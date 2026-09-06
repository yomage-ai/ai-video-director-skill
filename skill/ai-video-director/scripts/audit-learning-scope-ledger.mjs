#!/usr/bin/env node

import {readFileSync} from 'node:fs';
import path from 'node:path';

const validChangeTypes = new Set([
  'pre-existing-confirmed',
  'pre-existing-hardened',
  'public-curated-style-hardened',
  'corrected-overgeneralization',
  'new-general-rule',
  'new-public-curated-style',
  'new-private-preference',
  'project-only-decision',
]);
const validLayers = new Set([
  'public-repository',
  'public-curated-style-library',
  'private-profile',
  'project-only',
]);

function fail(message) {
  throw new Error(message);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const input = process.argv[2];
if (!input) fail('Usage: node audit-learning-scope-ledger.mjs <learning-scope-ledger.json>');
const file = path.resolve(input);
let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  fail(`Cannot read learning scope ledger ${file}: ${error instanceof Error ? error.message : error}`);
}

const errors = [];
const warnings = [];
if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
if (!nonEmpty(data.projectId)) errors.push('projectId is required.');
if (Array.isArray(data.entries) && data.entries.length === 0 && data.reviewedNoNewLearning === true && nonEmpty(data.noNewLearningReason)) {
  // A real review can find nothing new; do not force agents to invent a lesson.
} else if (!Array.isArray(data.entries) || data.entries.length === 0) {
  errors.push('Learning entries or an explicit reviewed no-new-learning reason are required.');
} else {
  const ids = new Set();
  const linkedReferences = [];
  data.entries.forEach((entry, index) => {
    const label = `entries[${index}]`;
    for (const field of [
      'id',
      'title',
      'sourceFeedback',
      'previousContract',
      'observedFailure',
      'generalizedInvariant',
      'projectSpecificInstance',
      'privacyReason',
    ]) {
      if (!nonEmpty(entry[field])) errors.push(`${label}.${field} is required.`);
    }
    if (ids.has(entry.id)) errors.push(`${label}.id must be unique.`);
    ids.add(entry.id);
    if (!validChangeTypes.has(entry.changeType)) errors.push(`${label}.changeType is invalid.`);
    if (!validLayers.has(entry.promotionLayer)) errors.push(`${label}.promotionLayer is invalid.`);
    if (entry.linkedEntryIds !== undefined && !Array.isArray(entry.linkedEntryIds)) {
      errors.push(`${label}.linkedEntryIds must be an array when present.`);
    } else {
      for (const targetId of entry.linkedEntryIds ?? []) {
        if (!nonEmpty(targetId) || targetId === entry.id) {
          errors.push(`${label}.linkedEntryIds must contain non-self entry ids.`);
        } else {
          linkedReferences.push({label, targetId});
        }
      }
    }
    const implementation = entry.implementation || {};
    if (implementation.externalKnowledgeRecords !== undefined
      && (!Array.isArray(implementation.externalKnowledgeRecords)
        || implementation.externalKnowledgeRecords.some((value) => !nonEmpty(value)))) {
      errors.push(`${label}.implementation.externalKnowledgeRecords must be an array of non-empty strings.`);
    }
    if (['public-repository', 'public-curated-style-library'].includes(entry.promotionLayer)
        && (!Array.isArray(implementation.publicRepositoryFiles) || implementation.publicRepositoryFiles.length === 0)) {
      errors.push(`${label} public entries must name publicRepositoryFiles.`);
    }
    if (entry.promotionLayer === 'private-profile'
        && (!Array.isArray(implementation.privateProfileKeys) || implementation.privateProfileKeys.length === 0)) {
      errors.push(`${label} private-profile entries must name privateProfileKeys.`);
    }
    if (entry.promotionLayer === 'project-only'
        && (!Array.isArray(implementation.projectArtifacts) || implementation.projectArtifacts.length === 0)) {
      errors.push(`${label} project-only entries must name projectArtifacts.`);
    }
    if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) errors.push(`${label}.evidence is required.`);
    if (entry.approvedByUser !== true) warnings.push(`${label} is not marked user-approved.`);
  });
  for (const {label, targetId} of linkedReferences) {
    if (!ids.has(targetId)) errors.push(`${label}.linkedEntryIds references missing entry ${targetId}.`);
  }
}

const report = {ok: errors.length === 0, file, errors, warnings};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
