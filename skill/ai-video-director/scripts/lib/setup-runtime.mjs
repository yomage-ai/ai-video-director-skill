import {spawnSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';

export const runtimeRoot = () => path.join(process.env.AI_VIDEO_DIRECTOR_DATA_DIR || path.join(os.homedir(), '.local', 'share', 'ai-video-director'), 'runtime');
export const skillRoots = () => [path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'), path.join(os.homedir(), '.agents', 'skills')];
export const directories = dir => { try { return readdirSync(dir, {withFileTypes:true}).filter(d => d.isDirectory()).map(d => path.join(dir,d.name)); } catch { return []; } };

// Include verified host/runtime locations without changing the user's shell configuration.
export function activateRuntimePaths() {
  const host = path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies');
  const extra = [path.dirname(process.execPath), path.join(host,'bin','override'), path.join(host,'bin','fallback'), path.join(host,'native','git','cmd')];
  if (process.platform === 'darwin') extra.push('/opt/homebrew/bin','/usr/local/bin');
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA;
    if (local) {
      extra.push(path.join(local,'Microsoft','WinGet','Links'),path.join(local,'Microsoft','WindowsApps'));
      for (const pkg of directories(path.join(local,'Microsoft','WinGet','Packages')).filter(p => path.basename(p).startsWith('Gyan.FFmpeg_'))) {
        extra.push(path.join(pkg,'bin'), ...directories(pkg).map(p => path.join(p,'bin')));
      }
    }
    if (process.env.ProgramFiles) extra.push(path.join(process.env.ProgramFiles,'Git','cmd'));
  }
  process.env.PATH = [...new Set([path.dirname(process.execPath), ...(process.env.PATH || '').split(path.delimiter), ...extra.filter(existsSync)])].join(path.delimiter);
}

export function run(argv, {cwd, timeout = 120000, live = false} = {}) {
  const result = spawnSync(argv[0], argv.slice(1), {cwd, timeout, encoding:'utf8', shell:false, maxBuffer:8*1024*1024, stdio:live ? ['ignore',2,2] : 'pipe', env:process.env});
  return {ok:!result.error && result.status === 0, status:result.status, output:`${result.stdout || ''}${result.stderr || ''}`.trim(), error:result.error?.message};
}
export const version = (argv) => { const r=run(argv,{timeout:15000}); return r.ok ? r.output.split(/\r?\n/)[0] : null; };

export function npmCommand() {
  // Execute npm's JS entrypoint with this Node; avoids .cmd quoting and mismatched Node on Windows.
  const nodeDir=path.dirname(process.execPath);
  const candidates=[path.join(nodeDir,'node_modules','npm','bin','npm-cli.js'),path.resolve(nodeDir,'../lib/node_modules/npm/bin/npm-cli.js')];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    try { candidates.push(path.resolve(path.dirname(realpathSync(path.join(dir,process.platform==='win32' ? 'npm.cmd' : 'npm'))),'npm-cli.js')); } catch {}
    candidates.push(path.join(dir,'node_modules','npm','bin','npm-cli.js'));
  }
  const entry=candidates.find(existsSync);
  return entry ? [process.execPath,entry] : null;
}

export function xmlDependency(skillDir) {
  try {
    const req=createRequire(path.join(skillDir,'package.json'));
    const meta=JSON.parse(readFileSync(path.resolve(path.dirname(req.resolve('fast-xml-parser')),'../package.json'),'utf8'));
    const {XMLParser}=req('fast-xml-parser');
    return meta.version === '5.10.1' && new XMLParser().parse('<root>ok</root>').root === 'ok';
  } catch { return false; }
}

export function nativeInstallPlan(platform, packages, available, uid = -1) {
  if (!packages.length) return [];
  if (platform === 'darwin' && available('brew')) return [['brew','install',...packages]];
  if (platform === 'win32' && available('winget')) return packages.map(p => ['winget','install','--id',p==='ffmpeg' ? 'Gyan.FFmpeg' : 'Git.Git','--exact','--source','winget','--silent','--disable-interactivity','--accept-source-agreements','--accept-package-agreements']);
  if (platform === 'linux' && available('apt-get')) {
    const prefix=uid===0 ? [] : ['sudo','-n'];
    return [[...prefix,'apt-get','update'],[...prefix,'apt-get','install','-y',...packages]];
  }
  return null;
}

export function findHyperframes(wanted) {
  const global=version(['hyperframes','--version']);
  if (global && global.match(/\b\d+\.\d+\.\d+\b/)?.[0] === wanted) return {argv:['hyperframes'],version:wanted,source:'PATH'};
  const candidates=[path.join(runtimeRoot(),`hyperframes-${wanted}`),...directories(process.env.npm_config_cache ? path.join(process.env.npm_config_cache,'_npx') : path.join(os.homedir(),'.npm','_npx'))];
  for (const dir of candidates) {
    const pkg=path.join(dir,'node_modules','hyperframes');
    try {
      if (JSON.parse(readFileSync(path.join(pkg,'package.json'),'utf8')).version !== wanted) continue;
      const argv=[process.execPath,path.join(pkg,'bin','hyperframes.mjs')];
      if (version([...argv,'--version'])?.match(/\b\d+\.\d+\.\d+\b/)?.[0] === wanted) return {argv,version:wanted,source:pkg};
    } catch {}
  }
  return null;
}

export function classifyChatcut(plugin, server, authStatus) {
  if (!plugin?.installed) return 'missing';
  if (!plugin.enabled) return 'disabled';
  if (!server?.enabled) return 'registration-required';
  if (authStatus === 'not_logged_in') return 'authentication-required';
  return 'installed-session-verification-required';
}
