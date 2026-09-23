import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,realpathSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skill/ai-video-director');
test('authorized update preserves an old folder and personal files, switches once and reuses the installation',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-update-'));
  const destination=path.join(dir,'codex','skills','ai-video-director');
  mkdirSync(destination,{recursive:true});
  writeFileSync(path.join(destination,'SKILL.md'),'---\nname: ai-video-director\ndescription: Old fixture\n---\n');
  writeFileSync(path.join(destination,'personal-note.txt'),'preserve this anonymous custom note');
  const invoke=()=>spawnSync(process.execPath,[path.join(skill,'scripts/director.mjs'),'install-skill','--update'],{encoding:'utf8',timeout:30000,env:{...process.env,CODEX_HOME:path.join(dir,'codex'),AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
  try {
    const first=invoke();assert.ifError(first.error);assert.equal(first.status,0,first.stderr);
    const result=JSON.parse(first.stdout);assert.equal(result.status,'updated');
    assert.equal(path.dirname(result.backup),path.join(dir,'codex','skill-backups'));
    assert.equal(readFileSync(path.join(result.backup,'personal-note.txt'),'utf8'),'preserve this anonymous custom note');
    assert.equal(realpathSync(destination),realpathSync(skill));
    const second=invoke();assert.equal(second.status,0,second.stderr);
    assert.equal(JSON.parse(second.stdout).status,'already-installed');
    assert.equal(JSON.parse(second.stdout).backup,undefined);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('update does not replace an unrelated directory',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-update-unknown-'));
  const destination=path.join(dir,'skills','ai-video-director');
  mkdirSync(destination,{recursive:true});
  writeFileSync(path.join(destination,'SKILL.md'),'---\nname: unrelated\n---\n');
  try {
    const result=spawnSync(process.execPath,[path.join(skill,'scripts/director.mjs'),'install-skill','--update'],{encoding:'utf8',env:{...process.env,CODEX_HOME:dir,AI_VIDEO_DIRECTOR_DATA_DIR:path.join(dir,'data')}});
    assert.equal(result.status,1);
    assert.ok(result.stderr.includes('ownership'));
    assert.equal(readFileSync(path.join(destination,'SKILL.md'),'utf8'),'---\nname: unrelated\n---\n');
  } finally {rmSync(dir,{recursive:true,force:true});}
});

import {switchSkillWithRollback} from '../skill/ai-video-director/scripts/lib/skill-install.mjs';
import {unlinkSync} from 'node:fs';
test('failed setup restores the old Skill and personal files, including thrown setup errors',()=>{
 for(const setup of [()=>({ok:false,error:'synthetic dependency failure'}),()=>{throw Error('synthetic setup exception');}]){
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-rollback-')),destination=path.join(dir,'installed'),source=path.join(dir,'new');
  mkdirSync(destination);mkdirSync(source);writeFileSync(path.join(destination,'personal.txt'),'keep');
  try{const r=switchSkillWithRollback({destination,source,backupRoot:path.join(dir,'backups'),setup});assert.equal(r.status,'rolled-back');assert.equal(readFileSync(path.join(destination,'personal.txt'),'utf8'),'keep');}
  finally{rmSync(dir,{recursive:true,force:true});}
 }
});
test('setup cannot roll back over a concurrent replacement',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'avd-update-race-')),destination=path.join(dir,'installed'),source=path.join(dir,'new');mkdirSync(destination);mkdirSync(source);writeFileSync(path.join(destination,'old.txt'),'keep');
 try{const r=switchSkillWithRollback({destination,source,backupRoot:path.join(dir,'backups'),setup:()=>{unlinkSync(destination);mkdirSync(destination);writeFileSync(path.join(destination,'other.txt'),'other actor');return {ok:false};}});assert.equal(r.status,'recovery-required');assert.equal(readFileSync(path.join(destination,'other.txt'),'utf8'),'other actor');assert.equal(readFileSync(path.join(r.backup,'old.txt'),'utf8'),'keep');}
 finally{rmSync(dir,{recursive:true,force:true});}
});
