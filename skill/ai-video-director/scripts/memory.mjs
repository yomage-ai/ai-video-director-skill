#!/usr/bin/env node

import {randomUUID} from 'node:crypto';
import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicStyle, identityAdapter, mergePreferences} from './lib/style-profile.mjs';

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
    ...(args.supersedes ? {supersedes:args.supersedes} : {}),
  };
  appendFileSync(paths.feedback, `${JSON.stringify(event)}\n`, 'utf8');
  console.log(JSON.stringify({dataDir: paths.root, event}, null, 2));
}

function setDotted(target, dottedKey, value) {
  if (!/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(dottedKey)) {
    throw new Error('--key must be a dot-separated preference key.');
  }
  const parts = dottedKey.split('.');
  if (parts.some(part => ['__proto__', 'constructor', 'prototype'].includes(part))) {
    throw new Error('Unsafe preference key');
  }
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
  const paths = pathsFor(args);
  const defaults = publicStyle();
  const hasLocalProfile = !args['defaults-only'] && existsSync(paths.profile);
  const profile = hasLocalProfile ? readProfile(paths) : {profileId:null,version:null,preferences:{},promotionHistory:[]};
  const events = hasLocalProfile && existsSync(paths.feedback) ? readEvents(paths) : [];
  if (args.history) {
    console.log(JSON.stringify({dataDir:paths.root,profile,feedbackEvents:events},null,2));
    return;
  }
  const identity = args['identity-skill'] ? identityAdapter(path.resolve(args['identity-skill'])) : null;
  let effective = mergePreferences(defaults.preferences, profile.preferences || {});
  if (identity) effective = mergePreferences(effective, identity.preferences);
  const valueAt = (obj,key) => key.split('.').reduce((v,k)=>v?.[k],obj);
  const stage = args.stage || 'intake';
  const selectors = {
    intake: /(?:content|intake|source|workflow|platformFrame|styleSelection|handdrawnKnowledgeMapStyle)/i,
    rough: /(?:rough|dialogue|pace|pause|color|loudness|takeSelection|playback|productionBaseline)/i,
    fine: /(?:caption|style|palette|visual|presenter|cutout|outline|progress|outro|broll|screenRecording|evidence|audioLoudness)/i,
    release: /(?:render|production|delivery|platform|loudness)/i,
    all: /./,
  };
  if (!selectors[stage]) throw new Error('--stage must be intake, rough, fine, release, or all');
  const preferences = {}, provenance = [];
  function visit(value,key) {
    if (args.key ? (key === args.key || key.startsWith(args.key+'.')) : selectors[stage].test(key)) {
      if (args.style && /style/i.test(key) && typeof value === 'object'
        && !JSON.stringify(value).includes(args.style)) return;
      setDotted(preferences,key,structuredClone(value));
      provenance.push({key,source:'bundled-public-style',profileId:defaults.profileId,version:defaults.version});
      if (valueAt(profile.preferences,key) !== undefined) {
        const history = [...(profile.promotionHistory || [])].reverse().find(e=>key===e.key || key.startsWith(e.key+'.') || e.key.startsWith(key+'.'));
        provenance.push({key,source:'current-local-override',profileVersion:profile.version,
          feedbackId:history?.sourceFeedbackId || null,approvedAt:history?.approvedAt || null});
      }
      if (identity && valueAt(identity.preferences,key) !== undefined) provenance.push({key,source:'selected-identity-skill',skillId:identity.skillId,version:identity.version});
      return;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k,v] of Object.entries(value)) visit(v,key?key+'.'+k:k);
    }
  }
  for (const [key,value] of Object.entries(effective)) visit(value,key);
  const overridden = [];
  if (args.overrides) {
    const overrides = JSON.parse(readFileSync(path.resolve(args.overrides),'utf8'));
    for (const item of overrides) {
      if (!item.key || !item.reason || !item.source) throw new Error('Each project override needs key, value, reason and source');
      overridden.push({key:item.key,previous:item.key.split('.').reduce((v,k)=>v?.[k],preferences),reason:item.reason});
      setDotted(preferences,item.key,item.value);
      provenance.push({key:item.key,source:'current-project-override',evidence:item.source,reason:item.reason});
    }
  }
  const promoted = new Set(events.filter(e=>e.type==='feedback-promoted').map(e=>e.sourceFeedbackId));
  const superseded = new Set(events.flatMap(e=>[e.supersedes,
    ...(e.feedback?.match(/supersedes feedback ([a-f0-9-]{36})/i)?.slice(1) || [])]).filter(Boolean));
  const pending = events.filter(e=>e.type==='feedback-recorded' && !promoted.has(e.id) && !superseded.has(e.id)
    && (!args.project || e.projectId===args.project || e.scope==='base-candidate'));
  console.log(JSON.stringify({dataDir:paths.root,profileId:profile.profileId,profileVersion:profile.version,
    publicStyle:{profileId:defaults.profileId,version:defaults.version},localProfileRequired:false,
    identity:identity ? {skillId:identity.skillId,version:identity.version,assets:identity.assets} : null,
    stage,preferences,provenance,overridden,
    pendingCandidates:args['include-candidates'] ? pending.slice(-12).map(e=>({id:e.id,projectId:e.projectId,category:e.category,feedback:e.feedback,scope:e.scope,automaticallyApplied:false})) : [],
    pendingCandidateCount:pending.length,historyIncluded:false},null,2));
}

function usage() {
  console.log(`Usage:
  node scripts/memory.mjs init [--data-dir <private-directory>]
  node scripts/memory.mjs show [--stage intake|rough|fine|release|all] [--defaults-only] [--identity-skill <skill-directory>] [--key <prefix>] [--style <id>] [--project <id>] [--include-candidates] [--overrides <project-overrides.json>] [--history] [--data-dir <private-directory>]
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
