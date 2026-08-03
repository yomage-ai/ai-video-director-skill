#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {XMLParser} from 'fast-xml-parser';

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
        if (name) definitions.set(String(file['@_id']), String(name));
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
      return definitions.get(String(file['@_id']));
    }
  }
  if (clip.name) return String(clip.name);
  fail(`clip ${index} has no source file identity`);
}

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error('Usage: node chatcut-xml-to-canonical-edl.mjs <input.xml> <output.json>');
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const parser = new XMLParser({ignoreAttributes: false, parseTagValue: false, trimValues: true});
const document = parser.parse(readFileSync(inputPath, 'utf8'));
const project = document?.xmeml?.project;
if (!project) fail('xmeml.project is missing');
const sequence = first(project?.children?.sequence);
if (!sequence) fail('project.children.sequence is missing');
const video = sequence?.media?.video;
if (!video) fail('sequence.media.video is missing');

const populatedTracks = array(video.track).filter((track) => array(track?.clipitem).length > 0);
if (populatedTracks.length !== 1) {
  fail(`exactly one populated primary video track is supported; found ${populatedTracks.length}`);
}
const clips = array(populatedTracks[0].clipitem);
if (clips.length === 0) fail('primary video track contains no clips');

const outputRate = frameRate(sequence.rate, 'sequence.rate');
const durationFrames = finiteNumber(sequence.duration, 'sequence.duration');
if (!Number.isInteger(durationFrames) || durationFrames <= 0) {
  fail('sequence.duration must be a positive integer frame count');
}
const definitions = collectFileDefinitions(sequence);
const segments = clips.map((clip, offset) => {
  const index = offset + 1;
  const outputStartFrame = finiteNumber(clip.start, `clip ${index}.start`);
  const outputEndFrameExclusive = finiteNumber(clip.end, `clip ${index}.end`);
  const sourceInFrame = finiteNumber(clip.in, `clip ${index}.in`);
  const sourceOutFrame = finiteNumber(clip.out, `clip ${index}.out`);
  for (const [name, value] of Object.entries({outputStartFrame, outputEndFrameExclusive, sourceInFrame, sourceOutFrame})) {
    if (!Number.isInteger(value)) fail(`clip ${index}.${name} must be an integer`);
  }
  if (outputEndFrameExclusive <= outputStartFrame) fail(`clip ${index} has a non-positive output duration`);
  if (sourceOutFrame <= sourceInFrame) fail(`clip ${index} has a non-positive source duration`);

  const sourceRate = frameRate(clip.rate || first(clip.file)?.rate, `clip ${index}.rate`);
  const durationInFrames = outputEndFrameExclusive - outputStartFrame;
  const durationSeconds = durationInFrames / outputRate.exact;
  const xmlSourceDuration = (sourceOutFrame - sourceInFrame) / sourceRate.exact;
  const toleranceSeconds = 1.5 / Math.min(outputRate.exact, sourceRate.exact);
  if (Math.abs(xmlSourceDuration - durationSeconds) > toleranceSeconds) {
    fail(`clip ${index} source/output durations differ by more than 1.5 frames; retiming is not supported`);
  }
  const sourceStartSeconds = sourceInFrame / sourceRate.exact;
  return {
    id: `segment-${String(index).padStart(3, '0')}`,
    sourceFile: sourceName(clip, definitions, index),
    outputStartFrame,
    outputEndFrameExclusive,
    durationInFrames,
    sourceInFrame,
    sourceOutFrame,
    sourceFps: sourceRate.exact,
    sourceStartSeconds,
    sourceEndSeconds: sourceStartSeconds + durationSeconds,
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

const canonicalEdl = {
  schemaVersion: 1,
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
    'transitions, retiming, transforms, filters, multicam and nested sequences are not preserved',
  ],
  segments,
};

writeFileSync(outputPath, `${JSON.stringify(canonicalEdl, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(canonicalEdl, null, 2));
