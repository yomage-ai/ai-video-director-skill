#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRegistry = path.resolve(
  scriptDir, '../references/curated-style-library.json');
const [inputArg, reportArg] = process.argv.slice(2);
const inputPath = path.resolve(inputArg || defaultRegistry);
const reportPath = reportArg ? path.resolve(reportArg) : null;
const errors = [];

const nonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const requireString = (value, field) => {
  if (!nonEmptyString(value)) errors.push(`${field} must be a non-empty string`);
};
const requireTrue = (value, field) => {
  if (value !== true) errors.push(`${field} must be true`);
};
const requireFalse = (value, field) => {
  if (value !== false) errors.push(`${field} must be false`);
};
const requireStrings = (value, field, minimum = 1) => {
  if (!Array.isArray(value)
    || value.length < minimum
    || value.some((item) => !nonEmptyString(item))) {
    errors.push(`${field} must contain at least ${minimum} non-empty strings`);
  }
};

let raw = '';
let data = {};
try {
  raw = readFileSync(inputPath, 'utf8');
  data = JSON.parse(raw);
} catch (error) {
  errors.push(`cannot read curated style library: ${error.message}`);
}

if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!Number.isInteger(data.libraryVersion) || data.libraryVersion < 1) {
  errors.push('libraryVersion must be an integer >= 1');
}
requireString(data.libraryId, 'libraryId');
requireString(data.purpose?.en, 'purpose.en');
requireString(data.purpose?.['zh-CN'], 'purpose.zh-CN');
const minimumCandidates = data.selectionPolicy?.candidateComparisonMinimum;
if (!Number.isInteger(minimumCandidates) || minimumCandidates < 2) {
  errors.push('selectionPolicy.candidateComparisonMinimum must be an integer >= 2');
}
requireFalse(data.selectionPolicy?.universalTemplateLock,
  'selectionPolicy.universalTemplateLock');
requireTrue(data.referencePolicy?.keepMarkedStyles,
  'referencePolicy.keepMarkedStyles');
requireTrue(data.referencePolicy?.outsideLibraryAllowed,
  'referencePolicy.outsideLibraryAllowed');
requireTrue(data.referencePolicy?.hybridAllowed,
  'referencePolicy.hybridAllowed');
requireString(data.referencePolicy?.role, 'referencePolicy.role');
requireString(data.referencePolicy?.outsideLibraryRule,
  'referencePolicy.outsideLibraryRule');
requireTrue(data.sharedQualityFloor?.realEvidenceMayNotBeReplacedByIllustration,
  'sharedQualityFloor.realEvidenceMayNotBeReplacedByIllustration');
requireTrue(data.sharedQualityFloor?.literalReferenceCopyForbidden,
  'sharedQualityFloor.literalReferenceCopyForbidden');
requireTrue(data.sharedQualityFloor?.captionAndPlatformSafeRegionsRemainReserved,
  'sharedQualityFloor.captionAndPlatformSafeRegionsRemainReserved');
requireStrings(data.sharedQualityFloor?.verification,
  'sharedQualityFloor.verification', 4);

if (/\/Users\/|[A-Za-z]:\\|file:\/\/|@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(raw)) {
  errors.push('curated style library must not contain absolute user paths, file URLs, or email addresses');
}

const ids = new Set();
let activeCount = 0;
if (!Array.isArray(data.styles) || data.styles.length === 0) {
  errors.push('styles must contain at least one entry');
} else {
  for (const [index, style] of data.styles.entries()) {
    const prefix = `styles[${index}]`;
    requireString(style.id, `${prefix}.id`);
    if (nonEmptyString(style.id)
      && !/^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/.test(style.id)) {
      errors.push(`${prefix}.id must be a kebab-case versioned id`);
    }
    if (ids.has(style.id)) errors.push(`${prefix}.id must be unique`);
    ids.add(style.id);
    if (!['candidate', 'active', 'archived'].includes(style.status)) {
      errors.push(`${prefix}.status must be candidate, active, or archived`);
    }
    if (style.status === 'active') activeCount += 1;
    requireString(style.validationLevel, `${prefix}.validationLevel`);
    requireStrings(style.curationSignals, `${prefix}.curationSignals`);
    requireString(style.label?.en, `${prefix}.label.en`);
    requireString(style.label?.['zh-CN'], `${prefix}.label.zh-CN`);
    requireString(style.summary?.en, `${prefix}.summary.en`);
    requireString(style.summary?.['zh-CN'], `${prefix}.summary.zh-CN`);
    requireStrings(style.contentFit?.viewerJobs,
      `${prefix}.contentFit.viewerJobs`);
    requireStrings(style.contentFit?.strongSignals,
      `${prefix}.contentFit.strongSignals`);
    requireStrings(style.contentFit?.avoidWhen,
      `${prefix}.contentFit.avoidWhen`);
    requireString(style.visualContract?.surface,
      `${prefix}.visualContract.surface`);
    if (!style.visualContract?.palette
      || Object.keys(style.visualContract.palette).length < 4) {
      errors.push(`${prefix}.visualContract.palette must define at least four semantic color roles`);
    }
    requireString(style.visualContract?.typography,
      `${prefix}.visualContract.typography`);
    requireStrings(style.visualContract?.composition,
      `${prefix}.visualContract.composition`, 3);
    requireStrings(style.brollGrammar?.primaryForms,
      `${prefix}.brollGrammar.primaryForms`);
    requireString(style.brollGrammar?.buildRule,
      `${prefix}.brollGrammar.buildRule`);
    requireString(style.brollGrammar?.evidenceBoundary,
      `${prefix}.brollGrammar.evidenceBoundary`);
    requireStrings(style.motionGrammar?.entrances,
      `${prefix}.motionGrammar.entrances`);
    requireString(style.motionGrammar?.character,
      `${prefix}.motionGrammar.character`);
    requireString(style.motionGrammar?.timing,
      `${prefix}.motionGrammar.timing`);
    requireStrings(style.soundGrammar?.candidates,
      `${prefix}.soundGrammar.candidates`);
    requireString(style.soundGrammar?.rule,
      `${prefix}.soundGrammar.rule`);
    requireString(style.provenance?.relationship,
      `${prefix}.provenance.relationship`);
    requireFalse(style.provenance?.sourceAssetDistributed,
      `${prefix}.provenance.sourceAssetDistributed`);
    requireString(style.provenance?.note,
      `${prefix}.provenance.note`);
  }
}

if (Number.isInteger(minimumCandidates) && activeCount < minimumCandidates) {
  errors.push('active style count must meet candidateComparisonMinimum');
}

const result = {
  ok: errors.length === 0,
  input: inputPath,
  libraryVersion: data.libraryVersion ?? null,
  styleCount: Array.isArray(data.styles) ? data.styles.length : 0,
  activeStyleCount: activeCount,
  errors,
};
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
