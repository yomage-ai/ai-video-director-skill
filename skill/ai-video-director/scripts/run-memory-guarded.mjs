#!/usr/bin/env node

import {execFileSync, spawn} from 'node:child_process';
import {appendFileSync, mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const GIB = 1024 ** 3;

function usage() {
  console.log(`Usage:
  node scripts/run-memory-guarded.mjs [options] -- <command> [args...]

Options:
  --cwd <path>                 Working directory for the command
  --min-free-percent <number>  Trip when system free/available memory stays below this value
  --max-swap-growth-gib <n>    Trip when swap grows this many GiB above the start baseline
  --max-compressed-gib <n>     Trip when macOS compressed memory exceeds this value
  --max-process-rss-gib <n>    Trip when the guarded process tree exceeds this RSS
  --poll-seconds <number>      Sampling interval (default: 5)
  --trip-count <number>        Consecutive violating samples before trip (default: 3)
  --terminate-grace-seconds <n> Grace period before SIGKILL (default: 5)
  --log <path>                 Append JSONL guard events to this file
  --help                       Show this help

At least one threshold must be supplied. The guard preserves the child exit code on
success and exits 70 after a circuit-breaker trip.`);
}

function parseArgs(values) {
  const options = {
    cwd: process.cwd(),
    pollSeconds: 5,
    tripCount: 3,
    terminateGraceSeconds: 5,
    command: [],
  };
  const numeric = new Map([
    ['--min-free-percent', 'minFreePercent'],
    ['--max-swap-growth-gib', 'maxSwapGrowthGib'],
    ['--max-compressed-gib', 'maxCompressedGib'],
    ['--max-process-rss-gib', 'maxProcessRssGib'],
    ['--poll-seconds', 'pollSeconds'],
    ['--trip-count', 'tripCount'],
    ['--terminate-grace-seconds', 'terminateGraceSeconds'],
  ]);

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--') {
      options.command = values.slice(index + 1);
      break;
    }
    if (value === '--help') {
      options.help = true;
      continue;
    }
    if (value === '--cwd' || value === '--log') {
      const next = values[++index];
      if (!next) throw new Error(`${value} requires a value.`);
      options[value === '--cwd' ? 'cwd' : 'logPath'] = path.resolve(next);
      continue;
    }
    const key = numeric.get(value);
    if (!key) throw new Error(`Unknown option: ${value}`);
    const next = Number(values[++index]);
    if (!Number.isFinite(next) || next < 0) {
      throw new Error(`${value} requires a non-negative number.`);
    }
    options[key] = next;
  }

  if (options.help) return options;
  if (!options.command.length) throw new Error('A command is required after --.');
  if (!Number.isInteger(options.tripCount) || options.tripCount < 1) {
    throw new Error('--trip-count must be a positive integer.');
  }
  if (options.pollSeconds <= 0 || options.terminateGraceSeconds < 0) {
    throw new Error('Polling must be positive and the termination grace period non-negative.');
  }
  const thresholds = [
    options.minFreePercent,
    options.maxSwapGrowthGib,
    options.maxCompressedGib,
    options.maxProcessRssGib,
  ];
  if (thresholds.every((value) => value === undefined)) {
    throw new Error('Supply at least one memory threshold.');
  }
  return options;
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
  } catch {
    return '';
  }
}

function parseSize(value, unit) {
  const multiplier = {K: 1024, M: 1024 ** 2, G: GIB, T: 1024 ** 4}[unit.toUpperCase()];
  return Number(value) * multiplier;
}

function swapUsedBytes() {
  if (process.platform === 'darwin') {
    const output = commandOutput('sysctl', ['vm.swapusage']);
    const match = output.match(/used\s*=\s*([0-9.]+)([KMGT])/i);
    return match ? parseSize(match[1], match[2]) : null;
  }
  if (process.platform === 'linux') {
    const output = commandOutput('cat', ['/proc/meminfo']);
    const total = Number(output.match(/^SwapTotal:\s+(\d+)\s+kB/im)?.[1]);
    const free = Number(output.match(/^SwapFree:\s+(\d+)\s+kB/im)?.[1]);
    return Number.isFinite(total) && Number.isFinite(free) ? (total - free) * 1024 : null;
  }
  return null;
}

function availableMemoryPercent() {
  if (process.platform === 'darwin') {
    const output = commandOutput('memory_pressure', ['-Q']);
    const match = output.match(/free percentage:\s*([0-9.]+)%/i);
    if (match) return Number(match[1]);
  }
  return os.totalmem() > 0 ? os.freemem() / os.totalmem() * 100 : null;
}

function compressedMemoryBytes() {
  if (process.platform !== 'darwin') return null;
  const output = commandOutput('vm_stat', []);
  const pageSize = Number(output.match(/page size of\s+(\d+)\s+bytes/i)?.[1]);
  const pages = Number(output.match(/Pages occupied by compressor:\s+(\d+)\./i)?.[1]);
  return Number.isFinite(pageSize) && Number.isFinite(pages) ? pageSize * pages : null;
}

