#!/usr/bin/env node
// Lossless video-tail reuse. Refuse incompatible streams; never quietly re-encode.
import {execFileSync} from 'node:child_process';
import {existsSync,mkdtempSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,invariant,sameFile,decode} from './lib/media-contract.mjs';
import {videoSpec} from './lib/locked-master.mjs';
import {externalProject} from './lib/external-project.mjs';
const ff=args=>execFileSync('ffmpeg',['-v','error','-xerror','-n',...args],{encoding:'utf8',maxBuffer:32e6});
export function joinPrefix(master,prefix,output) {
  [master,prefix,output]=[master,prefix,output].map(x=>path.resolve(x));
  externalProject(output);
  invariant(!existsSync(output),'Output exists; use a new version');
  const spec=videoSpec(master),p=videoSpec(prefix);
  invariant(p.width===spec.width&&p.height===spec.height&&p.fps===spec.fps&&p.durationFrames<spec.durationFrames,'Prefix must preserve canvas/cadence and leave a tail');
  const inspect=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_streams','-show_data_hash','sha256','-of','json',file],{encoding:'utf8'})).streams[0];
  const a=inspect(master),b=inspect(prefix);
  invariant(a.codec_name==='h264','Tail reuse currently supports H.264 only; use full render for another codec');
  const keys=['codec_name','profile','level','pix_fmt','time_base','sample_aspect_ratio','color_range','color_space','color_transfer','color_primaries','extradata_hash'];
  invariant(a.extradata_hash&&keys.every(k=>a[k]===b[k]),'Codec/header/color mismatch; full render required');
  const cut=p.durationFrames/p.fps;
  const frames=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-skip_frame','nokey','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',master],{encoding:'utf8',maxBuffer:32e6})).frames;
  invariant(frames.some(f=>Math.abs(Number(f.best_effort_timestamp_time)-cut)<1e-5),'Tail must start on an existing keyframe; extend prefix or full render');
  const dir=mkdtempSync(path.join(os.tmpdir(),'director-prefix-'));
  ff(['-i',prefix,'-map','0:v:0','-c','copy',path.join(dir,'prefix.mp4')]);
  ff(['-ss',String(cut),'-i',master,'-map','0:v:0','-c','copy',path.join(dir,'tail.mp4')]);
  writeFileSync(path.join(dir,'concat.txt'),"file 'prefix.mp4'\nfile 'tail.mp4'\n",{flag:'wx'});
  ff(['-f','concat','-safe','1','-i',path.join(dir,'concat.txt'),'-i',master,'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',output]);
  decode(output);invariant(JSON.stringify(videoSpec(output))===JSON.stringify(spec),'Reused output specification mismatch');
  const audio=f=>ff(['-i',f,'-map','0:a:0','-c:a','pcm_f32le','-f','hash','-hash','sha256','-']).trim();
  invariant(audio(master)===audio(output),'Original audio was not preserved');
  const tailHash=f=>ff(['-ss',String(cut),'-i',f,'-map','0:v:0','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','hash','-hash','sha256','-']).trim();
  invariant(tailHash(master)===tailHash(output),'Copied tail bitstream differs');
  const receipt={schemaVersion:1,master:artifact(master),prefix:artifact(prefix),output:artifact(output),reusedFromFrame:p.durationFrames,reusedFrames:spec.durationFrames-p.durationFrames,tailBitstreamIdentical:true,audioSamplesIdentical:true,fullDecodePassed:true,needsRevisionQa:true};
  writeFileSync(output+'.reuse.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return receipt;
}
if(process.argv[1]&&existsSync(process.argv[1])&&sameFile(process.argv[1],fileURLToPath(import.meta.url))) {
  try {invariant(process.argv.length===5,'Usage: join-rendered-prefix.mjs <master> <new-prefix> <new-output>');console.log(JSON.stringify(joinPrefix(...process.argv.slice(2)),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
