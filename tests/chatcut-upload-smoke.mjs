// Explicit integration test: execute the actual installed official helper and the
// Skill entry against a loopback-only storage fixture. No real account or media.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawn, spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareChatcutUpload, sourceSha256} from '../skill/ai-video-director/scripts/lib/chatcut-upload-compat.mjs';

const args=process.argv.slice(2);
const value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const helper=path.resolve(value('--helper',''));
const out=path.resolve(value('--out',''));
const delayMs=Number(value('--delay-ms','100'));
const slow=delayMs>120000;
const port=Number(value('--port','0'));
assert.ok(args.includes('--helper') && args.includes('--out'));
assert.ok(delayMs>=0 && delayMs<160000);
mkdirSync(out,{recursive:true});
const before=sourceSha256(readFileSync(helper));
const prepared=prepareChatcutUpload(helper,{root:path.join(out,'runtime')});
assert.equal(prepareChatcutUpload(helper,{root:path.join(out,'runtime')}).action,'reused');
assert.equal(prepareChatcutUpload(helper,{root:path.join(out,'check-only'),apply:false}).action,'preparation-required');

const media=path.join(out,'anonymous.mp4');
const ff=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=640x360:rate=30','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','2','-c:v','libx264','-b:v','1500k','-c:a','aac','-movflags','+faststart',media],{encoding:'utf8',timeout:30000});
assert.equal(ff.status,0,ff.stderr);
const states=new Map(['baseline','fixed','resume','failure'].map(role=>[role,{role,active:0,maxActive:0,parts:new Map(),signs:[],registered:0,finalized:false,transcriptionRequests:0}]));
const timers=new Set();
let base;
const slot=(role,key)=>({fileKey:key,readUrl:`${base}/${role}/bytes/${key}`,presignedUrl:`${base}/${role}/bytes/${key}`});
const json=(res,data,status=200)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data));};
const server=createServer(async(req,res)=>{
  try {
    if(req.url==='/') {json(res,{fixture:'avd-upload-transport'});return;}
    const [,role,kind,key]=req.url.split('/');
    const state=states.get(role);
    if(!state){json(res,{error:'unknown fixture role'},404);return;}
    const chunks=[];
    for await (const chunk of req) chunks.push(chunk);
    const bytes=Buffer.concat(chunks);
    if(kind==='session') {
      const body=JSON.parse(bytes).request;
      if(body.registerAssetPlaceholderRequest) {
        const r=body.registerAssetPlaceholderRequest;
        state.assetId=r.assetId;state.registered++;
        json(res,{assetId:r.assetId,...(r.thumbnail?{thumbnailUpload:slot(role,'registered-thumbnail')}:{})});return;
      }
      if(body.prepareRegisteredUploadRequest) {
        const r=body.prepareRegisteredUploadRequest;
        state.assetId=r.assetId;state.size=r.size;state.partSize=Math.ceil(r.size/6);
        json(res,{assetUpload:{...slot(role,'main'),assetId:r.assetId,multipartUploadId:`${role}-upload`,multipartPartSizeBytes:state.partSize,multipartPartCount:Math.ceil(r.size/state.partSize)},...(r.thumbnail?{thumbnailUpload:slot(role,'final-thumbnail')}:{})});return;
      }
      if(body.signPartsRequest) {
        const r=body.signPartsRequest;state.signs.push([r.firstPartNumber,r.lastPartNumber]);
        json(res,{partUrls:Object.fromEntries(Array.from({length:r.lastPartNumber-r.firstPartNumber+1},(_,i)=>{const n=i+r.firstPartNumber;return [String(n),`${base}/${role}/part/${n}`];}))});return;
      }
      if(body.finalizeAssetUploadRequest) {
        const r=body.finalizeAssetUploadRequest;
        assert.equal(r.assetId,state.assetId);
        assert.equal(r.startTranscription,false);
        assert.equal(r.multipart.parts.length,6);
        state.finalized=true;
        state.uploaded=Buffer.concat([...state.parts].sort(([a],[b])=>a-b).map(([,v])=>v));
        assert.equal(state.uploaded.length,state.size);
        json(res,{assetId:state.assetId});return;
      }
      state.transcriptionRequests++;
      json(res,{error:'unexpected operation'},400);return;
    }
    if(kind==='part') {
      state.active++;state.maxActive=Math.max(state.maxActive,state.active);
      let settled=false;
      const done=()=>{if(!settled){state.active--;settled=true;}};
      const partNumber=Number(key);
      // A long-running PUT is enough to exercise the actual upstream request timer.
      // The file is intentionally tiny: this tests elapsed request time, not bandwidth.
      const wait=(role==='baseline'||role==='fixed') && partNumber<=2?delayMs:50;
      const timer=setTimeout(()=>{
        timers.delete(timer);
        if(res.destroyed)return;
        done();
        if(role==='failure') {json(res,{error:'fixture forbidden'},403);return;}
        state.parts.set(partNumber,bytes);
        res.writeHead(200,{etag:`"${createHash('md5').update(bytes).digest('hex')}"`});res.end();
      },wait);
      timers.add(timer);
      res.on('close',()=>{clearTimeout(timer);timers.delete(timer);done();});
      return;
    }
    if(kind==='bytes') {res.writeHead(200,{etag:'"fixture-thumbnail"'});res.end();return;}
    json(res,{error:'unknown fixture route'},404);
  } catch(e) {json(res,{error:e.message},500);}
});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
base=`http://127.0.0.1:${server.address().port}`;
const cli=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skill/ai-video-director/scripts/chatcut-upload.mjs');
const children=new Set();
function run(role,{adapted=true,resume=false}={}) {
  const state=states.get(role);
  const started=Date.now();
  const official=['--token',randomUUID(),'--endpoint',`${base}/${role}/session`,'--no-transcribe','--ffmpeg','ffmpeg','--ffprobe','ffprobe',...(resume?['--asset-id','fixture-existing-asset']:[]),media];
  const argv=adapted?[cli,'--helper',helper,'--',...official]:[helper,...official];
  const child=spawn(process.execPath,argv,{env:{...process.env,AI_VIDEO_DIRECTOR_DATA_DIR:out},stdio:['ignore','pipe','pipe']});
  children.add(child);
  let stdout='',stderr='',timedOutAt=null;
  child.stdout.on('data',chunk=>{stdout+=chunk;});
  child.stderr.on('data',chunk=>{
    stderr+=chunk;
    if(role==='baseline' && slow && timedOutAt===null && /request timed out after 120s/.test(stderr)) {
      timedOutAt=Date.now()-started;
      console.log(JSON.stringify({event:'original-request-timeout',elapsedMs:timedOutAt}));
      child.kill('SIGTERM'); // Stop only this fixture-owned baseline after the measured failure.
    }
  });
  return new Promise((resolve,reject)=>{
    child.once('error',reject);
    child.once('close',(code,signal)=>{
      children.delete(child);
      writeFileSync(path.join(out,`${role}.log`),stderr);
      resolve({role,code,signal,elapsedMs:Date.now()-started,timedOutAt,stdout,stderr});
    });
  });
}

