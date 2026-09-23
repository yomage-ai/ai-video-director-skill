import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {artifact} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {checkProgramPlan,checkProgramReview,programReviewFrames} from '../skill/ai-video-director/scripts/lib/program-review.mjs';
import {questionCardState} from '../skill/ai-video-director/assets/components/question-card.mjs';
import {checkInformationPlan} from '../skill/ai-video-director/scripts/lib/editorial-checks.mjs';
const write=(f,d)=>writeFileSync(f,JSON.stringify(d));
function fixture(){
 const dir=mkdtempSync(path.join(os.tmpdir(),'avd-program-')),edl=path.join(dir,'edl.json'),planFile=path.join(dir,'plan.json'),reviewFile=path.join(dir,'review.json'),image=path.join(dir,'frame.svg');
 write(edl,{outputFps:30,durationFrames:120});writeFileSync(image,'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="gray"/></svg>');
 const plan={schemaVersion:1,edl:artifact(edl),canvas:{width:160,height:90,fps:30,durationFrames:120},beats:[{id:'question',startFrame:0,endFrame:30,viewerJob:'Understand the question',requiredLayers:['person','card']},{id:'answer',startFrame:30,endFrame:120,viewerJob:'Inspect original evidence',requiredLayers:['screen'],continuousScreen:true}],layers:[{id:'person',kind:'presenter',startFrame:0,endFrame:30,keyframes:[]},{id:'card',kind:'graphics',startFrame:0,endFrame:45,keyframes:[30,40]},{id:'screen',kind:'screen',startFrame:30,endFrame:120,keyframes:[]}],sfx:'off',cues:[]};
 write(planFile,plan);
 const review={schemaVersion:1,phase:'preflight',planSha256:artifact(planFile).sha256,method:'Synthetic geometry validation, no creator acceptance',unresolved:[],frames:programReviewFrames(plan).map(frame=>({frame,status:'clear',observation:'Synthetic fixture only',image:artifact(image),boxes:[{id:'title',x:80,y:4,width:70,height:10}]}))};write(reviewFile,review);
 return {dir,plan,review,planFile,reviewFile,save(){write(planFile,plan);review.planSha256=artifact(planFile).sha256;write(reviewFile,review);},check(){return checkProgramReview(artifact(planFile),artifact(reviewFile),dir);}};
}
test('derived full-program samples include ends, both sides of transitions, extremes and holds',()=>{const f=fixture();try{const frames=programReviewFrames(f.plan);for(const n of [0,1,29,30,31,39,40,41,44,45,46,119])assert.ok(frames.includes(n));assert.equal(f.check().ok,true);}finally{rmSync(f.dir,{recursive:true,force:true});}});
test('rejects omitted late state, stale plan, unresolved collision and off-canvas text',()=>{
 for(const mutate of [f=>f.review.frames.pop(),f=>f.review.planSha256='old',f=>f.review.frames[0].boxes.push({id:'answer-title',x:85,y:5,width:40,height:10}),f=>f.review.frames[0].boxes[0].x=150]){
 const f=fixture();try{mutate(f);write(f.reviewFile,f.review);assert.throws(()=>f.check());}finally{rmSync(f.dir,{recursive:true,force:true});}}
});
test('blocks one-frame presenter intrusion, missing evidence and orphan tail before render',()=>{
 for(const change of [p=>p.layers.push({id:'flash',kind:'presenter',startFrame:50,endFrame:51,keyframes:[]}),p=>p.layers[2].endFrame=119,p=>p.beats[1].endFrame=119,p=>p.beats[1].screenReferences=[{phrase:'click here',sourceLocator:'spoken-source',layerId:'not-displayed'}]]){
 const f=fixture();try{change(f.plan);assert.throws(()=>checkProgramPlan(f.plan,f.dir));}finally{rmSync(f.dir,{recursive:true,force:true});}}
});
test('rejects wrong native render geometry, ghost SFX and duplicated editable composition roots',()=>{
 const f=fixture();try{
 assert.throws(()=>checkProgramPlan(f.plan,f.dir,{outputSpec:{...f.plan.canvas,width:320}}),/width/);
 f.plan.sfx='on';assert.throws(()=>checkProgramPlan(f.plan,f.dir),/Enabled SFX/);f.plan.sfx='off';
 const entry=path.join(f.dir,'index.html');writeFileSync(entry,'<div data-composition-id="main"></div>');f.plan.editableEntry=artifact(entry);assert.ok(checkProgramPlan(f.plan,f.dir));
 writeFileSync(path.join(f.dir,'copy.html'),'<div data-composition-id="main"></div>');assert.throws(()=>checkProgramPlan(f.plan,f.dir),/one composition entry/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('creator sample review cannot be reused as final composite review',()=>{const f=fixture();try{assert.throws(()=>checkProgramReview(artifact(f.planFile),artifact(f.reviewFile),f.dir,{renderRef:artifact(f.planFile)}),/phase/);}finally{rmSync(f.dir,{recursive:true,force:true});}});
test('question card holds through spoken question, docks deterministically and exits on semantic boundary',()=>{
 const p={start:0,readEnd:30,settle:45,end:100,large:{x:50,y:15,width:100,height:50},docked:{x:80,y:2,width:70,height:12}};
 assert.deepEqual(questionCardState({...p,frame:29}).rect,p.large);
 assert.deepEqual(questionCardState({...p,frame:45}).rect,p.docked);
 const middle=questionCardState({...p,frame:38});questionCardState({...p,frame:90});assert.deepEqual(questionCardState({...p,frame:38}),middle);
 assert.equal(questionCardState({...p,frame:100}).visible,false);assert.throws(()=>questionCardState({...p,settle:20,frame:10}));
});
test('a dependent explanation cannot precede the context it names',()=>{
 const claim=(id,dependsOn=[])=>({id,dependsOn,viewerBenefit:'Synthetic context',occurrences:[{role:'primary',speaker:'presenter',sourceId:'s',locator:'source phrase'}]});
 assert.equal(checkInformationPlan({schemaVersion:1,claims:[claim('topic'),claim('questions',['topic'])]}),true);
 assert.throws(()=>checkInformationPlan({schemaVersion:1,claims:[claim('questions',['topic']),claim('topic')]}),/context/);
});
test('actual decoded audio detects an SFX omitted from the exported mix',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'avd-mix-'));const ff=args=>{const r=spawnSync('ffmpeg',['-v','error',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 try{
 const dialogue=path.join(dir,'dialogue.wav'),sfx=path.join(dir,'sfx.wav'),mix=path.join(dir,'mix.wav'),plan=path.join(dir,'plan.json');
 ff(['-f','lavfi','-i','sine=frequency=440:duration=4:sample_rate=48000','-c:a','pcm_s16le',dialogue]);
 ff(['-f','lavfi','-i','sine=frequency=880:duration=0.3:sample_rate=48000','-af','adelay=2000,apad=whole_dur=4','-c:a','pcm_s16le',sfx]);
 ff(['-i',dialogue,'-i',sfx,'-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0','-c:a','pcm_s16le',mix]);
 write(plan,{canvas:{durationFrames:120,fps:30},cues:[{id:'cue',startFrame:60,endFrame:69}]});
 const verify=(master,name)=>spawnSync(process.execPath,['skill/ai-video-director/scripts/verify-program-audio.mjs',plan,master,dialogue,sfx,path.join(dir,name),'1'],{encoding:'utf8'});
 const yes=verify(mix,'yes.json');assert.equal(yes.status,0,yes.stderr);assert.equal(JSON.parse(readFileSync(path.join(dir,'yes.json'))).ok,true);
 const no=verify(dialogue,'no.json');assert.equal(no.status,1);const report=JSON.parse(readFileSync(path.join(dir,'no.json')));assert.equal(report.checks.find(c=>c.id==='cue').status,'fail');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

import {compatibleStyleVersion,styleDigest} from '../skill/ai-video-director/scripts/lib/style-version.mjs';
test('adding a style preserves unchanged approved contracts, but changed style bytes invalidate them',()=>{
 const old={id:'a-v1',color:'green'},b={id:'b-v1',color:'paper'};const library={libraryVersion:2,styles:[old,b],compatibleVersions:{1:{styleDigests:{'a-v1':styleDigest(old)}}}};
 assert.equal(compatibleStyleVersion(library,1,['a-v1']),true);
 assert.equal(compatibleStyleVersion(library,1,['b-v1']),false);
 library.styles[0].color='red';assert.equal(compatibleStyleVersion(library,1,['a-v1']),false);
 assert.equal(compatibleStyleVersion(library,999,['a-v1']),false);
});

test('question recipe requires presenter, full question card hold and an answer docking state',()=>{
 const f=fixture();try{f.plan.questionTreatment='presenter-card-dock';f.plan.beats[0].role='question';f.plan.beats[1].role='answer';
 assert.throws(()=>checkProgramPlan(f.plan,f.dir),/question card/);
 f.plan.layers[1].kind='question';f.plan.beats[0].questionTransition={cardLayerId:'card',settleFrame:40};assert.ok(checkProgramPlan(f.plan,f.dir));
 f.plan.beats[0].questionTransition.settleFrame=45;assert.throws(()=>checkProgramPlan(f.plan,f.dir),/Card must hold/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
