#!/usr/bin/env node

import {randomUUID} from 'node:crypto';
import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');

function parseArgs(values) {
  const parsed = {_: []};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      parsed._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function isWithin(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function dataDir(args) {
  const result = path.resolve(
    args['data-dir']
      || process.env.AI_VIDEO_DIRECTOR_DATA_DIR
      || path.join(os.homedir(), '.local', 'share', 'ai-video-director'),
  );
  if (isWithin(result, repoRoot)) {
    throw new Error('Private memory must live outside the Skill repository.');
  }
  return result;
}

function pathsFor(args) {
  const root = dataDir(args);
  return {
    root,
    profile: path.join(root, 'profile.json'),
    feedback: path.join(root, 'feedback-log.jsonl'),
  };
}

function initialize(args) {
  const paths = pathsFor(args);
  mkdirSync(paths.root, {recursive: true, mode: 0o700});
  if (!existsSync(paths.profile)) {
    writeFileSync(paths.profile, `${JSON.stringify({
      schemaVersion: 1,
      profileId: 'private-base-profile',
      version: 1,
      preferences: {},
      negativePreferences: [],
      promotionHistory: [],
      updatedAt: new Date().toISOString(),
    }, null, 2)}\n`, {encoding: 'utf8', mode: 0o600});
  }
  if (!existsSync(paths.feedback)) {
    writeFileSync(paths.feedback, '', {encoding: 'utf8', mode: 0o600});
  }
  return paths;
}

function readProfile(paths) {
  return JSON.parse(readFileSync(paths.profile, 'utf8'));
}

function readEvents(paths) {
  const content = readFileSync(paths.feedback, 'utf8').trim();
  return content ? content.split(/\r?\n/).map((line) => JSON.parse(line)) : [];
}

function record(args) {
  const paths = initialize(args);
  if (!args.project || !args.category || !args.feedback) {
    throw new Error('record requires --project, --category, and --feedback.');
  }
  const scope = args.scope || 'project-only';
  if (!['project-only', 'base-candidate'].includes(scope)) {
    throw new Error('--scope must be project-only or base-candidate.');
  }
  const event = {
    schemaVersion: 1,
    type: 'feedback-recorded',
    id: randomUUID(),
    recordedAt: new Date().toISOString(),
    projectId: args.project,
    category: args.category,
    feedback: args.feedback,
    scope,
    promotionStatus: 'not-promoted',
  };
  appendFileSync(paths.feedback, `${JSON.stringify(event)}\n`, 'utf8');
  console.log(JSON.stringify({dataDir: paths.root, event}, null, 2));
}

function setDotted(target, dottedKey, value) {
  if (!/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(dottedKey)) {
    throw new Error('--key must be a dot-separated preference key.');
  }
  const parts = dottedKey.split('.');
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

function promote(args) {
  if (!args['confirm-user-approved']) {
    throw new Error('Promotion requires --confirm-user-approved after explicit user approval.');
  }
  if (!args.id || !args.key || args['value-json'] === undefined || !args.reason) {
    throw new Error('promote requires --id, --key, --value-json, --reason, and --confirm-user-approved.');
  }
  const paths = initialize(args);
  const events = readEvents(paths);
  const source = events.find((event) => event.type === 'feedback-recorded' && event.id === args.id);
  if (!source) {
    throw new Error(`Feedback id not found: ${args.id}`);
  }
  let value;
  try {
    value = JSON.parse(args['value-json']);
  } catch {
    throw new Error('--value-json must be valid JSON.');
  }
  const profile = readProfile(paths);
  setDotted(profile.preferences, args.key, value);
  profile.version += 1;
  profile.updatedAt = new Date().toISOString();
  const promotion = {
    sourceFeedbackId: source.id,
    key: args.key,
    value,
    reason: args.reason,
    approvedAt: profile.updatedAt,
  };
  profile.promotionHistory.push(promotion);
  writeFileSync(paths.profile, `${JSON.stringify(profile, null, 2)}\n`, {encoding: 'utf8', mode: 0o600});
  appendFileSync(paths.feedback, `${JSON.stringify({
    schemaVersion: 1,
    type: 'feedback-promoted',
    id: randomUUID(),
    recordedAt: profile.updatedAt,
    ...promotion,
  })}\n`, 'utf8');
  console.log(JSON.stringify({dataDir: paths.root, profileVersion: profile.version, promotion}, null, 2));
}

function show(args) {
  const paths = initialize(args);
  console.log(JSON.stringify({
    dataDir: paths.root,
    profile: readProfile(paths),
    feedbackEvents: readEvents(paths),
  }, null, 2));
}

function usage() {
  console.log(`Usage:
  node scripts/memory.mjs init [--data-dir <private-directory>]
  node scripts/memory.mjs show [--data-dir <private-directory>]
  node scripts/memory.mjs record --project <id> --category <name> --feedback <text> [--scope project-only|base-candidate]
  node scripts/memory.mjs promote --id <feedback-id> --key <dotted-key> --value-json <json> --reason <text> --confirm-user-approved`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
try {
  if (command === 'init') {
    const paths = initialize(args);
    console.log(JSON.stringify({status: 'initialized', dataDir: paths.root}, null, 2));
  } else if (command === 'show') {
    show(args);
  } else if (command === 'record') {
    record(args);
  } else if (command === 'promote') {
    promote(args);
  } else {
    usage();
    if (command) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
