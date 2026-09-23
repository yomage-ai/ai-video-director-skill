#!/usr/bin/env node
import path from 'node:path';
import {artifact,invariant} from './lib/media-contract.mjs';
import {checkProgramReview} from './lib/program-review.mjs';
try {const [plan,review,master]=process.argv.slice(2);invariant(plan&&review,'Usage: audit-program-review.mjs plan review [final-master]');console.log(JSON.stringify(checkProgramReview(artifact(plan),artifact(review),process.cwd(),{renderRef:master?artifact(master):undefined}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
