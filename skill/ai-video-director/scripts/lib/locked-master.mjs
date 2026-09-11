import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,writeFileSync,mkdtempSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {artifact,json,resolveArtifact,invariant,probe,decode,sha256,sameFile} from './media-contract.mjs';
import {checkInformationPlan,checkPresentation} from './editorial-checks.mjs';
import {recordStageEvent} from './iteration-log.mjs';
import {externalProject} from './external-project.mjs';

const ff=args=>execFileSync('ffmpeg',['-v','error','-xerror',...args],{encoding:'utf8',maxBuffer:16e6});
const int=(v,min=0)=>Number.isInteger(v)&&v>=min;
function approved(a,target,base,label) {
  invariant(a?.approvedBy==='user'&&Number.isFinite(Date.parse(a.approvedAt)),`${label}: explicit user approval required`);
  invariant(sameFile(resolveArtifact(a.artifact,base,label),target),`${label}: approval targets another artifact`);
  return artifact(resolveArtifact(a.evidence,base,`${label} message`));
}
export function videoSpec(file) {
  const m=probe(file),v=m.streams.find(s=>s.codec_type==='video');
  invariant(v&&m.streams.filter(s=>s.codec_type==='video').length===1,'One video stream required');
  const [n,d]=v.avg_frame_rate.split('/').map(Number),fps=n/d;
  invariant(Number.isFinite(fps)&&fps>0&&int(Number(v.nb_frames),1),'Counted CFR video required');
  return {width:v.width,height:v.height,fps,durationFrames:Number(v.nb_frames)};
}
export function checkRevision(file,stage) {
  const manifest=path.resolve(file),base=path.dirname(manifest),m=json(manifest);
  externalProject(base);
  invariant(m.outputScope==='locked-master'&&['revision-render','revision-review','deliver'].includes(stage),'Locked master supports revision-render/revision-review/deliver only');
  invariant(m.publicationInScope===false,'Locked revision does not authorize publication; use a separate publish package');
  const master=resolveArtifact(m.master,base,'locked master'),spec=videoSpec(master);
  const planFile=path.resolve(base,m.artifacts?.revisionPlan||'');const p=json(planFile);
  const inputs=[artifact(master),artifact(planFile),approved(m.approvals?.master,master,base,'master'),approved(m.approvals?.change,planFile,base,'change')];
  invariant(p.schemaVersion===1&&p.masterSha256===m.master.sha256,'Plan belongs to another master');
  invariant(typeof p.version==='string'&&p.version.trim()&&typeof m.projectId==='string'&&m.projectId.trim(),'Project and revision version required');
  invariant(p.kind==='visual-only'&&p.audio==='preserve'&&p.timing==='identity','Recut/retime/audio edits require the normal editing route, not locked-master');
  invariant(JSON.stringify(p.outputSpec)===JSON.stringify(spec),'Plan must preserve master canvas, cadence and frames');
  invariant(Array.isArray(p.changes)&&p.changes.length,'Explicit change allowlist required');
  const ids=new Set();
  for(const c of p.changes) {
    invariant(c.id&&!ids.has(c.id)&&c.layer&&c.reason,'Unique change id, layer and reason required');ids.add(c.id);
    invariant(int(c.startFrame)&&int(c.endFrame,1)&&c.startFrame<c.endFrame&&c.endFrame<=spec.durationFrames,'Change frame interval invalid');
    const r=c.rect;invariant(r&&['x','y','width','height'].every(k=>int(r[k]))&&r.width>0&&r.height>0&&r.x+r.width<=spec.width&&r.y+r.height<=spec.height,'Allowed change rectangle invalid');
  }
  invariant(Array.isArray(p.inheritedExceptions),'Explicit inherited exception list required (may be empty)');
  for(const e of p.inheritedExceptions) invariant(e.reason&&int(e.startFrame)&&int(e.endFrame,1)&&e.endFrame>e.startFrame&&e.endFrame<=spec.durationFrames,'Invalid inherited exception');
  checkInformationPlan(p.informationPlan);
  checkPresentation(p.presentation,base,{sample:p.sample,dimensions:spec});inputs.push(artifact(resolveArtifact(p.sample,base,'sample')));
  for(const e of Object.values(p.presentation.elements)) if(e.state==='present') inputs.push(artifact(resolveArtifact(e.review.evidence,base)));
  if(p.presentation.cutoutUsed) inputs.push(artifact(resolveArtifact(p.presentation.matteReview.evidence,base)));
  invariant(typeof p.styleChanged==='boolean','Declare whether visual direction changes');
  if(p.styleChanged) {
    inputs.push(approved(m.approvals?.sample,resolveArtifact(p.sample,base),base,'new style sample'));
    const seconds=Number(probe(resolveArtifact(p.sample,base)).format.duration);
    invariant(seconds>=6&&seconds<=12.1,'A new style sample needs 6–12 seconds of complete audiovisual context');
  }
  const job=m.jobs?.['revision-render'];
  invariant(job&&Array.isArray(job.argv)&&job.argv.length&&job.argv.every(s=>typeof s==='string'&&s),'Render argv array required');
  invariant(JSON.stringify(job.outputSpec)===JSON.stringify(spec),'Render specification differs from master');
  invariant(Array.isArray(job.inputs)&&job.inputs.length,'Bind render code/assets/config inputs');
  for(const ref of job.inputs) inputs.push(artifact(resolveArtifact(ref,base,'revision input')));
  invariant(typeof job.outputPath==='string'&&job.outputPath,'New output path required');const output=path.resolve(base,job.outputPath);
  externalProject(output);
  invariant(output!==master&&!inputs.some(ref=>ref.path===output),'Revision cannot overwrite any source/input');
  if(stage==='revision-render') {
    invariant(!existsSync(output),'Output exists; use a new version');
    const capFile=path.resolve(base,m.artifacts.capabilities),cap=json(capFile);inputs.push(artifact(capFile));
    invariant(Array.isArray(job.requiresCapabilities)&&['ffmpeg','ffprobe'].every(k=>job.requiresCapabilities.includes(k)),'Local FFmpeg/ffprobe capabilities required');
    for(const name of job.requiresCapabilities) {
      const c=cap.checks?.find(x=>x.name===name),age=Date.now()-Date.parse(c?.checkedAt);
      invariant(c?.status==='pass'&&c.version&&c.method&&age>=-60000&&age<=86400000,`Capability not verified: ${name}`);
      inputs.push(artifact(resolveArtifact(c.evidence,path.dirname(capFile),name)));
    }
  } else {
    const receiptFile=path.resolve(base,m.artifacts.revisionRenderReceipt||'');const r=json(receiptFile);
    invariant(r.stage==='revision-render'&&r.fullDecodePassed===true,'Revision render receipt required');
    invariant(JSON.stringify(r.job)===JSON.stringify(job),'Revision render job changed since render');
    invariant(sameFile(resolveArtifact(r.output,path.dirname(receiptFile)),output),'Receipt targets another output');
    invariant(JSON.stringify(r.outputSpec)===JSON.stringify(spec),'Receipt specification changed');
    for(const ref of r.inputs) resolveArtifact(ref,path.dirname(receiptFile),'render dependency');
    for(const ref of inputs) invariant(r.inputs.some(x=>x.path===ref.path&&x.sha256===ref.sha256),'Revision dependency changed since render');
    invariant(JSON.stringify(videoSpec(output))===JSON.stringify(spec),'Output differs from master specification');
    inputs.push(artifact(receiptFile));
    if(stage==='deliver') {
      inputs.push(approved(m.approvals?.release,output,base,'release'));
      const qFile=path.resolve(base,m.artifacts.revisionQa||''),q=json(qFile);
      invariant(q.ok===true&&q.master.sha256===m.master.sha256&&q.plan.sha256===sha256(planFile)&&q.output.sha256===sha256(output),'Revision QA is stale or failed');
      invariant(q.fullDecodePassed===true&&q.timestampsContinuous===true&&q.audioSamplesIdentical===true&&q.unchangedPixels?.frames===spec.durationFrames&&q.unchangedPixels.minSsim>=0.995,'Revision technical checks incomplete');
      resolveArtifact(q.unchangedPixels.stats,base,'unchanged-region statistics');
      resolveArtifact(q.output,base);resolveArtifact(q.plan,base);resolveArtifact(q.master,base);
      const reviewFile=path.resolve(base,m.artifacts.revisionVisualReview||''),review=json(reviewFile);
      invariant(review.outputSha256===q.output.sha256&&review.normalSpeedMotion===true&&review.method,'Actual final motion review required');
      invariant(Array.isArray(review.changes)&&review.changes.length===p.changes.length&&new Set(review.changes.map(x=>x.id)).size===p.changes.length,'Review each changed window exactly once');
      for(const c of p.changes) {
        const r=review.changes.find(x=>x.id===c.id);invariant(r?.status==='pass'&&r.observation,'Unreviewed changed window');
        resolveArtifact(r.evidence,base,'actual final visual evidence');
      }
      for(const key of ['editableProject','captions','learningLedger']) inputs.push(artifact(resolveArtifact(m.supporting?.[key],base,key)));
      decode(output);
    }
  }
  return {ok:true,stage,scope:'locked-master',manifest,projectId:m.projectId,m,base,p,planFile,master,output,spec,inputs};
}

