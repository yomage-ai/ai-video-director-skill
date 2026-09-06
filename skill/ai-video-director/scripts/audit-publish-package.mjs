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

const claimEvidence = Array.isArray(data.claimEvidence) ? data.claimEvidence : [];
const claimById = new Map();
for (const [index, claim] of claimEvidence.entries()) {
  const label = `claimEvidence[${index}]`;
  if (!nonEmpty(claim.id)) errors.push(`${label}.id is required.`);
  if (claimById.has(claim.id)) errors.push(`${label}.id must be unique.`);
  if (nonEmpty(claim.id)) claimById.set(claim.id, claim);
  if (!nonEmpty(claim.claimText)) errors.push(`${label}.claimText is required.`);
  if (!nonEmpty(claim.publicationWording)) errors.push(`${label}.publicationWording is required.`);
  if (!['exact', 'rounded', 'bounded', 'personal-experience', 'question-only']
    .includes(claim.precision)) {
    errors.push(`${label}.precision must be exact, rounded, bounded, personal-experience, or question-only.`);
  }
  if (!nonEmpty(claim.scope)) errors.push(`${label}.scope is required.`);
  if (!nonEmpty(claim.sourceEvidence)) errors.push(`${label}.sourceEvidence is required.`);
  if (!['verified', 'narrowed', 'removed'].includes(claim.status)) {
    errors.push(`${label}.status must be verified, narrowed, or removed.`);
  }
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
    const numericOrMeasuredClaim = /\d[\d,.]*(?:\s*(?:%|GB|TB|MB|G|亿|万|千|小时|分钟|天|次|份|个|Token))?/i;
    if (!Array.isArray(variant.claimEvidenceIds)) {
      errors.push(`${label}.claimEvidenceIds must be an array.`);
    } else {
      for (const claimId of variant.claimEvidenceIds) {
        if (!claimById.has(claimId)) {
          errors.push(`${label}.claimEvidenceIds references unknown claim ${claimId}.`);
        } else if (claimById.get(claimId)?.status === 'removed') {
          errors.push(`${label}.claimEvidenceIds references removed claim ${claimId}.`);
        }
      }
      if (numericOrMeasuredClaim.test(combined) && variant.claimEvidenceIds.length === 0) {
        errors.push(`${label} contains a numeric or measured claim but has no claimEvidenceIds.`);
      }
    }
    if (!Array.isArray(variant.claimsNeedingEvidenceOrNarrowing)) {
      errors.push(`${label}.claimsNeedingEvidenceOrNarrowing must be an array.`);
    } else if (variant.claimsNeedingEvidenceOrNarrowing.length > 0) {
      errors.push(`${label} still contains unresolved claims needing evidence or narrowing.`);
    }
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

const postPublish = data.postPublishVerification || {};
if (postPublish.titleSearchUsedAsSoleViolationEvidence !== false) {
  errors.push('Title search may not be used as the sole evidence of a violation.');
}
if (postPublish.deleteOrRepostPerformed === true
  && postPublish.reasonCapturedBeforeDeleteOrRepost !== true) {
  errors.push('Capture the platform status or stated reason before deleting or reposting.');
}
if (postPublish.publicationInScope === true) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(postPublish.publishTimestamp || '')) {
    errors.push('postPublishVerification.publishTimestamp is required when publication is in scope.');
  }
  if (!nonEmpty(postPublish.selectedVisibility)) {
    errors.push('postPublishVerification.selectedVisibility is required when publication is in scope.');
  }
  if (!nonEmpty(postPublish.itemOrShareUrlOrId)) {
    errors.push('postPublishVerification.itemOrShareUrlOrId is required when publication is in scope.');
  }
  if (!['processing', 'under-review', 'public', 'restricted', 'removed', 'unknown']
    .includes(postPublish.platformStatus)) {
    errors.push('postPublishVerification.platformStatus must record the observed platform state.');
  }
  if (!/^\d{4}-\d{2}-\d{2}/.test(postPublish.checkedAt || '')) {
    errors.push('postPublishVerification.checkedAt is required when publication is in scope.');
  }
  if (postPublish.directItemVisibilityChecked !== true) {
    errors.push('postPublishVerification.directItemVisibilityChecked must be true when publication is in scope.');
  }
  if (['restricted', 'removed'].includes(postPublish.platformStatus)
    && !nonEmpty(postPublish.platformNotice)) {
    errors.push('postPublishVerification.platformNotice is required for restricted or removed content.');
  }
}

const report = {ok: errors.length === 0, file, errors, warnings};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
