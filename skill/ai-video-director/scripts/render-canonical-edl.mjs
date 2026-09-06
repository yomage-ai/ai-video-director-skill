#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {artifact, decode, invariant, validateEdl, resolveArtifact, sha256} from './lib/media-contract.mjs';
import path from 'node:path';

function parseArgs(values) {
  const parsed = {_: []};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--source-map') {
      parsed.sourceMap = values[index + 1];
      index += 1;
    } else {
      parsed._.push(value);
    }
  }
  return parsed;
}

function usage() {
  throw new Error(
    'Usage: node render-canonical-edl.mjs <edl.json> <single-source-media> <output.mp4>\n'
    + '   or: node render-canonical-edl.mjs <edl.json> <output.mp4> --source-map <source-map.json>',
  );
}

function finitePositive(value, name) {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) throw new Error(`${name} must be positive`);
  return result;
}

function probe(source) {
  const document = JSON.parse(execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', source],
    {encoding: 'utf8'},
  ));
  const video = document.streams?.find((stream) => stream.codec_type === 'video');
  const audio = document.streams?.find((stream) => stream.codec_type === 'audio');
  if (!video) throw new Error(`Source has no video stream: ${source}`);
  if (!audio) throw new Error(`Source has no audio stream: ${source}`);
  return {video, audio};
}

function isHdr(video) {
  return ['smpte2084', 'arib-std-b67'].includes(video.color_transfer)
    || video.color_primaries === 'bt2020';
}

const args = parseArgs(process.argv.slice(2));
let edlArg;
let outputArg;
let directSource;
if (args.sourceMap) {
  if (args._.length !== 2) usage();
  [edlArg, outputArg] = args._;
} else {
  if (args._.length !== 3) usage();
  [edlArg, directSource, outputArg] = args._;
}

const edlPath = path.resolve(edlArg);
const outputPath = path.resolve(outputArg);
const edl = JSON.parse(readFileSync(edlPath, 'utf8'));
if (![1,2].includes(edl.schemaVersion) || !Array.isArray(edl.segments) || edl.segments.length === 0) {
  throw new Error('Unsupported or empty canonical EDL');
}
validateEdl(edl);
invariant(!existsSync(outputPath), 'Output exists; choose a new version instead of overwriting');
const edlBinding = artifact(edlPath);
const extraBindings = ['timingSource','processingPlan'].filter(k=>edl[k])
  .map(k=>artifact(resolveArtifact(edl[k],path.dirname(edlPath),k)));
if (args.sourceMap) extraBindings.push(artifact(path.resolve(args.sourceMap)));
const outputFps = finitePositive(edl.outputFps, 'outputFps');
const durationFrames = finitePositive(edl.durationFrames, 'durationFrames');

let sourceMap;
if (args.sourceMap) {
  const rawMap = JSON.parse(readFileSync(path.resolve(args.sourceMap), 'utf8'));
  sourceMap = rawMap.sources || rawMap;
  if (!sourceMap || typeof sourceMap !== 'object' || Array.isArray(sourceMap)) {
    throw new Error('Source map must be an object from EDL sourceFile names to local media paths');
  }
} else {
  const names = [...new Set(edl.segments.map((segment) => segment.sourceId || segment.sourceFile))];
  if (names.length !== 1) {
    throw new Error('EDL contains multiple source names; use --source-map');
  }
  sourceMap = {[names[0]]: directSource};
}

const sourceNames = [...new Set(edl.segments.map((segment) => segment.sourceId || segment.sourceFile))];
const sources = sourceNames.map((name) => {
  const label = edl.segments.find(s => (s.sourceId || s.sourceFile) === name).sourceFile;
  const sameNameIds = new Set(edl.segments.filter(s=>s.sourceFile===label).map(s=>s.sourceId || s.sourceFile));
  const configured = sourceMap[name] ?? (sameNameIds.size === 1 ? sourceMap[label] : undefined);
  if (!configured) throw new Error(`No source path mapped for EDL sourceFile: ${name}`);
  const mapBase = args.sourceMap ? path.dirname(path.resolve(args.sourceMap)) : process.cwd();
  const resolved = path.resolve(mapBase,typeof configured === 'string' ? configured : configured.path);
  if (configured.sha256) resolveArtifact(configured,mapBase,`source ${name}`);
  if (configured.lineage) {
    resolveArtifact(configured.lineage.original,mapBase,'derived original');
    resolveArtifact(configured.lineage.derivation,mapBase,'derivation record');
  }
  if (!existsSync(resolved)) throw new Error(`Source media not found: ${resolved}`);
  return {name, path: resolved, binding: {...artifact(resolved), sourceId:name, ...(configured.lineage ? {lineage:{original:artifact(resolveArtifact(configured.lineage.original,mapBase)), derivation:artifact(resolveArtifact(configured.lineage.derivation,mapBase))}} : {})}, ...probe(resolved)};
});
for (const source of sources) {
  if (isHdr(source.video)) {
    throw new Error(
      `HDR source detected (${source.name}, ${source.video.color_transfer || source.video.color_primaries}). `
      + 'Refusing an implicit 8-bit SDR conversion. Build and approve a color-managed SDR proxy or an explicit HDR master pipeline first.',
    );
  }
}
const firstVideo = sources[0].video;
for (const source of sources.slice(1)) {
  if (source.video.width !== firstVideo.width || source.video.height !== firstVideo.height) {
    throw new Error('All mapped sources must currently have identical dimensions');
  }
}

