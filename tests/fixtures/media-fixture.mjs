import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {artifact,json,sha256} from '../../skill/ai-video-director/scripts/lib/media-contract.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
export const scripts=path.join(root,'skill/ai-video-director/scripts');
export const run=(name,args)=>execFileSync(process.execPath,[path.join(scripts,name),...args],{encoding:'utf8'});
const cached=new Map();
export function mediaFixture(rate=1) {
  if(cached.has(rate)) return cached.get(rate);
  const dir=mkdtempSync(path.join(os.tmpdir(),'director-media-'));
  const source=path.join(dir,'source.mp4'),edlFile=path.join(dir,'edl.json'),output=path.join(dir,'aroll.mp4');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=gray:s=160x90:r=30:d=32',
    '-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=32',
    '-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',source]);
  let xml=readFileSync(path.join(root,'tests/fixtures/simple-chatcut.xml'),'utf8')
    .replace('<duration>60</duration>','<duration>900</duration>')
    .replace('<end>30</end>','<end>450</end>').replace('<out>30</out>','<out>450</out>')
    .replace('<start>30</start>','<start>450</start>').replace('<end>60</end>','<end>900</end>')
    .replace('<in>60</in>','<in>480</in>').replace('<out>90</out>','<out>930</out>');
  if(rate!==1) xml=xml.replace('<out>450</out>',`<out>${450*rate}</out>`).replace('<out>930</out>',`<out>${480+450*rate}</out>`);
  const xmlFile=path.join(dir,'timing.xml');writeFileSync(xmlFile,xml);
  const planFile=path.join(dir,'processing.json');
  writeFileSync(planFile,JSON.stringify({schemaVersion:1,inputXmlSha256:sha256(xmlFile),segments:{'clipitem-1':{playbackRate:rate},'clipitem-2':{playbackRate:rate}}}));
  run('chatcut-xml-to-canonical-edl.mjs',[xmlFile,edlFile,'--processing',planFile]);
  run('render-canonical-edl.mjs',[edlFile,source,output]);
  const reviewFile=path.join(dir,'prepared.json');
  run('prepare-rough-review.mjs',[output+'.render.json',reviewFile]);
  const sample=path.join(dir,'sample.mp4');
  execFileSync('ffmpeg',['-v','error','-i',output,'-t','8','-c:v','libx264','-c:a','aac',sample]);
  const fixture={dir,source,edlFile,output,xmlFile,sample,reviewFile,edl:json(edlFile),prepared:json(reviewFile),receipt:artifact(output+'.render.json')};
  cached.set(rate,fixture);
  return fixture;
}
export function bindRoughReview(review) {
  const fixture=mediaFixture(review.playbackSpeedReview.selectedRate);
  review.evidenceBinding={renderReceipt:fixture.receipt};
  review.canonicalEdlVersion=fixture.receipt && json(fixture.receipt.path).edl.sha256;
  const p=fixture.prepared.manuscriptAudibilityAudit.verifiedBoundaries[0];
  review.manuscriptAudibilityAudit.verifiedBoundaries.forEach(b=>Object.assign(b,{boundaryId:p.boundaryId,timelineFrame:p.timelineFrame,
    timelineTimeSeconds:p.timelineTimeSeconds,renderedWindow:p.renderedWindow,windowEvidence:p.windowEvidence}));
  review.pauseScan.candidates=[{startSeconds:14.8,endSeconds:15.1,decision:'keep',reason:'Synthetic audit fixture; not an actual editorial approval.'}];
  review.fullCutReview.method='Synthetic test fixture for validation logic only';
  review.sourceColorNormalization.naturalSkinAndExposurePass=true;
  review.sourceColorNormalization.representativeFramesChecked={early:true,middle:true,late:true,cutBoundaries:true};
  review.dialogueLoudnessMatch.currentAfterIntegratedLufs=-21;
  review.dialogueLoudnessMatch.currentAfterTruePeakDbtp=-17;
  return fixture;
}
export function bindFineDirection(direction,rate=1) {
  const fixture=mediaFixture(rate);
  direction.basedOn.canonicalEdlVersion=json(fixture.receipt.path).edl.sha256;
  direction.basedOn.durationFrames=fixture.edl.durationFrames;
  direction.basedOn.fps=fixture.edl.outputFps;
  direction.audiovisualSample.reviewArtifact=fixture.sample;
  direction.evidenceBinding={roughRenderReceipt:fixture.receipt,sample:artifact(fixture.sample),dependencies:[artifact(fixture.output),artifact(fixture.edlFile)]};
  return fixture;
}
