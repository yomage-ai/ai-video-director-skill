#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [, , inputPath, reportPath] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/audit-coverage-boundaries.mjs <manifest.json> [report.json]');
  process.exit(2);
}

const input = path.resolve(inputPath);
const manifest = JSON.parse(fs.readFileSync(input, 'utf8'));
const fps = Number(manifest.fps ?? 30);
const duration = Number(manifest.durationSeconds);
const minimumDwell = Number(manifest.minimumIntentionalDwellSeconds ?? 2);
const nearCut = Number(manifest.nearSourceCutSeconds ?? 1);
const tolerance = 0.5 / fps + 1e-6;
const errors = [];
const notices = [];
let frameBoundaryChecks = 0;

function close(a, b) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

function finite(value) {
  return Number.isFinite(Number(value));
}

function validateFrameBoundary(label, seconds, declaredFrame, kind) {
  if (declaredFrame === undefined || declaredFrame === null) return;
  frameBoundaryChecks += 1;
  if (!Number.isInteger(Number(declaredFrame)) || Number(declaredFrame) < 0) {
    errors.push(`${label}: ${kind}Frame must be a non-negative integer`);
    return;
  }
  if (!finite(seconds)) {
    errors.push(`${label}: ${kind}Sec must be finite when ${kind}Frame is declared`);
    return;
  }
  const authoredFrame = Number(declaredFrame);
  const nearestFrame = Math.round(Number(seconds) * fps);
  let runtimeFrame = nearestFrame;
  while (runtimeFrame / fps < Number(seconds)) runtimeFrame += 1;
  while (runtimeFrame > 0 && (runtimeFrame - 1) / fps >= Number(seconds)) {
    runtimeFrame -= 1;
  }
  if (nearestFrame !== authoredFrame) {
    errors.push(`${label}: ${kind}Sec ${seconds} rounds to frame ${nearestFrame}, expected declared frame ${authoredFrame}`);
  }
  if (runtimeFrame !== authoredFrame) {
    errors.push(`${label}: ${kind}Sec ${seconds} becomes runtime frame ${runtimeFrame}, not declared frame ${authoredFrame}; derive the second value from frame/fps without decimal rounding`);
  }
}

function nearestCut(time) {
  const cuts = (manifest.sourceCuts ?? []).map(Number).filter(Number.isFinite);
  if (!cuts.length) return null;
  return cuts.reduce((best, cut) => (
    Math.abs(cut - time) < Math.abs(best - time) ? cut : best
  ));
}

const runs = [...(manifest.runs ?? [])].sort((a, b) => a.startSec - b.startSec);
if (!finite(duration) || duration <= 0) errors.push('manifest: durationSeconds must be positive');
if (!runs.length) errors.push('manifest: runs must contain at least one aggregate coverage run');

const sourceCuts = manifest.sourceCuts ?? [];
const sourceCutFrames = manifest.sourceCutFrames ?? [];
if (sourceCutFrames.length && sourceCutFrames.length !== sourceCuts.length) {
  errors.push('manifest: sourceCutFrames must have the same length as sourceCuts');
}
sourceCuts.forEach((cut, index) => {
  validateFrameBoundary(`source-cut-${index}`, cut, sourceCutFrames[index], 'start');
});

