import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync,symlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,json,sha256,sameFile} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {checkStage,runStage} from '../skill/ai-video-director/scripts/stage.mjs';
import {bindRoughReview,bindFineDirection,run} from './fixtures/media-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const templates=path.join(root,'skill/ai-video-director/assets/templates');
const write=(file,data)=>writeFileSync(file,JSON.stringify(data,null,2));
const approval=(file,evidence)=>({approvedBy:'user',approvedAt:new Date().toISOString(),artifact:artifact(file),evidence:artifact(evidence)});

test('installed directory symlink executes stage CLI and fails closed like the real path',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'director-installed-cli-'));
  const installed=path.join(dir,'installed-skill');
  symlinkSync(path.join(root,'skill','ai-video-director'),installed,process.platform==='win32'?'junction':'dir');
  const file=path.join(dir,'unapproved.json');
  const manifest=json(path.join(templates,'pipeline.template.json'));
  write(file,manifest);
  const invoke=script=>spawnSync(process.execPath,[script,'check',file,'rough-render'],{encoding:'utf8'});
  const direct=invoke(path.join(root,'skill','ai-video-director','scripts','stage.mjs'));
  const linked=invoke(path.join(installed,'scripts','stage.mjs'));
  assert.equal(direct.status,1);
  assert.equal(linked.status,1);
  assert.equal(linked.stderr,direct.stderr);
  assert.ok(linked.stderr.trim().length>0);
});

// Explicitly synthetic approvals and capability attestations test the gate logic only.
// They are never installed as production approvals or claimed as a human listening test.
function project() {
  const dir=mkdtempSync(path.join(os.tmpdir(),'director-stage-'));
  const rough=json(path.join(root,'tests/fixtures/rough-review.json'));
  const f=bindRoughReview(rough);
  const fine=json(path.join(root,'tests/fixtures/fine-direction.json'));
  bindFineDirection(fine,rough.playbackSpeedReview.selectedRate);
  const roughFile=path.join(dir,'rough.json'),fineFile=path.join(dir,'fine.json');
  write(roughFile,rough);write(fineFile,fine);
  const brief=path.join(dir,'brief.md'),message=path.join(dir,'synthetic-approval.txt');
  writeFileSync(brief,'# 内容锁定\n本合成测试只说明今日、这周、以后如何组织任务，不构成真实用户视频。\n# 导演判断\n先交代结果，再解释操作，所有批准都是测试夹具。\n# 粗剪方案\n保留完整表达并删除重录。\n# 证据计划\n使用本地测试图和纯音。\n# 暂缓确认的精剪项\n暂缓确认全部视觉和声音风格。\n# 本轮确认\n请确认内容和粗剪方案。');
  writeFileSync(message,'SYNTHETIC TEST ONLY: this is not a real user approval or listening result.');
  const capabilities=path.join(dir,'capabilities.json');
  write(capabilities,{schemaVersion:1,checks:['ffmpeg','ffprobe','chatcut','asr','source-listen','fine-renderer'].map(name=>({
    name,status:'pass',version:'synthetic-gate-fixture',method:'Synthetic attestation for gate testing only',checkedAt:new Date().toISOString(),evidence:artifact(message)}))});
  const m=json(path.join(templates,'pipeline.template.json'));
  Object.assign(m,{projectId:'synthetic-stage-test',language:'zh-CN'});
  Object.assign(m.artifacts,{contentBrief:brief,roughReview:roughFile,fineDirection:fineFile,capabilities});
  for(const [key,file] of Object.entries({content:brief,rough:roughFile,style:fineFile})) m.approvals[key]=approval(file,message);
  for(const stage of ['rough-render','fine-render']) {
    const output=path.join(dir,stage+'.mp4');
    Object.assign(m.jobs[stage],{argv:['ffmpeg','-v','error','-n','-i',f.output,'-c','copy',output],inputs:[artifact(f.output)],outputPath:output,
      outputSpec:{width:160,height:90,fps:30,durationFrames:900}});
  }
  const file=path.join(dir,'pipeline.json');write(file,m);
  return {dir,file,m,f,message,roughFile,fineFile,brief,save:()=>write(file,m)};
}

test('stage preflight blocks missing, stale and mismatched approvals before rendering',()=>{
  const p=project();
  assert.equal(checkStage(p.file,'rough-render').ok,true);
  const prior=p.m.approvals.content;p.m.approvals.content={};p.save();
  assert.throws(()=>checkStage(p.file,'rough-render'),/content: user approval/);
  assert.equal(existsSync(p.m.jobs['rough-render'].outputPath),false);
  p.m.approvals.content=prior;p.save();
  const original=readFileSync(p.brief);writeFileSync(p.brief,Buffer.concat([original,Buffer.from('\n内容有变化。')]));
  assert.throws(()=>checkStage(p.file,'rough-render'),/stale/);writeFileSync(p.brief,original);
  p.m.approvals.style={};p.save();assert.throws(()=>checkStage(p.file,'fine-render'),/style: user approval/);
  p.m.approvals.style=approval(p.fineFile,p.message);
  const fine=json(p.fineFile);bindFineDirection(fine,1);write(p.fineFile,fine);p.m.approvals.style=approval(p.fineFile,p.message);p.save();
  assert.throws(()=>checkStage(p.file,'fine-render'),/another rough render/);
});

