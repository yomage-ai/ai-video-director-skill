import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {artifact,joins} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {checkPauseLedger} from '../skill/ai-video-director/scripts/lib/pause-ledger.mjs';
import {checkCreatorReview} from '../skill/ai-video-director/scripts/lib/creator-review.mjs';
function fixture(){
 const base=mkdtempSync(path.join(os.tmpdir(),'pause-ledger-'));const evidence=path.join(base,'measurements.json');writeFileSync(evidence,'{}');
 const edl={outputFps:30,segments:[{id:'a',outputStartFrame:0,outputEndFrameExclusive:30},{id:'b',outputStartFrame:30,outputEndFrameExclusive:60}]},bound={edl,receipt:{edl:{sha256:'edl'},output:{sha256:'program'}}};
 const ledger={schemaVersion:1,programSha256:'program',edlSha256:'edl',speechBoundaryMethod:'synthetic mapped tokens',noiseAwareMethod:'synthetic envelope vs noise floor',wordTimingAnomalyMethod:'synthetic long-word review',evidence:artifact(evidence),joins:joins(edl).map(b=>({...b,gapSeconds:.27,status:'repaired',reason:'Synthetic same-sentence context'})),intervals:edl.segments.map(s=>({segmentId:s.id,startFrame:s.outputStartFrame,endFrame:s.outputEndFrameExclusive,status:'clear',observation:'Synthetic interior scan',candidates:[]})),unresolved:[]};
 return {base,bound,ledger,save(){const f=path.join(base,'ledger.json');writeFileSync(f,JSON.stringify(ledger));return artifact(f);}};
}
test('complete measured ledger supports contextual intentional pauses without a universal duration cap',()=>{const f=fixture();f.ledger.joins[0].gapSeconds=.9;f.ledger.joins[0].status='intentional';f.ledger.joins[0].reason='Synthetic reaction beat';assert.deepEqual(checkPauseLedger(f.save(),f.bound,f.base),{joins:1,intervals:2});});
test('rejects missing numeric speech gap, missing join, interior omissions and stale version',()=>{for(const change of [l=>delete l.joins[0].gapSeconds,l=>l.joins.pop(),l=>l.intervals.pop(),l=>l.programSha256='old',l=>l.edlSha256='old',l=>l.unresolved.push('reported long pause'),l=>l.joins[0].status='pending',l=>l.noiseAwareMethod='']){const f=fixture();change(f.ledger);assert.throws(()=>checkPauseLedger(f.save(),f.bound,f.base));}});
test('rejects stale evidence and unresolved or out-of-interval interior candidates',()=>{for(const change of [l=>l.evidence.sha256='stale',l=>l.intervals[0].candidates.push({startSeconds:.1,endSeconds:.8,status:'pending',reason:'needs inspection'}),l=>l.intervals[0].candidates.push({startSeconds:1.2,endSeconds:1.9,status:'clear',reason:'wrong interval'})]){const f=fixture();change(f.ledger);assert.throws(()=>checkPauseLedger(f.save(),f.bound,f.base));}});
test('new creator review cannot pass using only general clear checkboxes',()=>{
 const f=fixture(),evidence=f.ledger.evidence,check={status:'clear',method:'synthetic technical check',observation:'Synthetic fixture, no listening claim',evidence};
 const data={schemaVersion:6,reviewMode:'creator-feedback',pauseContractVersion:1,status:'ready-for-user-review',canonicalEdlVersion:'edl',agentPreparation:{programSha256:'program',listeningModelUsed:false,agentAuditoryReviewClaimed:false,unresolvedIssues:[],checks:Object.fromEntries(['content','picture','pauses','pace','audioLevels','decode'].map(k=>[k,{...check}])),intervals:f.bound.edl.segments.map(s=>({segmentId:s.id,startFrame:s.outputStartFrame,endFrame:s.outputEndFrameExclusive,...check})),boundaries:joins(f.bound.edl).map(b=>({...b,expectedLastToken:'end',expectedFirstToken:'start',...check}))}};
 Object.assign(data.agentPreparation.checks.audioLevels,{integratedLufs:-16.5,truePeakDbtp:-1.2});
 assert.throws(()=>checkCreatorReview(data,f.bound,f.base));data.agentPreparation.pauseLedger=f.save();assert.equal(checkCreatorReview(data,f.bound,f.base).ok,true);
});
