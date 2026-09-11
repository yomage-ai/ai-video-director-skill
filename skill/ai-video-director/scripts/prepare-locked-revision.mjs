#!/usr/bin/env node
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,json,invariant} from './lib/media-contract.mjs';
import {videoSpec} from './lib/locked-master.mjs';
import {externalProject} from './lib/external-project.mjs';
try {
  const [masterArg,dirArg,version]=process.argv.slice(2);
  invariant(masterArg&&dirArg&&version,'Usage: prepare-locked-revision.mjs <master> <new-external-directory> <version>');
  const master=artifact(path.resolve(masterArg)),dir=externalProject(dirArg),skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  invariant(!existsSync(dir),'Use a new project directory outside this repository');
  const outputSpec=videoSpec(master.path),presentation=json(path.join(skill,'assets/templates/presentation.template.json'));
  if(outputSpec.width<outputSpec.height) Object.assign(presentation,{orientation:'portrait',preset:null});
  const plan={schemaVersion:1,version,masterSha256:master.sha256,kind:'visual-only',audio:'preserve',timing:'identity',outputSpec,changes:[],inheritedExceptions:[],styleChanged:null,sample:null,informationPlan:{schemaVersion:1,claims:[]},presentation};
  const m={schemaVersion:1,projectId:path.basename(dir),language:'zh-CN',outputScope:'locked-master',publicationInScope:false,master,
    recovery:{schemaVersion:1,blockers:[]},artifacts:{revisionPlan:'revision-plan.json',capabilities:'capabilities.json',revisionRenderReceipt:'candidate.mp4.stage.json',revisionQa:'revision-qa.json',revisionVisualReview:'revision-visual-review.json'},
    approvals:{master:null,change:null,sample:null,release:null},supporting:{editableProject:null,captions:null,learningLedger:null},
    jobs:{'revision-render':{argv:[],inputs:[],outputPath:'candidate.mp4',outputSpec,requiresCapabilities:['ffmpeg','ffprobe'],renderKind:'full'}}};
  mkdirSync(dir,{recursive:true});for(const [name,data] of Object.entries({'revision-plan.json':plan,'pipeline.json':m}))writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({project:dir,status:'unapproved-scaffold',next:'Agent records actual approvals, allowed changes, dynamic sample, code/assets and capabilities; no rendering authorized by scaffold.'},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
