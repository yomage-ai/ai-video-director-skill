#!/usr/bin/env node
import {cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {activateRuntimePaths, classifyChatcut, findHyperframes, nativeInstallPlan, npmCommand, run, runtimeRoot, skillRoots, version, xmlDependency} from './lib/setup-runtime.mjs';
import {artifact, decode, probe} from './lib/media-contract.mjs';
import {prepareChatcutUpload} from './lib/chatcut-upload-compat.mjs';
import {recoveryAction} from './lib/recovery.mjs';

const skillDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(path.join(skillDir,'references','dependencies.json'),'utf8'));
const args=process.argv.slice(2);
const value=(key,fallback) => { const i=args.indexOf(key); return i<0 ? fallback : args[i+1]; };
const stage=value('--stage','rough');
const apply=args.includes('--apply');
const renderer=value('--renderer','hyperframes');
const codex=value('--codex',null);
const report={schemaVersion:1,checkedAt:new Date().toISOString(),stage,mode:apply?'apply':'check',checks:[],agentActions:[],userActions:[],operationalReady:false};
const add=(name,status,detail={}) => report.checks.push({name,status,...detail});
const action=(name,instruction) => report.agentActions.push({name,instruction});
function checkedRun(argv, opts={}) {
  const r=run(argv,{timeout:600000,live:true,...opts});
  if (!r.ok) throw new Error(`${path.basename(argv[0])} failed (${r.status ?? r.error}); inspect the command log, repair the cause, then resume. No success was recorded.`);
}
function readCommand(argv) { const r=run(argv); if (!r.ok) return null; try { return JSON.parse(r.output); } catch { return null; } }
function needs(name,instruction) { add(name,'missing'); action(name,instruction); }
function smokeFolder(prefix) { mkdirSync(runtimeRoot(),{recursive:true}); return mkdtempSync(path.join(runtimeRoot(),prefix)); }

function core() {
  const major=Number(process.versions.node.split('.')[0]);
  if (major<22) { needs('node','Run bootstrap.sh / bootstrap.ps1 to select or acquire Node >=22, then rerun setup.'); return false; }
  add('node','pass',{version:process.version,path:process.execPath});
  const npm=npmCommand();
  if (!npm) needs('npm','Resolve a complete existing Node/npm distribution or run the bootstrap with --fresh-node; do not ask the user to install npm manually.');
  else add('npm','pass',{argv:npm});
  if (!xmlDependency(skillDir)) {
    if (apply && npm) checkedRun([...npm,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:skillDir});
    if (!xmlDependency(skillDir)) needs('fast-xml-parser','Run setup --apply using the bundled Skill package-lock.json in a writable Skill installation.');
    else add('fast-xml-parser','pass',{action:'installed',version:manifest.xmlVersion});
  } else add('fast-xml-parser','pass',{action:'reused',version:manifest.xmlVersion});
  const missing=[];
  if (!version(['ffmpeg','-version']) || !version(['ffprobe','-version'])) missing.push('ffmpeg');
  if (stage!=='intake' && !version(['git','--version'])) missing.push('git');
  if (missing.length && apply) {
    const plan=nativeInstallPlan(process.platform,missing,p=>!!version([p,'--version']),process.getuid?.());
    if (plan) { for (const argv of plan) checkedRun(argv); activateRuntimePaths(); }
    else action('native-package-manager','Read dependency-setup.md: Agent installs the OS package manager or a verified official binary, then resumes; ask only for a concrete system permission if needed.');
  }
  for (const name of ['ffmpeg','ffprobe',...(stage!=='intake'?['git']:[])]) {
    const found=version([name,name==='git'?'--version':'-version']);
    if (found) add(name,'pass',{version:found,action:missing.includes(name==='ffprobe'?'ffmpeg':name)?'installed':'reused'});
    else needs(name,'Agent completes native setup from dependency-setup.md and reruns --apply.');
  }
  return !!npm && report.checks.every(c=>c.status==='pass');
}

