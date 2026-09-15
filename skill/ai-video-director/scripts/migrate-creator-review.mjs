#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,sameFile,invariant} from './lib/media-contract.mjs';

// Retire only obsolete listening prerequisites. Preserve all approvals and
// actual editor, permission, billing and known-defect recovery records.
export function migrateCreatorReview(file) {
 const target=path.resolve(file),m=JSON.parse(readFileSync(target,'utf8'));
 invariant(m.schemaVersion===1,'Unknown pipeline schema');
 const changes=[];
 for(const [stage,job] of Object.entries(m.jobs||{})) {
  if(job.requiresCapabilities?.includes('source-listen')) {
   job.requiresCapabilities=job.requiresCapabilities.filter(x=>x!=='source-listen');changes.push(`${stage}: retired source-listen`);
  }
 }
 const policy=artifact(fileURLToPath(new URL('../references/creator-feedback-review.md',import.meta.url)));
 for(const b of m.recovery?.blockers||[]) {
  if(b.status!=='resolved' && ['actual-auditory-review','source-listen'].includes(b.id)
    && ['quality','capability'].includes(b.kind) && !b.alternativeRoute) {
   b.status='resolved';b.qualityRequirementsPreserved=true;
   b.resolution={verifiedAt:new Date().toISOString(),evidence:policy,detail:'Obsolete listening-model prerequisite retired by the creator-feedback workflow; no model test or Agent listening pass is claimed.'};
   changes.push(`${b.id}: retired prerequisite, not an auditory pass`);
  }
 }
 if(changes.length) writeFileSync(target,JSON.stringify(m,null,2)+'\n');
 return {ok:true,changes,reviewMode:'creator-feedback',approvalsPreserved:true,
  next:'For legacy schema 4/5 review, prepare a new schema 6 file from the same render receipt and carry only actual checks. Reuse valid creator approval; never ask for a listening model.'};
}
if(process.argv[1]&&existsSync(process.argv[1])&&sameFile(process.argv[1],fileURLToPath(import.meta.url))) {
 try { invariant(process.argv[2],'Usage: migrate-creator-review.mjs <pipeline.json>');console.log(JSON.stringify(migrateCreatorReview(process.argv[2]),null,2)); }
 catch(error){console.error(error.message);process.exitCode=1;}
}
