import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, existsSync, mkdtempSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {activateRuntimePaths, classifyChatcut, nativeInstallPlan, npmCommand, xmlDependency} from '../skill/ai-video-director/scripts/lib/setup-runtime.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=path.join(repo,'skill','ai-video-director');
const temporary=()=>mkdtempSync(path.join(os.tmpdir(),'avd-setup-test-'));
function setup(args,data) {
  const r=spawnSync(process.execPath,[path.join(skill,'scripts','setup.mjs'),...args],{encoding:'utf8',env:{...process.env,AI_VIDEO_DIRECTOR_DATA_DIR:data},timeout:30000});
  assert.ifError(r.error);
  return {status:r.status,report:JSON.parse(r.stdout)};
}

test('native installation is missing-only and preserves permission boundaries on each OS',()=>{
  assert.deepEqual(nativeInstallPlan('darwin',[],()=>{throw Error('must not call package manager');}),[]);
  assert.deepEqual(nativeInstallPlan('darwin',['ffmpeg'],p=>p==='brew'),[['brew','install','ffmpeg']]);
  assert.equal(nativeInstallPlan('darwin',['ffmpeg'],()=>false),null);
  const windows=nativeInstallPlan('win32',['ffmpeg','git'],p=>p==='winget');
  assert.deepEqual(windows.map(a=>a[a.indexOf('--id')+1]),['Gyan.FFmpeg','Git.Git']);
  assert.ok(windows.every(a=>a.includes('--disable-interactivity') && a.includes('--exact') && !a.includes('--force')));
  assert.deepEqual(nativeInstallPlan('linux',['ffmpeg'],p=>p==='apt-get',1000)[0],['sudo','-n','apt-get','update']);
  assert.deepEqual(nativeInstallPlan('linux',['git'],p=>p==='apt-get',0)[1],['apt-get','install','-y','git']);
});

test('fallback binary directories never take priority over the existing tool search path',()=>{
  const before=process.env.PATH;
  const existing=temporary();
  try {
    process.env.PATH=[existing,before].join(path.delimiter);
    activateRuntimePaths();
    const resolved=process.env.PATH.split(path.delimiter);
    assert.equal(resolved[0],path.dirname(process.execPath));
    assert.equal(resolved[1],existing);
  } finally { process.env.PATH=before; }
});

test('ChatCut registration can never establish login, live tools or operational readiness',()=>{
  assert.equal(classifyChatcut(null,{enabled:true}),'missing');
  assert.equal(classifyChatcut({installed:true,enabled:false},{enabled:true}),'disabled');
  assert.equal(classifyChatcut({installed:true,enabled:true},null),'registration-required');
  assert.equal(classifyChatcut({installed:true,enabled:true},{enabled:true}),'installed-session-verification-required');
  assert.equal(classifyChatcut({installed:true,enabled:true},{enabled:true},'not_logged_in'),'authentication-required');
  assert.equal(classifyChatcut({installed:true,enabled:true},{enabled:true},'o_auth'),'installed-session-verification-required');
  assert.equal(classifyChatcut({installed:true,enabled:false},{enabled:true},'not_logged_in'),'disabled');
});

test('Skill-only packaging carries a usable exact dependency lock and detects the absent XML module',()=>{
  const dir=temporary();
  for (const file of ['package.json','package-lock.json']) cpSync(path.join(skill,file),path.join(dir,file));
  const pkg=JSON.parse(readFileSync(path.join(dir,'package.json')));
  const lock=JSON.parse(readFileSync(path.join(dir,'package-lock.json')));
  assert.equal(pkg.engines.node,'>=22');
  assert.deepEqual(pkg.dependencies,lock.packages[''].dependencies);
  assert.equal(lock.packages['node_modules/fast-xml-parser'].version,'5.10.1');
  assert.ok(lock.packages['node_modules/fast-xml-parser'].integrity);
  assert.equal(xmlDependency(dir),false);
  assert.equal(xmlDependency(skill),true);
  assert.ok(npmCommand()?.every(a=>typeof a==='string'));
});

test('setup check stays read-only and a missing host is not reported ready',()=>{
  const data=path.join(temporary(),'data');
  const result=setup(['--stage','rough'],data);
  assert.equal(result.status,1);
  assert.equal(result.report.localReady,false);
  assert.equal(result.report.operationalReady,false);
  assert.equal(result.report.checks.find(c=>c.name==='chatcut').status,'missing');
  assert.equal(existsSync(data),false);
});

test('repeated intake apply reuses installed dependencies and saves distinct receipts',()=>{
  const data=path.join(temporary(),'data');
  const lockBefore=readFileSync(path.join(skill,'package-lock.json'),'utf8');
  const one=setup(['--stage','intake','--apply'],data);
  const two=setup(['--stage','intake','--apply'],data);
  assert.equal(one.status,0);
  assert.equal(two.status,0);
  assert.equal(two.report.localReady,true);
  assert.equal(two.report.operationalReady,false);
  assert.equal(two.report.checks.find(c=>c.name==='fast-xml-parser').action,'reused');
  assert.ok(two.report.checks.filter(c=>['ffmpeg','ffprobe'].includes(c.name)).every(c=>c.action==='reused'));
  assert.notEqual(one.report.receipt,two.report.receipt);
  assert.ok(existsSync(one.report.receipt) && existsSync(two.report.receipt));
  assert.equal(readFileSync(path.join(skill,'package-lock.json'),'utf8'),lockBefore);
});

test('unsupported stage fails without starting a package installation',()=>{
  const data=path.join(temporary(),'data');
  const r=setup(['--stage','unknown'],data);
  assert.equal(r.status,1);
  assert.equal(r.report.localReady,false);
  assert.equal(r.report.checks.length,0);
  assert.equal(existsSync(data),false);
});