const inputIndex = new Map(sources.map((source, index) => [source.name, index]));
const filters = [];
edl.segments.forEach((segment, index) => {
  const sourceStart = Number(segment.sourceStartSeconds);
  const duration = Number(segment.durationSeconds);
  if (!Number.isFinite(sourceStart) || sourceStart < 0 || !Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid timing in ${segment.id || `segment ${index + 1}`}`);
  }
  const source = inputIndex.get(segment.sourceId || segment.sourceFile);
  const start = sourceStart.toFixed(9);
  const rate = segment.playbackRate ?? 1;
  const length = (duration * rate).toFixed(9);
  const selected = sources[source];
  const sourceDuration = Number(selected.video.duration);
  invariant(!Number.isFinite(sourceDuration) || sourceStart + duration * rate <= sourceDuration + 1 / outputFps,
    `Source interval exceeds media: ${segment.id}`);
  const audioDuration = Number(selected.audio.duration);
  invariant(Number.isFinite(audioDuration) && sourceStart + duration * rate <= audioDuration + 0.05,
    `Source audio interval exceeds media or has unknown duration: ${segment.id}`);
  invariant(Math.abs(Number(selected.audio.start_time || 0)-Number(selected.video.start_time || 0)) <= 0.05,
    'Source A/V start offsets need an explicitly aligned derivative');
  const processing = segment.processing || {};
  const vf = [`trim=start=${start}:duration=${length}`, `setpts=(PTS-STARTPTS)/${rate}`, `fps=${outputFps}`,
    `trim=end_frame=${segment.outputEndFrameExclusive-segment.outputStartFrame}`];
  if (Object.keys(processing.video || {}).length) vf.push('eq='+Object.entries(processing.video).map(([k,v])=>`${k}=${v}`).join(':'));
  const af = [`atrim=start=${start}:duration=${length}`, 'asetpts=PTS-STARTPTS'];
  let tempo = rate;
  while (tempo > 2) { af.push('atempo=2'); tempo /= 2; }
  while (tempo < 0.5) { af.push('atempo=0.5'); tempo /= 0.5; }
  if (tempo !== 1) af.push(`atempo=${tempo}`);
  const audio = processing.audio || {};
  if (audio.gainDb) af.push(`volume=${audio.gainDb}dB`);
  if (audio.fadeInSeconds) af.push(`afade=t=in:st=0:d=${audio.fadeInSeconds}`);
  if (audio.fadeOutSeconds) af.push(`afade=t=out:st=${duration-audio.fadeOutSeconds}:d=${audio.fadeOutSeconds}`);
  // No implicit fades: an approved processing contract owns every audio change.
  af.push(`apad=whole_dur=${duration}`, `atrim=duration=${duration}`);
  filters.push(`[${source}:v]${vf.join(',')}[v${index}]`, `[${source}:a]${af.join(',')}[a${index}]`);
});
const concatInputs = edl.segments.map((_, index) => `[v${index}][a${index}]`).join('');
filters.push(`${concatInputs}concat=n=${edl.segments.length}:v=1:a=1[v][a]`);

mkdirSync(path.dirname(outputPath), {recursive: true});
const ffmpegArgs = ['-hide_banner', '-n', '-v', 'warning'];
for (const source of sources) ffmpegArgs.push('-i', source.path);
ffmpegArgs.push(
  '-filter_complex', filters.join(';'),
  '-map', '[v]',
  '-map', '[a]',
  '-frames:v', String(Math.round(durationFrames)),
  '-r', String(outputFps),
  '-fps_mode', 'cfr',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-movflags', '+faststart',
);
const metadataOptions = [
  ['-color_primaries', firstVideo.color_primaries],
  ['-color_trc', firstVideo.color_transfer],
  ['-colorspace', firstVideo.color_space],
  ['-color_range', firstVideo.color_range],
];
for (const [flag, value] of metadataOptions) {
  if (value && value !== 'unknown') ffmpegArgs.push(flag, value);
}
ffmpegArgs.push(outputPath);
execFileSync('ffmpeg', ffmpegArgs, {stdio: 'inherit'});

decode(outputPath);
const result = probe(outputPath);
invariant(Number(result.video.nb_frames) === durationFrames, 'Rendered frame count mismatch');
invariant(Math.abs(Number(result.video.duration)-edl.durationSeconds) < 2/outputFps, 'Rendered duration mismatch');
invariant(sha256(edlPath) === edlBinding.sha256, 'EDL changed during rendering');
for (const source of sources) invariant(sha256(source.path) === source.binding.sha256, 'Source changed during rendering');
for (const ref of extraBindings) resolveArtifact(ref,path.dirname(edlPath),'render dependency');
const receipt = {schemaVersion:1, outputClass:'review-proxy', generatedAt:new Date().toISOString(),
  edl:edlBinding, sources:sources.map(s=>s.binding), output:artifact(outputPath),
  durationFrames, outputFps, fullDecodePassed:true,
  processing:edl.segments.map(s=>({id:s.id,playbackRate:s.playbackRate ?? 1,processing:s.processing || {}})),
  renderer:artifact(new URL(import.meta.url)), command:['ffmpeg',...ffmpegArgs]};
writeFileSync(`${outputPath}.render.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({
  status: 'rendered',
  outputClass: 'review-proxy',
  receipt: `${outputPath}.render.json`,
  output: outputPath,
  durationFrames: Math.round(durationFrames),
  outputFps,
  width: result.video.width,
  height: result.video.height,
  sources: sourceNames,
}, null, 2));
