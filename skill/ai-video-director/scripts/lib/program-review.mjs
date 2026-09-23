import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {artifact,json,invariant,resolveArtifact} from './media-contract.mjs';
const text=v=>typeof v==='string'&&v.trim().length>0;
const overlaps=(a,b)=>a.startFrame<b.endFrame&&b.startFrame<a.endFrame;
const covers=(a,b)=>a.startFrame<=b.startFrame&&a.endFrame>=b.endFrame;

// One timebase for content, visual lifetimes and cues. Coordinates remain a
// project decision. Completeness and measured geometry are not perception.
export function checkProgramPlan(plan,base,{edlRef,outputSpec}={}) {
 invariant(plan.schemaVersion===1,'Program plan schema 1 required');
 const edl=json(resolveArtifact(plan.edl,base,'program EDL'));
 if(edlRef)invariant(plan.edl.sha256===edlRef.sha256,'Program plan uses another EDL');
 const {canvas}=plan;
 invariant(canvas&&['width','height','durationFrames'].every(k=>Number.isInteger(canvas[k])&&canvas[k]>0)&&Number.isFinite(canvas.fps)&&canvas.fps>0,'Program canvas required');
 invariant(canvas.fps===edl.outputFps&&canvas.durationFrames===edl.durationFrames,'Program timebase differs from EDL');
 if(outputSpec)for(const k of ['width','height','fps','durationFrames'])invariant(canvas[k]===outputSpec[k],`Program canvas ${k} differs from render`);
 const range=r=>invariant(Number.isInteger(r.startFrame)&&Number.isInteger(r.endFrame)&&r.startFrame>=0&&r.endFrame>r.startFrame&&r.endFrame<=canvas.durationFrames,'Invalid program frame range');
 const ids=new Map();
 for(const l of plan.layers||[]){range(l);invariant(text(l.id)&&!ids.has(l.id)&&text(l.kind),'Unique layer id and kind required');ids.set(l.id,l);
  invariant(Array.isArray(l.keyframes)&&l.keyframes.every(f=>Number.isInteger(f)&&f>=l.startFrame&&f<l.endFrame),'Declare motion extremes and state-change keyframes');
 }
 invariant(Array.isArray(plan.beats)&&plan.beats.length,'Program beats required');
 let end=0;const beatIds=new Set();
 for(const b of plan.beats){range(b);invariant(b.startFrame===end,'Semantic beats must cover the complete program without gaps/overlaps');end=b.endFrame;
  invariant(text(b.id)&&!beatIds.has(b.id)&&text(b.viewerJob),'Unique beat id and viewer job required');beatIds.add(b.id);
  invariant(Array.isArray(b.requiredLayers)&&b.requiredLayers.length,'Each beat needs its visible information owner');
  for(const id of b.requiredLayers)invariant(ids.has(id)&&covers(ids.get(id),b),`Required layer ${id} does not cover beat ${b.id}`);
  if(b.continuousScreen===true){invariant(b.requiredLayers.some(id=>ids.get(id).kind==='screen'),'Continuous answer requires a screen base');
   invariant(![...ids.values()].some(l=>l.kind==='presenter'&&overlaps(l,b)),`Independent presenter interrupts screen answer ${b.id}`);
  }
  for(const r of b.screenReferences||[]){invariant(text(r.phrase)&&text(r.sourceLocator),'Screen-relative phrase requires source context');
   invariant(ids.has(r.layerId)&&covers(ids.get(r.layerId),b),'Referenced operation is not displayed during its explanation');
  }
 }
 invariant(end===canvas.durationFrames,'Program beats omit the tail');
 if(plan.questionTreatment==='presenter-card-dock'){
  const questions=plan.beats.filter(b=>b.role==='question');invariant(questions.length,'Question treatment has no question beats');
  for(const b of questions){
   invariant(b.requiredLayers.some(id=>ids.get(id).kind==='presenter'),'Question must be introduced by the presenter');
   const transition=b.questionTransition,card=ids.get(transition?.cardLayerId),answer=plan.beats[plan.beats.indexOf(b)+1];
   invariant(card?.kind==='question'&&b.requiredLayers.includes(card.id),'Question requires a visible question card');
   invariant(answer?.role==='answer'&&Number.isInteger(transition.settleFrame)&&transition.settleFrame>b.endFrame&&transition.settleFrame<answer.endFrame,'Question must lead into an answer and ordered docking phase');
   invariant(card.endFrame>transition.settleFrame&&card.keyframes.includes(b.endFrame)&&card.keyframes.includes(transition.settleFrame),'Card must hold through question and include docking boundaries');
  }
 }

 const cueIds=new Set();
 for(const c of plan.cues||[]){range(c);invariant(text(c.id)&&!cueIds.has(c.id)&&text(c.reason),'Unique motivated cue required');cueIds.add(c.id);resolveArtifact(c.asset,base,'cue audio');}
 invariant(['on','off'].includes(plan.sfx),'Explicit SFX decision required');
 invariant((plan.sfx==='on')===(cueIds.size>0),'Enabled SFX must have actual cue assets/timing; off cannot contain cues');
 if(plan.editableEntry){const entry=resolveArtifact(plan.editableEntry,base,'editable entry'),dir=path.dirname(entry);
  const roots=readdirSync(dir).filter(f=>f.endsWith('.html')&&/data-composition-id\s*=/.test(readFileSync(path.join(dir,f),'utf8')));
  invariant(roots.length===1&&roots[0]===path.basename(entry),'Editable project must have one composition entry; archive extra roots outside HTML discovery');
 }
 return {edl,canvas,layers:ids};
}

