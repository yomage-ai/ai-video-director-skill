import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {artifact} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {recoveryAction,verifyRecovery} from '../skill/ai-video-director/scripts/lib/recovery.mjs';
import {checkStage} from '../skill/ai-video-director/scripts/stage.mjs';

test('auth, permission, billing and provider changes require user action without fallback',()=>{
  for(const kind of ['authentication','permission','billing','route-change']) {
    const r=recoveryAction(kind,'Synthetic provider','Synthetic failure');
    assert.equal(r.actor,'user');assert.equal(r.automaticFallbackAllowed,false);
    assert.equal(r.dependentExecution,'blocked');
  }
  for(const kind of ['technical','quality','capability']) assert.equal(recoveryAction(kind,'Synthetic','Test').actor,'agent');
});

test('unresolved recovery blocks every production stage before unrelated approvals or renders',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-recovery-'));
  const file=path.join(dir,'pipeline.json');
  writeFileSync(file,JSON.stringify({schemaVersion:1,projectId:'synthetic',recovery:{schemaVersion:1,
    blockers:[{id:'login',kind:'authentication',provider:'Synthetic',detail:'Login required',status:'blocked'}]}}));
  for(const stage of ['rough-render','fine-render','deliver']) assert.throws(()=>checkStage(file,stage),/Recovery blocked: login/);
});

test('a successful alternative cannot resolve an auth blocker without user evidence',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-recovery-proof-'));
  const proof=path.join(dir,'synthetic-proof.txt');writeFileSync(proof,'SYNTHETIC test evidence, not real approval.');
  const b={id:'login',kind:'authentication',provider:'Synthetic',detail:'Test',status:'resolved',
    qualityRequirementsPreserved:true,resolution:{verifiedAt:new Date().toISOString(),evidence:artifact(proof)}};
  assert.throws(()=>verifyRecovery({schemaVersion:1,blockers:[b]},dir),/user authorization/);
  b.resolution.userAuthorization={approvedBy:'user',approvedAt:new Date().toISOString(),evidence:artifact(proof)};
  assert.equal(verifyRecovery({schemaVersion:1,blockers:[b]},dir).length,2);
  writeFileSync(proof,'Changed evidence');
  assert.throws(()=>verifyRecovery({schemaVersion:1,blockers:[b]},dir),/stale/);
});

test('quality standards cannot be waived by a resolved flag',()=>{
  const b={id:'quality',kind:'quality',provider:'Synthetic',detail:'Test',status:'resolved',qualityRequirementsPreserved:false};
  assert.throws(()=>verifyRecovery({schemaVersion:1,blockers:[b]},'.'),/cannot lower/);
  assert.deepEqual(verifyRecovery(undefined,'.'),[]);
});