function cfr(file,spec) {
  const rows=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file],{encoding:'utf8',maxBuffer:64e6})).frames;
  invariant(rows.length===spec.durationFrames&&rows.every((r,i)=>Math.abs(Number(r.best_effort_timestamp_time)-i/spec.fps)<1e-5),'Noncontinuous CFR presentation timestamps');
}
export function verifyRevision(c) {
  const {master,output,p,spec,planFile}=c;decode(output);cfr(master,spec);cfr(output,spec);
  invariant(JSON.stringify(videoSpec(output))===JSON.stringify(spec),'Final output specification mismatch');
  const audio=f=>ff(['-i',f,'-map','0:a:0','-c:a','pcm_f32le','-f','hash','-hash','sha256','-']).trim();
  const a=probe(master).streams.filter(x=>x.codec_type==='audio'),b=probe(output).streams.filter(x=>x.codec_type==='audio');
  invariant(a.length===1&&b.length===1&&a[0].sample_rate===b[0].sample_rate&&a[0].channels===b[0].channels,'Preserve one original audio stream');
  invariant(['start_time','duration'].every(k=>Number.isFinite(Number(a[0][k]))&&Math.abs(Number(a[0][k])-Number(b[0][k]))<1/Number(a[0].sample_rate)),'Locked audio timing changed');
  invariant(audio(master)===audio(output),'Locked audio samples changed');
  const dir=mkdtempSync(path.join(path.dirname(output),'revision-qa-')),stats=path.join(dir,'ssim.log');
  // Mask only explicitly authorized pixels in both images, not an entire time window.
  const masks=p.changes.map(c=>`drawbox=x=${c.rect.x}:y=${c.rect.y}:w=${c.rect.width}:h=${c.rect.height}:color=black:t=fill:enable='gte(n,${c.startFrame})*lt(n,${c.endFrame})'`).join(',');
  ff(['-threads','2','-i',master,'-threads','2','-i',output,'-filter_complex_threads','1','-filter_complex',`[0:v]${masks}[a];[1:v]${masks}[b];[a][b]ssim=stats_file=${stats}[v]`,'-map','[v]','-an','-f','null','-']);
  const values=readFileSync(stats,'utf8').trim().split('\n').map(x=>Number(x.match(/All:([\d.]+)/)?.[1]));
  invariant(values.length===spec.durationFrames&&values.every(Number.isFinite),'Incomplete invariant pixel comparison');
  const minimum=values.reduce((a,b)=>Math.min(a,b),1);invariant(minimum>=0.995,`Pixels outside authorized region changed: minimum SSIM ${minimum}`);
  return {schemaVersion:1,ok:true,master:artifact(master),plan:artifact(planFile),output:artifact(output),fullDecodePassed:true,timestampsContinuous:true,audioSamplesIdentical:true,
    unchangedPixels:{frames:values.length,minSsim:minimum,meanSsim:values.reduce((x,y)=>x+y,0)/values.length,stats:artifact(stats)},
    reviewStatus:'technical-only-awaiting-actual-motion-review-and-user-approval',independentAuditoryReview:false};
}
export function runRevision(c) {
  if(c.stage==='deliver') {
    const iteration=recordStageEvent(c,'approval','pass',resolveArtifact(c.m.approvals.release.evidence,c.base));
    return {...c,m:undefined,p:undefined,base:undefined,iteration};
  }
  if(c.stage==='revision-review') {
    const file=externalProject(path.resolve(c.base,c.m.artifacts.revisionQa));invariant(!existsSync(file),'QA exists; preserve it and select a new QA path');
    const startedAt=new Date().toISOString(),qa={...verifyRevision(c),startedAt,completedAt:new Date().toISOString()};writeFileSync(file,JSON.stringify(qa,null,2)+'\n',{flag:'wx'});
    return {ok:true,stage:c.stage,qa:file,iteration:recordStageEvent(c,'qa','pass',file)};
  }
  const startedAt=new Date().toISOString(),manifestHash=sha256(c.manifest),job=c.m.jobs['revision-render'];
  const r=spawnSync(job.argv[0],job.argv.slice(1),{cwd:c.base,stdio:'inherit',shell:false});
  invariant(r.status===0,`Revision render failed: ${r.error||r.status}`);invariant(sha256(c.manifest)===manifestHash,'Manifest changed during render');
  for(const ref of c.inputs) resolveArtifact(ref,c.base,'render dependency');
  decode(c.output);invariant(JSON.stringify(videoSpec(c.output))===JSON.stringify(c.spec),'Rendered specification mismatch');
  const receipt={schemaVersion:1,stage:'revision-render',projectId:c.projectId,job,inputs:c.inputs,output:artifact(c.output),outputSpec:c.spec,startedAt,completedAt:new Date().toISOString(),fullDecodePassed:true};
  writeFileSync(c.output+'.stage.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  return {ok:true,stage:c.stage,output:c.output,receipt:c.output+'.stage.json',iteration:recordStageEvent(c,'render','pass',c.output+'.stage.json'),next:'revision-review; no automatic creator approval'};
}
