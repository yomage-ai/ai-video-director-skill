#!/usr/bin/env node
import {mkdirSync, existsSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,json,joins,invariant,verifyRenderReceipt} from './lib/media-contract.mjs';

const [receiptArg, outputArg] = process.argv.slice(2);
invariant(receiptArg && outputArg,'Usage: prepare-rough-review.mjs <render.json> <new-review.json>');
const output = path.resolve(outputArg);
invariant(!existsSync(output),'Review exists; prepare a new version instead of rewriting approval');
const binding = artifact(path.resolve(receiptArg));
const {edl,program,receipt} = verifyRenderReceipt(binding,process.cwd());
const template = fileURLToPath(new URL('../assets/templates/rough-cut-review.template.json',import.meta.url));
const review = json(template);
review.status = 'in-progress';
review.evidenceBinding = {renderReceipt:binding};
review.canonicalEdlVersion = receipt.edl.sha256;
const boundaries = joins(edl);
review.timelineInventory = {durationSeconds:edl.durationSeconds,placedMediaItems:edl.segments.length,
  expectedJoinCount:boundaries.length,actualJoinCount:boundaries.length,allRealJoinsRepresented:true};
const directory = path.join(path.dirname(output),path.basename(output,'.json')+'-windows');
mkdirSync(directory,{recursive:true});
review.manuscriptAudibilityAudit.verifiedBoundaries = boundaries.map((boundary,index)=>{
  const startSeconds = Math.max(0,boundary.timelineTimeSeconds-2.5);
  const endSeconds = Math.min(edl.durationSeconds,boundary.timelineTimeSeconds+2.5);
  const file = path.join(directory,`join-${index+1}.wav`);
  execFileSync('ffmpeg',['-v','error','-n','-ss',String(startSeconds),'-i',program,'-t',String(endSeconds-startSeconds),
    '-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',file],{stdio:'pipe'});
  return {...review.manuscriptAudibilityAudit.verifiedBoundaries[0],...boundary,
    renderedWindow:file,windowEvidence:{...artifact(file),programSha256:receipt.output.sha256,startSeconds,endSeconds,
      generator:'prepare-rough-review.mjs / ffmpeg pcm_s16le 48000 mono'}};
});
writeFileSync(output,JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({output,joins:boundaries.length,status:'in-progress',
  next:'Agent must actually listen, inspect, measure and fill review decisions; generation does not approve quality.'}));
