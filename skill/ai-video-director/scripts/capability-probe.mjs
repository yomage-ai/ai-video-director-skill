#!/usr/bin/env node
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {artifact,invariant,probe} from './lib/media-contract.mjs';

const [outputArg]=process.argv.slice(2);
invariant(outputArg,'Usage: capability-probe.mjs <new-capabilities.json>');
const output=path.resolve(outputArg),directory=mkdtempSync(path.join(os.tmpdir(),'director-probe-'));
const checks=[];
try {
  const sample=path.join(directory,'sample.mp4');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=s=64x64:r=30:d=0.3',
    '-f','lavfi','-i','sine=frequency=440:duration=0.3','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',sample]);
  const media=probe(sample);
  invariant(media.streams.some(s=>s.codec_type==='audio') && media.streams.some(s=>s.codec_type==='video'),'Local sample probe failed');
  for(const name of ['ffmpeg','ffprobe']) {
    const result=spawnSync(name,['-version'],{encoding:'utf8'});
    invariant(result.status===0,`${name} unavailable`);
    const evidenceFile=`${output}.${name}.json`;
    const evidence={tool:name,argv:[name,'-version'],status:result.status,version:result.stdout.split('\n')[0],sampleProbe:media};
    writeFileSync(evidenceFile,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
    checks.push({name,status:'pass',version:evidence.version,method:'local encode and stream probe',checkedAt:new Date().toISOString(),evidence:artifact(evidenceFile)});
  }
  writeFileSync(output,JSON.stringify({schemaVersion:1,checks,unverified:['chatcut','asr','source-listen','fine-renderer']},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({output,checks:checks.map(c=>c.name),note:'Editor, ASR, auditory review and selected fine renderer require real host/tool evidence; installation is not connectivity.'}));
} finally { rmSync(directory,{recursive:true,force:true}); }
