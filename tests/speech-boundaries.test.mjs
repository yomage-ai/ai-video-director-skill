import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {artifact,json,verifyRenderReceipt} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {checkSpeechBoundaries} from '../skill/ai-video-director/scripts/lib/speech-boundaries.mjs';
import {checkPauseLedger} from '../skill/ai-video-director/scripts/lib/pause-ledger.mjs';
import {mediaFixture,run} from './fixtures/media-fixture.mjs';
const word=(sourceId,range,edge)=>({sourceId,token:'synthetic phoneme',protectedRange:range,edgeRange:edge,basis:'spectrogram-and-word-context',locationMethod:'Synthetic known source span for gate testing; not a human speech judgment',uncertaintyReason:'Synthetic 20 ms edge uncertainty'});
function fixture(){return {bound:{receipt:{output:{sha256:'p'},edl:{sha256:'e'}},edl:{outputFps:30,segments:[{id:'a',sourceId:'s',sourceStartSeconds:10,sourceEndSeconds:12,playbackRate:2,outputStartFrame:0,outputEndFrameExclusive:30},{id:'b',sourceId:'s',sourceStartSeconds:20,sourceEndSeconds:22,playbackRate:2,outputStartFrame:30,outputEndFrameExclusive:60}]}},data:{schemaVersion:1,programSha256:'p',edlSha256:'e',joins:[{boundaryId:'a--b',outgoing:word('s',[11.6,11.8],[11.78,11.8]),incoming:word('s',[20.2,20.5],[20.2,20.22])}]}};}
test('maps source speech uncertainty through playback rate without inventing a fixed pause',()=>{
 const {data,bound}=fixture(),m=checkSpeechBoundaries(data,bound,'.',{verifyWindows:false})[0];
 assert.ok(Math.abs(m.gapRangeSeconds[0]-.2)<1e-8);assert.ok(Math.abs(m.gapRangeSeconds[1]-.22)<1e-8);
});
test('rejects clipped onset/tail, fade into a word, unbound source, reversed uncertainty and ASR-only declarations',()=>{
 for(const mutate of [
  f=>f.bound.edl.segments[0].sourceEndSeconds=11.79,
  f=>f.bound.edl.segments[1].sourceStartSeconds=20.21,
  f=>f.bound.edl.segments[0].processing={audio:{fadeOutSeconds:.11}},
  f=>f.bound.edl.segments[1].processing={audio:{fadeInSeconds:.11}},
  f=>f.data.joins[0].outgoing.sourceId='wrong',
  f=>f.data.joins[0].incoming.edgeRange=[20.22,20.2],
  f=>f.data.joins[0].outgoing.basis='ASR-only',
  f=>f.data.joins=[]
 ]){const f=fixture();mutate(f);assert.throws(()=>checkSpeechBoundaries(f.data,f.bound,'.',{verifyWindows:false}));}
});
test('uncertain edge crossing a cut fails even if the nominal word timestamp would fit',()=>{
 const f=fixture();f.data.joins[0].outgoing.protectedRange=[11.6,12.02];f.data.joins[0].outgoing.edgeRange=[11.95,12.02];
 assert.throws(()=>checkSpeechBoundaries(f.data,f.bound,'.',{verifyWindows:false}),/intrudes/);
});
test('real decoded source/output evidence binds schema 3 ledger; wrong gap and substituted audio are rejected',()=>{
 const f=mediaFixture(),bound=verifyRenderReceipt(f.receipt,f.dir),[a,b]=f.edl.segments;
 const data={schemaVersion:1,programSha256:bound.receipt.output.sha256,edlSha256:bound.receipt.edl.sha256,joins:[{boundaryId:`${a.id}--${b.id}`,outgoing:word(a.sourceId,[14.5,14.9],[14.88,14.9]),incoming:word(b.sourceId,[16.1,16.5],[16.1,16.12])}]};
 const input=path.join(f.dir,'source-labels.json'),proof=path.join(f.dir,'source-proof.json');writeFileSync(input,JSON.stringify(data));
 run('prepare-speech-boundaries.mjs',[f.receipt.path,input,proof]);
 const packet=json(proof),m=checkSpeechBoundaries(packet,bound,f.dir)[0];
 const ledger={schemaVersion:3,programSha256:data.programSha256,edlSha256:data.edlSha256,speechBoundaryMethod:'Synthetic known spans plus decoded context',noiseAwareMethod:'Synthetic fixture only',wordTimingAnomalyMethod:'Synthetic fixture only',evidence:artifact(input),sourceBoundaryEvidence:artifact(proof),joins:[{boundaryId:data.joins[0].boundaryId,timelineFrame:b.outputStartFrame,outgoingSpeechEndSeconds:m.outgoing[1],incomingSpeechStartSeconds:m.incoming[0],gapSeconds:m.gapRangeSeconds[0],gapRangeSeconds:m.gapRangeSeconds,status:'clear',reason:'Synthetic technical check, not naturalness approval'}],intervals:f.edl.segments.map(s=>({segmentId:s.id,startFrame:s.outputStartFrame,endFrame:s.outputEndFrameExclusive,status:'clear',observation:'Synthetic fixture',candidates:[]})),unresolved:[]};
 const ledgerFile=path.join(f.dir,'v3-ledger.json'),save=()=>{writeFileSync(ledgerFile,JSON.stringify(ledger));return artifact(ledgerFile);};
 assert.equal(checkPauseLedger(save(),bound,f.dir,{version:3}).joins,1);
 ledger.joins[0].outgoingSpeechEndSeconds-=.04;ledger.joins[0].gapSeconds+=.04;
 assert.throws(()=>checkPauseLedger(save(),bound,f.dir,{version:3}),/disagree/);
 packet.joins[0].outgoing.window.audio=packet.joins[0].renderedWindow.audio;
 assert.throws(()=>checkSpeechBoundaries(packet,bound,f.dir),/Window audio does not match/);
});
