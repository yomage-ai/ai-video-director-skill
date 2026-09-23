import {invariant,resolveArtifact,joins} from './media-contract.mjs';
import {checkPauseLedger} from './pause-ledger.mjs';
import {preparationChecks,defectClasses} from './review-policy.mjs';

const text = value => typeof value === 'string' && value.trim().length > 0;
const resolved = value => ['clear','repaired','intentional'].includes(value);

// Preparation evidence and creator acceptance are separate. Neither claims
// that a language model listened to audio or requires an audio-model provider.
export function checkCreatorReview(data,bound,base) {
  invariant(data.schemaVersion===6 && data.reviewMode==='creator-feedback','Creator-feedback review schema 6 required');
  invariant(['ready-for-user-review','approved'].includes(data.status),'Complete Agent preparation before offering the rough cut');
  invariant(data.canonicalEdlVersion===bound.receipt.edl.sha256,'Review EDL differs from rendered EDL');
  const p=data.agentPreparation;
  invariant(p?.programSha256===bound.receipt.output.sha256,'Preparation belongs to another program');
  invariant(p.listeningModelUsed===false,'Listening models are not part of this workflow');
  invariant(p.agentAuditoryReviewClaimed===false,'Do not turn creator feedback into an Agent listening claim');
  const check=(value,label)=>{
    invariant(value && resolved(value.status) && text(value.method) && text(value.observation),`${label}: actual check method, observation and resolved status required`);
    resolveArtifact(value.evidence,base,`${label} evidence`);
  };
  const complete=data.preparationContractVersion===2;
  for(const name of complete?preparationChecks:['content','picture','pauses','pace','audioLevels','decode']) check(p.checks?.[name],name);
  invariant(Number.isFinite(p.checks.audioLevels.integratedLufs) && Number.isFinite(p.checks.audioLevels.truePeakDbtp),'Measured loudness and peak required');
  invariant(p.checks.audioLevels.truePeakDbtp<=0,'Audio clips above 0 dBTP');
  invariant(Array.isArray(p.unresolvedIssues) && p.unresolvedIssues.length===0,'Resolve known preparation defects before handoff');
  if(data.pauseContractVersion||p.pauseLedger)checkPauseLedger(p.pauseLedger,bound,base,{version:data.pauseContractVersion});
  invariant(p.intervals?.length===bound.edl.segments.length,'Check every retained interval');
  for(const [i,s] of bound.edl.segments.entries()) {
    const r=p.intervals[i];
    invariant(r.segmentId===s.id && r.startFrame===s.outputStartFrame && r.endFrame===s.outputEndFrameExclusive,'Retained interval differs from EDL');
    check(r,`interval ${i}`);
    if(complete) for(const kind of defectClasses.interval) invariant(resolved(r.classes?.[kind]),`interval ${i}: unresolved ${kind}`);
  }
  const expected=joins(bound.edl);
  invariant(p.boundaries?.length===expected.length,'Check every real join');
  for(const [i,b] of expected.entries()) {
    const r=p.boundaries[i];
    invariant(r.boundaryId===b.boundaryId && r.timelineFrame===b.timelineFrame,'Join differs from EDL');
    invariant(text(r.expectedLastToken) && text(r.expectedFirstToken),'Retain expected word boundaries');
    check(r,`join ${i}`);
    if(complete) for(const kind of defectClasses.join) invariant(resolved(r.classes?.[kind]),`join ${i}: unresolved ${kind}`);
  }
  if(data.status==='approved') {
    const a=data.creatorFeedback;
    invariant(a?.approvedBy==='user' && Number.isFinite(Date.parse(a.approvedAt)),'Creator approval with timestamp required');
    invariant(a.programSha256===bound.receipt.output.sha256,'Creator approved another rough cut');
    invariant(text(a.quote),'Preserve the actual creator approval message');
    resolveArtifact(a.evidence,base,'creator feedback');
  }
  return {ok:true,counts:{joins:expected.length,intervals:p.intervals.length},warnings:
    data.status==='approved'?[]:['Ready for normal creator review; subjective sound quality is not an Agent listening claim.']};
}
