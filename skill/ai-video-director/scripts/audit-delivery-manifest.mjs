#!/usr/bin/env node

import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {sha256} from './lib/media-contract.mjs';

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`Cannot read delivery manifest ${file}: ${error instanceof Error ? error.message : error}`);
  }
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function checkAbsolutePath(value, label, expectedType, errors) {
  if (!nonEmpty(value) || !path.isAbsolute(value)) {
    errors.push(`${label} must be an absolute local path.`);
    return;
  }
  if (!existsSync(value)) {
    errors.push(`${label} does not exist: ${value}`);
    return;
  }
  const stat = statSync(value);
  if (expectedType === 'file' && !stat.isFile()) errors.push(`${label} must be a file.`);
  if (expectedType === 'directory' && !stat.isDirectory()) errors.push(`${label} must be a directory.`);
}

const input = process.argv[2];
if (!input) fail('Usage: node audit-delivery-manifest.mjs <delivery-manifest.json>');

const file = path.resolve(input);
const data = readJson(file);
const errors = [];
const warnings = [];

if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
if (!nonEmpty(data.projectId)) errors.push('projectId is required.');
if (!['ready', 'delivered'].includes(data.status)) errors.push('status must be ready or delivered.');

const master = data.releaseMaster || {};
checkAbsolutePath(master.absolutePath, 'releaseMaster.absolutePath', 'file', errors);
checkAbsolutePath(master.qaReportAbsolutePath, 'releaseMaster.qaReportAbsolutePath', 'file', errors);
if (!nonEmpty(master.sha256)) errors.push('releaseMaster.sha256 is required.');
else if (existsSync(master.absolutePath) && sha256(master.absolutePath) !== master.sha256) errors.push('releaseMaster.sha256 differs from the actual file.');
if (master.exactCandidateApprovedByUser !== true) {
  warnings.push('The exact release candidate has not yet been approved by the user.');
}

if (!Array.isArray(data.editableProjects) || data.editableProjects.length === 0) {
  errors.push('At least one editable project is required.');
} else {
  data.editableProjects.forEach((project, index) => {
    const label = `editableProjects[${index}]`;
    if (!nonEmpty(project.role) || !nonEmpty(project.format)) errors.push(`${label} role and format are required.`);
    checkAbsolutePath(project.absolutePath, `${label}.absolutePath`, 'directory', errors);
    checkAbsolutePath(project.entryPointAbsolutePath, `${label}.entryPointAbsolutePath`, 'file', errors);
    for (const field of ['openOrPreviewCommand', 'checkCommand', 'renderCommand']) {
      if (!nonEmpty(project[field])) errors.push(`${label}.${field} is required.`);
    }
    if (project.verifiedOpenable !== true) errors.push(`${label} must be verified openable.`);
  });
}

const rough = data.roughCut || {};
checkAbsolutePath(rough.fcpXmlAbsolutePath, 'roughCut.fcpXmlAbsolutePath', 'file', errors);
checkAbsolutePath(rough.canonicalEdlAbsolutePath, 'roughCut.canonicalEdlAbsolutePath', 'file', errors);
checkAbsolutePath(rough.lockedArollAbsolutePath, 'roughCut.lockedArollAbsolutePath', 'file', errors);

const supporting = data.supportingArtifacts || {};
for (const field of [
  'captionsAbsolutePath',
  'storyboardAbsolutePath',
  'directorPlanAbsolutePath',
  'rightsManifestAbsolutePath',
  'publicationPackageAbsolutePath',
  'learningScopeLedgerAbsolutePath',
]) {
  if (field === 'publicationPackageAbsolutePath' && data.publicationInScope === false) continue;
  checkAbsolutePath(supporting[field], `supportingArtifacts.${field}`, 'file', errors);
}

const checks = data.deliveryChecks || {};
for (const field of [
  'allDeclaredLocalPathsAreAbsolute',
  'allRequiredLocalFilesExist',
  'editableProjectOpenedOrChecked',
  'renderCommandIsReproducible',
  'finalResponseListsPathsAndOpeningInstructions',
]) {
  if (checks[field] !== true) errors.push(`deliveryChecks.${field} must be true.`);
}
if (checks.sharedWorkspaceRequiresDownload !== false) {
  errors.push('deliveryChecks.sharedWorkspaceRequiresDownload must be false.');
}

const report = {ok: errors.length === 0, file, errors, warnings};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
