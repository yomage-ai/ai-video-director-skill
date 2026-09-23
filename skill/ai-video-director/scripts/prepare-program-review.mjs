#!/usr/bin/env node
import {writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {artifact,json,invariant} from './lib/media-contract.mjs';
import {checkProgramPlan,programReviewFrames} from './lib/program-review.mjs';
try {
 const [input,output,master]=process.argv.slice(2);invariant(input&&output,'Usage: prepare-program-review.mjs plan.json new-review.json [final-master]');
 invariant(!existsSync(output),'Review exists; preserve it and create a new version');
 const plan=json(input);checkProgramPlan(plan,path.dirname(path.resolve(input)));
 const frames=programReviewFrames(plan);
 writeFileSync(output,JSON.stringify({schemaVersion:1,planSha256:artifact(input).sha256,phase:master?'final':'preflight',render:master?artifact(master):null,method:'',unresolved:[],frames:frames.map(frame=>({frame,status:'pending',observation:'',image:null,boxes:[]})),audioMix:null},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({output,frames:frames.length,next:'Agent renders/inspects these states, records measured readable-object boxes and evidence. Preparation is not a pass.'}));
}catch(e){console.error(e.message);process.exitCode=1;}