function chatcut() {
  if (!codex || !path.isAbsolute(codex) || !existsSync(codex)) { needs('chatcut','Agent locates the active desktop app bundled CLI, then reruns --codex <absolute-cli>. For another host or an already callable Desktop surface, follow dependency-setup.md instead.'); return; }
  const marketplaceSource=manifest.chatcut.source;
  let markets=readCommand([codex,'plugin','marketplace','list','--json']);
  if (!markets) throw new Error('Cannot inspect the host plugin registry; use the current official host installer, not cache-directory inference.');
  let market=markets.marketplaces?.find(m=>m.marketplaceSource?.source?.replace(/\.git$/,'').toLowerCase()===marketplaceSource.replace(/\.git$/,'').toLowerCase());
  if (!market && apply) {
    checkedRun([codex,'plugin','marketplace','add',marketplaceSource,'--ref',manifest.chatcut.revision]);
    markets=readCommand([codex,'plugin','marketplace','list','--json']);
    market=markets?.marketplaces?.find(m=>m.marketplaceSource?.source?.replace(/\.git$/,'').toLowerCase()===marketplaceSource.replace(/\.git$/,'').toLowerCase());
  }
  if (!market) { needs('chatcut','Run --apply to add the official pinned ChatCut marketplace.'); return; }
  const list=()=>readCommand([codex,'plugin','list','--marketplace',market.name,'--json']);
  let registry=list();
  if (!registry) throw new Error('Cannot read ChatCut plugin status.');
  let plugin=registry.installed?.find(p=>p.name==='chatcut');
  if (!plugin?.installed && apply) {
    const candidate=registry.available?.find(p=>p.name==='chatcut');
    if (candidate?.version && candidate.version!==manifest.chatcut.version) throw new Error('Existing marketplace offers a different ChatCut version; review its upstream change before adoption. Do not overwrite the marketplace.');
    checkedRun([codex,'plugin','add',`chatcut@${market.name}`,'--json']);
    plugin=list()?.installed?.find(p=>p.name==='chatcut');
  }
  const server=readCommand([codex,'mcp','get','chatcut','--json']);
  const servers=readCommand([codex,'mcp','list','--json']);
  const authStatus=Array.isArray(servers) ? servers.find(s=>s.name==='chatcut')?.auth_status : undefined;
  const status=classifyChatcut(plugin,server,authStatus);
  add('chatcut',status,{version:plugin?.version || null,authStatus:authStatus || 'unknown'});
  if (status==='disabled') action('chatcut','Check why this plugin is disabled; preserve an explicit user-disable decision. Enable only within current authorization, using the host supported command.');
  else if (status==='missing' || status==='registration-required') action('chatcut','Resume the official plugin install/registration flow and verify its actual result.');
  else if (status==='authentication-required') {
    report.userActions.push({name:'chatcut-login',...recoveryAction('authentication','ChatCut','The installed connector reports not_logged_in; login/consent is required before source upload or editing.')});
    action('chatcut-login','Tell the user that ChatCut needs login and open the official sign-in flow once. Let the user complete required login/consent. Recheck mcp list and make a live call before resuming. Record the blocker in pipeline.recovery. Do not switch to local editing or another model/provider to avoid this step.');
  }
  else action('chatcut-session','Discover live ChatCut tools and make a read-only call. If it requests authentication, explain the login to the user, open the official flow once and wait for any required user consent. Recheck auth and live tools before resuming; record the blocker rather than switching routes. Request a new session only when re-discovery fails after recovery. Installed does not mean logged in or callable.');
  action('source-listen','Before editing, test whether this exact host/model receives real audio for analysis. Name the working modality or reviewer and bind a real speech sample. A playable file, audio attachment returned to the user, ASR text, waveform, or ChatCut login is not a listening-capability pass. If unavailable, record the exact missing route and stop production handoff; do not turn a rough-cut request into permission for an unreviewed export.');
  if (status==='installed-session-verification-required') {
    const helper=plugin?.source?.path && path.join(plugin.source.path,'skills','asset-import','scripts','upload-media.mjs');
    if (helper && existsSync(helper)) {
      const prepared=prepareChatcutUpload(helper,{apply});
      add('chatcut-upload-compat',prepared.ready?'pass':'preparation-required',{...prepared,scope:'helper verified/prepared locally; not an authenticated upload test'});
    } else needs('chatcut-upload-compat','Resolve the official helper from the active asset-import Skill, then Agent runs chatcut-upload.mjs --helper <absolute-helper> --prepare-only. Do not ask the user to copy a helper or edit settings.');
    action('chatcut-upload','For hosted imports and same-asset retry, run this Skill\'s chatcut-upload.mjs --helper <active-official-helper> -- <official arguments>. It automatically verifies and prepares the governed compatibility helper. A large file runs alone; retain no-transcribe and existing assets.');
  }
  action('asr','Verify the chosen ChatCut host exposes real transcription and can access the authorized source; transcribe after content approval. A manuscript or plugin cache does not prove ASR readiness.');
}

