import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,chmodSync,rmSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyHostedChatcut,addNewChatcutHeader} from '../skill/ai-video-director/scripts/lib/chatcut-host.mjs';

const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skill/ai-video-director');
test('hosted readiness depends on registration and auth, not a plugin version',()=>{
  assert.equal(classifyHostedChatcut(null),'missing');
  assert.equal(classifyHostedChatcut({enabled:false},'o_auth'),'disabled');
  assert.equal(classifyHostedChatcut({enabled:true},'not_logged_in'),'authentication-required');
  assert.equal(classifyHostedChatcut({enabled:true},'o_auth'),'installed-session-verification-required');
  assert.equal(classifyHostedChatcut({enabled:true}),'installed-session-verification-required');
});

test('new registration header keeps unrelated config and refuses to overwrite existing headers',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-host-config-')),config=path.join(dir,'config.toml');
  const before='model = "fixture"\n[mcp_servers.chatcut]\nurl = "https://example.invalid"\n[mcp_servers.other]\nurl = "https://other.invalid"\n';
  try {
    writeFileSync(config,before);
    addNewChatcutHeader(config,{'x-chatcut-mcp-surface':'codex'});
    const after=readFileSync(config,'utf8');
    assert.ok(after.startsWith(before));
    assert.ok(after.includes('[mcp_servers.chatcut.http_headers]'));
    assert.equal(readdirSync(dir).filter(f=>f.endsWith('.bak')).length,1);
    assert.throws(()=>addNewChatcutHeader(config,{'x-chatcut-mcp-surface':'other'}),/preserve/);
    assert.equal(readFileSync(config,'utf8'),after);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

function fixtureHost(dir,{registered,pluginVersion,brokenRegistry=false,authStatus='not_logged_in'}) {
  const cli=path.join(dir,'codex-fixture');
  const state=path.join(dir,'registered'),calls=path.join(dir,'calls.jsonl');
  if (registered) writeFileSync(state,'yes');
  writeFileSync(path.join(dir,'config.toml'),'model = "preserve-me"\n');
  writeFileSync(cli,`#!${process.execPath}
import {existsSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
const a=process.argv.slice(2),root=process.env.CODEX_HOME;
appendFileSync(root+'/calls.jsonl',JSON.stringify(a)+'\\n');
let r;const present=existsSync(root+'/registered');
if(a[0]==='plugin'&&a[1]==='list')r={installed:${pluginVersion?JSON.stringify([{name:'chatcut',installed:true,enabled:true,version:pluginVersion}]):'[]'}};
else if(a[0]==='mcp'&&a[1]==='get'){
 if(!present)process.exit(1);
 const headers=readFileSync(root+'/config.toml','utf8').includes('[mcp_servers.chatcut.http_headers]')?{'x-chatcut-mcp-surface':'codex'}:{};
 r={enabled:true,transport:{http_headers:headers}};
} else if(a[0]==='mcp'&&a[1]==='list'){
 if(${brokenRegistry})process.exit(2);
 r=present?[{name:'chatcut',auth_status:${JSON.stringify(authStatus)}}]:[];
} else if(a[0]==='mcp'&&a[1]==='add'){
 if(present)process.exit(7);
 writeFileSync(root+'/registered','yes');
 appendFileSync(root+'/config.toml','[mcp_servers.chatcut]\\nurl = "https://api.chatcut.io/api/external-mcp/mcp"\\n');r={};
} else process.exit(8);
process.stdout.write(JSON.stringify(r));
`);
  chmodSync(cli,0o700);return {cli,calls};
}

test('fresh user registration works without marketplace/plugin install; repeat preserves it and routes sign-in', {skip:process.platform==='win32'},()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-host-fresh-'));
  try {
    const {cli,calls}=fixtureHost(dir,{registered:false});
    const invoke=()=>spawnSync(process.execPath,[path.join(skill,'scripts/setup.mjs'),'--stage','rough','--apply','--codex',cli],{encoding:'utf8',timeout:30000,env:{...process.env,CODEX_HOME:dir,AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
    for(let i=0;i<2;i++){
      const result=invoke();assert.ifError(result.error);
      const report=JSON.parse(result.stdout);
      assert.equal(report.error,undefined);
      assert.equal(report.localReady,false);
      assert.equal(report.userActions[0].name,'chatcut-login');
      assert.equal(report.userActions[0].actor,'user');
    }
    const commands=readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(commands.filter(a=>a[0]==='mcp'&&a[1]==='add').length,1);
    assert.ok(!commands.some(a=>a[0]==='plugin'||a[1]==='login'));
    assert.ok(readFileSync(path.join(dir,'config.toml'),'utf8').startsWith('model = "preserve-me"'));
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('old and future installed plugins do not trigger a version error, reinstall or duplicate connection', {skip:process.platform==='win32'},()=>{
  for(const pluginVersion of ['0.2.26','1.10.12','99.0.0']){
    const dir=mkdtempSync(path.join(os.tmpdir(),'avd-host-reuse-'));
    try {
      const {cli,calls}=fixtureHost(dir,{registered:true,pluginVersion});
      const result=spawnSync(process.execPath,[path.join(skill,'scripts/setup.mjs'),'--stage','rough','--codex',cli],{encoding:'utf8',timeout:30000,env:{...process.env,CODEX_HOME:dir,AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
      assert.ifError(result.error);
      const report=JSON.parse(result.stdout);
      assert.equal(report.error,undefined);
      assert.equal(report.userActions[0].name,'chatcut-login');
      const commands=readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse);
      assert.ok(commands.every(a=>a[0]==='mcp'&&['get','list'].includes(a[1])));
    } finally {rmSync(dir,{recursive:true,force:true});}
  }
});

test('unreadable registry remains an Agent recovery, never a mistaken fresh registration', {skip:process.platform==='win32'},()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-host-broken-'));
  try {
    const {cli,calls}=fixtureHost(dir,{registered:false,brokenRegistry:true});
    const result=spawnSync(process.execPath,[path.join(skill,'scripts/setup.mjs'),'--stage','rough','--apply','--codex',cli],{encoding:'utf8',timeout:30000,env:{...process.env,CODEX_HOME:dir,AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
    assert.ifError(result.error);
    const report=JSON.parse(result.stdout);
    assert.ok(report.error.includes('verify'));
    assert.equal(report.userActions.length,0);
    assert.ok(report.agentActions.some(a=>a.name==='setup-recovery'));
    assert.ok(!readFileSync(calls,'utf8').includes('"add"'));
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('authenticated connection without a plugin still reaches automatic helper preparation', {skip:process.platform==='win32'},()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-host-mcp-only-'));
  try {
    const {cli,calls}=fixtureHost(dir,{registered:true,authStatus:'o_auth'});
    const result=spawnSync(process.execPath,[path.join(skill,'scripts/setup.mjs'),'--stage','rough','--codex',cli],{encoding:'utf8',timeout:30000,env:{...process.env,CODEX_HOME:dir,AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
    assert.ifError(result.error);
    const report=JSON.parse(result.stdout);
    assert.equal(report.error,undefined);
    assert.equal(report.userActions.length,0);
    assert.equal(report.checks.find(c=>c.name==='chatcut').status,'installed-session-verification-required');
    assert.equal(report.checks.find(c=>c.name==='chatcut-upload-compat').action,'acquisition-required');
    assert.equal(report.checks.find(c=>c.name==='chatcut-upload-compat').selection,'isolated-reviewed-helper');
    assert.ok(!readFileSync(calls,'utf8').includes('"add"'));
  } finally {rmSync(dir,{recursive:true,force:true});}
});
