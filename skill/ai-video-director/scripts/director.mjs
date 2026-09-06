#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {resolveArtifact} from './lib/media-contract.mjs';
import {publicStyle} from './lib/style-profile.mjs';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const skillDir = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(skillDir, '../..');
const templatesDir = path.join(skillDir, 'assets', 'templates');

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

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {encoding: 'utf8'});
  if (result.error || result.status !== 0) {
    return null;
  }
  return `${result.stdout || result.stderr}`.split(/\r?\n/, 1)[0].trim();
}

function privateDataDir() {
  return path.resolve(
    process.env.AI_VIDEO_DIRECTOR_DATA_DIR
      || path.join(os.homedir(), '.local', 'share', 'ai-video-director'),
  );
}

function skillInstallPath() {
  const codexHome = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), '.codex');
  return path.join(codexHome, 'skills', 'ai-video-director');
}

function doctor(args = {}) {
  const required = [
    ['Git', 'git', ['--version']],
    ['Node.js', 'node', ['--version']],
    ['npm', 'npm', ['--version']],
    ['FFmpeg', 'ffmpeg', ['-version']],
    ['ffprobe', 'ffprobe', ['-version']],
  ];
  const checks = required.map(([name, command, args]) => {
    const version = commandVersion(command, args);
    return {name, required: true, status: version ? 'pass' : 'fail', version};
  });

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push({
    name: 'Node.js >= 20',
    required: true,
    status: nodeMajor >= 20 ? 'pass' : 'fail',
    version: process.versions.node,
  });

  let xmlStatus = 'fail';
  try {
    const resolved = import.meta.resolve('fast-xml-parser');
    xmlStatus = resolved ? 'pass' : 'fail';
  } catch {
    xmlStatus = 'fail';
  }
  checks.push({name: 'fast-xml-parser', required: true, status: xmlStatus});

  const dataDir = privateDataDir();
  try {
    const defaults = publicStyle();
    checks.push({name:'Bundled Xiaoxiong editing style',required:true,status:'pass',profileId:defaults.profileId,version:defaults.version,localProfileRequired:false});
  } catch (error) {
    checks.push({name:'Bundled Xiaoxiong editing style',required:true,status:'fail',error:error.message});
  }
  checks.push({
    name: 'private data directory outside repository',
    required: true,
    status: isWithin(dataDir, repoRoot) ? 'fail' : 'pass',
    path: dataDir,
  });

  const installPath = skillInstallPath();
  let installStatus = 'not-installed';
  if (existsSync(installPath) || lstatSafe(installPath)?.isSymbolicLink()) {
    try {
      installStatus = realpathSync(installPath) === realpathSync(skillDir) ? 'pass' : 'wrong-target';
    } catch {
      installStatus = 'broken-link';
    }
  }
  checks.push({
    name: 'Codex Skill installation',
    required: false,
    status: installStatus,
    path: installPath,
  });

  const optionalCommands = [
    ['uv for optional local voice clone', 'uv', ['--version']],
  ];
  for (const [name, command, args] of optionalCommands) {
    const version = commandVersion(command, args);
    checks.push({name, required: false, status: version ? 'pass' : 'not-found', version});
  }

  const hyperframesVersion = commandVersion('hyperframes', ['--version']);
  const npxVersion = commandVersion('npx', ['--version']);
  checks.push({
    name: 'HyperFrames CLI',
    required: false,
    status: hyperframesVersion ? 'pass' : npxVersion ? 'agent-managed-npx-ready' : 'not-found',
    version: hyperframesVersion ?? (npxVersion ? `npx ${npxVersion}` : null),
    note: hyperframesVersion
      ? 'Installed command is available.'
      : npxVersion
        ? 'The Agent can run the governed pinned HyperFrames version with npx; first use may download the package and model.'
        : 'Install or otherwise provide an approved HyperFrames runtime before a presenter-cutout shot.',
  });

  const possibleSkillRoots = [
    path.join(os.homedir(), '.agents', 'skills'),
    path.join(os.homedir(), '.codex', 'skills'),
  ];
  checks.push({
    name: 'HyperFrames authoring Skill',
    required: false,
    status: possibleSkillRoots.some((root) => existsSync(path.join(root, 'hyperframes', 'SKILL.md')))
      ? 'pass'
      : 'not-found',
  });

  const chatcutPluginRoot = path.join(os.homedir(), '.codex', 'plugins', 'cache', 'chatcut-inc', 'chatcut');
  checks.push({
    name: 'ChatCut Codex plugin',
    required: false,
    status: existsSync(chatcutPluginRoot) ? 'installed-unverified' : 'not-found',
    note: 'Cache presence is not proof of connection, login or callable editing capability.',
    path: chatcutPluginRoot,
  });
  checks.push({
    name: 'ASR provider',
    required: false,
    status: 'project-stage-check-required',
    note: 'ASR is not bundled; verify ChatCut or an approved local provider before transcription.',
  });

  const legacyPath = path.join(path.dirname(installPath), 'ai-auto-editing-director');
  checks.push({
    name: 'legacy ai-auto-editing-director disabled',
    required: false,
    status: existsSync(legacyPath) ? 'warning-installed' : 'pass',
    path: legacyPath,
  });

  const failed = checks.filter((check) => check.required && check.status !== 'pass');
  if (args.stage) {
    const requiredByStage = {rough:['ffmpeg','ffprobe','chatcut','asr','source-listen'],fine:['ffmpeg','ffprobe','fine-renderer'],release:['ffmpeg','ffprobe','fine-renderer']};
    if (!requiredByStage[args.stage]) throw new Error('--stage must be rough, fine or release');
    let capabilities = {checks:[]};
    if (args.capabilities) capabilities=JSON.parse(readFileSync(path.resolve(args.capabilities),'utf8'));
    for(const name of requiredByStage[args.stage]) {
      const check=capabilities.checks?.find(c=>c.name===name);
      let error;
      try {
        if (check?.status !== 'pass' || !check.version || !check.method || !Number.isFinite(Date.parse(check.checkedAt)) || Math.abs(Date.now()-Date.parse(check.checkedAt))>86400000) throw new Error('missing, stale or unverified capability');
        resolveArtifact(check.evidence,path.dirname(path.resolve(args.capabilities)),name);
      } catch(e) { error=e.message; }
      const result={name:`operational ${name}`,required:true,status:error?'fail':'pass',note:error || check.method};
      checks.push(result); if(error) failed.push(result);
    }
  }
  console.log(JSON.stringify({ok: failed.length === 0, scope:args.stage || 'local-installation-only',repoRoot, skillDir, checks}, null, 2));
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function lstatSafe(target) {
  try {
    return lstatSync(target);
  } catch {
    return null;
  }
}

function installSkill(args) {
  const destination = skillInstallPath();
  mkdirSync(path.dirname(destination), {recursive: true});
  const stat = lstatSafe(destination);
  if (stat) {
    if (stat.isSymbolicLink()) {
      try {
        if (realpathSync(destination) === realpathSync(skillDir)) {
          console.log(JSON.stringify({status: 'already-installed', destination, source: skillDir}, null, 2));
          return;
        }
      } catch {
        // A broken link may be replaced only with explicit force.
      }
      if (!args.force) {
        throw new Error(`A different symlink exists at ${destination}; pass --force to replace only that symlink.`);
      }
      unlinkSync(destination);
    } else {
      throw new Error(`Refusing to replace a real file or directory at ${destination}.`);
    }
  }
  symlinkSync(skillDir, destination, 'dir');
  console.log(JSON.stringify({status: 'installed', destination, source: skillDir}, null, 2));
}

function uninstallSkill() {
  const destination = skillInstallPath();
  const stat = lstatSafe(destination);
  if (!stat) {
    console.log(JSON.stringify({status: 'not-installed', destination}, null, 2));
    return;
  }
  if (!stat.isSymbolicLink()) {
    throw new Error(`Refusing to remove a real file or directory at ${destination}.`);
  }
  let target;
  try {
    target = realpathSync(destination);
  } catch {
    target = path.resolve(path.dirname(destination), readlinkSync(destination));
  }
  if (path.resolve(target) !== path.resolve(skillDir)) {
    throw new Error(`Refusing to remove a symlink owned by another installation: ${destination}`);
  }
  unlinkSync(destination);
  console.log(JSON.stringify({status: 'uninstalled', destination}, null, 2));
}

function loadTemplate(name) {
  return JSON.parse(readFileSync(path.join(templatesDir, name), 'utf8'));
}

function writeJson(target, value) {
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function initProject(args) {
  const id = args.id;
  if (!id || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(id)) {
    throw new Error('--id is required and must be 2-63 lowercase letters, numbers, or hyphens.');
  }
  const projectsRoot = path.resolve(
    args.root || path.join(os.homedir(), 'Documents', 'ai-video-projects'),
  );
  const projectDir = path.join(projectsRoot, id);
  const language = args.language || 'en';
  if (!['zh-CN', 'en'].includes(language)) {
    throw new Error('--language must be zh-CN or en.');
  }
  if (isWithin(projectDir, repoRoot)) {
    throw new Error('Video projects must be created outside the Skill repository.');
  }
  if (existsSync(projectDir) && !args.force) {
    throw new Error(`Project already exists: ${projectDir}. Pass --force only to add missing scaffold files.`);
  }

  for (const directory of [
    projectDir,
    path.join(projectDir, 'inputs'),
    path.join(projectDir, 'analysis'),
    path.join(projectDir, 'assets'),
    path.join(projectDir, 'renders'),
    path.join(projectDir, 'delivery'),
    path.join(projectDir, 'logs'),
  ]) {
    mkdirSync(directory, {recursive: true});
  }

  const date = new Date().toISOString();
  const styleDestination = path.join(projectDir,'analysis/style-defaults.json');
  if (!existsSync(styleDestination)) {
    writeJson(styleDestination,publicStyle());
  }
  const files = [
    ['new-video-intake.template.json', 'intake.json'],
    ['content-lock.template.json', 'analysis/content-lock.json'],
    ['director-plan.template.json', 'analysis/director-plan.json'],
    ['rough-cut-review.template.json', 'analysis/rough-cut-review.json'],
    ['fine-edit-direction.template.json', 'analysis/fine-edit-direction.json'],
    ['project-state.template.json', 'project-state.json'],
    ['pipeline.template.json', 'pipeline.json'],
    ['trial-metrics.template.json', 'analysis/trial-metrics.json'],
    ['rights-manifest.template.json', 'analysis/rights-manifest.json'],
    ['publish-package.template.json', 'analysis/publish-package.json'],
    ['learning-scope-ledger.template.json', 'analysis/learning-scope-ledger.json'],
    ['delivery-manifest.template.json', 'delivery/delivery-manifest.json'],
  ];
  for (const [templateName, relativeDestination] of files) {
    const destination = path.join(projectDir, relativeDestination);
    if (existsSync(destination)) {
      continue;
    }
    const value = loadTemplate(templateName);
    value.projectId = id;
    if (templateName === 'pipeline.template.json') value.language = language;
    if ('updatedAt' in value) {
      value.updatedAt = date;
    }
    writeJson(destination, value);
  }

  const qaDestination = path.join(projectDir, 'analysis', 'qa-report.md');
  if (!existsSync(qaDestination)) {
    cpSync(path.join(templatesDir, 'qa-report.template.md'), qaDestination);
  }
  const directorBriefDestination = path.join(projectDir, 'analysis', 'director-brief.md');
  if (!existsSync(directorBriefDestination)) {
    cpSync(path.join(templatesDir, `director-brief.${language}.template.md`),
      directorBriefDestination);
  }
  const gitignoreDestination = path.join(projectDir, '.gitignore');
  if (!existsSync(gitignoreDestination)) {
    writeFileSync(
      gitignoreDestination,
      ['.DS_Store', '.env', '.env.*', 'inputs/', 'renders/', 'delivery/', 'logs/', '*.key', '*.pem', ''].join('\n'),
      'utf8',
    );
  }
  console.log(JSON.stringify({status: 'initialized', projectId: id, projectDir}, null, 2));
}

function usage() {
  console.log(`Usage:
  node scripts/director.mjs doctor [--stage rough|fine|release --capabilities <capabilities.json>]
  node scripts/director.mjs contract --section <name>
  node scripts/director.mjs install-skill [--force]
  node scripts/director.mjs uninstall-skill
  node scripts/director.mjs init-project --id <id> [--root <outside-repo-directory>] [--language <zh-CN|en>] [--force]`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];

try {
  if (command === 'contract') {
    const contract = JSON.parse(readFileSync(path.join(skillDir,'references/director-contract.json'),'utf8'));
    if (!args.section || !(args.section in contract)) throw new Error('contract --section requires a named section such as roughCut, bRollContinuity or finishingPass');
    console.log(JSON.stringify({section:args.section,value:contract[args.section]},null,2));
  } else if (command === 'doctor') {
    doctor(args);
  } else if (command === 'install-skill') {
    installSkill(args);
  } else if (command === 'uninstall-skill') {
    uninstallSkill();
  } else if (command === 'init-project') {
    initProject(args);
  } else {
    usage();
    if (command) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
