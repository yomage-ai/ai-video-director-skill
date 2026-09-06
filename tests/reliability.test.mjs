import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,json,sha256,probe,verifyRenderReceipt} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {mediaFixture,bindRoughReview,bindFineDirection,scripts,run} from './fixtures/media-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=()=>mkdtempSync(path.join(os.tmpdir(),'director-reliability-'));
const write=(file,data)=>writeFileSync(file,JSON.stringify(data,null,2));
const result=(script,args)=>spawnSync(process.execPath,[path.join(scripts,script),...args],{encoding:'utf8'});
const fixtureJson=(name)=>json(path.join(root,'tests/fixtures',name));
function reviews(dir) {
  const rough=fixtureJson('rough-review.json');bindRoughReview(rough);
  const fine=fixtureJson('fine-direction.json');bindFineDirection(fine);
  write(path.join(dir,'rough.json'),rough);write(path.join(dir,'fine.json'),fine);
  return {rough,fine};
}
test('actual evidence rejects missing media, out-of-range, duplicate and stale program records',()=>{
  const dir=temp(),{rough}=reviews(dir);
  const wrongWindow=path.join(dir,'unrelated-window.wav');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=200:sample_rate=48000:duration=5','-c:a','pcm_s16le',wrongWindow]);
  assert.equal(result('audit-rough-cut-review.mjs',[path.join(dir,'rough.json')]).status,0);
  const cases={
    missing:d=>d.manuscriptAudibilityAudit.verifiedBoundaries[0].windowEvidence.path=path.join(dir,'absent.wav'),
    outside:d=>d.manuscriptAudibilityAudit.verifiedBoundaries[0].timelineTimeSeconds=99999,
    duplicate:d=>{d.manuscriptAudibilityAudit.verifiedBoundaries.push(structuredClone(d.manuscriptAudibilityAudit.verifiedBoundaries[0]));d.timelineInventory.placedMediaItems=3;d.timelineInventory.actualJoinCount=d.timelineInventory.expectedJoinCount=2;},
    stale:d=>d.manuscriptAudibilityAudit.verifiedBoundaries[0].windowEvidence.programSha256='0'.repeat(64),
    wrongCount:d=>d.timelineInventory.placedMediaItems=20,
    wrongRate:d=>d.playbackSpeedReview.stableRateRanges[0].rate=1.3,
    omittedRange:d=>d.playbackSpeedReview.stableRateRanges[0].endSeconds=20,
    unrelatedAudio:d=>{const b=d.manuscriptAudibilityAudit.verifiedBoundaries[0];b.renderedWindow=wrongWindow;Object.assign(b.windowEvidence,artifact(wrongWindow));},
  };
  for(const [name,mutate] of Object.entries(cases)) {
    const d=structuredClone(rough);mutate(d);const file=path.join(dir,name+'.json');write(file,d);
    assert.notEqual(result('audit-rough-cut-review.mjs',[file]).status,0,name);
  }
  const f=mediaFixture(),original=readFileSync(f.xmlFile);
  try { writeFileSync(f.xmlFile,Buffer.concat([original,Buffer.from('\n<!-- changed -->')]));
    assert.throws(()=>verifyRenderReceipt(f.receipt,dir),/stale/);
  } finally {writeFileSync(f.xmlFile,original);}
});
test('the style audit rejects missing or silent samples and old rough versions',()=>{
  const dir=temp(),{fine}=reviews(dir);
  assert.equal(result('audit-fine-edit-direction.mjs',[path.join(dir,'fine.json')]).status,0);
  for(const change of [d=>d.evidenceBinding.sample.path='missing.mp4',d=>{d.audiovisualSample.silent=true;d.audiovisualSample.dialogueOnlyIsIntentionalFinalRecommendation=true;},d=>d.basedOn.canonicalEdlVersion='0'.repeat(64)]) {
    const d=structuredClone(fine);change(d);write(path.join(dir,'bad.json'),d);
    assert.notEqual(result('audit-fine-edit-direction.mjs',[path.join(dir,'bad.json')]).status,0);
  }
});
test('XML effects, unknown processing and independent audio cannot be silently discarded',()=>{
  const dir=temp(),xml=readFileSync(path.join(root,'tests/fixtures/simple-chatcut.xml'),'utf8');
  const audio=xml.match(/<track>[\s\S]*?<\/track>/)[0].replace('<in>60</in>','<in>65</in>');
  for(const changed of [xml.replace('</clipitem>','<filter><effect><name>Color</name></effect></filter></clipitem>'),xml.replace('<video>','<video><enabled>FALSE</enabled>'),
    xml.replace('</video>',`</video><audio>${audio}</audio>`),xml.replace('id="clipitem-2"','id="clipitem-1"')]) {
    writeFileSync(path.join(dir,'bad.xml'),changed);
    assert.notEqual(result('chatcut-xml-to-canonical-edl.mjs',[path.join(dir,'bad.xml'),path.join(dir,'bad.json')]).status,0);
  }
  const input=path.join(dir,'timing.xml');writeFileSync(input,xml);
  write(path.join(dir,'plan.json'),{schemaVersion:1,inputXmlSha256:sha256(input),segments:{'clipitem-1':{video:{unknown:1}}}});
  assert.notEqual(result('chatcut-xml-to-canonical-edl.mjs',[input,path.join(dir,'out.json'),'--processing',path.join(dir,'plan.json')]).status,0);
  for(const video of [42,[],{gamma:0},{brightness:2}]) {
    write(path.join(dir,'plan.json'),{schemaVersion:1,inputXmlSha256:sha256(input),segments:{'clipitem-1':{video}}});
    assert.notEqual(result('chatcut-xml-to-canonical-edl.mjs',[input,path.join(dir,'out.json'),'--processing',path.join(dir,'plan.json')]).status,0);
  }
});
test('neutral audio keeps energy near the join instead of adding a frame-length fade',()=>{
  const f=mediaFixture();
  const pcm=execFileSync('ffmpeg',['-v','error','-i',f.output,'-ss','14.5','-t','1','-vn','-ac','1','-ar','48000','-f','f32le','pipe:1']);
  const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.byteLength/4);
  const rms=(a,b)=>{const values=samples.subarray(Math.round(a*48000),Math.round(b*48000));return Math.sqrt(values.reduce((sum,v)=>sum+v*v,0)/values.length);};
  assert.ok(rms(.480,.497)/rms(.2,.4)>.75,'word-tail region must not have an implicit fade');
  assert.ok(rms(.503,.520)/rms(.6,.8)>.75,'word-onset region must not have an implicit fade');
  const window=f.prepared.manuscriptAudibilityAudit.verifiedBoundaries[0].windowEvidence;
  assert.equal(window.endSeconds-window.startSeconds,5);
  assert.equal(json(f.output+'.render.json').command.some(x=>x.includes('afade')),false);
});
test('anonymous local speech survives retiming and gain processing without using personal audio', {skip:process.platform!=='darwin'},()=>{
  const dir=temp(),speech=path.join(dir,'speech.aiff'),source=path.join(dir,'speech.mp4');
  const textFile=path.join(dir,'speech.txt');
  writeFileSync(textFile,'Keep the complete word. Remove only the repeated sentence. Then review the whole passage.');
  execFileSync('/usr/bin/say',['-f',textFile,'-o',speech]);
  const seconds=Number(probe(speech).format.duration)+.5;
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=gray:s=160x90:r=30:d=${seconds}`,
    '-i',speech,'-af',`apad=whole_dur=${seconds}`,'-t',String(seconds),'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',source]);
  const frames=Math.floor(seconds*30/1.04),duration=frames/30;
  const edl={schemaVersion:2,outputFps:30,durationFrames:frames,durationSeconds:duration,segments:[{
    id:'speech-1',sourceId:'anonymous-system-speech',sourceFile:'speech.mp4',outputStartFrame:0,outputEndFrameExclusive:frames,
    durationSeconds:duration,sourceStartSeconds:0,sourceEndSeconds:duration*1.04,playbackRate:1.04,processing:{audio:{gainDb:-3}}}]};
  const edlFile=path.join(dir,'speech-edl.json'),output=path.join(dir,'retimed.mp4');write(edlFile,edl);
  run('render-canonical-edl.mjs',[edlFile,source,output]);
  assert.equal(Number(probe(output).streams.find(s=>s.codec_type==='video').nb_frames),frames);
  const levels=file=>{
    const p=execFileSync('ffmpeg',['-v','error','-i',file,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{maxBuffer:16*1024*1024});
    const samples=new Float32Array(p.buffer,p.byteOffset,p.byteLength/4);
    return Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);
  };
  assert.ok(Math.abs(20*Math.log10(levels(output)/levels(source))+3)<1.2,'speech gain survives the render');
  // This measures mechanics on anonymous synthetic speech, not naturalness or listening acceptance.
});
test('explicit retime preserves pitch, gain and color while output duration stays exact',()=>{
  const f=mediaFixture(),dir=temp(),input=path.join(dir,'timing.xml');
  writeFileSync(input,readFileSync(path.join(root,'tests/fixtures/simple-chatcut.xml'),'utf8').replace('<out>30</out>','<out>36</out>'));
  assert.notEqual(result('chatcut-xml-to-canonical-edl.mjs',[input,path.join(dir,'unplanned.json')]).status,0);
  const plan={schemaVersion:1,inputXmlSha256:sha256(input),segments:{'clipitem-1':{playbackRate:1.2,video:{brightness:0.1},audio:{gainDb:-6}}}};
  write(path.join(dir,'plan.json'),plan);
  const edlFile=path.join(dir,'edl.json'),out=path.join(dir,'out.mp4');
  run('chatcut-xml-to-canonical-edl.mjs',[input,edlFile,'--processing',path.join(dir,'plan.json')]);
  run('render-canonical-edl.mjs',[edlFile,f.source,out]);
  assert.equal(Number(probe(out).streams.find(s=>s.codec_type==='video').nb_frames),60);
  const pcm=execFileSync('ffmpeg',['-v','error','-i',out,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1']);
  const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.byteLength/4);
  const rms=(start,end)=>{const values=samples.subarray(start*48000,end*48000);return Math.sqrt(values.reduce((sum,v)=>sum+v*v,0)/values.length);};
  assert.ok(Math.abs(20*Math.log10(rms(.2,.8)/rms(1.2,1.8))+6)<0.8,'gain applied to the intended segment only');
  let crossings=0;for(let i=9601;i<38400;i++) if(samples[i-1]<=0 && samples[i]>0) crossings++;
  assert.ok(Math.abs(crossings/.6-880)<6,'constant tempo must preserve pitch');
  const luma=t=>{const pixels=execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',out,'-frames:v','1','-pix_fmt','gray','-f','rawvideo','pipe:1']);return pixels.reduce((a,b)=>a+b,0)/pixels.length;};
  assert.ok(luma(.5)>luma(1.5)+15,'explicit color processing is visible');
  assert.ok(Math.abs(Number(probe(out).format.duration)-2)<.1);
  assert.notEqual(result('render-canonical-edl.mjs',[edlFile,f.source,out]).status,0,'approved output cannot be overwritten');
});
test('source IDs prevent same-name media collisions',()=>{
  const dir=temp(),f=mediaFixture(),input=path.join(dir,'same-name.xml');
  const xml=readFileSync(path.join(root,'tests/fixtures/simple-chatcut.xml'),'utf8').replace('<file id="file-1" />','<file id="file-2"><name>source.mp4</name><pathurl>file:///different/source.mp4</pathurl></file>');
  writeFileSync(input,xml);const edlFile=path.join(dir,'edl.json');run('chatcut-xml-to-canonical-edl.mjs',[input,edlFile]);
  assert.deepEqual(json(edlFile).segments.map(s=>s.sourceId),['file-1','file-2']);
  write(path.join(dir,'map.json'),{'source.mp4':f.source});
  assert.notEqual(result('render-canonical-edl.mjs',[edlFile,path.join(dir,'ambiguous.mp4'),'--source-map',path.join(dir,'map.json')]).status,0);
  write(path.join(dir,'map.json'),{'file-1':f.source,'file-2':f.source});
  run('render-canonical-edl.mjs',[edlFile,path.join(dir,'mapped.mp4'),'--source-map',path.join(dir,'map.json')]);
});
test('scoped memory keeps history, superseded candidates and project overrides out of persistent defaults',()=>{
  const dir=temp();run('memory.mjs',['init','--data-dir',dir]);
  const one=JSON.parse(run('memory.mjs',['record','--data-dir',dir,'--project','trial','--category','layout','--feedback','First trial option']));
  run('memory.mjs',['record','--data-dir',dir,'--project','trial','--category','layout','--feedback','Corrected trial option','--supersedes',one.event.id]);
  const profile=json(path.join(dir,'profile.json'));profile.preferences={captions:{color:'white'},production:{workers:1}};write(path.join(dir,'profile.json'),profile);
  const before=sha256(path.join(dir,'profile.json'));write(path.join(dir,'overrides.json'),[{key:'captions.color',value:'yellow',reason:'Current approved sample',source:'fixture approval'}]);
  const current=JSON.parse(run('memory.mjs',['show','--data-dir',dir,'--stage','fine','--include-candidates','--overrides',path.join(dir,'overrides.json')]));
  assert.equal(current.preferences.captions.color,'yellow');assert.equal(current.preferences.production,undefined);
  assert.equal(current.pendingCandidates.length,1);assert.equal(current.pendingCandidates[0].automaticallyApplied,false);
  assert.equal(current.historyIncluded,false);assert.equal(current.profile,undefined);assert.equal(sha256(path.join(dir,'profile.json')),before);
});
test('operational doctor does not equate installation with connected production tools',()=>{
  const dir=temp(),file=path.join(dir,'capabilities.json');run('capability-probe.mjs',[file]);
  assert.equal(json(file).checks.length,2);
  const r=result('director.mjs',['doctor','--stage','rough','--capabilities',file]);
  assert.notEqual(r.status,0);assert.match(r.stdout,/operational chatcut/);assert.match(r.stdout,/operational source-listen/);
});
