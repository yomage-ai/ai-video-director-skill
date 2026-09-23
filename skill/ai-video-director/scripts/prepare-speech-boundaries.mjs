#!/usr/bin/env node
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {artifact,json,invariant,resolveArtifact,verifyRenderReceipt,probe} from './lib/media-contract.mjs';
import {checkSpeechBoundaries} from './lib/speech-boundaries.mjs';
const [receiptArg,annotationsArg,outputArg]=process.argv.slice(2);
invariant(receiptArg&&annotationsArg&&outputArg,'Usage: prepare-speech-boundaries.mjs render.json source-annotations.json new-evidence.json');
const output=path.resolve(outputArg);invariant(!existsSync(output),'Preserve existing source evidence; choose a new path');
const bound=verifyRenderReceipt(artifact(path.resolve(receiptArg)),process.cwd()),data=json(path.resolve(annotationsArg));
// Fail before generating a pass-looking packet for a cut inside annotated speech.
const mapped=checkSpeechBoundaries(data,bound,process.cwd(),{verifyWindows:false});
const dir=path.join(path.dirname(output),path.basename(output,'.json')+'-windows');invariant(!existsSync(dir),'Evidence window directory exists; use a new version');mkdirSync(dir,{recursive:true});
const durations=new Map(),sourceFiles=new Map();
function window(file,start,end,name){
 if(!durations.has(file))durations.set(file,Number(probe(file).format.duration));
 start=Math.max(0,start);end=Math.min(durations.get(file),end);invariant(end>start,'Empty evidence interval');
 const wav=path.join(dir,name+'.wav'),png=path.join(dir,name+'.png');
 execFileSync('ffmpeg',['-v','error','-n','-ss',String(start),'-i',file,'-t',String(end-start),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',wav]);
 execFileSync('ffmpeg',['-v','error','-n','-i',wav,'-lavfi','showspectrumpic=s=1200x500:legend=1:scale=log','-frames:v','1',png]);
 return {startSeconds:start,endSeconds:end,audio:artifact(wav),spectrogram:artifact(png)};
}
for(const [i,row] of data.joins.entries()){
 for(const side of ['outgoing','incoming']){
  const x=row[side],src=bound.receipt.sources.find(s=>s.sourceId===x.sourceId);
  if(!sourceFiles.has(x.sourceId))sourceFiles.set(x.sourceId,resolveArtifact(src,path.dirname(bound.file),'source'));
  const file=sourceFiles.get(x.sourceId);
  x.window=window(file,x.protectedRange[0]-.5,x.protectedRange[1]+.5,`${i+1}-${side}`);
 }
 row.renderedWindow=window(bound.program,mapped[i].outgoing[0]-.5,mapped[i].incoming[1]+.5,`${i+1}-after`);
}
data.annotationInput=artifact(path.resolve(annotationsArg));data.generator='prepare-speech-boundaries';
data.limit='Source labels are Agent/creator judgments; windows prove provenance, not automatic phonetic accuracy or naturalness.';
checkSpeechBoundaries(data,bound,path.dirname(output));
writeFileSync(output,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({output,joins:data.joins.length,mapped,meaning:'Protected labelled speech retained; inspect actual source/output windows. Naturalness is not certified.'},null,2));
