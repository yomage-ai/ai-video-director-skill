#!/usr/bin/env node

import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');

function run(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const errors = [];
const warnings = [];
const forbiddenMedia = /\.(mov|mp4|m4v|avi|mkv|webm|wav|mp3|m4a|aac|flac|aiff|png|jpe?g|webp|gif|pdf|zip|7z|p12|pem|key)$/i;
const sensitivePatterns = [
  {name: 'absolute-home-path', regex: /(?:\/Users\/|\/home\/)[A-Za-z0-9._-]+\//},
  {name: 'private-key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/},
  {name: 'OpenAI-style-key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/},
  {name: 'GitHub-token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/},
  {name: 'AWS-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/},
  {name: 'email-address', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/},
];

function scanText(text, label) {
  for (const pattern of sensitivePatterns) {
    if (pattern.regex.test(text)) errors.push(`${label} contains ${pattern.name}.`);
  }
}

const trackedFiles = run(['ls-files', '-z']).split('\0').filter(Boolean);
for (const relative of trackedFiles) {
  if (forbiddenMedia.test(relative)) errors.push(`Tracked media or sensitive binary is not allowed: ${relative}`);
  const absolute = path.join(repoRoot, relative);
  const content = readFileSync(absolute);
  if (content.includes(0)) {
    errors.push(`Unexpected binary tracked file: ${relative}`);
  } else {
    scanText(content.toString('utf8'), `current file ${relative}`);
  }
}

const historicalPaths = run(['log', '--all', '--name-only', '--pretty=format:'])
  .split('\n').map((value) => value.trim()).filter(Boolean);
for (const historicalPath of new Set(historicalPaths)) {
  if (forbiddenMedia.test(historicalPath)) errors.push(`Historical media or sensitive binary path is not allowed: ${historicalPath}`);
}

const authorEmails = run(['log', '--all', '--format=%ae%n%ce'])
  .split('\n').map((value) => value.trim()).filter(Boolean);
for (const email of new Set(authorEmails)) {
  if (!email.endsWith('@users.noreply.github.com')) {
    errors.push(`Commit metadata exposes a non-private email: ${email}`);
  }
}

const configuredEmail = run(['config', '--get', 'user.email']).trim();
if (!configuredEmail.endsWith('@users.noreply.github.com')) {
  errors.push(`Local Git user.email must use a GitHub noreply address before public commits: ${configuredEmail}`);
}

const objectLines = run(['rev-list', '--objects', '--all']).trim().split('\n').filter(Boolean);
const objectIds = objectLines.map((line) => line.split(' ')[0]);
const batch = spawnSync('git', ['cat-file', '--batch-check=%(objecttype) %(objectname) %(objectsize)'], {
  cwd: repoRoot,
  input: `${objectIds.join('\n')}\n`,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
if (batch.status !== 0) throw new Error(`git cat-file batch failed: ${batch.stderr || batch.stdout}`);
const blobs = batch.stdout.split('\n').filter(Boolean).map((line) => {
  const [type, object, size] = line.split(' ');
  return {type, object, size: Number(size)};
}).filter((item) => item.type === 'blob');
for (const blob of blobs) {
  if (blob.size > 5 * 1024 * 1024) errors.push(`Historical blob exceeds 5 MiB: ${blob.object} (${blob.size} bytes)`);
  if (blob.size <= 2 * 1024 * 1024) {
    const content = spawnSync('git', ['cat-file', 'blob', blob.object], {
      cwd: repoRoot,
      encoding: 'buffer',
      maxBuffer: 4 * 1024 * 1024,
    });
    if (content.status !== 0) throw new Error(`Cannot read historical blob ${blob.object}.`);
    if (!content.stdout.includes(0)) scanText(content.stdout.toString('utf8'), `historical blob ${blob.object}`);
  }
}

const license = readFileSync(path.join(repoRoot, 'LICENSE'), 'utf8');
if (!license.includes('Apache License') || !license.includes('Version 2.0')) {
  errors.push('LICENSE must contain the Apache License 2.0 text.');
}
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
if (packageJson.license !== 'Apache-2.0') errors.push('package.json license must be Apache-2.0.');
if (packageJson.private !== true) warnings.push('package.json private should remain true unless npm publication is intentionally approved.');

const report = {
  ok: errors.length === 0,
  repository: repoRoot,
  trackedFileCount: trackedFiles.length,
  historyCommitCount: Number(run(['rev-list', '--all', '--count']).trim()),
  historicalBlobCount: blobs.length,
  errors: [...new Set(errors)],
  warnings: [...new Set(warnings)],
};
console.log(JSON.stringify(report, null, 2));
if (report.errors.length > 0) process.exitCode = 1;