function processTreeRssBytes(rootPid) {
  if (process.platform === 'win32') return null;
  const output = commandOutput('ps', ['-axo', 'pid=,ppid=,rss=']);
  const children = new Map();
  const rss = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
    if (!match) continue;
    const pid = Number(match[1]);
    const ppid = Number(match[2]);
    rss.set(pid, Number(match[3]) * 1024);
    if (!children.has(ppid)) children.set(ppid, []);
    children.get(ppid).push(pid);
  }
  let total = 0;
  const pending = [rootPid];
  const seen = new Set();
  while (pending.length) {
    const pid = pending.pop();
    if (seen.has(pid)) continue;
    seen.add(pid);
    total += rss.get(pid) || 0;
    pending.push(...(children.get(pid) || []));
  }
  return total;
}

function snapshot(rootPid, baselineSwapBytes) {
  const swapBytes = swapUsedBytes();
  return {
    at: new Date().toISOString(),
    freePercent: availableMemoryPercent(),
    swapBytes,
    swapGrowthBytes: swapBytes === null || baselineSwapBytes === null
      ? null
      : Math.max(0, swapBytes - baselineSwapBytes),
    compressedBytes: compressedMemoryBytes(),
    processRssBytes: processTreeRssBytes(rootPid),
  };
}

function violations(sample, options) {
  const results = [];
  if (options.minFreePercent !== undefined
      && sample.freePercent !== null
      && sample.freePercent < options.minFreePercent) {
    results.push('free-memory');
  }
  if (options.maxSwapGrowthGib !== undefined
      && sample.swapGrowthBytes !== null
      && sample.swapGrowthBytes > options.maxSwapGrowthGib * GIB) {
    results.push('swap-growth');
  }
  if (options.maxCompressedGib !== undefined
      && sample.compressedBytes !== null
      && sample.compressedBytes > options.maxCompressedGib * GIB) {
    results.push('compressed-memory');
  }
  if (options.maxProcessRssGib !== undefined
      && sample.processRssBytes !== null
      && sample.processRssBytes > options.maxProcessRssGib * GIB) {
    results.push('process-rss');
  }
  return results;
}

function createEventLogger(logPath) {
  if (logPath) mkdirSync(path.dirname(logPath), {recursive: true});
  return (event) => {
    const line = JSON.stringify({source: 'memory-guard', ...event});
    console.error(`[memory-guard] ${line}`);
    if (logPath) appendFileSync(logPath, `${line}\n`, 'utf8');
  };
}

function terminateProcessTree(child, signal) {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') {
      const args = ['/PID', String(child.pid), '/T'];
      if (signal === 'SIGKILL') args.push('/F');
      execFileSync('taskkill', args, {stdio: 'ignore'});
    } else {
      process.kill(-child.pid, signal);
    }
  } catch {
    try {
      child.kill(signal);
    } catch {
      // The process already exited.
    }
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    usage();
    process.exitCode = 64;
    return;
  }
  if (options.help) {
    usage();
    return;
  }

  const log = createEventLogger(options.logPath);
  const baselineSwapBytes = swapUsedBytes();
  const child = spawn(options.command[0], options.command.slice(1), {
    cwd: options.cwd,
    detached: process.platform !== 'win32',
    stdio: 'inherit',
  });
  let consecutiveTrips = 0;
  let tripped = false;
  let tripSample = null;
  let tripReasons = [];
  let killTimer = null;

  log({
    event: 'started',
    pid: child.pid,
    command: options.command,
    cwd: options.cwd,
    thresholds: {
      minFreePercent: options.minFreePercent ?? null,
      maxSwapGrowthGib: options.maxSwapGrowthGib ?? null,
      maxCompressedGib: options.maxCompressedGib ?? null,
      maxProcessRssGib: options.maxProcessRssGib ?? null,
      tripCount: options.tripCount,
    },
    baselineSwapBytes,
  });

  const poll = () => {
    if (!child.pid || tripped) return;
    const sample = snapshot(child.pid, baselineSwapBytes);
    const currentViolations = violations(sample, options);
    consecutiveTrips = currentViolations.length ? consecutiveTrips + 1 : 0;
    log({event: 'sample', pid: child.pid, consecutiveTrips, violations: currentViolations, ...sample});
    if (consecutiveTrips < options.tripCount) return;
    tripped = true;
    tripSample = sample;
    tripReasons = currentViolations;
    log({event: 'tripped', pid: child.pid, reasons: tripReasons, sample: tripSample});
    terminateProcessTree(child, 'SIGTERM');
    killTimer = setTimeout(() => terminateProcessTree(child, 'SIGKILL'),
      options.terminateGraceSeconds * 1000);
  };

  const interval = setInterval(poll, options.pollSeconds * 1000);
  poll();

  const forwardSignal = (signal) => {
    log({event: 'forward-signal', pid: child.pid, signal});
    terminateProcessTree(child, signal);
  };
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));

  const result = await new Promise((resolve) => {
    child.once('error', (error) => resolve({error}));
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  clearInterval(interval);
  if (killTimer) clearTimeout(killTimer);

  if (result.error) {
    log({event: 'spawn-error', message: result.error.message});
    process.exitCode = 69;
    return;
  }
  if (tripped) {
    log({event: 'stopped-by-guard', code: result.code, signal: result.signal,
      reasons: tripReasons, sample: tripSample});
    process.exitCode = 70;
    return;
  }
  log({event: 'completed', code: result.code, signal: result.signal});
  process.exitCode = result.code ?? (result.signal ? 128 : 0);
}

await main();
