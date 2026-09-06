import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const skill=path.join(root,'skill/ai-video-director');
const temp=()=>mkdtempSync(path.join(os.tmpdir(),'public-style-'));
const write=(file,value)=>writeFileSync(file,JSON.stringify(value));
const run=(args,dir=skill)=>JSON.parse(execFileSync(process.execPath,[path.join(dir,'scripts/memory.mjs'),...args],{encoding:'utf8'}));

test('a standalone fresh Skill loads the full public style without local profile or identity',()=>{
  const dir=temp(),copy=path.join(dir,'isolated-skill/ai-video-director'),data=temp();
  cpSync(skill,copy,{recursive:true});
  const result=run(['show','--stage','all','--data-dir',data],copy);
  assert.equal(result.preferences.talkingHead.audioLoudness.target.integratedLufsPreferred,-16.5);
  assert.equal(result.preferences.talkingHead.paletteTokens['bold-evidence-editorial-v1'].yellow,'#f9d84a');
  assert.equal(result.preferences.talkingHead.captionLayout.presets['bold-evidence-editorial-v1'].fontSize,50);
  assert.equal(result.preferences.talkingHead.signatureOutro,undefined);
  assert.equal(result.identity,null);
  assert.equal(existsSync(path.join(data,'profile.json')),false);
  assert.equal(existsSync(path.join(data,'feedback-log.jsonl')),false);
  assert.equal(result.localProfileRequired,false);
});

test('local and current-project overrides retain unspecified public fields without persisting the view',()=>{
  const dir=temp(),file=path.join(dir,'profile.json');
  write(file,{profileId:'test',version:1,preferences:{talkingHead:{audioLoudness:{target:{integratedLufsPreferred:-17}}}},promotionHistory:[]});
  const before=readFileSync(file,'utf8');
  const override=path.join(dir,'override.json');
  write(override,[{key:'talkingHead.audioLoudness.target.integratedLufsPreferred',value:-16,reason:'Current mix decision',source:'test approval'}]);
  const result=run(['show','--data-dir',dir,'--stage','rough','--overrides',override]);
  assert.equal(result.preferences.talkingHead.audioLoudness.target.integratedLufsPreferred,-16);
  assert.equal(result.preferences.talkingHead.audioLoudness.target.truePeakMaximumDbtp,-1);
  assert.equal(readFileSync(file,'utf8'),before);
  assert.ok(result.provenance.some(x=>x.source==='current-project-override'));
  assert.equal(run(['show','--defaults-only','--data-dir',dir,'--stage','rough']).preferences.talkingHead.audioLoudness.target.integratedLufsPreferred,-16.5);
});

test('identity selection verifies portable asset bytes and cannot replace audio style',()=>{
  const dir=temp(),data=temp();mkdirSync(path.join(dir,'references'));mkdirSync(path.join(dir,'assets'));
  const bytes=Buffer.from('anonymous identity asset integrity fixture');
  writeFileSync(path.join(dir,'assets/identity.txt'),bytes);
  const adapter={schemaVersion:1,skillId:'fixture-identity',version:1,assets:{open:{path:'assets/identity.txt',sha256:createHash('sha256').update(bytes).digest('hex')}},preferences:{talkingHead:{signatureOutro:{enabled:true}}}};
  const manifest=path.join(dir,'references/video-adapter.json');write(manifest,adapter);
  const result=run(['show','--stage','fine','--data-dir',data,'--identity-skill',dir]);
  assert.equal(result.preferences.talkingHead.signatureOutro.enabled,true);
  assert.equal(result.preferences.talkingHead.audioLoudness.target.integratedLufsPreferred,-16.5);
  assert.ok(path.isAbsolute(result.identity.assets.open.path));
  adapter.preferences.talkingHead.audioLoudness={target:{integratedLufsPreferred:0}};write(manifest,adapter);
  assert.throws(()=>run(['show','--data-dir',data,'--identity-skill',dir]),/identity fields/);
  delete adapter.preferences.talkingHead.audioLoudness;write(manifest,adapter);writeFileSync(path.join(dir,'assets/identity.txt'),'changed');
  assert.throws(()=>run(['show','--data-dir',data,'--identity-skill',dir]),/hash mismatch/);
});

test('public style has no source-machine paths, current identity assets or hidden reference dependencies',()=>{
  const style=JSON.parse(readFileSync(path.join(skill,'references/xiaoxiong-public-style.json')));
  const text=JSON.stringify(style);
  assert.doesNotMatch(text,/\/Users\/|\/Volumes\/|timelineId|localPath|referenceRender|referenceFile|我是小熊/);
  for(const relative of style.referenceAssets) assert.ok(existsSync(path.join(skill,relative)),relative);
  const map=JSON.parse(readFileSync(path.join(skill,'references/style-publication-map.json')));
  assert.equal(map.items.length,15);
  assert.equal(map.rawReferencePathsRequiredAtRuntime,0);
});

test('the exact public color chain runs as an FFmpeg simple filter without altering its stage values',()=>{
  const style=JSON.parse(readFileSync(path.join(skill,'references/xiaoxiong-public-style.json')));
  const color=style.preferences.talkingHead.productionBaseline.color;
  assert.equal(color.ffmpegVideoFilter,color.filterStages.join(','));
  const result=spawnSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=s=64x64:r=1:d=1','-vf',color.ffmpegVideoFilter,'-frames:v','1','-f','null','-'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
