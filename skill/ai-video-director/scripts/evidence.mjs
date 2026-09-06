#!/usr/bin/env node
import {artifact,invariant} from './lib/media-contract.mjs';
const [command,...files]=process.argv.slice(2);
invariant(command==='bind' && files.length,'Usage: evidence.mjs bind <file> [file...]');
console.log(JSON.stringify(files.map(artifact),null,2));
