#!/usr/bin/env node
import path from 'node:path';
import {json,invariant} from './lib/media-contract.mjs';
import {appendIteration} from './lib/iteration-log.mjs';
try {
  const [project,file]=process.argv.slice(2);invariant(file,'Usage: record-iteration.mjs <external-project> <event.json>');
  console.log(JSON.stringify(appendIteration(path.resolve(project),json(file)),null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
