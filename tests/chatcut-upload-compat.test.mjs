import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {applyUploadProfile, checkedRuntimeRoot, prepareChatcutUpload, ensureChatcutUpload, downloadVerifiedHelper, sourceSha256, uploadProfile, reviewedUpstream} from '../skill/ai-video-director/scripts/lib/chatcut-upload-compat.mjs';

// Anonymous behavioral fixture. The exact upstream helper is separately exercised
// by chatcut-upload-smoke.mjs without redistributing its GPL source in this repo.
const fixture=`
const MULTIPART_SIGN_BATCH_SIZE = 32;
const UPLOAD_RETRY_MAX_ATTEMPTS = 5;
const UPLOAD_RETRY_ATTEMPT_TIMEOUT_MS = 120_000;
const LOUDNESS_PROBE_TIMEOUT_MS = 120_000;
function retry(options) {
 const transcriptionOnly=options.transcriptionOnly;
 return {assetId:options.assetId,args:[
      ...(transcriptionOnly ? ["--transcription-only"] : []),
      '--asset-id',options.assetId,options.source]};
}
globalThis.result={batch:MULTIPART_SIGN_BATCH_SIZE,attempts:UPLOAD_RETRY_MAX_ATTEMPTS,timeout:UPLOAD_RETRY_ATTEMPT_TIMEOUT_MS,loudness:LOUDNESS_PROBE_TIMEOUT_MS,retry};
`;

test('upload profile changes transport limits without changing the loudness timeout or asset identity',()=>{
  const context={};
  vm.runInNewContext(applyUploadProfile(fixture),context);
  assert.equal(context.result.timeout,600000);
  assert.equal(context.result.batch,2);
  assert.equal(context.result.attempts,2);
  assert.equal(context.result.loudness,120000);
  const noAsr=context.result.retry({assetId:'fixture-existing-asset',source:'anonymous.mp4',transcribe:false});
  assert.deepEqual(Array.from(noAsr.args),['--no-transcribe','--asset-id','fixture-existing-asset','anonymous.mp4']);
  const withAsr=context.result.retry({assetId:'fixture-existing-asset',source:'anonymous.mp4',transcribe:true,transcriptionOnly:true});
  assert.deepEqual(Array.from(withAsr.args),['--transcription-only','--asset-id','fixture-existing-asset','anonymous.mp4']);
});

test('unknown helper cannot create a compatibility cache or execute input code',()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-upload-unknown-'));
  const helper=path.join(dir,'upload-media.mjs');
  const root=path.join(dir,'cache');
  writeFileSync(helper,fixture);
  try {
    assert.throws(()=>prepareChatcutUpload(helper,{root}),/Unknown ChatCut/);
    assert.equal(existsSync(root),false);
    assert.equal(readFileSync(helper,'utf8'),fixture);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('reviewed helper hashes select their own provenance and reject changed bytes',()=>{
  assert.equal(reviewedUpstream(uploadProfile.upstreamSha256).upstreamVersion,'0.2.26');
  const current=reviewedUpstream('72fe5aa2c5cce067f8d926a7588e7101632693b7453b627b9bda1fbb0b6477a9');
  assert.equal(current.upstreamVersion,'1.10.12');
  assert.equal(current.upstreamRevision,'506b5b0d671ac84e51aa803433ed690a96748bac');
  assert.equal(reviewedUpstream('0'.repeat(64)),undefined);
});

test('missing or repeated adaptation anchors fail instead of modifying a different helper shape',()=>{
  assert.throws(()=>applyUploadProfile(fixture.replace('const MULTIPART_SIGN_BATCH_SIZE = 32;','const MULTIPART_SIGN_BATCH_SIZE = 16;')),/Unsupported/);
  assert.throws(()=>applyUploadProfile(fixture+'\nconst UPLOAD_RETRY_MAX_ATTEMPTS = 5;'),/Unsupported/);
  assert.throws(()=>applyUploadProfile(applyUploadProfile(fixture)),/Unsupported/);
  assert.equal(uploadProfile.upstreamSha256.length,64);
});

test('upload CLI rejects invalid invocation before running a helper and never echoes forwarded credentials',()=>{
  const cli=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skill/ai-video-director/scripts/chatcut-upload.mjs');
  const sentinel='fixture-forwarded-value';
  const result=spawnSync(process.execPath,[cli,'--prepare-only','--','--token',sentinel],{encoding:'utf8'});
  assert.equal(result.status,1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(sentinel));
  assert.equal(JSON.parse(result.stderr).stage,'chatcut-upload-preparation');
});

test('adapted upstream source cannot be prepared inside the public repository, including through a linked parent',()=>{
  const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  assert.throws(()=>checkedRuntimeRoot(path.join(repo,'tmp','new-runtime')),/outside the public repository/);
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-upload-boundary-'));
  try {
    symlinkSync(repo,path.join(dir,'linked-repository'),process.platform==='win32'?'junction':'dir');
    assert.throws(()=>checkedRuntimeRoot(path.join(dir,'linked-repository','new-runtime')),/outside the public repository/);
    assert.ok(checkedRuntimeRoot(path.join(dir,'private-runtime')).endsWith('private-runtime'));
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('missing and unknown helpers route to isolated acquisition in read-only setup',async()=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'avd-auto-helper-'));
  const helper=path.join(dir,'future-helper.mjs');
  writeFileSync(helper,'throw new Error("must never execute");');
  try {
    for (const source of [undefined,helper,path.join(dir,'missing.mjs')]) {
      const result=await ensureChatcutUpload(source,{apply:false,root:path.join(dir,'runtime'),fetchImpl:()=>{throw Error('read-only must not download');}});
      assert.equal(result.action,'acquisition-required');
      assert.equal(result.pluginUnchanged,true);
      assert.equal(result.ready,false);
    }
    assert.equal(existsSync(path.join(dir,'runtime')),false);
    assert.equal(readFileSync(helper,'utf8'),'throw new Error("must never execute");');
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('official acquisition checks bytes, bounds retries and rejects changed code without retry',async()=>{
  const bytes=Buffer.from('anonymous non-executed software fixture');
  const upstream={upstreamRevision:'a'.repeat(40),upstreamSha256:sourceSha256(bytes)};
  let calls=0;
  const downloaded=await downloadVerifiedHelper(upstream,{fetchImpl:async(url,opts)=>{
    calls++;
    assert.ok(url.startsWith('https://raw.githubusercontent.com/ChatCut-Inc/agent-plugin/'));
    assert.equal(opts.redirect,'error');
    assert.ok(opts.signal);
    if (calls===1) throw Error('temporary network failure');
    return new Response(bytes);
  }});
  assert.deepEqual(downloaded,bytes);assert.equal(calls,2);
  calls=0;
  await assert.rejects(downloadVerifiedHelper(upstream,{fetchImpl:async()=>{calls++;return new Response('changed code');}}),/hash mismatch/);
  assert.equal(calls,1);
  calls=0;
  await assert.rejects(downloadVerifiedHelper(upstream,{fetchImpl:async()=>{calls++;throw Error('offline');}}),/offline/);
  assert.equal(calls,2);
  await assert.rejects(downloadVerifiedHelper(upstream,{fetchImpl:async()=>new Response(Buffer.alloc(2*1024*1024+1))}),/bounded download/);
});