runs.forEach((run, index) => {
  const label = run.id ?? `run-${index + 1}`;
  if (!finite(run.startSec) || !finite(run.endSec) || run.endSec <= run.startSec) {
    errors.push(`${label}: invalid startSec/endSec`);
    return;
  }
  if (!run.mode) errors.push(`${label}: mode is required`);
  validateFrameBoundary(label, run.startSec, run.startFrame, 'start');
  validateFrameBoundary(label, run.endSec, run.endFrame, 'end');
  const dwell = Number(run.endSec) - Number(run.startSec);
  if (dwell + tolerance < minimumDwell) {
    if (run.exception !== 'token-synchronized-demo') {
      errors.push(`${label}: ${dwell.toFixed(3)}s dwell is below ${minimumDwell}s without a token-synchronized-demo exception`);
    } else {
      const token = run.tokenWindow;
      if (!token || !token.firstToken || !token.lastToken
        || !close(token.startSec, run.startSec) || !close(token.endSec, run.endSec)) {
        errors.push(`${label}: token-synchronized-demo must name first/last tokens and match the run boundaries`);
      }
      if (!Number.isInteger(run.startFrame) || !Number.isInteger(run.endFrame)) {
        errors.push(`${label}: token-synchronized-demo must declare exact startFrame/endFrame values`);
      }
    }
  }

  if (run.boundaryPolicy === 'source-cut-snap' && index > 0) {
    if (!Number.isInteger(run.startFrame)) {
      errors.push(`${label}: source-cut-snap must declare the canonical startFrame`);
    }
    const cut = nearestCut(run.startSec);
    if (cut === null || !close(cut, run.startSec)) {
      errors.push(`${label}: source-cut-snap boundary ${run.startSec} does not match a source cut`);
    }
  }
});

for (let index = 1; index < runs.length; index += 1) {
  const previous = runs[index - 1];
  const current = runs[index];
  if (!close(previous.endSec, current.startSec)) {
    const relation = previous.endSec < current.startSec ? 'gap' : 'overlap';
    errors.push(`${previous.id} -> ${current.id}: ${relation} from ${previous.endSec} to ${current.startSec}`);
  }

  const cut = nearestCut(current.startSec);
  if (cut === null) continue;
  const distance = Math.abs(cut - current.startSec);
  const touchesAOnly = previous.mode === 'A-only' || current.mode === 'A-only';
  if (touchesAOnly && distance <= nearCut + tolerance && !close(cut, current.startSec)) {
    errors.push(`${previous.id} -> ${current.id}: A-only/layout boundary is ${distance.toFixed(3)}s from source cut ${cut}; snap them or move the layout outside the near-cut window`);
  } else if (!touchesAOnly && distance <= nearCut + tolerance && !close(cut, current.startSec)) {
    notices.push(`${previous.id} -> ${current.id}: non-A-only boundary is ${distance.toFixed(3)}s from source cut ${cut}; verify that full B-roll coverage hides the source edit`);
  }
}

if (runs.length && finite(duration)) {
  if (!close(runs[0].startSec, 0)) errors.push(`timeline: first run starts at ${runs[0].startSec}, expected 0`);
  if (!close(runs.at(-1).endSec, duration)) {
    errors.push(`timeline: final run ends at ${runs.at(-1).endSec}, expected ${duration}`);
  }
}

for (const group of manifest.continuousRuns ?? []) {
  const cards = [...(group.cards ?? [])].sort((a, b) => a.startSec - b.startSec);
  if (!cards.length) {
    errors.push(`${group.id}: continuous run has no cards`);
    continue;
  }
  if (!close(cards[0].startSec, group.startSec)) {
    errors.push(`${group.id}: first card does not cover the run start`);
  }
  if (!close(cards.at(-1).endSec, group.endSec)) {
    errors.push(`${group.id}: final card does not cover the run end`);
  }
  for (let index = 1; index < cards.length; index += 1) {
    if (!close(cards[index - 1].endSec, cards[index].startSec)) {
      errors.push(`${group.id}: card gap/overlap at ${cards[index - 1].endSec} -> ${cards[index].startSec}`);
    }
  }
  if (group.presenterRequired) {
    const presenter = group.presenter;
    if (!presenter || !close(presenter.startSec, group.startSec)
      || !close(presenter.endSec, group.endSec)) {
      errors.push(`${group.id}: one stable presenter interval must span the complete continuous run`);
    }
  }
}

const report = {
  schemaVersion: 1,
  input,
  fps,
  durationSeconds: duration,
  aggregateRuns: runs.length,
  continuousRuns: (manifest.continuousRuns ?? []).length,
  minimumIntentionalDwellSeconds: minimumDwell,
  frameBoundaryChecks,
  errors,
  notices,
  result: errors.length ? 'fail' : 'pass',
};

if (reportPath) {
  fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
