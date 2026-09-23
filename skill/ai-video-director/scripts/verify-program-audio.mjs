#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {artifact,json,invariant} from './lib/media-contract.mjs';
// Compare decoded mono signals, not semantic listening. The expected mix is
// the locked dialogue plus the complete SFX stem at the declared uniform gain.
function pcm(file,start,duration){
 const r=spawnSync('ffmpeg',['-v','error','-ss',String(start),'-i',file,'-t',String(duration),'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{maxBuffer:16*1024*1024});
 invariant(r.status===0,`PCM decode failed: ${r.stderr?.toString()}`);
 const values=new Float32Array(r.stdout.length/4);for(let i=0;i<values.length;i++)values[i]=r.stdout.readFloatLE(i*4);return values;
}
function correlation(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa*bb>1e-16?dot/Math.sqrt(aa*bb):0;}
try {
 const [planFile,master,dialogue,sfx,output,gainArg='1']=process.argv.slice(2);
 invariant(output,'Usage: verify-program-audio.mjs plan master dialogue-wav sfx-wav-or-dash new-report gain');
 const plan=json(planFile),gain=Number(gainArg);invariant(Number.isFinite(gain)&&gain>0&&gain<=4,'Declared uniform mix gain required');
 const seconds=plan.canvas.durationFrames/plan.canvas.fps;
 const windows=[0,Math.max(0,seconds/2-1),Math.max(0,seconds-2)].map((start,i)=>({id:`program-${i}`,start,end:Math.min(seconds,start+2)}));
 for(const c of plan.cues||[])windows.push({id:c.id,cue:true,start:c.startFrame/plan.canvas.fps,end:Math.min(seconds,c.endFrame/plan.canvas.fps)});
 const checks=windows.map(w=>{
  const duration=w.end-w.start,m=pcm(master,w.start,duration),d=pcm(dialogue,w.start,duration),s=sfx==='-'?new Float32Array(d.length):pcm(sfx,w.start,duration);
  invariant(Math.abs(m.length-d.length)<=48&&Math.abs(s.length-d.length)<=48,'Decoded mix window duration mismatch');
  const n=Math.min(m.length,d.length,s.length);invariant(n>0,'Empty mix window');
  const expected=new Float32Array(n),actual=m.slice(0,n),residual=new Float32Array(n),effect=new Float32Array(n);
  let power=0,error=0;
  for(let i=0;i<n;i++){expected[i]=(d[i]+s[i])*gain;effect[i]=s[i]*gain;residual[i]=m[i]-d[i]*gain;power+=expected[i]**2;error+=(m[i]-expected[i])**2;}
  const rms=Math.sqrt(power/n),nrmse=Math.sqrt(error/n)/Math.max(rms,1e-5),corr=correlation(actual,expected),cueCorrelation=w.cue?correlation(residual,effect):null;
  const pass=(rms<1e-5?Math.sqrt(error/n)<1e-4:nrmse<=.05&&corr>=.995)&&(!w.cue||cueCorrelation>=.9);
  return {...w,nrmse,correlation:corr,cueResidualCorrelation:cueCorrelation,status:pass?'pass':'fail'};
 });
 const result={schemaVersion:1,tool:'verify-program-audio',ok:checks.every(c=>c.status==='pass'),plan:artifact(planFile),render:artifact(master),dialogue:artifact(dialogue),sfx:sfx==='-'?null:artifact(sfx),gain,checks,limits:'Zero-offset decoded signal comparison; no semantic listening or perceptual-quality claim.'};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({ok:result.ok,output,checks:checks.length}));if(!result.ok)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
