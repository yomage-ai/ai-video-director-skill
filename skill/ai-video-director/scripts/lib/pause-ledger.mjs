import {readFileSync} from 'node:fs';
import {invariant,resolveArtifact,joins} from './media-contract.mjs';
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const done=v=>['clear','repaired','intentional'].includes(v);

// Checks completeness and version binding, not subjective listening quality.
export function checkPauseLedger(ref,bound,base){
 const file=resolveArtifact(ref,base,'pause ledger');
 const ledger=JSON.parse(readFileSync(file,'utf8'));
 invariant(ledger.schemaVersion===1,'Pause ledger schema 1 required');
 invariant(ledger.programSha256===bound.receipt.output.sha256&&ledger.edlSha256===bound.receipt.edl.sha256,'Pause ledger belongs to another rendered version');
 for(const k of ['speechBoundaryMethod','noiseAwareMethod','wordTimingAnomalyMethod'])invariant(nonempty(ledger[k]),`Pause ledger ${k} required; silence detection alone is insufficient`);
 resolveArtifact(ledger.evidence,base,'pause measurement evidence');
 const expected=joins(bound.edl);
 invariant(ledger.joins?.length===expected.length,'Measure the speech gap across every join');
 for(let i=0;i<expected.length;i++){
  const r=ledger.joins[i],b=expected[i];
  invariant(r.boundaryId===b.boundaryId&&r.timelineFrame===b.timelineFrame,'Pause join differs from canonical EDL');
  invariant(Number.isFinite(r.gapSeconds)&&r.gapSeconds>=0,'Measured speech-to-speech gap required, including outgoing tail and incoming lead-in');
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
