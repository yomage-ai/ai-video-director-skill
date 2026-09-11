import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,symlinkSync,existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {artifact,json} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {checkStage,runStage} from '../skill/ai-video-director/scripts/stage.mjs';
import {verifyRevision,videoSpec} from '../skill/ai-video-director/scripts/lib/locked-master.mjs';
import {rebaseLayers} from '../skill/ai-video-director/scripts/lib/frame-map.mjs';
import {checkInformationPlan,checkPresentation,checkInteriorReview} from '../skill/ai-video-director/scripts/lib/editorial-checks.mjs';
import {appendIteration} from '../skill/ai-video-director/scripts/lib/iteration-log.mjs';
import {joinPrefix} from '../skill/ai-video-director/scripts/join-rendered-prefix.mjs';
import {externalProject} from '../skill/ai-video-director/scripts/lib/external-project.mjs';
const write=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2));
const ff=args=>execFileSync('ffmpeg',['-v','error','-n',...args]);
const approval=(f,e)=>({approvedBy:'user',approvedAt:new Date().toISOString(),artifact:artifact(f),evidence:artifact(e)});
const informationPlan={schemaVersion:1,claims:[{id:'one',viewerBenefit:'Synthetic example only',occurrences:[{role:'primary',sourceId:'master',locator:'frames 0–90',speaker:'screen-explanation'}]}]};
function fixture() {
  const dir=mkdtempSync(path.join(os.tmpdir(),'director-locked-test-')),master=path.join(dir,'master.mp4'),sample=path.join(dir,'sample.mp4'),message=path.join(dir,'synthetic.txt');
  writeFileSync(message,'SYNTHETIC TEST ONLY. Gate regression; not real user approval, listening or visual quality evidence.');
  ff(['-f','lavfi','-i','color=gray:s=160x90:r=30:d=3','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=3','-c:v','libx264','-g','30','-bf','0','-pix_fmt','yuv420p','-c:a','aac','-shortest',master]);
  ff(['-i',master,'-c','copy',sample]);
  const presentation={schemaVersion:1,preset:'xiaoxiong-landscape-screen-v1',orientation:'landscape',portraitSafeCoordinatesApplied:false,
    captions:{surface:'transparent',align:'center',layer:'topmost'},progress:{edge:'top'},cutoutUsed:false,
    elements:Object.fromEntries(['captions','progress','presenter','screen','graphics','audio'].map(k=>[k,{state:['presenter','graphics'].includes(k)?'absent':'present',reason:'Synthetic validator fixture',review:{normalSpeed:true,method:'Synthetic attestation only',observation:'Not a real perceptual claim',sampleSha256:artifact(sample).sha256,evidence:artifact(message)}}])),
    screenRuns:[{role:'primary',sourceId:'master',locator:'frames 0–90',loop:false,format:'video',muted:false}]};
  const output=path.join(dir,'candidate.mp4'),plan=path.join(dir,'revision-plan.json'),caps=path.join(dir,'capabilities.json'),file=path.join(dir,'pipeline.json');
  const p={schemaVersion:1,version:'v2',masterSha256:artifact(master).sha256,kind:'visual-only',audio:'preserve',timing:'identity',outputSpec:videoSpec(master),
    changes:[{id:'mark',layer:'graphics',reason:'Synthetic authorized region',startFrame:0,endFrame:30,rect:{x:0,y:0,width:40,height:40}}],inheritedExceptions:[],styleChanged:false,sample:artifact(sample),informationPlan:structuredClone(informationPlan),presentation};
  write(plan,p);write(caps,{schemaVersion:1,checks:['ffmpeg','ffprobe'].map(name=>({name,status:'pass',version:'synthetic',method:'Gate fixture',checkedAt:new Date().toISOString(),evidence:artifact(message)}))});
  const m={schemaVersion:1,projectId:'synthetic-revision',outputScope:'locked-master',publicationInScope:false,master:artifact(master),recovery:{schemaVersion:1,blockers:[]},
    artifacts:{revisionPlan:plan,capabilities:caps,revisionRenderReceipt:output+'.stage.json',revisionQa:path.join(dir,'qa.json'),revisionVisualReview:path.join(dir,'review.json')},approvals:{master:approval(master,message),change:approval(plan,message)},supporting:{},
    jobs:{'revision-render':{argv:['ffmpeg','-v','error','-n','-i',master,'-c','copy',output],inputs:[artifact(master)],outputPath:output,outputSpec:p.outputSpec,requiresCapabilities:['ffmpeg','ffprobe'],renderKind:'full'}}};
  write(file,m);return {dir,master,output,message,sample,plan,p,m,file,save(){write(plan,p);m.approvals.change=approval(plan,message);write(file,m);}};
}
test('locked master preserves output and audio, requires exact final review and approval, and records current version',()=>{
  const f=fixture();runStage(f.file,'revision-render');assert.throws(()=>runStage(f.file,'revision-render'),/Output exists/);
  assert.equal(runStage(f.file,'revision-review').ok,true);
  assert.throws(()=>checkStage(f.file,'deliver'),/release/);
  const ledger=path.join(f.dir,'learning.json');write(ledger,{schemaVersion:1,projectId:f.m.projectId,entries:[],reviewedNoNewLearning:true,noNewLearningReason:'Anonymous regression only; no real-world lesson.'});
  Object.assign(f.m.supporting,{editableProject:artifact(f.plan),captions:artifact(f.message),learningLedger:artifact(ledger)});
  f.m.approvals.release=approval(f.output,f.message);write(f.m.artifacts.revisionVisualReview,{outputSha256:artifact(f.output).sha256,normalSpeedMotion:true,method:'Synthetic fixture only',changes:[{id:'mark',status:'pass',observation:'Synthetic validation',evidence:artifact(f.message)}]});write(f.file,f.m);
  runStage(f.file,'deliver');runStage(f.file,'deliver');
  const summary=json(path.join(f.dir,'analysis/iteration-summary.json'));assert.equal(summary.currentVersion,'v2');assert.equal(summary.creatorAccepted,true);assert.equal(summary.eventCount,5);assert.ok(summary.measuredSeconds.tool>0);
  f.p.changes[0].reason='Later edit';f.save();assert.throws(()=>checkStage(f.file,'deliver'),/stale|changed/);
});
test('locked revision rejects missing approval, retiming, unrelated recovery and incomplete samples',()=>{
  const f=fixture();f.m.approvals.master=null;f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/master: explicit/);
  f.m.approvals.master=approval(f.master,f.message);f.p.timing='reorder';f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/Recut/);
  f.p.timing='identity';f.p.presentation.progress.edge='bottom';f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/top/);
  f.p.presentation.progress.edge='top';f.p.presentation.screenRuns[0].loop=true;f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/loop/);
  f.p.presentation.screenRuns[0].loop=false;f.p.presentation.elements.captions.review.normalSpeed=false;f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/dynamic/);
  f.p.presentation.elements.captions.review.normalSpeed=true;f.p.styleChanged=true;f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/new style sample/);
  f.p.styleChanged=false;f.m.recovery.blockers=[{id:'blocked',kind:'permission',provider:'selected',detail:'Denied',status:'pending'}];f.save();assert.throws(()=>checkStage(f.file,'revision-render'),/Recovery blocked/);
});
test('real pixel/audio comparison rejects changes outside allowlist and changed audio',()=>{
  const f=fixture(),outside=path.join(f.dir,'outside.mp4'),audio=path.join(f.dir,'audio.mp4');
  ff(['-i',f.master,'-vf','drawbox=color=white:t=fill','-c:v','libx264','-c:a','copy',outside]);
  assert.throws(()=>verifyRevision({...f,output:outside,spec:f.p.outputSpec,planFile:f.plan}),/Pixels outside/);
  ff(['-i',f.master,'-af','volume=0.5','-c:v','copy','-c:a','aac',audio]);
  assert.throws(()=>verifyRevision({...f,output:audio,spec:f.p.outputSpec,planFile:f.plan}),/audio/);
});
test('one frame map rebases reordered 5x sections, splitting all overlay intervals and rejecting stale data',()=>{
  const map={schemaVersion:1,sourceVersion:'v1',sourceFps:30,outputFps:30,sourceFrames:300,durationFrames:140,segments:[
    {id:'second',sourceStartFrame:100,sourceEndFrame:300,startFrame:0,endFrame:40,rate:5},
    {id:'first',sourceStartFrame:0,sourceEndFrame:100,startFrame:40,endFrame:140,rate:1}]};
  const layers={sourceVersion:'v1',items:['caption','progress','callout','presenter','sfx'].map(layer=>({id:layer,layer,startFrame:90,endFrame:150}))};
  const r=rebaseLayers(map,layers);assert.equal(r.items.length,10);assert.deepEqual(r.items.filter(x=>x.layer==='caption').map(x=>[x.startFrame,x.endFrame]),[[0,10],[130,140]]);
  layers.sourceVersion='old';assert.throws(()=>rebaseLayers(map,layers),/version differs/);
  map.segments[0].startFrame=1;assert.throws(()=>rebaseLayers(map,layers),/contiguous/);
});
test('information, matte and retained interiors require coverage and version-bound observations',()=>{
  const f=fixture(),p=structuredClone(informationPlan);p.claims[0].occurrences.push(p.claims[0].occurrences[0]);assert.throws(()=>checkInformationPlan(p),/one primary/);
  f.p.presentation.cutoutUsed=true;assert.throws(()=>checkPresentation(f.p.presentation,f.dir),/presenter/);
  f.p.presentation.elements.presenter.state='present';assert.throws(()=>checkPresentation(f.p.presentation,f.dir),/hair/);
  const edl={segments:[{id:'s',outputStartFrame:0,outputEndFrameExclusive:90}]},r={programSha256:artifact(f.master).sha256,intervals:[{segmentId:'s',startFrame:0,endFrame:90,normalSpeedAudio:true,normalSpeedMotion:true,method:'Synthetic test',observation:'Synthetic only',evidence:artifact(f.message),classes:Object.fromEntries(['restart','mouth-preparation','blink-reset','literal-repeat','semantic-repeat'].map(k=>[k,'clear']))}]};
  checkInteriorReview(r,edl,r.programSha256,f.dir);r.intervals[0].classes['semantic-repeat']='pending';assert.throws(()=>checkInteriorReview(r,edl,r.programSha256,f.dir),/semantic-repeat/);
  r.intervals=[];assert.throws(()=>checkInteriorReview(r,edl,r.programSha256,f.dir),/Every retained/);
});
test('old-version approval never resets current version; unknown time stays null',()=>{
  const f=fixture(),base={schemaVersion:1,projectId:'metrics',evidence:artifact(f.message),artifact:artifact(f.master)};
  appendIteration(f.dir,{...base,id:'render2',version:'v2',type:'render',renderKind:'partial',result:'pass',occurredAt:'2026-01-01T00:00:00Z'});
  const r=appendIteration(f.dir,{...base,id:'old-approval',version:'v1',type:'approval',approvedBy:'user',occurredAt:'2026-01-01T00:00:01Z'});
  assert.equal(r.summary.currentVersion,'v2');assert.equal(r.summary.creatorAccepted,false);assert.equal(r.summary.measuredSeconds.agent,null);
});
test('keyframe tail reuse keeps bitstream and audio; incompatible cut fails',()=>{
  const f=fixture(),prefix=path.join(f.dir,'prefix.mp4'),bad=path.join(f.dir,'bad.mp4');
  ff(['-i',f.master,'-frames:v','30','-an','-c:v','copy',prefix]);
  const r=joinPrefix(f.master,prefix,path.join(f.dir,'reused.mp4'));assert.equal(r.reusedFrames,60);assert.equal(r.tailBitstreamIdentical,true);
  ff(['-i',f.master,'-frames:v','29','-an','-c:v','copy',bad]);assert.throws(()=>joinPrefix(f.master,bad,path.join(f.dir,'invalid.mp4')),/keyframe/);
});
test('initializer leaves approval pending and rejects repository paths through symlinks',()=>{
  const f=fixture(),out=path.join(f.dir,'new-version');
  const script=new URL('../skill/ai-video-director/scripts/prepare-locked-revision.mjs',import.meta.url);
  execFileSync(process.execPath,[script.pathname,f.master,out,'v3']);
  const m=json(path.join(out,'pipeline.json'));assert.equal(m.approvals.master,null);assert.equal(m.master.sha256,artifact(f.master).sha256);
  assert.throws(()=>checkStage(path.join(out,'pipeline.json'),'revision-render'),/explicit user approval/);
  const link=path.join(f.dir,'repo-link');symlinkSync(new URL('../',import.meta.url).pathname,link,'dir');
  assert.throws(()=>externalProject(path.join(link,'private-new')),/outside/);assert.equal(existsSync(path.join(link,'private-new')),false);
});
test('authorized graphic change passes masked comparison without changing original sound',()=>{
  const f=fixture(),out=path.join(f.dir,'graphic.mp4');
  ff(['-i',f.master,'-vf',"drawbox=x=0:y=0:w=32:h=32:color=white:t=fill:enable='lt(n,30)'",'-c:v','libx264','-crf','12','-c:a','copy',out]);
  assert.equal(verifyRevision({...f,output:out,spec:f.p.outputSpec,planFile:f.plan}).ok,true);
});
