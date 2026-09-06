#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {verifyRenderReceipt,resolveArtifact,probe,joins,invariant,verifyAudioWindow} from './lib/media-contract.mjs';
import {sameFile} from './lib/media-contract.mjs';

const [inputPath, reportPath] = process.argv.slice(2);
if (!inputPath) {
  console.error('Usage: node scripts/audit-rough-cut-review.mjs <rough-cut-review.json> [report.json]');
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, 'utf8'));
const errors = [];
const warnings = [];

function requireTrue(value, field) {
  if (value !== true) errors.push(`${field} must be true`);
}

function requireFalse(value, field) {
  if (value !== false) errors.push(`${field} must be false`);
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') errors.push(`${field} must be a boolean`);
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${field} must be a non-empty string`);
}

function requireNumber(value, field, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) errors.push(`${field} must be a number >= ${minimum}`);
}

if (data.schemaVersion !== 4) errors.push('schemaVersion must be 4; regenerate evidence from the current render receipt');
if (!['ready-for-user-review', 'approved'].includes(data.status)) {
  errors.push('status must be ready-for-user-review or approved');
}

let bound;
try {
  bound = verifyRenderReceipt(data.evidenceBinding?.renderReceipt,path.dirname(path.resolve(inputPath)));
  invariant(data.canonicalEdlVersion === bound.receipt.edl.sha256,'canonicalEdlVersion does not match bound EDL');
} catch(error) { errors.push(`evidenceBinding: ${error.message}`); }

const inventory = data.timelineInventory ?? {};
requireNumber(inventory.placedMediaItems, 'timelineInventory.placedMediaItems', 1);
requireNumber(inventory.expectedJoinCount, 'timelineInventory.expectedJoinCount', 0);
requireNumber(inventory.actualJoinCount, 'timelineInventory.actualJoinCount', 0);
if (Number.isFinite(inventory.placedMediaItems)
  && inventory.expectedJoinCount !== inventory.placedMediaItems - 1) {
  errors.push('timelineInventory.expectedJoinCount must equal placedMediaItems - 1');
}
if (inventory.actualJoinCount !== inventory.expectedJoinCount) {
  errors.push('timelineInventory.actualJoinCount must equal expectedJoinCount');
}
requireTrue(inventory.allRealJoinsRepresented, 'timelineInventory.allRealJoinsRepresented');

if (bound) {
  if (inventory.placedMediaItems !== bound.edl.segments.length) errors.push('timelineInventory differs from actual EDL segment count');
  if (inventory.actualJoinCount !== bound.edl.segments.length-1) errors.push('join count differs from actual EDL');
  if (inventory.durationSeconds !== bound.edl.durationSeconds) errors.push('timelineInventory duration differs from actual EDL');
}
for (const key of ['placedMediaItems','expectedJoinCount','actualJoinCount']) {
  if (!Number.isInteger(inventory[key])) errors.push(`timelineInventory.${key} must be integer`);
}
const joinReview = data.joinReview ?? {};
requireTrue(joinReview.allPlacedItemBoundariesEnumerated,
  'joinReview.allPlacedItemBoundariesEnumerated');
requireTrue(joinReview.everyRealJoinReviewedAtNormalSpeed,
  'joinReview.everyRealJoinReviewedAtNormalSpeed');
requireTrue(joinReview.everyChangedBoundaryReviewedAtFullSpeed,
  'joinReview.everyChangedBoundaryReviewedAtFullSpeed');
requireTrue(joinReview.auditoryReviewCompletedByAgent,
  'joinReview.auditoryReviewCompletedByAgent');
requireFalse(joinReview.automationUsedAsSoleProof,
  'joinReview.automationUsedAsSoleProof');

for (const [key, value] of Object.entries(joinReview)) {
  if (key.toLowerCase().includes('pending') && value === true) {
    errors.push(`joinReview.${key} cannot be true at the review gate`);
  }
}

const boundaries = data.manuscriptAudibilityAudit?.verifiedBoundaries ?? [];
if (boundaries.length !== inventory.actualJoinCount) {
  errors.push('verifiedBoundaries must contain exactly one record for every real join');
}
const boundaryIds = new Set();
const expectedBoundaries = bound ? joins(bound.edl) : [];
const allowedBoundaryStatus = new Set(['pass', 'repaired', 'intentional-exception']);
for (const [index, boundary] of boundaries.entries()) {
  const prefix = `manuscriptAudibilityAudit.verifiedBoundaries[${index}]`;
  if (boundaryIds.has(boundary.boundaryId)) errors.push(`${prefix}: duplicate boundaryId`);
  boundaryIds.add(boundary.boundaryId);
  if (bound) {
    const expected = expectedBoundaries[index];
    if (!expected || boundary.boundaryId !== expected.boundaryId
      || boundary.timelineFrame !== expected.timelineFrame
      || Math.abs(boundary.timelineTimeSeconds-expected.timelineTimeSeconds) > 1e-8) {
      errors.push(`${prefix}: boundary does not match actual EDL position/order`);
    }
    try {
      const proof = boundary.windowEvidence;
      const file = resolveArtifact(proof,path.dirname(path.resolve(inputPath)),`${prefix}.windowEvidence`);
      invariant(sameFile(path.resolve(path.dirname(path.resolve(inputPath)),boundary.renderedWindow),file),'renderedWindow differs from evidence path');
      invariant(proof.programSha256 === bound.receipt.output.sha256,'window belongs to a different program version');
      invariant(Number.isFinite(proof.startSeconds) && Number.isFinite(proof.endSeconds)
        && proof.startSeconds >= 0 && proof.endSeconds <= bound.edl.durationSeconds
        && proof.startSeconds < boundary.timelineTimeSeconds && proof.endSeconds > boundary.timelineTimeSeconds,'window does not contain join or is out of bounds');
      invariant(typeof proof.generator === 'string' && proof.generator,'window generator required');
      invariant(proof.startSeconds <= Math.max(0,boundary.timelineTimeSeconds-2)+0.001
        && proof.endSeconds >= Math.min(bound.edl.durationSeconds,boundary.timelineTimeSeconds+2)-0.001,
        'window requires at least 2 seconds of context on each available side');
      const media = probe(file);
      invariant(media.streams.some(s=>s.codec_type==='audio'),'window has no audio');
      invariant(Math.abs(Number(media.format.duration)-(proof.endSeconds-proof.startSeconds)) < 0.05,'window duration mismatch');
      verifyAudioWindow(bound.program,file,proof.startSeconds,proof.endSeconds-proof.startSeconds);
    } catch(error) { errors.push(`${prefix}: ${error.message}`); }
  }
  requireString(boundary.boundaryId, `${prefix}.boundaryId`);
  requireNumber(boundary.timelineTimeSeconds, `${prefix}.timelineTimeSeconds`, 0);
  requireString(boundary.expectedLastToken, `${prefix}.expectedLastToken`);
  requireString(boundary.expectedFirstToken, `${prefix}.expectedFirstToken`);
  requireString(boundary.audibleLastToken, `${prefix}.audibleLastToken`);
  requireString(boundary.audibleFirstToken, `${prefix}.audibleFirstToken`);
  requireString(boundary.renderedWindow, `${prefix}.renderedWindow`);
  requireNumber(boundary.pauseSeconds, `${prefix}.pauseSeconds`, 0);
  requireTrue(boundary.retainedOccurrenceHasCompleteOnset,
    `${prefix}.retainedOccurrenceHasCompleteOnset`);
  requireTrue(boundary.normalSpeedAuditioned, `${prefix}.normalSpeedAuditioned`);
  if (!allowedBoundaryStatus.has(boundary.status)) {
    errors.push(`${prefix}.status must be pass, repaired, or intentional-exception`);
  }
  if (boundary.expectedLastToken !== boundary.audibleLastToken) {
    errors.push(`${prefix} does not preserve the expected outgoing token`);
  }
  if (boundary.expectedFirstToken !== boundary.audibleFirstToken) {
    errors.push(`${prefix} does not preserve the expected incoming token`);
  }
  if (boundary.status === 'intentional-exception' && !(boundary.notes ?? []).length) {
    errors.push(`${prefix}.notes must explain an intentional exception`);
  }
}

requireTrue(data.manuscriptAudibilityAudit?.openingWordsAudible,
  'manuscriptAudibilityAudit.openingWordsAudible');
requireTrue(data.manuscriptAudibilityAudit?.closingWordsAudible,
  'manuscriptAudibilityAudit.closingWordsAudible');
requireTrue(data.manuscriptAudibilityAudit?.everyChangedBoundaryHasExpectedTokens,
  'manuscriptAudibilityAudit.everyChangedBoundaryHasExpectedTokens');

const pauseScan = data.pauseScan ?? {};
requireTrue(pauseScan.scannedRenderedProgram, 'pauseScan.scannedRenderedProgram');
requireNumber(pauseScan.candidateThresholdSeconds, 'pauseScan.candidateThresholdSeconds', 0.1);
requireNumber(pauseScan.candidateCount, 'pauseScan.candidateCount', 0);
requireNumber(pauseScan.resolvedCount, 'pauseScan.resolvedCount', 0);
if (pauseScan.resolvedCount !== pauseScan.candidateCount) {
  errors.push('pauseScan.resolvedCount must equal candidateCount');
}
if (pauseScan.unresolvedCount !== 0) errors.push('pauseScan.unresolvedCount must be 0');
if (pauseScan.longestUnexplainedSeconds !== null) {
  errors.push('pauseScan.longestUnexplainedSeconds must be null');
}

if ((pauseScan.candidates || []).length !== pauseScan.candidateCount) errors.push('pauseScan.candidates must enumerate every reported pause candidate');
for (const [i,candidate] of (pauseScan.candidates || []).entries()) {
  if (!Number.isFinite(candidate.startSeconds) || !Number.isFinite(candidate.endSeconds)
    || candidate.startSeconds < 0 || candidate.endSeconds <= candidate.startSeconds
    || (bound && candidate.endSeconds > bound.edl.durationSeconds)
    || !['keep','shorten','remove'].includes(candidate.decision) || !candidate.reason) errors.push(`pauseScan.candidates[${i}] requires an in-range resolved decision`);
}
const issueSweep = data.issueClassSweep ?? {};
requireBoolean(issueSweep.userFeedbackNamedRepeatableDefect,
  'issueClassSweep.userFeedbackNamedRepeatableDefect');
requireFalse(issueSweep.patchOnlyListedTimestamps,
  'issueClassSweep.patchOnlyListedTimestamps');
if (issueSweep.userFeedbackNamedRepeatableDefect === true) {
  requireTrue(issueSweep.fullRelevantTimelineSwept,
    'issueClassSweep.fullRelevantTimelineSwept');
  if (!Array.isArray(issueSweep.classes) || issueSweep.classes.length === 0) {
    errors.push('issueClassSweep.classes must list every defect class when repeatable feedback was received');
  }
  for (const [index, item] of (issueSweep.classes ?? []).entries()) {
    const prefix = `issueClassSweep.classes[${index}]`;
    requireString(item.id, `${prefix}.id`);
    requireString(item.detectionMethod, `${prefix}.detectionMethod`);
    requireNumber(item.hitCount, `${prefix}.hitCount`, 0);
    requireNumber(item.resolvedCount, `${prefix}.resolvedCount`, 0);
    if (item.hitCount !== item.resolvedCount) {
      errors.push(`${prefix}.resolvedCount must equal hitCount`);
    }
    requireString(item.evidence, `${prefix}.evidence`);
  }
}

const expressive = data.expressiveMomentReview ?? {};
requireTrue(expressive.contentDriven, 'expressiveMomentReview.contentDriven');
requireFalse(expressive.automaticFreezeOrRemoval,
  'expressiveMomentReview.automaticFreezeOrRemoval');
if ((expressive.unresolved ?? []).length > 0) {
  errors.push('expressiveMomentReview.unresolved must be empty');
}
const allowedExpressiveTreatments = new Set([
  'preserve-natural-motion', 'shorten', 'cut-away', 'hold', 'motivated-freeze', 'other',
]);
for (const [index, decision] of (expressive.decisions ?? []).entries()) {
  const prefix = `expressiveMomentReview.decisions[${index}]`;
  requireString(decision.id, `${prefix}.id`);
  requireString(decision.type, `${prefix}.type`);
  if (!allowedExpressiveTreatments.has(decision.treatment)) {
    errors.push(`${prefix}.treatment must be a declared content-driven treatment`);
  }
  requireString(decision.reason, `${prefix}.reason`);
  requireTrue(decision.normalSpeedAudiovisualReviewed,
    `${prefix}.normalSpeedAudiovisualReviewed`);
}

const speed = data.playbackSpeedReview ?? {};
requireBoolean(speed.retimeApplied, 'playbackSpeedReview.retimeApplied');

const pace = data.paceConsistencyReview ?? {};
requireString(pace.method, 'paceConsistencyReview.method');
requireNumber(pace.reviewCandidateDeltaPercent,
  'paceConsistencyReview.reviewCandidateDeltaPercent', 1);
const windows = pace.comparisonWindows ?? [];
if (windows.length < 3) errors.push('paceConsistencyReview.comparisonWindows needs early, middle, and late samples');
for (const role of ['early', 'middle', 'late']) {
  if (!windows.some((window) => window.role === role)) {
    errors.push(`paceConsistencyReview.comparisonWindows is missing ${role}`);
  }
}
for (const [index, window] of windows.entries()) {
  const prefix = `paceConsistencyReview.comparisonWindows[${index}]`;
  requireString(window.id, `${prefix}.id`);
  if (bound && window.endSeconds > bound.edl.durationSeconds) errors.push(`${prefix}: pace window exceeds program`);
  requireNumber(window.startSeconds, `${prefix}.startSeconds`, 0);
  requireNumber(window.endSeconds, `${prefix}.endSeconds`, 0);
  if (Number.isFinite(window.startSeconds) && Number.isFinite(window.endSeconds)
    && window.endSeconds <= window.startSeconds) {
    errors.push(`${prefix}.endSeconds must be greater than startSeconds`);
  }
  requireNumber(window.activeSpeechUnitsPerSecond,
    `${prefix}.activeSpeechUnitsPerSecond`, 0.01);
  requireNumber(window.selectedPlaybackRate, `${prefix}.selectedPlaybackRate`, 0.01);
  requireTrue(window.normalSpeedAuditioned, `${prefix}.normalSpeedAuditioned`);
  if (!['pass', 'repaired', 'intentional-variation'].includes(window.status)) {
    errors.push(`${prefix}.status must be pass, repaired, or intentional-variation`);
  }
  if (window.status === 'intentional-variation') {
    requireString(window.rationale, `${prefix}.rationale`);
  }
}
requireTrue(pace.wholeProgramFeelsConsistent,
  'paceConsistencyReview.wholeProgramFeelsConsistent');
if ((pace.unresolvedSections ?? []).length > 0) {
  errors.push('paceConsistencyReview.unresolvedSections must be empty');
}
const revalidation = pace.postRetimeRevalidation ?? {};
if (speed.retimeApplied === true) {
  if (revalidation.status !== 'pass') {
    errors.push('paceConsistencyReview.postRetimeRevalidation.status must be pass when retimeApplied is true');
  }
  for (const field of ['joinsAndBreaths', 'timelineDurationAndBoundaries']) {
    if (revalidation[field] !== 'pass') {
      errors.push(`paceConsistencyReview.postRetimeRevalidation.${field} must be pass after retiming`);
    }
  }
  for (const field of [
    'captions',
    'bRoll',
    'presenterOrCutout',
    'soundEffects',
    'backgroundMusicAndDucking',
    'layoutAndMotion',
    'chapterProgress',
    'transitions',
    'outro',
  ]) {
    if (!['pass', 'not-present'].includes(revalidation[field])) {
      errors.push(`paceConsistencyReview.postRetimeRevalidation.${field} must be pass or not-present after retiming`);
    }
  }
  requireTrue(revalidation.normalSpeedAudiovisualReviewCompleted,
    'paceConsistencyReview.postRetimeRevalidation.normalSpeedAudiovisualReviewCompleted');
  if (!Array.isArray(revalidation.evidence) || revalidation.evidence.length === 0
    || revalidation.evidence.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push('paceConsistencyReview.postRetimeRevalidation.evidence must contain normal-speed review evidence after retiming');
  }
} else if (speed.retimeApplied === false && revalidation.status !== 'not-applicable') {
  errors.push('paceConsistencyReview.postRetimeRevalidation.status must be not-applicable when retimeApplied is false');
}

if (!(speed.testedRates ?? []).includes(speed.selectedRate)) {
  errors.push('playbackSpeedReview.testedRates must include selectedRate');
}
requireString(speed.contentAndPerformanceRationale,
  'playbackSpeedReview.contentAndPerformanceRationale');
requireTrue(speed.representativeRenderedPassageReviewed,
  'playbackSpeedReview.representativeRenderedPassageReviewed');
requireTrue(speed.boundaryAuditRerunAfterRateSelection,
  'playbackSpeedReview.boundaryAuditRerunAfterRateSelection');
if (speed.retimeApplied === true) {
  requireTrue(speed.pitchPreserved, 'playbackSpeedReview.pitchPreserved');
  if (!(speed.stableRateRanges ?? []).some((range) => range.rate !== speed.sourceRate)) {
    errors.push('playbackSpeedReview.stableRateRanges must contain an applied rate different from sourceRate when retimeApplied is true');
  }
} else if (speed.retimeApplied === false && speed.selectedRate !== speed.sourceRate) {
  errors.push('playbackSpeedReview.selectedRate must equal sourceRate when retimeApplied is false');
}
requireFalse(speed.abruptRateChangeAtNonSemanticBoundary,
  'playbackSpeedReview.abruptRateChangeAtNonSemanticBoundary');
if (!(speed.stableRateRanges ?? []).length) {
  errors.push('playbackSpeedReview.stableRateRanges must declare the reviewed contiguous rate ranges');
}
if (bound) {
  const ranges = speed.stableRateRanges || [];
  const applied = bound.edl.segments.some(s=>(s.playbackRate ?? 1) !== 1);
  if (speed.retimeApplied !== applied) errors.push('retimeApplied differs from actual EDL');
  if (speed.sourceRate !== 1) errors.push('sourceRate must describe the original 1x timebase');
  let end = 0;
  for (const range of ranges) {
    if (!Number.isFinite(range.startSeconds) || !Number.isFinite(range.endSeconds) || !Number.isFinite(range.rate)
      || Math.abs(range.startSeconds-end)>1e-7 || range.endSeconds<=range.startSeconds || range.endSeconds>bound.edl.durationSeconds) {
      errors.push('stableRateRanges must cover the actual program contiguously');
    }
    for (const s of bound.edl.segments) {
      const start=s.outputStartFrame/bound.edl.outputFps,stop=s.outputEndFrameExclusive/bound.edl.outputFps;
      if (range.startSeconds < stop-1e-7 && range.endSeconds > start+1e-7 && range.rate !== (s.playbackRate ?? 1)) {
        errors.push('stableRateRanges rate differs from actual EDL');
      }
    }
    end=range.endSeconds;
  }
  if (Math.abs(end-bound.edl.durationSeconds)>1e-7) errors.push('stableRateRanges omit part of the program');
  for (const window of windows) for (const s of bound.edl.segments) {
    if (window.startSeconds < s.outputEndFrameExclusive/bound.edl.outputFps-1e-7
      && window.endSeconds > s.outputStartFrame/bound.edl.outputFps+1e-7
      && window.selectedPlaybackRate !== (s.playbackRate ?? 1)) errors.push('Pace sample rate differs from EDL; split samples at rate changes');
  }
}

const full = data.fullCutReview ?? {};
requireTrue(full.watchedFromStartToFinish, 'fullCutReview.watchedFromStartToFinish');
requireTrue(full.listenedFromStartToFinish, 'fullCutReview.listenedFromStartToFinish');
requireTrue(full.normalSpeedAuditoryReview, 'fullCutReview.normalSpeedAuditoryReview');
requireFalse(full.automationUsedAsSoleProof, 'fullCutReview.automationUsedAsSoleProof');
requireString(full.reviewer, 'fullCutReview.reviewer');
requireString(full.method, 'fullCutReview.method');
if ((full.unresolvedIssues ?? []).length > 0) {
  errors.push('fullCutReview.unresolvedIssues must be empty');
}

const color = data.sourceColorNormalization || {};
requireTrue(color.naturalSkinAndExposurePass,'sourceColorNormalization.naturalSkinAndExposurePass');
for (const role of ['early','middle','late','cutBoundaries']) requireTrue(color.representativeFramesChecked?.[role],`sourceColorNormalization.representativeFramesChecked.${role}`);
const loudness = data.dialogueLoudnessMatch || {};
for (const field of ['currentAfterIntegratedLufs','currentAfterTruePeakDbtp']) {
  if (!Number.isFinite(loudness[field])) errors.push(`dialogueLoudnessMatch.${field} must be measured`);
}
if (loudness.currentAfterTruePeakDbtp > 0) errors.push('dialogueLoudnessMatch: true peak exceeds 0 dBTP');
if (data.status === 'approved' && !data.approvedAt) {
  errors.push('approvedAt is required when status is approved');
}
if (data.status === 'ready-for-user-review' && data.approvedAt) {
  warnings.push('approvedAt is present before creator approval');
}

const result = {
  ok: errors.length === 0,
  input: inputPath,
  errors,
  warnings,
  counts: {
    joins: boundaries.length,
    pauseCandidates: pauseScan.candidateCount ?? null,
    paceWindows: windows.length,
  },
};

if (reportPath) writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