try {
  console.log(JSON.stringify({event:'fixture-ready',url:base,delayMs,media:'anonymous generated video',scope:'loopback HTTP; no ChatCut cloud account'}));
  const [baseline,fixed]=await Promise.all([run('baseline',{adapted:false}),run('fixed')]);
  if(slow) {
    assert.ok(baseline.timedOutAt>=120000 && baseline.timedOutAt<140000);
    assert.ok(fixed.elapsedMs>120000);
  } else assert.equal(baseline.code,0,baseline.stderr);
  assert.equal(fixed.code,0,fixed.stderr);
  const fixedOutput=JSON.parse(fixed.stdout);
  const s=states.get('fixed');
  assert.equal(s.finalized,true);
  assert.equal(s.transcriptionRequests,0);
  assert.equal(s.registered,1);
  assert.equal(s.maxActive,2);
  assert.equal(s.signs.length,3);
  assert.ok(s.signs.every(([a,b])=>b-a+1<=2));
  assert.equal(sourceSha256(s.uploaded),sourceSha256(readFileSync(fixedOutput.imports[0].metadata.uploadPath)));
  assert.equal(fixedOutput.imports[0].result.assetId,s.assetId);
  const resume=await run('resume',{resume:true});
  assert.equal(resume.code,0,resume.stderr);
  assert.equal(states.get('resume').registered,0);
  assert.equal(JSON.parse(resume.stdout).imports[0].result.assetId,'fixture-existing-asset');
  const failure=await run('failure',{resume:true});
  assert.equal(failure.code,1);
  const failureJson=JSON.parse(failure.stderr.slice(failure.stderr.lastIndexOf('\n{')));
  assert.equal(failureJson.assetId,'fixture-existing-asset');
  assert.ok(failureJson.retry.args.includes('--no-transcribe'));
  assert.equal(sourceSha256(readFileSync(helper)),before);
  const result={ok:true,delayMs,baseline:{elapsedMs:baseline.elapsedMs,requestTimedOutAtMs:baseline.timedOutAt,maxConcurrentParts:states.get('baseline').maxActive},fixed:{elapsedMs:fixed.elapsedMs,maxConcurrentParts:s.maxActive,signingBatches:s.signs.length,byteHashMatched:true,finalized:true},sameAssetRetry:true,noTranscribePreserved:true,originalHelperUnchanged:true,prepared,scope:'real original/adapted helper against controlled loopback HTTP, generated video; real cloud authentication/backend and affected device not tested'};
  writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({...result,prepared:undefined}));
} finally {
  for(const child of children) child.kill('SIGTERM');
  for(const timer of timers) clearTimeout(timer);
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