test('rough-only scope delivers approved A-roll, edit project and captions without style or final-render gates',()=>{
  const p=project();p.m.outputScope='rough-cut';p.m.approvals.style={};p.m.artifacts.fineDirection=null;
  const captions=path.join(p.dir,'captions.srt');writeFileSync(captions,'1\n00:00:00,000 --> 00:00:01,000\nSynthetic test\n');
  p.m.roughDelivery={editableProject:artifact(p.f.xmlFile),captions:artifact(captions)};p.save();
  const result=runStage(p.file,'deliver');assert.equal(result.scope,'rough-cut');assert.ok(sameFile(result.delivered.aroll,p.f.output));
  assert.throws(()=>checkStage(p.file,'fine-render'),/outside.*scope/);
  writeFileSync(captions,'changed');assert.throws(()=>checkStage(p.file,'deliver'),/stale/);
});

test('stage rejects an actual render at the wrong resolution and does not create a success receipt',()=>{
  const p=project();p.m.jobs['rough-render'].outputSpec.width=320;p.save();
  assert.throws(()=>runStage(p.file,'rough-render'),/resolution differs/);
  assert.equal(existsSync(p.m.jobs['rough-render'].outputPath+'.stage.json'),false);
});

test('fine render and final delivery bind exact output, approval and dependencies end to end',()=>{
  const p=project();const result=runStage(p.file,'fine-render');
  assert.equal(json(result.receipt).fullDecodePassed,true);
  assert.throws(()=>runStage(p.file,'fine-render'),/output exists/);
  const support={};
  for(const name of ['qa.md','captions.srt','storyboard.json','plan.json','rights.json']) {
    const file=path.join(p.dir,name);writeFileSync(file,'Synthetic supporting artifact; not production QA.');support[name]=file;
  }
  const learning=path.join(p.dir,'learning.json');
  write(learning,{schemaVersion:1,projectId:p.m.projectId,entries:[],reviewedNoNewLearning:true,noNewLearningReason:'Synthetic regression test; no creator preference or project lesson to promote.'});
  const d=json(path.join(templates,'delivery-manifest.template.json'));
  Object.assign(d,{projectId:p.m.projectId,status:'ready',publicationInScope:false});
  Object.assign(d.releaseMaster,{absolutePath:result.output,sha256:sha256(result.output),qaReportAbsolutePath:support['qa.md'],exactCandidateApprovedByUser:true});
  Object.assign(d.editableProjects[0],{role:'fine-edit',format:'synthetic-project',absolutePath:p.dir,entryPointAbsolutePath:p.file,
    openOrPreviewCommand:'cat pipeline.json',checkCommand:'node --version',renderCommand:'See synthetic stage receipt argv',verifiedOpenable:true});
  Object.assign(d.roughCut,{fcpXmlAbsolutePath:p.f.xmlFile,canonicalEdlAbsolutePath:p.f.edlFile,lockedArollAbsolutePath:p.f.output});
  Object.assign(d.supportingArtifacts,{captionsAbsolutePath:support['captions.srt'],storyboardAbsolutePath:support['storyboard.json'],directorPlanAbsolutePath:support['plan.json'],rightsManifestAbsolutePath:support['rights.json'],learningScopeLedgerAbsolutePath:learning});
  for(const k of Object.keys(d.deliveryChecks)) d.deliveryChecks[k]=k!=='sharedWorkspaceRequiresDownload';
  const delivery=path.join(p.dir,'delivery.json');write(delivery,d);
  p.m.artifacts.deliveryManifest=delivery;p.m.artifacts.fineRenderReceipt=result.receipt;p.save();
  assert.throws(()=>checkStage(p.file,'deliver'),/release: user approval/);
  p.m.approvals.release=approval(result.output,p.message);p.save();
  assert.equal(runStage(p.file,'deliver').ok,true);
  p.m.jobs['fine-render'].outputSpec.width=320;p.save();
  assert.throws(()=>checkStage(p.file,'deliver'),/specification changed/);
  p.m.jobs['fine-render'].outputSpec.width=160;p.save();
  const fine=json(p.fineFile);fine.contentDirection.primaryViewerJob+=' Updated after rendering.';write(p.fineFile,fine);
  p.m.approvals.style=approval(p.fineFile,p.message);p.save();
  assert.throws(()=>checkStage(p.file,'deliver'),/stale|older approval/);
  const invalidLearning={schemaVersion:1,projectId:'test',entries:[]};write(learning,invalidLearning);
  assert.throws(()=>run('audit-learning-scope-ledger.mjs',[learning]));
});
