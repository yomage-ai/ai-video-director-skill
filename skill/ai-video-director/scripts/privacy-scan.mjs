#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding: 'utf8'}).trim();
const output = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {cwd: repoRoot, encoding: 'utf8'},
);
const files = output.split('\0').filter(Boolean);
const findings = [];

const mediaExtensions = new Set([
  '.mov', '.mp4', '.m4v', '.avi', '.mkv', '.wav', '.mp3', '.m4a', '.aac', '.flac', '.aiff',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.srt', '.vtt',
]);
const allowedTextFixtures = /^tests\/fixtures\/.*\.(srt|vtt)$/i;
const secretFile = /(^|\/)(\.env($|\.)|id_rsa|id_ed25519|.*\.(pem|p12|pfx|key)|credentials?\.json|secrets?\.)/i;
const contentPatterns = [
  {name: 'absolute macOS user path', regex: /\/Users\/[A-Za-z0-9._-]+\//g},
  {name: 'absolute Windows user path', regex: /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/g},
  {name: 'private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g},
  {name: 'OpenAI-style secret', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g},
  {name: 'GitHub token', regex: /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/g},
  {name: 'AWS access key', regex: /\bAKIA[A-Z0-9]{16}\b/g},
];

for (const relativePath of files) {
  const extension = path.extname(relativePath).toLowerCase();
  if (mediaExtensions.has(extension) && !allowedTextFixtures.test(relativePath)) {
    findings.push({file: relativePath, issue: 'private/generated media type is not allowed in this repository'});
    continue;
  }
  if (secretFile.test(relativePath) && relativePath !== '.env.example') {
    findings.push({file: relativePath, issue: 'secret-like filename'});
    continue;
  }
  const absolutePath = path.join(repoRoot, relativePath);
  const stat = statSync(absolutePath);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) {
    continue;
  }
  let content;
  try {
    content = readFileSync(absolutePath, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\u0000')) {
    continue;
  }
  for (const pattern of contentPatterns) {
    pattern.regex.lastIndex = 0;
    const match = pattern.regex.exec(content);
    if (match) {
      findings.push({file: relativePath, issue: pattern.name, sample: match[0]});
    }
  }
}

console.log(JSON.stringify({ok: findings.length === 0, scannedFiles: files.length, findings}, null, 2));
if (findings.length > 0) {
  process.exitCode = 1;
}
