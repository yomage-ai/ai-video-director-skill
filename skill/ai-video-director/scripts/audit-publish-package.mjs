#!/usr/bin/env node

import {readFileSync} from 'node:fs';
import path from 'node:path';

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`Cannot read publish package ${file}: ${error instanceof Error ? error.message : error}`);
  }
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const input = process.argv[2];
if (!input) {
  fail('Usage: node audit-publish-package.mjs <publish-package.json>');
}

const file = path.resolve(input);
const data = readJson(file);
const errors = [];
const warnings = [];

if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
if (!nonEmpty(data.target?.platform)) errors.push('target.platform is required.');
if (!/^\d{4}-\d{2}-\d{2}/.test(data.rulesVerification?.checkedAt || '')) {
  errors.push('rulesVerification.checkedAt must record a current ISO date.');
}
const officialSources = data.rulesVerification?.officialSources;
if (!Array.isArray(officialSources) || officialSources.length === 0) {
  errors.push('At least one official rule source is required.');
} else if (officialSources.some((source) => !/^https:\/\//.test(source?.url || ''))) {
  errors.push('Every official rule source must include a direct HTTPS URL.');
}
if (data.rulesVerification?.guaranteedCompliantClaimAllowed !== false) {
  errors.push('The package may not promise guaranteed compliance.');
}

const release = data.releaseMaster || {};
if (!['platform-release', 'source-quality-master'].includes(release.classification)) {
  errors.push('releaseMaster must be a platform-release or source-quality-master.');
}
if (!nonEmpty(release.path)) errors.push('releaseMaster.path is required.');
if (release.upscaledReviewProxy === true) errors.push('An upscaled review proxy cannot pass as a release master.');
for (const axis of ['width', 'height']) {
  const required = Number(release.required?.[axis]);
  const probed = Number(release.probed?.[axis]);
  if (!Number.isFinite(required) || required <= 0) errors.push(`releaseMaster.required.${axis} is required.`);
  if (probed !== required) errors.push(`releaseMaster.probed.${axis} must equal the required value.`);
}
if (release.exactCandidateQaPassed !== true) errors.push('The exact release candidate must pass QA.');

const disclosure = data.aiDisclosure || {};
const aiUsed = [disclosure.aiAssistedEditing, disclosure.aiGeneratedGraphicsOrAnimation,
  disclosure.syntheticVoice, disclosure.faceReplacement].some((value) => value === true);
if (aiUsed && disclosure.platformDeclarationPlanned !== true) {
  errors.push('AI use is declared, but the platform declaration is not planned.');
}
if (aiUsed && !nonEmpty(disclosure.viewerFacingCopy)) {
  warnings.push('AI use is declared but viewerFacingCopy is empty; verify whether current rules require visible copy.');
}

const variants = data.variants;
if (!Array.isArray(variants) || variants.length < 3) {
  errors.push('Provide at least three publication variants.');
} else {
  const ids = new Set();
  const risky = /(保证不违规|绝不违规|绝不限流|100%|百分之百|必火|稳赚|私信领取|加微|微信[:：]?\s*[A-Za-z0-9_-]+|https?:\/\/)/i;
  variants.forEach((variant, index) => {
    const label = `variants[${index}]`;
    if (!nonEmpty(variant.id)) errors.push(`${label}.id is required.`);
    if (ids.has(variant.id)) errors.push(`${label}.id must be unique.`);
    ids.add(variant.id);
    if (!nonEmpty(variant.coverTitle)) errors.push(`${label}.coverTitle is required.`);
    if (!nonEmpty(variant.postCaption)) errors.push(`${label}.postCaption is required.`);
    const combined = `${variant.coverTitle || ''}\n${variant.postCaption || ''}`;
    if (risky.test(combined)) errors.push(`${label} contains a prohibited guarantee, diversion cue, or raw URL.`);
    if (!Array.isArray(variant.hashtags) || variant.hashtags.length < 2 || variant.hashtags.length > 8) {
      errors.push(`${label}.hashtags must contain 2-8 directly relevant tags.`);
    } else {
      const normalized = variant.hashtags.map((tag) => String(tag).trim());
      if (new Set(normalized).size !== normalized.length) errors.push(`${label}.hashtags contains duplicates.`);
      if (normalized.some((tag) => !tag.startsWith('#'))) errors.push(`${label}.hashtags must start with #.`);
    }
  });
}

if (Array.isArray(data.campaignTags) && data.campaignTags.length > 0
    && data.campaignEligibilityVerified !== true) {
  errors.push('Campaign tags require verified eligibility.');
}
if (data.humanReviewRequired !== true) errors.push('humanReviewRequired must remain true.');

const report = {ok: errors.length === 0, file, errors, warnings};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
