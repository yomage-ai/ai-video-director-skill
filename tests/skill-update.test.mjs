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
