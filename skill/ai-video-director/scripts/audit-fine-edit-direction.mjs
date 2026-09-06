#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveArtifact,verifyRenderReceipt,probe,invariant} from './lib/media-contract.mjs';
import {sameFile} from './lib/media-contract.mjs';

const [inputPath, reportPath] = process.argv.slice(2);
if (!inputPath) {
  console.error('Usage: node scripts/audit-fine-edit-direction.mjs <fine-edit-direction.json> [report.json]');
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, 'utf8'));
const errors = [];
const warnings = [];
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const curatedLibraryPath = path.resolve(
  scriptDir, '../references/curated-style-library.json');
let curatedLibrary = {libraryVersion: null, selectionPolicy: {}, styles: []};
try {
  curatedLibrary = JSON.parse(readFileSync(curatedLibraryPath, 'utf8'));
} catch (error) {
  errors.push(`curated style library could not be loaded: ${error.message}`);
}
const activeCuratedStyleIds = new Set(
  (curatedLibrary.styles ?? [])
    .filter((style) => style.status === 'active')
    .map((style) => style.id),
);

const requireTrue = (value, field) => {
  if (value !== true) errors.push(`${field} must be true`);
};
const requireFalse = (value, field) => {
  if (value !== false) errors.push(`${field} must be false`);
};
const requireString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${field} must be a non-empty string`);
};
const requireNumber = (value, field, minimum = 0) => {
  if (!Number.isFinite(value) || value < minimum) errors.push(`${field} must be a number >= ${minimum}`);
};
const nonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!['ready-for-user-review', 'approved'].includes(data.status)) {
  errors.push('status must be ready-for-user-review or approved');
}
requireTrue(data.basedOn?.roughCutApproved, 'basedOn.roughCutApproved');
if (!['deferred', 'approved-reference', 'explicit-new-reference', 'curated-library', 'dynamic-adaptation', 'content-derived']
  .includes(data.styleSource?.mode)) {
  errors.push('styleSource.mode must declare deferred, approved-reference, explicit-new-reference, curated-library, dynamic-adaptation, or content-derived');
}
requireFalse(data.styleSource?.unreferencedHouseTemplateLockedAtDirectorPlan,
  'styleSource.unreferencedHouseTemplateLockedAtDirectorPlan');
if (['ready-for-user-review', 'approved'].includes(data.status)
  && data.styleSource?.mode === 'deferred') {
  errors.push('styleSource.mode may not remain deferred when the fine-edit direction is ready for review');
}

const dynamicModes = new Set(['dynamic-adaptation', 'content-derived']);
const curatedDecisionModes = new Set(['curated-library', ...dynamicModes]);
if (curatedDecisionModes.has(data.styleSource?.mode)) {
  const selection = data.styleSource?.curatedLibrary ?? {};
  requireTrue(selection.reviewed, 'styleSource.curatedLibrary.reviewed');
  if (selection.libraryVersion !== curatedLibrary.libraryVersion) {
    errors.push('styleSource.curatedLibrary.libraryVersion must match the installed curated style library');
  }
  const minimumCandidates = curatedLibrary.selectionPolicy?.candidateComparisonMinimum ?? 2;
  if (!Array.isArray(selection.candidateStyleIds)
    || selection.candidateStyleIds.length < minimumCandidates
    || selection.candidateStyleIds.some((id) => !nonEmptyString(id))) {
    errors.push(`styleSource.curatedLibrary.candidateStyleIds must contain at least ${minimumCandidates} named candidates`);
  }
  const candidateIds = selection.candidateStyleIds ?? [];
  if (new Set(candidateIds).size !== candidateIds.length) {
    errors.push('styleSource.curatedLibrary.candidateStyleIds must not contain duplicates');
  }
  for (const id of candidateIds) {
    if (!activeCuratedStyleIds.has(id)) {
      errors.push(`styleSource.curatedLibrary candidate is not an active library style: ${id}`);
    }
  }
  requireString(selection.selectionReason,
    'styleSource.curatedLibrary.selectionReason');
  requireString(selection.adaptationSummary,
    'styleSource.curatedLibrary.adaptationSummary');
  if (!Array.isArray(selection.rejectionReasons)) {
    errors.push('styleSource.curatedLibrary.rejectionReasons must be an array');
  }
  const assessedIds = new Set();
  for (const [index, assessment] of (selection.rejectionReasons ?? []).entries()) {
    const prefix = `styleSource.curatedLibrary.rejectionReasons[${index}]`;
    requireString(assessment?.styleId, `${prefix}.styleId`);
    requireString(assessment?.reason, `${prefix}.reason`);
    if (!candidateIds.includes(assessment?.styleId)) {
      errors.push(`${prefix}.styleId must be one of the considered candidateStyleIds`);
    }
    assessedIds.add(assessment?.styleId);
  }

  if (data.styleSource.mode === 'curated-library') {
    requireString(selection.selectedStyleId,
      'styleSource.curatedLibrary.selectedStyleId');
    if (!activeCuratedStyleIds.has(selection.selectedStyleId)) {
      errors.push('styleSource.curatedLibrary.selectedStyleId must name an active library style');
    }
    if (!candidateIds.includes(selection.selectedStyleId)) {
      errors.push('styleSource.curatedLibrary.candidateStyleIds must include selectedStyleId');
    }
    if (data.styleSource.referenceId !== selection.selectedStyleId) {
      errors.push('styleSource.referenceId must equal the selected curated style id');
    }
    requireTrue(data.styleSource.contractExtracted,
      'styleSource.contractExtracted for curated-library mode');
    for (const id of candidateIds) {
      if (id !== selection.selectedStyleId && !assessedIds.has(id)) {
        errors.push(`styleSource.curatedLibrary.rejectionReasons must explain why ${id} was not selected`);
      }
    }
  }

  if (dynamicModes.has(data.styleSource.mode)) {
    if (selection.selectedStyleId !== null) {
      errors.push('styleSource.curatedLibrary.selectedStyleId must be null for dynamic adaptation');
    }
    if (!Array.isArray(selection.rejectionReasons)
      || selection.rejectionReasons.length < candidateIds.length) {
      errors.push('styleSource.curatedLibrary.rejectionReasons must assess every candidate before dynamic adaptation');
    }
    for (const id of candidateIds) {
      if (!assessedIds.has(id)) {
        errors.push(`styleSource.curatedLibrary.rejectionReasons must include ${id}`);
      }
    }

    const dynamic = data.styleSource.dynamicAdaptation ?? {};
    requireString(dynamic.triggerReason,
      'styleSource.dynamicAdaptation.triggerReason');
    requireString(dynamic.fitGap,
      'styleSource.dynamicAdaptation.fitGap');
    requireString(dynamic.dominantSystem,
      'styleSource.dynamicAdaptation.dominantSystem');
    requireTrue(dynamic.notLimitedToLibrary,
      'styleSource.dynamicAdaptation.notLimitedToLibrary');
    if (!Array.isArray(dynamic.borrowedReferenceRoles)) {
      errors.push('styleSource.dynamicAdaptation.borrowedReferenceRoles must be an array');
    } else {
      for (const [index, item] of dynamic.borrowedReferenceRoles.entries()) {
        const prefix = `styleSource.dynamicAdaptation.borrowedReferenceRoles[${index}]`;
        requireString(item?.styleId, `${prefix}.styleId`);
        requireString(item?.role, `${prefix}.role`);
        requireString(item?.reason, `${prefix}.reason`);
        if (!activeCuratedStyleIds.has(item?.styleId)) {
          errors.push(`${prefix}.styleId must name an active curated style`);
        }
      }
    }
    for (const field of [
      'palette',
      'typography',
      'composition',
      'imageryAndIcons',
      'motion',
      'transitions',
      'music',
      'soundEffects',
    ]) {
      requireString(dynamic.visualSystem?.[field],
        `styleSource.dynamicAdaptation.visualSystem.${field}`);
    }
    if (data.styleSource.mode === 'content-derived') {
      warnings.push('styleSource.mode content-derived is a legacy alias; use dynamic-adaptation for new records');
    }
  }
}
requireString(data.contentDirection?.primaryViewerJob,
  'contentDirection.primaryViewerJob');
requireTrue(data.contentDirection?.contentSpecificLayoutSelection,
  'contentDirection.contentSpecificLayoutSelection');
requireTrue(data.contentDirection?.majorNarrativeBeatsAudited,
  'contentDirection.majorNarrativeBeatsAudited');
if (!(data.contentDirection?.beats ?? []).length) {
  errors.push('contentDirection.beats must contain at least one semantic beat');
}
for (const [index, beat] of (data.contentDirection?.beats ?? []).entries()) {
  const prefix = `contentDirection.beats[${index}]`;
  requireString(beat.id, `${prefix}.id`);
  requireString(beat.viewerJob, `${prefix}.viewerJob`);
  requireString(beat.narrativeRole, `${prefix}.narrativeRole`);
  if (!['none', 'visual', 'audio', 'both'].includes(beat.emphasisDecision)) {
    errors.push(`${prefix}.emphasisDecision must be none, visual, audio, or both`);
  }
  requireString(beat.emphasisReason, `${prefix}.emphasisReason`);
}

const visualAssetPlan = data.visualAssetPlan ?? {};
requireTrue(visualAssetPlan.contentFitPrimary,
  'visualAssetPlan.contentFitPrimary');
requireTrue(visualAssetPlan.referenceLibraryIsNotWhitelist,
  'visualAssetPlan.referenceLibraryIsNotWhitelist');
requireString(visualAssetPlan.coherencePlan,
  'visualAssetPlan.coherencePlan');
if (!Array.isArray(visualAssetPlan.decisions)
  || visualAssetPlan.decisions.length === 0) {
  errors.push('visualAssetPlan.decisions must contain at least one beat-level asset decision');
}
const beatIds = new Set((data.contentDirection?.beats ?? []).map((beat) => beat.id));
const plannedBeatIds = new Set();
const semanticRoles = new Set([
  'proof',
  'explanation',
  'comparison',
  'atmosphere',
  'transition',
  'emphasis',
  'identity',
  'none',
]);
const assetForms = new Set([
  'real-footage',
  'screen-recording',
  'still-image',
  'document',
  'generated-raster',
  'code-motion',
  'typography',
  'icons',
  'licensed-media',
  'hybrid',
  'none',
]);
for (const [index, decision] of (visualAssetPlan.decisions ?? []).entries()) {
  const prefix = `visualAssetPlan.decisions[${index}]`;
  requireString(decision.beatId, `${prefix}.beatId`);
  if (!beatIds.has(decision.beatId)) {
    errors.push(`${prefix}.beatId must name a contentDirection beat`);
  }
  plannedBeatIds.add(decision.beatId);
  requireString(decision.viewerJob, `${prefix}.viewerJob`);
  if (!semanticRoles.has(decision.semanticRole)) {
    errors.push(`${prefix}.semanticRole is invalid`);
  }
  if (!assetForms.has(decision.assetForm)) {
    errors.push(`${prefix}.assetForm is invalid`);
  }
  if (!Array.isArray(decision.referenceStyleIds)
    || decision.referenceStyleIds.some((id) => !activeCuratedStyleIds.has(id))) {
    errors.push(`${prefix}.referenceStyleIds must be an array of active curated style ids`);
  }
  for (const field of [
    'selectionReason',
    'sourceOrGenerationPlan',
    'rendererOrTool',
    'plannedVisibleResult',
    'styleAdaptation',
    'rightsEvidencePrivacyBoundary',
  ]) {
    requireString(decision[field], `${prefix}.${field}`);
  }
}
for (const beatId of beatIds) {
  if (!plannedBeatIds.has(beatId)) {
    errors.push(`visualAssetPlan.decisions must include content beat ${beatId}`);
  }
}

const evidence = data.screenEvidence ?? {};
if (typeof evidence.used !== 'boolean') {
  errors.push('screenEvidence.used must be true or false');
}
requireTrue(evidence.formatSelectionIsContentDriven,
  'screenEvidence.formatSelectionIsContentDriven');
requireFalse(evidence.automaticStillOrRecordingRule,
  'screenEvidence.automaticStillOrRecordingRule');
requireTrue(evidence.onePrimaryEvidencePlaneDefault,
  'screenEvidence.onePrimaryEvidencePlaneDefault');
requireFalse(evidence.persistentSynchronizedDuplicateDefault,
  'screenEvidence.persistentSynchronizedDuplicateDefault');
requireTrue(evidence.wholeThenSemanticPushPanOrCut,
  'screenEvidence.wholeThenSemanticPushPanOrCut');
requireTrue(evidence.splitScreenOnlyForGenuineSimultaneousComparison,
  'screenEvidence.splitScreenOnlyForGenuineSimultaneousComparison');
if (evidence.used === true && !(evidence.runs ?? []).length) {
  errors.push('screenEvidence.runs must declare every screen-evidence run when screen evidence is used');
}
if (evidence.used === true) {
  requireTrue(evidence.sourceRangesAllocatedBeforeFullFineEdit,
    'screenEvidence.sourceRangesAllocatedBeforeFullFineEdit');
  requireTrue(evidence.crossRunSourceReuseAudited,
    'screenEvidence.crossRunSourceReuseAudited');
}
const priorSourceRanges = new Map();
for (const [index, run] of (evidence.runs ?? []).entries()) {
  const prefix = `screenEvidence.runs[${index}]`;
  requireString(run.id, `${prefix}.id`);
  requireString(run.viewerJob, `${prefix}.viewerJob`);
  requireString(run.layoutReason, `${prefix}.layoutReason`);
  requireString(run.narrativeRole, `${prefix}.narrativeRole`);
  requireString(run.sourceRangeId, `${prefix}.sourceRangeId`);
  requireString(run.newInformationComparedWithEarlierRuns,
    `${prefix}.newInformationComparedWithEarlierRuns`);
  if (run.sourceRangeId && priorSourceRanges.has(run.sourceRangeId)) {
    if (run.reusesEarlierSourceRange !== true) {
      errors.push(`${prefix}.reusesEarlierSourceRange must be true when sourceRangeId was used earlier`);
    }
    requireString(run.reuseJustification, `${prefix}.reuseJustification`);
  } else if (run.reusesEarlierSourceRange === true) {
    errors.push(`${prefix}.reusesEarlierSourceRange may be true only when sourceRangeId was used earlier`);
  }
  if (run.sourceRangeId) priorSourceRanges.set(run.sourceRangeId, index);
  if (typeof run.recordingProvided !== 'boolean') {
    errors.push(`${prefix}.recordingProvided must be true or false`);
  }
  if (!Array.isArray(run.candidateFormatsConsidered)
    || run.candidateFormatsConsidered.length === 0) {
    errors.push(`${prefix}.candidateFormatsConsidered must declare at least one candidate`);
  }
  if (!['still', 'recording', 'hybrid'].includes(run.selectedFormat)) {
    errors.push(`${prefix}.selectedFormat must be still, recording, or hybrid`);
  }
  requireString(run.formatReason, `${prefix}.formatReason`);
  requireFalse(run.automaticFormatRuleApplied, `${prefix}.automaticFormatRuleApplied`);
  if (run.recordingProvided === true) {
    requireTrue(run.recordingReviewedFirst, `${prefix}.recordingReviewedFirst`);
    requireTrue(run.representativeStillCompared,
      `${prefix}.representativeStillCompared`);
    if (!(run.candidateFormatsConsidered ?? []).includes('recording')
      || !(run.candidateFormatsConsidered ?? []).includes('still')) {
      errors.push(`${prefix}.candidateFormatsConsidered must include recording and still when a recording was provided`);
    }
  }
  requireTrue(run.primaryEvidencePlaneDeclared, `${prefix}.primaryEvidencePlaneDeclared`);
  if (run.persistentSynchronizedDuplicate === true) {
    errors.push(`${prefix} may not persistently duplicate synchronized source footage`);
  }
  if ((run.simultaneousSourceCopies ?? 1) > 1) {
    if (!Number.isFinite(run.temporaryDetailDurationSeconds)
      || run.temporaryDetailDurationSeconds <= 0
      || run.temporaryDetailDurationSeconds > 2.5) {
      errors.push(`${prefix}.temporaryDetailDurationSeconds must be > 0 and <= 2.5 when copies > 1`);
    }
    requireString(run.temporaryDetailReason, `${prefix}.temporaryDetailReason`);
  }
}

const presenter = data.presenter ?? {};
if (typeof presenter.used !== 'boolean') errors.push('presenter.used must be true or false');
if (typeof presenter.cutoutUsed !== 'boolean') {
  errors.push('presenter.cutoutUsed must be true or false');
}
requireTrue(presenter.roleDeclaredPerRun, 'presenter.roleDeclaredPerRun');
requireTrue(presenter.placementFollowsEvidenceOccupancy,
  'presenter.placementFollowsEvidenceOccupancy');
requireTrue(presenter.publicLowerCornerRecommendationAppliesOnlyToBBaseACutout,
  'presenter.publicLowerCornerRecommendationAppliesOnlyToBBaseACutout');
requireTrue(presenter.publicRecommendationIsOverridable,
  'presenter.publicRecommendationIsOverridable');
requireFalse(presenter.activeEvidenceMayBeCovered,
  'presenter.activeEvidenceMayBeCovered');
if (presenter.used === true) {
  requireTrue(presenter.previewIncludesPlannedTreatment,
    'presenter.previewIncludesPlannedTreatment');
}
if (presenter.cutoutUsed === true) {
  requireTrue(presenter.used, 'presenter.used when presenter.cutoutUsed is true');
  const placement = presenter.portraitCutoutPlacement ?? {};
  if (!['public-recommendation', 'content-derived', 'approved-reference', 'private-profile', 'mixed']
    .includes(placement.selectionSource)) {
    errors.push('presenter.portraitCutoutPlacement.selectionSource must declare how placement was selected');
  }
  if (!Array.isArray(placement.publicRecommendedStartingZones)
    || !placement.publicRecommendedStartingZones.includes('lower-left')
    || !placement.publicRecommendedStartingZones.includes('lower-right')) {
    errors.push('presenter.portraitCutoutPlacement.publicRecommendedStartingZones must include lower-left and lower-right');
  }
  requireTrue(placement.publicRecommendationConsidered,
    'presenter.portraitCutoutPlacement.publicRecommendationConsidered');
  if (!Array.isArray(placement.candidateZonesCompared)
    || placement.candidateZonesCompared.length === 0
    || placement.candidateZonesCompared.some((zone) => !nonEmptyString(zone))) {
    errors.push('presenter.portraitCutoutPlacement.candidateZonesCompared must contain at least one named zone');
  }
  requireFalse(placement.universalCornerDefaultApplied,
    'presenter.portraitCutoutPlacement.universalCornerDefaultApplied');
  requireString(placement.selectedZone,
    'presenter.portraitCutoutPlacement.selectedZone');
  if (!(placement.candidateZonesCompared ?? []).includes(placement.selectedZone)) {
    errors.push('presenter.portraitCutoutPlacement.candidateZonesCompared must include selectedZone');
  }
  if (!(placement.candidateZonesCompared ?? []).some((zone) => ['lower-left', 'lower-right'].includes(zone))) {
    errors.push('presenter.portraitCutoutPlacement must consider at least one public lower-corner recommendation');
  }
  if (!['lower-left', 'lower-right'].includes(placement.selectedZone)) {
    requireString(placement.publicRecommendationOverrideReason,
      'presenter.portraitCutoutPlacement.publicRecommendationOverrideReason');
  }
  requireString(placement.selectionReason,
    'presenter.portraitCutoutPlacement.selectionReason');
  requireTrue(placement.stableWithinCoverageRun,
    'presenter.portraitCutoutPlacement.stableWithinCoverageRun');

  const outline = presenter.cutoutOutline ?? {};
  if (!['public-recommendation', 'content-derived', 'approved-reference', 'private-profile', 'mixed']
    .includes(outline.selectionSource)) {
    errors.push('presenter.cutoutOutline.selectionSource must declare how the outline was selected');
  }
  if (outline.publicRecommendedStartingState !== 'on') {
    errors.push('presenter.cutoutOutline.publicRecommendedStartingState must be on');
  }
  requireTrue(outline.publicRecommendationConsidered,
    'presenter.cutoutOutline.publicRecommendationConsidered');
  requireTrue(outline.recommendationOverridable,
    'presenter.cutoutOutline.recommendationOverridable');
  if (!Array.isArray(outline.candidateStatesCompared)
    || outline.candidateStatesCompared.length === 0
    || outline.candidateStatesCompared.some((state) => !['on', 'off'].includes(state))) {
    errors.push('presenter.cutoutOutline.candidateStatesCompared must contain on and/or off candidates');
  }
  requireFalse(outline.universalOutlineDefaultApplied,
    'presenter.cutoutOutline.universalOutlineDefaultApplied');
  if (!['on', 'off'].includes(outline.decision)) {
    errors.push('presenter.cutoutOutline.decision must be on or off');
  }
  if (!(outline.candidateStatesCompared ?? []).includes('on')) {
    errors.push('presenter.cutoutOutline.candidateStatesCompared must include the public on recommendation');
  }
  if (!(outline.candidateStatesCompared ?? []).includes(outline.decision)) {
    errors.push('presenter.cutoutOutline.candidateStatesCompared must include the selected decision');
  }
  if (outline.decision === 'off') {
    requireString(outline.publicRecommendationOverrideReason,
      'presenter.cutoutOutline.publicRecommendationOverrideReason');
  }
  requireString(outline.decisionReason, 'presenter.cutoutOutline.decisionReason');
  requireTrue(outline.colorSelectionIsContentDriven,
    'presenter.cutoutOutline.colorSelectionIsContentDriven');
  if (outline.decision === 'on') {
    requireTrue(outline.derivedFromSameAlpha,
      'presenter.cutoutOutline.derivedFromSameAlpha');
    const palette = outline.paletteAnalysis ?? {};
    requireString(palette.hairOrHeadwear,
      'presenter.cutoutOutline.paletteAnalysis.hairOrHeadwear');
    requireString(palette.clothing,
      'presenter.cutoutOutline.paletteAnalysis.clothing');
    for (const field of ['underlyingBackgroundFamilies', 'contentOrBrandPalette']) {
      if (!Array.isArray(palette[field]) || palette[field].length === 0
        || palette[field].some((item) => typeof item !== 'string' || item.trim() === '')) {
        errors.push(`presenter.cutoutOutline.paletteAnalysis.${field} must contain analyzed colors`);
      }
    }
    if (!Array.isArray(palette.contrastRisks)) {
      errors.push('presenter.cutoutOutline.paletteAnalysis.contrastRisks must be an array');
    }
    requireString(outline.selectedColor, 'presenter.cutoutOutline.selectedColor');
    requireNumber(outline.selectedWidthToCanvasWidth,
      'presenter.cutoutOutline.selectedWidthToCanvasWidth', 0.0001);
    requireTrue(outline.brightDarkBusyAndPhoneScaleReviewed,
      'presenter.cutoutOutline.brightDarkBusyAndPhoneScaleReviewed');
  }
}

const captions = data.captions ?? {};
if (!['public-recommendation', 'content-and-phone-scale', 'approved-reference', 'private-profile', 'mixed']
  .includes(captions.selectionSource)) {
  errors.push('captions.selectionSource must declare how the maximum line count was selected');
}
if (captions.publicRecommendedMaximumLines !== 1) {
  errors.push('captions.publicRecommendedMaximumLines must be 1');
}
requireTrue(captions.publicRecommendationConsidered,
  'captions.publicRecommendationConsidered');
requireTrue(captions.recommendationOverridable,
  'captions.recommendationOverridable');
if (!Array.isArray(captions.candidateMaximumLinesCompared)
  || captions.candidateMaximumLinesCompared.length === 0
  || captions.candidateMaximumLinesCompared.some((lines) => ![1, 2].includes(lines))) {
  errors.push('captions.candidateMaximumLinesCompared must contain one-line and/or two-line candidates');
}
if (captions.delivery === 'portrait-short-form'
  && ![1, 2].includes(captions.selectedMaximumLines)) {
  errors.push('captions.selectedMaximumLines must be 1 or 2 for portrait short-form delivery');
}
if (!(captions.candidateMaximumLinesCompared ?? []).includes(captions.selectedMaximumLines)) {
  errors.push('captions.candidateMaximumLinesCompared must include captions.selectedMaximumLines');
}
if (captions.delivery === 'portrait-short-form' && !(captions.candidateMaximumLinesCompared ?? []).includes(1)) {
  errors.push('captions.candidateMaximumLinesCompared must include the public one-line recommendation');
}
if (captions.selectedMaximumLines !== 1) {
  requireString(captions.publicRecommendationOverrideReason,
    'captions.publicRecommendationOverrideReason');
}
requireString(captions.selectionReason, 'captions.selectionReason');
requireFalse(captions.universalOneLineDefaultApplied,
  'captions.universalOneLineDefaultApplied');
requireTrue(captions.splitLongThoughtIntoConsecutiveSemanticCardsFirst,
  'captions.splitLongThoughtIntoConsecutiveSemanticCardsFirst');
requireFalse(captions.fixedWidthOrMidWordSplitAllowed,
  'captions.fixedWidthOrMidWordSplitAllowed');
requireTrue(captions.phoneScaleReviewed, 'captions.phoneScaleReviewed');

for (const key of ['backgroundMusic', 'soundEffects']) {
  const item = data.audio?.[key] ?? {};
  if (!['on', 'off'].includes(item.decision)) {
    errors.push(`audio.${key}.decision must be on or off`);
  }
  requireTrue(item.auditionedInStyleSample, `audio.${key}.auditionedInStyleSample`);
  requireString(item.reason, `audio.${key}.reason`);
  if (item.decision === 'on' && item.rightsStatus !== 'cleared') {
    errors.push(`audio.${key}.rightsStatus must be cleared when enabled`);
  }
  if (item.decision === 'off' && item.rightsStatus !== 'not-applicable') {
    errors.push(`audio.${key}.rightsStatus must be not-applicable when disabled`);
  }
  const provenance = item.provenance ?? {};
  const validOriginTypes = new Set([
    'ai-generated',
    'licensed-library',
    'creator-provided',
    'commissioned-original',
    'other-cleared',
    'not-applicable',
  ]);
  if (item.decision === 'on') {
    if (!validOriginTypes.has(provenance.originType)
      || provenance.originType === 'not-applicable') {
      errors.push(`audio.${key}.provenance.originType must declare the enabled audio source`);
    }
    requireString(provenance.providerOrLibrary,
      `audio.${key}.provenance.providerOrLibrary`);
    requireString(provenance.rightsManifestItemId,
      `audio.${key}.provenance.rightsManifestItemId`);
    requireString(provenance.creatorFacingSummary,
      `audio.${key}.provenance.creatorFacingSummary`);
    if (typeof provenance.exclusiveOriginalityVerified !== 'boolean') {
      errors.push(`audio.${key}.provenance.exclusiveOriginalityVerified must be a boolean`);
    }
    if (provenance.originType === 'ai-generated') {
      requireString(provenance.generationJobOrAssetId,
        `audio.${key}.provenance.generationJobOrAssetId`);
    }
    if (provenance.originType === 'licensed-library'
      && provenance.exclusiveOriginalityVerified === true) {
      errors.push(`audio.${key} licensed-library audio cannot be marked exclusive original`);
    }
  } else if (item.decision === 'off' && provenance.originType !== 'not-applicable') {
    errors.push(`audio.${key}.provenance.originType must be not-applicable when disabled`);
  }
}
requireTrue(data.audio?.backgroundMusic?.speechIntelligibilityReviewed,
  'audio.backgroundMusic.speechIntelligibilityReviewed');
if (['curated-library', 'dynamic-adaptation', 'content-derived'].includes(data.styleSource?.mode)) {
  requireTrue(data.audio?.backgroundMusic?.dialogueOnlyComparisonAuditionedWhenNoStyleWasLocked,
    'audio.backgroundMusic.dialogueOnlyComparisonAuditionedWhenNoStyleWasLocked');
}

try {
  const base=path.dirname(path.resolve(inputPath));
  const bound=verifyRenderReceipt(data.evidenceBinding?.roughRenderReceipt,base);
  invariant(data.basedOn.canonicalEdlVersion===bound.receipt.edl.sha256,'fine direction is bound to an older EDL');
  invariant(data.basedOn.durationFrames===bound.edl.durationFrames && data.basedOn.fps===bound.edl.outputFps,'fine direction timebase differs from EDL');
  const sampleFile=resolveArtifact(data.evidenceBinding?.sample,base,'audiovisual sample');
  invariant(sameFile(path.resolve(base,data.audiovisualSample.reviewArtifact),sampleFile),'sample artifact differs from evidence');
  const media=probe(sampleFile);
  invariant(media.streams.some(s=>s.codec_type==='audio') && media.streams.some(s=>s.codec_type==='video'),'sample requires actual video and audio streams');
  invariant(Math.abs(Number(media.format.duration)-data.audiovisualSample.durationSeconds)<0.1,'sample duration differs from real media');
  invariant(Array.isArray(data.evidenceBinding.dependencies) && data.evidenceBinding.dependencies.length>0,'sample source/config bindings required');
  for(const ref of data.evidenceBinding.dependencies) resolveArtifact(ref,base,'sample dependency');
} catch(error) { errors.push(`evidenceBinding: ${error.message}`); }

const sample = data.audiovisualSample ?? {};
if (!Number.isFinite(sample.durationSeconds)
  || sample.durationSeconds < 6
  || sample.durationSeconds > 12) {
  errors.push('audiovisualSample.durationSeconds must be between 6 and 12');
}
requireTrue(sample.containsActualOrTimingFaithfulDialogue,
  'audiovisualSample.containsActualOrTimingFaithfulDialogue');
requireTrue(sample.containsFinalLikeCaptions,
  'audiovisualSample.containsFinalLikeCaptions');
requireTrue(sample.containsPlannedEvidenceTreatment,
  'audiovisualSample.containsPlannedEvidenceTreatment');
if (presenter.used === true) {
  requireTrue(sample.containsPlannedPresenterTreatmentWhenUsed,
    'audiovisualSample.containsPlannedPresenterTreatmentWhenUsed');
}
requireTrue(sample.containsProposedBgmAndSfxState,
  'audiovisualSample.containsProposedBgmAndSfxState');
requireString(sample.creatorFacingReviewLanguage,
  'audiovisualSample.creatorFacingReviewLanguage');
requireString(sample.reviewArtifact, 'audiovisualSample.reviewArtifact');
if (sample.silent !== false) errors.push('audiovisualSample cannot be silent; dialogue-only still includes audible speech');
requireString(data.approval?.question, 'approval.question');
if (data.status === 'approved' && !data.approval?.approvedAt) {
  errors.push('approval.approvedAt is required when status is approved');
}

const result = {ok: errors.length === 0, input: inputPath, errors, warnings};
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
