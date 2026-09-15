import {createHash} from 'node:crypto';
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runtimeRoot} from './setup-runtime.mjs';

const skillDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const uploadProfile=Object.freeze(JSON.parse(readFileSync(path.join(skillDir,'references/chatcut-upload-profile.json'),'utf8')));
export const sourceSha256=source=>createHash('sha256').update(source).digest('hex');

export function reviewedUpstream(hash) {
  return [uploadProfile,...(uploadProfile.reviewedUpstreams || [])].find(entry=>entry.upstreamSha256===hash);
}

export function checkedRuntimeRoot(root) {
  let ancestor=path.resolve(root);
  const missing=[];
  while (!existsSync(ancestor)) { missing.unshift(path.basename(ancestor)); ancestor=path.dirname(ancestor); }
  const resolved=path.resolve(realpathSync(ancestor),...missing);
  const boundaries=[realpathSync(skillDir)];
  for (let dir=boundaries[0];path.dirname(dir)!==dir;dir=path.dirname(dir)) {
    if (existsSync(path.join(dir,'.git'))) {boundaries.push(dir);break;}
  }
  if (boundaries.some(dir=>{const rel=path.relative(dir,resolved);return rel==='' || (!path.isAbsolute(rel) && rel!=='..' && !rel.startsWith(`..${path.sep}`));})) {
    throw new Error('The adapted upstream helper must stay outside the public repository and installed Skill. Use the default local data directory.');
  }
  return resolved;
}

function replaceExactlyOnce(source,before,after) {
  if (source.split(before).length!==2) throw new Error('Unsupported ChatCut helper structure; preserve the plugin and review the upstream version.');
  return source.replace(before,after);
}

// This is a fixed source transformation, never an execution of the inspected input.
// The production preparation entry verifies the complete upstream SHA before calling it.
export function applyUploadProfile(source) {
  const edits=[
    ['const MULTIPART_SIGN_BATCH_SIZE = 32;',`const MULTIPART_SIGN_BATCH_SIZE = ${uploadProfile.parallelPartsPerFile};`],
    ['const UPLOAD_RETRY_MAX_ATTEMPTS = 5;',`const UPLOAD_RETRY_MAX_ATTEMPTS = ${uploadProfile.attemptsPerRequest};`],
    ['const UPLOAD_RETRY_ATTEMPT_TIMEOUT_MS = 120_000;',`const UPLOAD_RETRY_ATTEMPT_TIMEOUT_MS = ${uploadProfile.requestTimeoutMs};`],
    ['      ...(transcriptionOnly ? ["--transcription-only"] : []),','      ...(!options.transcribe ? ["--no-transcribe"] : []),\n      ...(transcriptionOnly ? ["--transcription-only"] : []),']
  ];
  return edits.reduce((text,[before,after])=>replaceExactlyOnce(text,before,after),source);
}

function checkedCachedFile(file,expectedHash) {
  if (!existsSync(file)) return false;
  if (!lstatSync(file).isFile() || sourceSha256(readFileSync(file))!==expectedHash) {
    throw new Error('Prepared ChatCut helper was modified; preserve it for inspection. Do not execute or silently overwrite it.');
  }
  return true;
}

export function prepareChatcutUpload(helper,{apply=true,root=runtimeRoot()}={}) {
  root=checkedRuntimeRoot(root);
  if (!helper || !path.isAbsolute(helper)) throw new Error('Resolve --helper from the active official ChatCut asset-import Skill to an absolute file path.');
  const original=realpathSync(helper);
  const source=readFileSync(original,'utf8');
  const upstream=reviewedUpstream(sourceSha256(source));
  if (!upstream) {
    throw Object.assign(new Error('Unknown ChatCut upload helper revision; acquire the governed isolated helper instead of modifying or executing unknown bytes.'),{code:'UNKNOWN_UPSTREAM'});
  }
  const prepared=applyUploadProfile(source);
  const preparedHash=sourceSha256(prepared);
  const directory=path.join(root,`${uploadProfile.id}-${preparedHash.slice(0,16)}`);
  const target=path.join(directory,'upload-media.mjs');
  if (existsSync(directory) && !lstatSync(directory).isDirectory()) throw new Error('Prepared helper directory is not an ordinary directory.');
  let reused=checkedCachedFile(target,preparedHash);
  if (!reused && existsSync(directory)) throw new Error('Incomplete prepared helper directory; preserve it for inspection before retrying.');
  const receipt={schemaVersion:1,profile:uploadProfile.id,upstreamVersion:upstream.upstreamVersion,upstreamSha256:upstream.upstreamSha256,preparedSha256:preparedHash,helper:target,originalHelper:original,requestTimeoutMs:uploadProfile.requestTimeoutMs,attemptsPerRequest:uploadProfile.attemptsPerRequest,parallelPartsPerFile:uploadProfile.parallelPartsPerFile,pluginUnchanged:true,networkUsed:false,ready:reused,action:reused?'reused':'preparation-required'};
  if (!reused && apply) {
    mkdirSync(root,{recursive:true});
    const temporary=mkdtempSync(path.join(root,'chatcut-upload-prepare-'));
    try {
      writeFileSync(path.join(temporary,'upload-media.mjs'),prepared,{mode:0o600,flag:'wx'});
      // Keep GPL metadata with the locally adapted upstream file. Never bundle it in the public Skill.
      writeFileSync(path.join(temporary,'UPSTREAM.json'),JSON.stringify({source:`https://github.com/ChatCut-Inc/agent-plugin/blob/${upstream.upstreamRevision}/codex/skills/asset-import/scripts/upload-media.mjs`,license:'GPL-3.0-only',changes:['bounded-request-timeout','two-attempts','two-parts-per-signing-batch','preserve-no-transcribe-retry'],upstreamSha256:upstream.upstreamSha256,preparedSha256:preparedHash},null,2)+'\n',{mode:0o600});
      try { renameSync(temporary,directory); }
      catch(e) {
        if (!['EEXIST','ENOTEMPTY'].includes(e.code) || !checkedCachedFile(target,preparedHash)) throw e;
        reused=true;
      }
      receipt.ready=true;
      receipt.action=reused?'reused':'prepared';
    } finally { if (existsSync(temporary)) rmSync(temporary,{recursive:true,force:true}); }
  }
  return receipt;
}

