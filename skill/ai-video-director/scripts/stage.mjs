#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,json,resolveArtifact,verifyRenderReceipt,decode,probe,invariant,sha256} from './lib/media-contract.mjs';
import {sameFile,finite} from './lib/media-contract.mjs';

const scripts = path.dirname(fileURLToPath(import.meta.url));
function audit(script,args) {
  const result = spawnSync(process.execPath,[path.join(scripts,script),...args],{encoding:'utf8'});
  invariant(result.status === 0,`${script} failed: ${result.stdout || result.stderr || result.error}`);
  return JSON.parse(result.stdout);
}
function approval(value, expected, base, label) {
  invariant(value?.approvedBy === 'user' && Number.isFinite(Date.parse(value.approvedAt)),`${label}: user approval with timestamp required`);
  const target = resolveArtifact(value.artifact,base,`${label} approved artifact`);
  invariant(sameFile(target,expected),`${label}: approval targets another artifact`);
  resolveArtifact(value.evidence,base,`${label} user message evidence`);
}
function outputSpec(spec, media) {
  invariant(spec && typeof spec==='object','Job outputSpec required');
  for(const key of ['width','height','durationFrames']) invariant(Number.isInteger(spec[key]) && spec[key]>0,`outputSpec.${key} must be a positive integer`);
  finite(spec.fps,'outputSpec.fps',0.001,240);
  if(!media) return;
  const video=media.streams.find(s=>s.codec_type==='video');
  const [n,d]=String(video?.avg_frame_rate || '0/1').split('/').map(Number);
  invariant(video && video.width===spec.width && video.height===spec.height,'Rendered resolution differs from approved outputSpec');
  invariant(Math.abs(n/d-spec.fps)<0.001 && Number(video.nb_frames)===spec.durationFrames,'Rendered timebase/frame count differs from outputSpec');
  invariant(Math.abs(Number(media.format.duration)-spec.durationFrames/spec.fps)<Math.max(0.1,2/spec.fps),'Rendered duration differs from outputSpec');
}
export function checkStage(manifestFile,stage) {
  invariant(['rough-render','fine-render','deliver'].includes(stage),'Unknown stage');
  const file=path.resolve(manifestFile),base=path.dirname(file),m=json(file);
  invariant(m.schemaVersion === 1 && typeof m.projectId === 'string' && m.projectId,'Invalid pipeline manifest');
  invariant(['rough-cut','full-edit'].includes(m.outputScope),'outputScope must be rough-cut or full-edit');
  invariant(!(m.outputScope==='rough-cut' && stage==='fine-render'),'Fine render is outside the rough-cut-only scope');
  const locate = (key)=> {
    invariant(typeof m.artifacts?.[key] === 'string',`Missing artifacts.${key}`);
    return path.resolve(base,m.artifacts[key]);
  };
  const brief=locate('contentBrief');
  audit('audit-director-brief.mjs',[brief,'--language',m.language]);
  approval(m.approvals?.content,brief,base,'content');
  const inputs=[artifact(brief),artifact(resolveArtifact(m.approvals.content.evidence,base))];
  let bound;
  if(stage !== 'rough-render') {
    const rough=locate('roughReview');
    audit('audit-rough-cut-review.mjs',[rough]);
    const review=json(rough);
    approval(m.approvals?.rough,rough,base,'rough');
    bound=verifyRenderReceipt(review.evidenceBinding.renderReceipt,path.dirname(rough));
    inputs.push(artifact(rough),artifact(bound.file),artifact(bound.edlPath),artifact(bound.program),artifact(resolveArtifact(m.approvals.rough.evidence,base)));
    if (!(stage === 'deliver' && m.outputScope === 'rough-cut')) {
    const direction=locate('fineDirection');
    audit('audit-fine-edit-direction.mjs',[direction]);
    approval(m.approvals?.style,direction,base,'style');
    inputs.push(artifact(direction),artifact(resolveArtifact(m.approvals.style.evidence,base)));
    const directionData=json(direction);
    invariant(directionData.evidenceBinding.roughRenderReceipt.sha256 === artifact(bound.file).sha256,'Style sample is based on another rough render');
    for(const ref of [directionData.evidenceBinding.sample,...directionData.evidenceBinding.dependencies]) {
      inputs.push(artifact(resolveArtifact(ref,path.dirname(direction),'style dependency')));
    }
    }
  }
  if(stage === 'deliver' && m.outputScope === 'rough-cut') {
    for(const key of ['editableProject','captions']) inputs.push(artifact(resolveArtifact(m.roughDelivery?.[key],base,`roughDelivery.${key}`)));
    decode(bound.program);
    return {ok:true,stage,scope:'rough-cut',projectId:m.projectId,manifest:file,inputs,
      delivered:{aroll:bound.program,edl:bound.edlPath,editableProject:m.roughDelivery.editableProject,captions:m.roughDelivery.captions},m,base};
  }
  if(stage === 'deliver') {
    const delivery=locate('deliveryManifest');
    audit('audit-delivery-manifest.mjs',[delivery]);
    const d=json(delivery);
    invariant(d.publicationInScope===m.publicationInScope,'Publication scope differs between pipeline and delivery manifest');
    const master=d.releaseMaster.absolutePath;
    invariant(sha256(master) === d.releaseMaster.sha256,'Delivery master hash mismatch');
    invariant(d.releaseMaster.exactCandidateApprovedByUser === true,'Exact final candidate needs approval');
    approval(m.approvals?.release,path.resolve(master),base,'release');
    invariant(sameFile(d.roughCut.canonicalEdlAbsolutePath,bound.edlPath) && sameFile(d.roughCut.lockedArollAbsolutePath,bound.program),'Delivery rough cut differs from approved program');
    const receiptFile=locate('fineRenderReceipt');
    const receipt=json(receiptFile);
    invariant(receipt.stage === 'fine-render' && receipt.fullDecodePassed === true,'Fine render receipt required');
    invariant(JSON.stringify(receipt.outputSpec)===JSON.stringify(m.jobs?.['fine-render']?.outputSpec),'Output specification changed after final render');
    outputSpec(receipt.outputSpec,probe(master));
    invariant(sameFile(resolveArtifact(receipt.output,path.dirname(receiptFile)),master),'Fine render receipt targets another master');
    for(const ref of receipt.inputs || []) resolveArtifact(ref,path.dirname(receiptFile),'fine render dependency');
    invariant(receipt.inputs?.length > 0,'Fine render dependency bindings required');
    // Approved rough/style must be the same dependencies used by the final render.
    for(const ref of inputs) invariant(receipt.inputs.some(x=>x.path===ref.path && x.sha256===ref.sha256),'Final render used an older approval/input');
    if(m.publicationInScope === true) audit('audit-publish-package.mjs',[d.supportingArtifacts.publicationPackageAbsolutePath]);
    audit('audit-learning-scope-ledger.mjs',[d.supportingArtifacts.learningScopeLedgerAbsolutePath]);
    decode(master);
    inputs.push(artifact(delivery),artifact(master),artifact(receiptFile));
  } else {
    const job=m.jobs?.[stage];
    outputSpec(job?.outputSpec);
    invariant(job && Array.isArray(job.argv) && job.argv.length && job.argv.every(x=>typeof x==='string' && x),'Stage job argv required');
    invariant(Array.isArray(job.inputs) && job.inputs.length > 0,'Stage job must bind source/config/code dependencies');
    for(const ref of job.inputs) inputs.push(artifact(resolveArtifact(ref,base,'job input')));
    const capabilityFile=locate('capabilities');
    audit('director.mjs',['doctor','--stage',stage==='rough-render'?'rough':'fine','--capabilities',capabilityFile]);
    const capabilities=json(capabilityFile);
    invariant(capabilities.schemaVersion===1 && Array.isArray(capabilities.checks),'Capability checks required');
    invariant(Array.isArray(job.requiresCapabilities) && job.requiresCapabilities.length,'Job must declare required capabilities');
    for(const name of job.requiresCapabilities) {
      const c=capabilities.checks.find(x=>x.name===name);
      invariant(c?.status==='pass' && c.method && c.version && Number.isFinite(Date.parse(c.checkedAt)),`Capability not verified: ${name}`);
      const age=Date.now()-Date.parse(c.checkedAt);
      invariant(age>=-60000 && age<=24*60*60*1000,`Capability receipt expired: ${name}`);
      inputs.push(artifact(resolveArtifact(c.evidence,path.dirname(capabilityFile),`capability ${name}`)));
    }
    inputs.push(artifact(capabilityFile));
    invariant(typeof job.outputPath==='string','Job outputPath required');
    invariant(!existsSync(path.resolve(base,job.outputPath)),'Stage output exists; use a new version');
  }
  return {ok:true,stage,projectId:m.projectId,manifest:file,inputs,m,base};
}
export function runStage(file,stage) {
  const checked=checkStage(file,stage);
  if(stage==='deliver') return {...checked,m:undefined,base:undefined};
  const {m,base,inputs}=checked,job=m.jobs[stage];
  const output=path.resolve(base,job.outputPath);
  const startedAt=new Date().toISOString();
  const manifestHash=sha256(checked.manifest);
  const result=spawnSync(job.argv[0],job.argv.slice(1),{cwd:base,stdio:'inherit',shell:false});
  invariant(result.status===0,`Stage command failed (${result.status}): ${result.error || ''}`);
  invariant(sha256(checked.manifest)===manifestHash,'Pipeline changed while rendering');
  for(const ref of inputs) resolveArtifact(ref,base,'render dependency');
  decode(output);
  const media=probe(output);
  invariant(media.streams.some(s=>s.codec_type==='video') && media.streams.some(s=>s.codec_type==='audio'),'Stage output must contain video and audio');
  outputSpec(job.outputSpec,media);
  const receipt={schemaVersion:1,stage,projectId:m.projectId,startedAt,completedAt:new Date().toISOString(),
    inputs,output:artifact(output),outputSpec:job.outputSpec,argv:job.argv,fullDecodePassed:true,media};
  writeFileSync(`${output}.stage.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  return {ok:true,stage,output,receipt:`${output}.stage.json`};
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [command,file,stage]=process.argv.slice(2);
    invariant(['check','run'].includes(command) && file && stage,'Usage: stage.mjs <check|run> <pipeline.json> <rough-render|fine-render|deliver>');
    const result=command==='run'?runStage(file,stage):checkStage(file,stage);
    console.log(JSON.stringify({...result,m:undefined,base:undefined},null,2));
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