export function programReviewFrames(plan){
 const n=plan.canvas.durationFrames,events=new Set([0,n]);
 for(const r of [...plan.beats,...plan.layers,...(plan.cues||[])]){events.add(r.startFrame);events.add(r.endFrame);for(const f of r.keyframes||[])events.add(f);}
 const ordered=[...events].sort((a,b)=>a-b),frames=new Set();
 for(const f of ordered)for(const offset of [-1,0,1])if(f+offset>=0&&f+offset<n)frames.add(f+offset);
 for(let i=1;i<ordered.length;i++)frames.add(Math.floor((ordered[i-1]+ordered[i])/2));
 return [...frames].sort((a,b)=>a-b);
}

export function checkProgramReview(planRef,reviewRef,base,{edlRef,outputSpec,renderRef}={}){
 const planFile=resolveArtifact(planRef,base,'program plan'),pbase=path.dirname(planFile),plan=json(planFile);
 checkProgramPlan(plan,pbase,{edlRef,outputSpec});
 const reviewFile=resolveArtifact(reviewRef,base,'program review'),rbase=path.dirname(reviewFile),r=json(reviewFile);
 invariant(r.schemaVersion===1&&r.planSha256===planRef.sha256,'Review belongs to another program plan');
 invariant(r.phase===(renderRef?'final':'preflight'),'Wrong program review phase');
 if(renderRef){resolveArtifact(r.render,rbase,'reviewed final master');invariant(r.render.sha256===renderRef.sha256,'Review is not of the actual final master');}
 invariant(text(r.method)&&Array.isArray(r.unresolved)&&r.unresolved.length===0,'Actual review method and resolved defects required');
 const frames=programReviewFrames(plan);
 invariant(r.frames?.length===frames.length,'Review every derived boundary, motion extreme and hold state');
 const inputs=[artifact(planFile),artifact(reviewFile)];
 for(const ref of [plan.edl,plan.editableEntry,...(plan.cues||[]).map(c=>c.asset)].filter(Boolean)) inputs.push(artifact(resolveArtifact(ref,pbase,'program dependency')));
 for(let i=0;i<frames.length;i++){
  const f=r.frames[i];invariant(f.frame===frames[i]&&f.status==='clear'&&text(f.observation),'Program frame missing, out of order or unresolved');
  inputs.push(artifact(resolveArtifact(f.image,rbase,'actual rendered frame')));
  invariant(Array.isArray(f.boxes),'Record measured text/critical-object boxes, or an empty list for a frame without them');
  const boxIds=new Set();
  for(const b of f.boxes){invariant(text(b.id)&&!boxIds.has(b.id)&&[b.x,b.y,b.width,b.height].every(Number.isFinite)&&b.width>0&&b.height>0,'Unique measured box required');boxIds.add(b.id);
   invariant(b.x>=0&&b.y>=0&&b.x+b.width<=plan.canvas.width&&b.y+b.height<=plan.canvas.height,'Readable object lies outside canvas');}
  for(let a=0;a<f.boxes.length;a++)for(let b=a+1;b<f.boxes.length;b++){
   const x=f.boxes[a],y=f.boxes[b],hit=x.x<y.x+y.width&&y.x<x.x+x.width&&x.y<y.y+y.height&&y.y<x.y+x.height;
   if(hit)invariant((f.intentionalOverlaps||[]).some(o=>o.ids?.includes(x.id)&&o.ids?.includes(y.id)&&text(o.reason)),'Unresolved text/critical-object collision');
  }
 }
 if(plan.sfx==='on'&&renderRef){
  invariant(r.audioMix?.status==='verified'&&text(r.audioMix.method),'Enabled cues require final mix verification');
  const file=resolveArtifact(r.audioMix.evidence,rbase,'final mix signal check'),mix=json(file);
  invariant(mix.tool==='verify-program-audio'&&mix.ok===true&&mix.render?.sha256===renderRef.sha256&&mix.plan?.sha256===planRef.sha256,'Mix proof belongs to another render or plan');
  invariant(mix.checks?.length>=3&&mix.checks.every(c=>c.status==='pass'),'Final mix signal checks failed');
  for(const cue of plan.cues)invariant(mix.checks.some(c=>c.id===cue.id&&c.cue===true&&c.cueResidualCorrelation>=.9),'Enabled cue missing from verified final mix');
  inputs.push(artifact(file));for(const ref of [mix.dialogue,mix.sfx].filter(Boolean))inputs.push(artifact(resolveArtifact(ref,path.dirname(file),'verified mix dependency')));
 }
 return {ok:true,frames:frames.length,inputs,limits:'Artifact, timeline and supplied measurement checks; Agent must inspect actual content. No independent listening claim.'};
}