// Download software only, never media or session credentials. The URL and full
// digest come from the maintained profile, independently of the active plugin.
export async function downloadVerifiedHelper(upstream,{fetchImpl=fetch}={}) {
  const url=`https://raw.githubusercontent.com/ChatCut-Inc/agent-plugin/${upstream.upstreamRevision}/codex/skills/asset-import/scripts/upload-media.mjs`;
  for (let attempt=0;attempt<2;attempt++) {
    try {
      const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error(`Official helper download returned HTTP ${response.status}`);
      const chunks=[];let size=0;
      for await (const chunk of response.body) {
        size+=chunk.length;
        if (size>2*1024*1024) throw Object.assign(new Error('Official helper exceeds the bounded download size'),{code:'INTEGRITY'});
        chunks.push(chunk);
      }
      const bytes=Buffer.concat(chunks);
      if (sourceSha256(bytes)!==upstream.upstreamSha256) throw Object.assign(new Error('Official helper download hash mismatch; no downloaded code executed'),{code:'INTEGRITY'});
      return bytes;
    } catch(error) {
      if (error.code==='INTEGRITY' || attempt===1) throw error;
    }
  }
}

export async function ensureChatcutUpload(helper,{apply=true,root=runtimeRoot(),fetchImpl=fetch}={}) {
  root=checkedRuntimeRoot(root);
  let reason='official-helper-not-installed';
  if (helper) {
    try { return {...prepareChatcutUpload(helper,{apply,root}),selection:'active-reviewed-helper'}; }
    catch(error) {
      if (error.code!=='UNKNOWN_UPSTREAM' && error.code!=='ENOENT') throw error;
      reason=error.code==='UNKNOWN_UPSTREAM'?'active-helper-new-or-unreviewed':'active-helper-missing';
    }
  }
  const upstream=reviewedUpstream(uploadProfile.fallbackUpstreamSha256);
  if (!upstream) throw new Error('The governed fallback helper is absent from the reviewed profile');
  const directory=path.join(root,`chatcut-official-${upstream.upstreamSha256.slice(0,16)}`);
  const target=path.join(directory,'upload-media.mjs');
  let networkUsed=false;
  if (!checkedCachedFile(target,upstream.upstreamSha256)) {
    if (!apply) return {ready:false,action:'acquisition-required',selection:'isolated-reviewed-helper',reason,networkUsed:false,pluginUnchanged:true};
    if (existsSync(directory)) throw new Error('Incomplete isolated helper cache; Agent preserves and inspects it before recovery');
    const bytes=await downloadVerifiedHelper(upstream,{fetchImpl});
    networkUsed=true;
    mkdirSync(root,{recursive:true});
    const temporary=mkdtempSync(path.join(root,'chatcut-official-fetch-'));
    try {
      writeFileSync(path.join(temporary,'upload-media.mjs'),bytes,{flag:'wx',mode:0o600});
      writeFileSync(path.join(temporary,'UPSTREAM.json'),JSON.stringify({source:`https://github.com/ChatCut-Inc/agent-plugin/tree/${upstream.upstreamRevision}`,license:'GPL-3.0-only',sha256:upstream.upstreamSha256})+'\n',{mode:0o600});
      try { renameSync(temporary,directory); }
      catch(error) { if (!['EEXIST','ENOTEMPTY'].includes(error.code) || !checkedCachedFile(target,upstream.upstreamSha256)) throw error; }
    } finally { if (existsSync(temporary)) rmSync(temporary,{recursive:true,force:true}); }
  }
  return {...prepareChatcutUpload(target,{apply,root}),selection:'isolated-reviewed-helper',reason,activeHelper:helper || null,networkUsed};
}
