#!/usr/bin/env node

import {readFileSync, writeFileSync} from 'node:fs';

const values = process.argv.slice(2);
const inputPath = values[0];
const languageIndex = values.indexOf('--language');
const reportIndex = values.indexOf('--report');
const language = languageIndex >= 0 ? values[languageIndex + 1] : null;
const reportPath = reportIndex >= 0 ? values[reportIndex + 1] : null;

if (!inputPath || !['zh-CN', 'en'].includes(language)) {
  console.error('Usage: node scripts/audit-director-brief.mjs <brief.md> --language <zh-CN|en> [--report report.json]');
  process.exit(1);
}

const source = readFileSync(inputPath, 'utf8');
const errors = [];
const warnings = [];

const requiredHeadings = language === 'zh-CN'
  ? ['内容锁定', '导演判断', '粗剪方案', '证据计划', '暂缓确认的精剪项', '本轮确认']
  : ['Content Lock', 'Director Judgment', 'Rough-Cut Plan', 'Evidence Plan',
    'Deferred Fine-Edit Decisions', 'This Approval'];

for (const heading of requiredHeadings) {
  if (!new RegExp(`^#{1,3}\\s+.*${heading}`, 'mi').test(source)) {
    errors.push(`missing user-facing heading: ${heading}`);
  }
}

const unfilledPromptLines = source.match(/^\s*-\s+[^\n:：]+[:：]\s*$/gm) ?? [];
if (unfilledPromptLines.length > 0) {
  errors.push(`director brief still contains ${unfilledPromptLines.length} unfilled prompt line(s)`);
}

if (/```\s*json/i.test(source)
  || /^\s*\{[\s\S]*"(?:schemaVersion|projectId|userFacingApproval)"\s*:/m.test(source)
  || /"(?:schemaVersion|projectId|canonicalEdlVersion|machineJsonMayBeShownByDefault)"\s*:/.test(source)) {
  errors.push('user-facing director brief must not expose internal machine JSON or schema fields');
}

if (language === 'zh-CN') {
  const hanCount = (source.match(/[\u3400-\u9fff]/g) ?? []).length;
  if (hanCount < 40) errors.push('zh-CN brief must contain substantive Chinese explanations');
  if (!/(确认|选择|请回复)/.test(source)) errors.push('zh-CN brief must ask one explicit approval question');
} else {
  const latinWords = source.match(/[A-Za-z]{2,}/g) ?? [];
  if (latinWords.length < 40) errors.push('English brief must contain substantive English explanations');
  if (!/(approve|choose|confirm|reply)/i.test(source)) {
    errors.push('English brief must ask one explicit approval question');
  }
}

if (!/(rough-cut|rough cut|粗剪)/i.test(source)) {
  errors.push('brief must state the rough-cut decision');
}
if (!/(defer|deferred|暂缓|暂不锁定|粗剪锁定后)/i.test(source)) {
  errors.push('brief must identify deferred fine-edit decisions');
}

const result = {ok: errors.length === 0, input: inputPath, language, errors, warnings};
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