function fine(npm) {
  if (renderer==='remotion') { needs('remotion','Agent follows dependency-setup.md: prepare the selected project at governed Remotion 4.0.504, ensure its browser, and run a tiny render; do not install HyperFrames for the same shot.'); return; }
  const wanted=manifest.hyperframes[renderer==='cutout'?'cutout':'composition'];
  let hf=findHyperframes(wanted);
  if (!hf && apply) {
    const prefix=path.join(runtimeRoot(),`hyperframes-${wanted}`);
    mkdirSync(prefix,{recursive:true});
    if (!existsSync(path.join(prefix,'package.json'))) writeFileSync(path.join(prefix,'package.json'),JSON.stringify({name:`avd-hyperframes-${wanted.replaceAll('.','-')}`,private:true},null,2)+'\n');
    checkedRun([...npm,'install','--prefix',prefix,'--save-exact','--no-audit','--no-fund',`hyperframes@${wanted}`]);
    hf=findHyperframes(wanted);
  }
  if (!hf) { needs('hyperframes',`Run --apply to install governed HyperFrames ${wanted}; npx alone is insufficient.`); return; }
  add('hyperframes','pass',{version:wanted,argv:hf.argv});
  // These CLI tarballs contain only entry Skills. Acquire the remaining published
  // authoring bundle from the governed Git revision, never a floating latest-main updater.
  const revision=manifest.hyperframes.skillsRevision;
  const checkout=path.join(runtimeRoot(),`hyperframes-skills-${revision}`);
  const required=manifest.hyperframes.skills;
  const missingSkills=required.some(name=>!skillRoots().some(root=>existsSync(path.join(root,name,'SKILL.md'))));
  if (missingSkills && apply && !existsSync(checkout)) {
    mkdirSync(runtimeRoot(),{recursive:true});
    const temporary=mkdtempSync(path.join(runtimeRoot(),'skills-fetch-'));
    const hooks=path.join(temporary,'avd-empty-hooks');
    mkdirSync(hooks);
    checkedRun(['git','init',temporary]);
    checkedRun(['git','-C',temporary,'remote','add','origin',manifest.hyperframes.source]);
    checkedRun(['git','-C',temporary,'sparse-checkout','set','skills']);
    checkedRun(['git','-C',temporary,'-c',`core.hooksPath=${hooks}`,'fetch','--depth=1','--filter=blob:none','origin',revision]);
    checkedRun(['git','-C',temporary,'-c',`core.hooksPath=${hooks}`,'checkout','--detach','FETCH_HEAD']);
    if (version(['git','-C',temporary,'rev-parse','HEAD'])!==revision) throw new Error('HyperFrames authoring revision mismatch');
    renameSync(temporary,checkout);
  }
  const bundle=path.join(checkout,'skills');
  if (missingSkills && existsSync(checkout) && version(['git','-C',checkout,'rev-parse','HEAD'])!==revision) throw new Error('Existing authoring checkout does not match the governed revision');
  for (const name of required) {
    let target=skillRoots().find(root=>existsSync(path.join(root,name,'SKILL.md')));
    if (!target && apply && bundle && existsSync(path.join(bundle,name,'SKILL.md'))) {
      const destination=path.join(skillRoots()[0],name);
      try { lstatSync(destination); throw new Error(`Preserve existing incomplete Skill directory: ${destination}; Agent repairs it separately.`); } catch(e) { if(e.code!=='ENOENT') throw e; }
      mkdirSync(path.dirname(destination),{recursive:true});
      cpSync(path.join(bundle,name),destination,{recursive:true,errorOnExist:true,force:false});
      target=skillRoots()[0];
    }
    if (target) add(`skill:${name}`,'pass',{path:path.join(target,name),scope:'files-present; Agent reads before use'});
    else needs(`skill:${name}`,'Agent reruns --apply to acquire the version-matched published authoring bundle and copy missing Skills.');
  }
  if (apply) checkedRun([...hf.argv,'browser','ensure']);
  const browser=run([...hf.argv,'browser','path']);
  if (!browser.ok || !browser.output || !existsSync(browser.output.trim())) needs('render-browser','Agent runs the selected HyperFrames browser ensure and verifies a tiny render.');
  else add('render-browser','pass',{path:browser.output.trim(),scope:'browser-found; actual render still required'});
  if (apply && report.checks.every(c=>c.status==='pass')) {
    const folder=smokeFolder('renderer-smoke-');
    const output=path.join(folder,'check.mp4');
    cpSync(path.join(skillDir,'assets','templates','dependency-smoke.html'),path.join(folder,'index.html'));
    checkedRun([...hf.argv,'lint',folder]);
    checkedRun([...hf.argv,'render',folder,'--output',output,'--workers','1','--no-browser-gpu','--no-best-effort']);
    decode(output);
    const media=probe(output);
    const stream=media.streams.find(s=>s.codec_type==='video');
    const duration=Number(media.format.duration);
    if (stream?.width!==320 || stream?.height!==180 || !Number.isFinite(duration) || Math.abs(duration-0.3)>0.051) throw new Error('Tiny render output does not match the expected dimensions/duration');
    add('render-smoke','pass',{version:wanted,evidence:artifact(output),scope:'anonymous 320x180 local render and full decode; no project/audio/style approval'});
  }
  action('fine-renderer','Bind the actual tiny-render evidence and selected runtime to the current capability record; verify project-specific media and fonts separately. Do not copy installation-only rows into production capability checks.');
  if (renderer==='cutout') action('cutout-model','Run the governed remove-background sample on clean locked A-roll; first use downloads the hash-pinned model, subsequent runs reuse it. Verify actual moving alpha before selecting cutout.');
}

