#!/usr/bin/env node

import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {XMLParser} from 'fast-xml-parser';
import {sha256, artifact, validateEdl, validateProcessing} from './lib/media-contract.mjs';

function fail(message) {
  throw new Error(`Invalid ChatCut/FCP XML: ${message}`);
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function array(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function finiteNumber(value, name) {
  const result = Number(value);
  if (!Number.isFinite(result)) fail(`${name} must be a finite number`);
  return result;
}

function frameRate(rate, name) {
  const node = first(rate);
  if (!node) fail(`${name} is missing`);
  const timebase = finiteNumber(node.timebase, `${name}.timebase`);
  if (timebase <= 0) fail(`${name}.timebase must be positive`);
  const ntsc = `${node.ntsc}`.toUpperCase() === 'TRUE';
  return {
    nominal: timebase,
    ntsc,
    exact: ntsc ? (timebase * 1000) / 1001 : timebase,
  };
}

function basenameFromPathUrl(pathUrl) {
  if (!pathUrl) return null;
  try {
    const parsed = new URL(String(pathUrl));
    if (parsed.protocol === 'file:') return path.basename(fileURLToPath(parsed));
  } catch {
    // Some exports use a plain path rather than a valid URL.
  }
  return path.basename(decodeURIComponent(String(pathUrl)));
}

function collectFileDefinitions(node, definitions = new Map()) {
  if (!node || typeof node !== 'object') return definitions;
  if (node.file) {
    for (const file of array(node.file)) {
      if (file && typeof file === 'object' && file['@_id']) {
        const name = file.name || basenameFromPathUrl(file.pathurl);
        if (name) {
          const id=String(file['@_id']),previous=definitions.get(id);
          if(previous && (previous.name !== String(name) || (previous.pathurl && file.pathurl && previous.pathurl !== file.pathurl))) fail(`Conflicting source definition: ${id}`);
          definitions.set(id,{name:String(name),pathurl:file.pathurl || previous?.pathurl || null});
        }
      }
    }
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') collectFileDefinitions(value, definitions);
  }
  return definitions;
}

function sourceName(clip, definitions, index) {
  const file = first(clip.file);
  if (file && typeof file === 'object') {
    const direct = file.name || basenameFromPathUrl(file.pathurl);
    if (direct) return String(direct);
    if (file['@_id'] && definitions.has(String(file['@_id']))) {
      return definitions.get(String(file['@_id'])).name;
    }
  }
  if (clip.name) return String(clip.name);
  fail(`clip ${index} has no source file identity`);
}

const [inputArg, outputArg, flag, planArg] = process.argv.slice(2);
if (flag && (flag !== '--processing' || !planArg)) fail('Expected --processing <plan.json>');
if (!inputArg || !outputArg) {
  throw new Error('Usage: node chatcut-xml-to-canonical-edl.mjs <input.xml> <output.json>');
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
if (existsSync(outputPath)) fail('Output EDL exists; choose a new version');
const inputHash = sha256(inputPath);
const plan = planArg ? JSON.parse(readFileSync(path.resolve(planArg),'utf8')) : {segments:{}};
if (planArg && (plan.schemaVersion !== 1 || plan.inputXmlSha256 !== inputHash)) fail('Processing plan is stale or invalid');
if (!plan.segments || typeof plan.segments !== 'object' || Array.isArray(plan.segments)) fail('Processing segments must be an object');
const usedPlanKeys = new Set();
const parser = new XMLParser({ignoreAttributes: false, parseTagValue: false, trimValues: true});
const document = parser.parse(readFileSync(inputPath, 'utf8'));
const project = document?.xmeml?.project;
if (!project) fail('xmeml.project is missing');
const sequence = first(project?.children?.sequence);
if (!sequence) fail('project.children.sequence is missing');
if (array(project.children.sequence).length !== 1) fail('Select exactly one sequence for handoff');
const video = sequence?.media?.video;
if (!video) fail('sequence.media.video is missing');

const populatedTracks = array(video.track).filter((track) => array(track?.clipitem).length > 0);
if (populatedTracks.length !== 1) {
  fail(`exactly one populated primary video track is supported; found ${populatedTracks.length}`);
}
const clips = array(populatedTracks[0].clipitem);
if (clips.length === 0) fail('primary video track contains no clips');

// XML effects are never silently dropped. Use a neutral timing export plus an
// explicit processing plan, or a reviewed source-quality derivative.
function rejectUnsupported(node, location = 'sequence') {
  if (!node || typeof node !== 'object') return;
  for (const [key,value] of Object.entries(node)) {
    if (['filter','transitionitem','generatoritem','speed','timeremap'].includes(key)) {
      fail(`${location}.${key}: unsupported XML processing; preserve the approved edit and use the documented explicit-processing or derivative handoff`);
    }
    if (key === 'sequence' && location !== 'root') fail('nested sequences are not supported');
    if (key === 'enabled' && String(value).toUpperCase() === 'FALSE') fail(`${location}: disabled track/item is not supported`);
    rejectUnsupported(value,`${location}.${key}`);
  }
}
rejectUnsupported(sequence);
const outputRate = frameRate(sequence.rate, 'sequence.rate');
const durationFrames = finiteNumber(sequence.duration, 'sequence.duration');
if (!Number.isInteger(durationFrames) || durationFrames <= 0) {
  fail('sequence.duration must be a positive integer frame count');
}
const definitions = collectFileDefinitions(sequence);
const clipIds = new Set();
const segments = clips.map((clip, offset) => {
  const index = offset + 1;
  const outputStartFrame = finiteNumber(clip.start, `clip ${index}.start`);
  const outputEndFrameExclusive = finiteNumber(clip.end, `clip ${index}.end`);
  const sourceInFrame = finiteNumber(clip.in, `clip ${index}.in`);
  const sourceOutFrame = finiteNumber(clip.out, `clip ${index}.out`);
  for (const [name, value] of Object.entries({outputStartFrame, outputEndFrameExclusive, sourceInFrame, sourceOutFrame})) {
    if (!Number.isInteger(value)) fail(`clip ${index}.${name} must be an integer`);
  }
  if (sourceInFrame < 0 || outputStartFrame < 0) fail(`clip ${index} has a negative boundary`);
  if (outputEndFrameExclusive <= outputStartFrame) fail(`clip ${index} has a non-positive output duration`);
  if (sourceOutFrame <= sourceInFrame) fail(`clip ${index} has a non-positive source duration`);

  const sourceRate = frameRate(clip.rate || first(clip.file)?.rate, `clip ${index}.rate`);
  const durationInFrames = outputEndFrameExclusive - outputStartFrame;
  const durationSeconds = durationInFrames / outputRate.exact;
  const xmlSourceDuration = (sourceOutFrame - sourceInFrame) / sourceRate.exact;
  const toleranceSeconds = 1.5 / Math.min(outputRate.exact, sourceRate.exact);
  const clipId = String(clip['@_id'] || `clip-${index}`);
  if (clipIds.has(clipId)) fail('Duplicate XML clip ID');
  clipIds.add(clipId);
  const operations = plan.segments[clipId] ?? {};
  if (!operations || typeof operations !== 'object' || Array.isArray(operations)) fail('Segment processing must be an object');
  if (plan.segments?.[clipId]) usedPlanKeys.add(clipId);
  for (const key of Object.keys(operations)) if (!['playbackRate','video','audio'].includes(key)) fail(`Unsupported processing field: ${key}`);
  const playbackRate = operations.playbackRate ?? 1;
  if (!Number.isFinite(playbackRate) || playbackRate < 0.25 || playbackRate > 4) fail(`clip ${index}: playbackRate must be 0.25..4`);
  if (Math.abs(xmlSourceDuration - durationSeconds * playbackRate) > toleranceSeconds) {
    fail(`clip ${index}: retiming requires an explicit constant playbackRate matching source/output duration`);
  }
  const processing = {video: operations.video ?? {}, audio: operations.audio ?? {}};
  validateProcessing(processing,durationSeconds);
  const sourceStartSeconds = sourceInFrame / sourceRate.exact;
  return {
    id: `segment-${String(index).padStart(3, '0')}`,
    xmlClipId: clipId,
    sourceId: String(first(clip.file)?.['@_id'] || `source-${index}`),
    sourceFile: sourceName(clip, definitions, index),
    playbackRate,
    processing,
    outputStartFrame,
    outputEndFrameExclusive,
    durationInFrames,
    sourceInFrame,
    sourceOutFrame,
    sourceFps: sourceRate.exact,
    sourceStartSeconds,
    sourceEndSeconds: sourceStartSeconds + durationSeconds * playbackRate,
    durationSeconds,
  };
});

let expectedStart = 0;
for (const segment of segments) {
  if (segment.outputStartFrame !== expectedStart) {
    fail(`timeline gap or overlap before ${segment.id}; expected output frame ${expectedStart}`);
  }
  expectedStart = segment.outputEndFrameExclusive;
}
if (expectedStart !== durationFrames) {
  fail(`last clip ends at frame ${expectedStart}, but sequence duration is ${durationFrames}`);
}

for (const key of Object.keys(plan.segments || {})) if (!usedPlanKeys.has(key)) fail(`Unused processing segment: ${key}`);
// Audio may be linked mono/stereo copies only. Independent offsets, sources,
// gaps and automation need an approved derivative rather than a lossy import.
for (const track of array(sequence.media?.audio?.track)) {
  const audioClips = array(track?.clipitem);
  if (!audioClips.length) continue;
  if (audioClips.length !== segments.length) fail('Independent audio edits are not supported');
  audioClips.forEach((a,i) => {
    const v = clips[i];
    for (const key of ['start','end','in','out']) if (Number(a[key]) !== Number(v[key])) fail('Independent audio timing is not supported');
    if (sourceName(a,definitions,i+1) !== segments[i].sourceFile) fail('Independent audio source is not supported');
    const aid = first(a.file)?.['@_id'];
    if (aid && String(aid) !== segments[i].sourceId) fail('Independent audio identity is not supported');
  });
}
const canonicalEdl = {
  schemaVersion: 2,
  inputXmlSha256: inputHash,
  timingSource: artifact(inputPath),
  processingPlan: planArg ? artifact(path.resolve(planArg)) : null,
  processingPlanSha256: planArg ? sha256(path.resolve(planArg)) : null,
  source: 'ChatCut Final Cut Pro XML export',
  inputXml: path.basename(inputPath),
  generatedAt: new Date().toISOString(),
  outputFps: outputRate.exact,
  outputRate,
  durationFrames,
  durationSeconds: durationFrames / outputRate.exact,
  timingRule: 'Output start/end frames define duration; source seconds are derived from source in and the exact output duration.',
  limitations: [
    'one populated primary video track with contiguous straight cuts',
    'captions and motion graphics are rebuilt downstream',
    'XML effects, transitions, independent audio and nested sequences are rejected; explicit constant-rate/video-eq/audio processing is supported',
  ],
  segments,
};

validateEdl(canonicalEdl);
writeFileSync(outputPath, `${JSON.stringify(canonicalEdl, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(canonicalEdl, null, 2));
