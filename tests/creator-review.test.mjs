import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkCreatorReview} from '../skill/ai-video-director/scripts/lib/creator-review.mjs';
import {artifact,joins} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {migrateCreatorReview} from '../skill/ai-video-director/scripts/migrate-creator-review.mjs';

function fixture() {
 const base=mkdtempSync(path.join(os.tmpdir(),'creator-review-'));
 const file=path.join(base,'evidence.txt');writeFileSync(file,'Synthetic technical-check and creator-feedback fixture.');
 const evidence=artifact(file),check=()=>({status:'clear',method:'synthetic regression fixture',observation:'No perceptual claim',evidence});
 const edl={outputFps:30,segments:[{id:'one',outputStartFrame:0,outputEndFrameExclusive:30},{id:'two',outputStartFrame:30,outputEndFrameExclusive:60}]};
 const bound={edl,receipt:{edl:{sha256:'edl'},output:{sha256:'program'}}};
 const data={schemaVersion:6,reviewMode:'creator-feedback',status:'ready-for-user-review',canonicalEdlVersion:'edl',agentPreparation:{
  programSha256:'program',listeningModelUsed:false,agentAuditoryReviewClaimed:false,unresolvedIssues:[],
  checks:Object.fromEntries(['content','picture','pauses','pace','audioLevels','decode'].map(k=>[k,check()])),
  intervals:edl.segments.map(s=>({segmentId:s.id,startFrame:s.outputStartFrame,endFrame:s.outputEndFrameExclusive,...check()})),
  boundaries:joins(edl).map(b=>({...b,expectedLastToken:'out',expectedFirstToken:'in',...check()}))}};
 Object.assign(data.agentPreparation.checks.audioLevels,{integratedLufs:-16.5,truePeakDbtp:-1.3});
 return {base,bound,data,evidence};
}
test('prepared rough cut is deliverable for creator feedback without audio model or prior creator approval',()=>{
 const f=fixture();assert.equal(checkCreatorReview(f.data,f.bound,f.base).ok,true);
});
test('creator acceptance cannot fabricate independent Agent listening or approve another render',()=>{
 const f=fixture();f.data.status='approved';
 assert.throws(()=>checkCreatorReview(f.data,f.bound,f.base),/Creator approval/);
 f.data.creatorFeedback={approvedBy:'user',approvedAt:new Date().toISOString(),programSha256:'other',quote:'Proceed',evidence:f.evidence};
 assert.throws(()=>checkCreatorReview(f.data,f.bound,f.base),/another rough/);
 f.data.creatorFeedback.programSha256='program';assert.equal(checkCreatorReview(f.data,f.bound,f.base).ok,true);
 f.data.agentPreparation.agentAuditoryReviewClaimed=true;assert.throws(()=>checkCreatorReview(f.data,f.bound,f.base),/listening claim/);
});
test('creator workflow retains join coverage, unresolved defect, loudness and stale evidence guards',()=>{
 for(const mutate of [d=>d.agentPreparation.boundaries.pop(),d=>d.agentPreparation.intervals.pop(),d=>d.agentPreparation.unresolvedIssues.push('clipped word'),d=>d.agentPreparation.checks.audioLevels.truePeakDbtp=1,d=>d.agentPreparation.checks.picture.evidence.sha256='stale']) {
  const f=fixture();mutate(f.data);assert.throws(()=>checkCreatorReview(f.data,f.bound,f.base));
 }
});
test('resume removes obsolete listening prerequisite while preserving real blockers and approvals',()=>{
 const f=fixture(),file=path.join(f.base,'pipeline.json');
 const m={schemaVersion:1,approvals:{rough:{approvedBy:'user',artifact:f.evidence}},jobs:{'rough-render':{requiresCapabilities:['ffmpeg','chatcut','source-listen']}},recovery:{schemaVersion:1,blockers:[
  {id:'actual-auditory-review',status:'blocked',kind:'quality',provider:'current route',detail:'No native listening'},
  {id:'login',status:'blocked',kind:'authentication',provider:'ChatCut',detail:'login needed'},
  {id:'clipped-word',status:'blocked',kind:'quality',provider:'editor',detail:'Known word onset clipped'}]}};
 writeFileSync(file,JSON.stringify(m));const result=migrateCreatorReview(file);
 assert.equal(result.changes.length,1);
 assert.deepEqual(result.agentReviewRequired,['actual-auditory-review']);
 assert.equal(JSON.parse(readFileSync(file,'utf8')).recovery.blockers[0].status,'blocked');assert.equal(migrateCreatorReview(file).changes.length,0);
 const classification=path.join(f.base,'classification.json');
 writeFileSync(classification,JSON.stringify({pipelineSha256:artifact(file).sha256,blockers:[{id:'actual-auditory-review',scope:'obsolete-prerequisite-only',reason:'Synthetic inspected prerequisite; no defect',evidence:f.evidence}]}));
 migrateCreatorReview(file,{classificationFile:classification});
 const saved=JSON.parse(readFileSync(file,'utf8'));
 assert.deepEqual(saved.approvals,m.approvals);
 assert.deepEqual(saved.jobs['rough-render'].requiresCapabilities,['ffmpeg','chatcut']);
 assert.equal(saved.recovery.blockers[0].status,'resolved');
 assert.deepEqual(saved.recovery.blockers.slice(1),m.recovery.blockers.slice(1));
});

test('migration cannot retire a known defect under an old audio-review id or a stale classification',()=>{
 const f=fixture(),file=path.join(f.base,'pipeline.json'),classification=path.join(f.base,'classify.json');
 const m={schemaVersion:1,jobs:{},recovery:{blockers:[{id:'source-listen',kind:'quality',status:'blocked',knownDefects:['clipped-word']}]}};
 writeFileSync(file,JSON.stringify(m));
 const c={pipelineSha256:artifact(file).sha256,blockers:[{id:'source-listen',scope:'obsolete-prerequisite-only',reason:'Synthetic',evidence:f.evidence}]};
 writeFileSync(classification,JSON.stringify(c));assert.throws(()=>migrateCreatorReview(file,{classificationFile:classification}),/Known defects/);
 c.pipelineSha256='old';writeFileSync(classification,JSON.stringify(c));assert.throws(()=>migrateCreatorReview(file,{classificationFile:classification}),/another pipeline/);
 assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),m);
});