try {
  if (!['intake','rough','fine','release'].includes(stage)) throw new Error('--stage must be intake, rough, fine or release');
  if (!['hyperframes','cutout','remotion'].includes(renderer)) throw new Error('--renderer must be hyperframes, cutout or remotion');
  if (codex && /[\r\n]/.test(codex)) throw new Error('Invalid CLI path');
  activateRuntimePaths();
  const ready=core();
  if (ready && apply) {
    const evidence=path.join(smokeFolder('ffmpeg-smoke-'),'capabilities.json');
    checkedRun([process.execPath,path.join(skillDir,'scripts','capability-probe.mjs'),evidence]);
    add('ffmpeg-smoke','pass',{evidence:artifact(evidence),scope:'local synthetic audio/video encode and probe'});
  }
  if (ready && stage==='rough') chatcut();
  if (ready && ['fine','release'].includes(stage)) fine(npmCommand());
} catch(e) { report.error=e.message; }
report.localReady=!report.error && report.checks.every(c=>c.status==='pass' || c.status==='installed-session-verification-required');
if (apply) {
  mkdirSync(runtimeRoot(),{recursive:true});
  const folder=mkdtempSync(path.join(runtimeRoot(),'setup-'));
  report.receipt=path.join(folder,'receipt.json');
  writeFileSync(report.receipt,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
if (!report.localReady) process.exitCode=1;
