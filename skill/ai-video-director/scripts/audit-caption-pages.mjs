#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [, , inputPath, reportPath] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/audit-caption-pages.mjs <manifest.json> [report.json]');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
const forceBreak = new Set(manifest.forceBreakPunctuation ?? [
  '，', '。', '；', '：', '！', '？', ',', '.', ';', ':', '!', '?',
]);
const protectedTerms = manifest.protectedTerms ?? [];
const maxUnits = manifest.maxUnits ?? null;
const errors = [];
let pageCount = 0;

function normalized(text) {
  return String(text ?? '').replace(/\s/gu, '');
}

function units(text) {
  return [...normalized(text)].length;
}

function cleanPageFinalPunctuation(text) {
  return String(text).trim().replace(/[，。；：、,.;:]$/u, '');
}

function punctuationIsEmbedded(chars, index) {
  const current = chars[index];
  const previous = chars[index - 1] ?? '';
  const next = chars[index + 1] ?? '';
  return /[0-9]/u.test(previous) && /[0-9]/u.test(next) && /[.,:]/u.test(current);
}

for (const [segmentIndex, segment] of (manifest.segments ?? []).entries()) {
  const segmentId = segment.id ?? `segment-${segmentIndex + 1}`;
  const pages = segment.pages ?? [];
  const rawPages = pages.map((page) => typeof page === 'string' ? page : page.rawText);
  pageCount += pages.length;

  if (!pages.length) {
    errors.push(`${segmentId}: no caption pages`);
    continue;
  }
  if (normalized(rawPages.join('')) !== normalized(segment.sourceText)) {
    errors.push(`${segmentId}: raw pages do not reconstruct sourceText`);
  }

  pages.forEach((pageEntry, pageIndex) => {
    const rawText = String(typeof pageEntry === 'string' ? pageEntry : pageEntry.rawText ?? '').trim();
    const displayText = String(typeof pageEntry === 'string'
      ? cleanPageFinalPunctuation(rawText)
      : pageEntry.displayText ?? '').trim();
    const label = `${segmentId}:page-${pageIndex + 1}`;

    if (!rawText) errors.push(`${label}: empty rawText`);
    if (/^[，。！？；：、,!?;:]/u.test(rawText)) {
      errors.push(`${label}: starts with detached punctuation`);
    }
    if (/^(?:的|地|得)(?!确)/u.test(rawText)) {
      errors.push(`${label}: starts with an orphaned function particle`);
    }
    if (maxUnits !== null && units(rawText) > maxUnits) {
      errors.push(`${label}: ${units(rawText)} units exceeds maxUnits ${maxUnits}`);
    }

    const chars = [...rawText];
    chars.slice(0, -1).forEach((char, index) => {
      if (forceBreak.has(char) && !punctuationIsEmbedded(chars, index)) {
        errors.push(`${label}: contains force-break punctuation "${char}" before page end`);
      }
    });

    const expectedDisplay = cleanPageFinalPunctuation(rawText);
    if (displayText !== expectedDisplay) {
      errors.push(`${label}: displayText differs beyond approved page-final cleanup`);
    }

    const nextRaw = String(typeof pages[pageIndex + 1] === 'string'
      ? pages[pageIndex + 1]
      : pages[pageIndex + 1]?.rawText ?? '').trim();
    if (nextRaw && /[A-Za-z0-9-]$/u.test(rawText) && /^[A-Za-z0-9-]/u.test(nextRaw)) {
      errors.push(`${label}: boundary splits a Latin token`);
    }
  });

  for (const term of protectedTerms) {
    if (!String(segment.sourceText).includes(term)) continue;
    if (!rawPages.some((page) => String(page).includes(term))) {
      errors.push(`${segmentId}: protected term "${term}" is split or missing`);
    }
  }
}

if (!(manifest.segments ?? []).length) {
  errors.push('manifest: segments must contain at least one item');
}

const report = {
  schemaVersion: 1,
  input: path.resolve(inputPath),
  profileId: manifest.profileId ?? null,
  segments: (manifest.segments ?? []).length,
  pages: pageCount,
  errors,
  result: errors.length === 0 ? 'pass' : 'fail',
};

if (reportPath) {
  fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
