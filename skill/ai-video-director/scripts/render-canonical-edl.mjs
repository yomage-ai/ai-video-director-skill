#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
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
if (edl.schemaVersion !== 1 || !Array.isArray(edl.segments) || edl.segments.length === 0) {
  throw new Error('Unsupported or empty canonical EDL');
}
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
  const names = [...new Set(edl.segments.map((segment) => segment.sourceFile))];
  if (names.length !== 1) {
    throw new Error('EDL contains multiple source names; use --source-map');
  }
  sourceMap = {[names[0]]: directSource};
}

const sourceNames = [...new Set(edl.segments.map((segment) => segment.sourceFile))];
const sources = sourceNames.map((name) => {
  const configured = sourceMap[name];
  if (!configured) throw new Error(`No source path mapped for EDL sourceFile: ${name}`);
  const resolved = path.resolve(configured);
  if (!existsSync(resolved)) throw new Error(`Source media not found: ${resolved}`);
  return {name, path: resolved, ...probe(resolved)};
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
  const source = inputIndex.get(segment.sourceFile);
  const start = sourceStart.toFixed(9);
  const length = duration.toFixed(9);
  const fadeDuration = Math.min(1 / outputFps, duration / 2);
  const fadeOutStart = Math.max(0, duration - fadeDuration);
  filters.push(
    `[${source}:v]trim=start=${start}:duration=${length},setpts=PTS-STARTPTS,fps=${outputFps}[v${index}]`,
    `[${source}:a]atrim=start=${start}:duration=${length},asetpts=PTS-STARTPTS,`
      + `afade=t=in:st=0:d=${fadeDuration.toFixed(9)},`
      + `afade=t=out:st=${fadeOutStart.toFixed(9)}:d=${fadeDuration.toFixed(9)}[a${index}]`,
  );
});
const concatInputs = edl.segments.map((_, index) => `[v${index}][a${index}]`).join('');
filters.push(`${concatInputs}concat=n=${edl.segments.length}:v=1:a=1[v][a]`);

mkdirSync(path.dirname(outputPath), {recursive: true});
const ffmpegArgs = ['-hide_banner', '-y', '-v', 'warning'];
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

const result = probe(outputPath);
console.log(JSON.stringify({
  status: 'rendered',
  output: outputPath,
  durationFrames: Math.round(durationFrames),
  outputFps,
  width: result.video.width,
  height: result.video.height,
  sources: sourceNames,
}, null, 2));
