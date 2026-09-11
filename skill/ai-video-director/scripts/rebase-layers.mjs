#!/usr/bin/env node
import {writeFileSync} from 'node:fs';
import {json,artifact,invariant} from './lib/media-contract.mjs';
import {rebaseLayers} from './lib/frame-map.mjs';
import {externalProject} from './lib/external-project.mjs';
try {
  const [map,layers,out]=process.argv.slice(2);invariant(out,'Usage: rebase-layers.mjs <frame-map.json> <source-layers.json> <new-layers.json>');
  const result={...rebaseLayers(json(map),json(layers)),dependencies:[artifact(map),artifact(layers)]};
  externalProject(out);
  writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({ok:result.ready,output:out,items:result.items.length,collapsed:result.collapsed}));
  if(!result.ready)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
