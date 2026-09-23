import {readFileSync} from 'node:fs';
import path from 'node:path';
import {checkSpeechBoundaries} from './speech-boundaries.mjs';
import {invariant,resolveArtifact,joins} from './media-contract.mjs';
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const done=v=>['clear','repaired','intentional'].includes(v);

// Checks completeness and version binding, not subjective listening quality.
export function checkPauseLedger(ref,bound,base,{version}={}){
 const file=resolveArtifact(ref,base,'pause ledger');
 const ledger=JSON.parse(readFileSync(file,'utf8'));
 invariant([1,2,3].includes(ledger.schemaVersion),'Pause ledger schema 1, 2 or 3 required');
 if(version>=2)invariant(ledger.schemaVersion>=version,'New review requires the requested source-boundary contract');
 invariant(ledger.programSha256===bound.receipt.output.sha256&&ledger.edlSha256===bound.receipt.edl.sha256,'Pause ledger belongs to another rendered version');
 for(const k of ['speechBoundaryMethod','noiseAwareMethod','wordTimingAnomalyMethod'])invariant(nonempty(ledger[k]),`Pause ledger ${k} required; silence detection alone is insufficient`);
 resolveArtifact(ledger.evidence,base,'pause measurement evidence');
 let sourceBounds;
 if(ledger.schemaVersion===3){const f=resolveArtifact(ledger.sourceBoundaryEvidence,base,'source speech evidence');sourceBounds=checkSpeechBoundaries(JSON.parse(readFileSync(f,'utf8')),bound,path.dirname(f));}
 const expected=joins(bound.edl);
 invariant(ledger.joins?.length===expected.length,'Measure the speech gap across every join');
 for(let i=0;i<expected.length;i++){
  const r=ledger.joins[i],b=expected[i];
  invariant(r.boundaryId===b.boundaryId&&r.timelineFrame===b.timelineFrame,'Pause join differs from canonical EDL');
  invariant(Number.isFinite(r.gapSeconds)&&r.gapSeconds>=0,'Measured speech-to-speech gap required, including outgoing tail and incoming lead-in');
  if(ledger.schemaVersion>=2){
   const cut=b.timelineFrame/bound.edl.outputFps,left=bound.edl.segments[i].outputStartFrame/bound.edl.outputFps,right=bound.edl.segments[i+1].outputEndFrameExclusive/bound.edl.outputFps;
   invariant(Number.isFinite(r.outgoingSpeechEndSeconds)&&r.outgoingSpeechEndSeconds>=left&&r.outgoingSpeechEndSeconds<=cut,'Outgoing speech edge must lie inside its retained interval');
   invariant(Number.isFinite(r.incomingSpeechStartSeconds)&&r.incomingSpeechStartSeconds>=cut&&r.incomingSpeechStartSeconds<=right,'Incoming speech edge must lie inside its retained interval');
   invariant(Math.abs(r.gapSeconds-(r.incomingSpeechStartSeconds-r.outgoingSpeechEndSeconds))<=1/bound.edl.outputFps,'Gap must equal outgoing tail plus incoming lead, within one frame');
  }
  if(sourceBounds){
   const m=sourceBounds[i];
   invariant(r.outgoingSpeechEndSeconds>=m.outgoing[0]-1e-9&&r.outgoingSpeechEndSeconds<=m.outgoing[1]+1e-9&&r.incomingSpeechStartSeconds>=m.incoming[0]-1e-9&&r.incomingSpeechStartSeconds<=m.incoming[1]+1e-9,'Claimed speech edges disagree with source labels and playback mapping');
   invariant(Array.isArray(r.gapRangeSeconds)&&r.gapRangeSeconds.length===2&&r.gapRangeSeconds.every((v,k)=>Number.isFinite(v)&&Math.abs(v-m.gapRangeSeconds[k])<1e-7),'Report uncertainty interval, not a falsely exact gap');
  }
  invariant(done(r.status)&&nonempty(r.reason),'Every pause needs a resolved disposition and contextual reason');
 }
 invariant(ledger.intervals?.length===bound.edl.segments.length,'Inspect pauses inside every retained interval');
 for(let i=0;i<bound.edl.segments.length;i++){
  const r=ledger.intervals[i],s=bound.edl.segments[i];
  invariant(r.segmentId===s.id&&r.startFrame===s.outputStartFrame&&r.endFrame===s.outputEndFrameExclusive,'Pause interval differs from canonical EDL');
  invariant(done(r.status)&&nonempty(r.observation)&&Array.isArray(r.candidates),'Interior pause inspection and candidate list required');
  for(const c of r.candidates){
   invariant(Number.isFinite(c.startSeconds)&&Number.isFinite(c.endSeconds)&&c.endSeconds>c.startSeconds,'Pause candidate timing required');
   invariant(c.startSeconds>=s.outputStartFrame/bound.edl.outputFps-.05&&c.endSeconds<=s.outputEndFrameExclusive/bound.edl.outputFps+.05,'Interior pause is outside its retained interval');
   invariant(done(c.status)&&nonempty(c.reason),'Resolve every interior pause candidate');
  }
 }
 invariant(Array.isArray(ledger.unresolved)&&ledger.unresolved.length===0,'Resolve the complete reported pause defect class before handoff');
 return {joins:expected.length,intervals:ledger.intervals.length};
}
