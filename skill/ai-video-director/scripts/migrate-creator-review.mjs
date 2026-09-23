#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artifact,sameFile,invariant,resolveArtifact} from './lib/media-contract.mjs';

// Retire only obsolete listening prerequisites. Preserve all approvals and
// actual editor, permission, billing and known-defect recovery records.
export function migrateCreatorReview(file,{classificationFile}={}) {
 const target=path.resolve(file),m=JSON.parse(readFileSync(target,'utf8'));
 invariant(m.schemaVersion===1,'Unknown pipeline schema');
 const classifications=new Map();
 if(classificationFile) {
  const source=path.resolve(classificationFile),c=JSON.parse(readFileSync(source,'utf8'));
  invariant(c.pipelineSha256===artifact(target).sha256,'Classification belongs to another pipeline version');
  invariant(Array.isArray(c.blockers),'Agent blocker classification required');
  for(const r of c.blockers) {
   invariant(!classifications.has(r.id),'Duplicate blocker classification');
   const b=m.recovery?.blockers?.find(b=>b.id===r.id);
   invariant(b && ['actual-auditory-review','source-listen'].includes(b.id) && ['quality','capability'].includes(b.kind) && !b.alternativeRoute,'Only obsolete listening prerequisites can be retired');
   invariant(!b.knownDefects?.length && !b.unresolvedIssues?.length,'Known defects cannot be retired as prerequisites');
   invariant(r.scope==='obsolete-prerequisite-only' && typeof r.reason==='string' && r.reason.trim(),'Agent must classify the actual obstruction, not only its id');
   resolveArtifact(r.evidence,path.dirname(source),'blocker classification evidence');
   classifications.set(r.id,{...r,classification:artifact(source)});
  }
 }
 const changes=[];
 for(const [stage,job] of Object.entries(m.jobs||{})) {
  if(job.requiresCapabilities?.includes('source-listen')) {
   job.requiresCapabilities=job.requiresCapabilities.filter(x=>x!=='source-listen');changes.push(`${stage}: retired source-listen`);
  }
 }
 const agentReviewRequired=[];
 for(const b of m.recovery?.blockers||[]) {
  if(b.status!=='resolved' && ['actual-auditory-review','source-listen'].includes(b.id)
    && ['quality','capability'].includes(b.kind) && !b.alternativeRoute) {
   if(!classifications.has(b.id)) { agentReviewRequired.push(b.id); continue; }
   const r=classifications.get(b.id);
   b.status='resolved';b.qualityRequirementsPreserved=true;
   b.resolution={verifiedAt:new Date().toISOString(),evidence:r.classification,detail:r.reason+'; obsolete prerequisite retired, no Agent listening pass claimed.'};
   changes.push(`${b.id}: retired prerequisite, not an auditory pass`);
  }
 }
 if(changes.length) writeFileSync(target,JSON.stringify(m,null,2)+'\n');
 return {ok:true,changes,agentReviewRequired,reviewMode:'creator-feedback',approvalsPreserved:true,
  next:'For legacy schema 4/5 review, prepare a new schema 6 file from the same render receipt and carry only actual checks. Reuse valid creator approval; never ask for a listening model.'};
}
if(process.argv[1]&&existsSync(process.argv[1])&&sameFile(process.argv[1],fileURLToPath(import.meta.url))) {
 try { invariant(process.argv[2],'Usage: migrate-creator-review.mjs <pipeline.json> [--classification file.json]');const i=process.argv.indexOf('--classification');invariant(i<0 || process.argv[i+1],'Classification file required');console.log(JSON.stringify(migrateCreatorReview(process.argv[2],{classificationFile:i<0?undefined:process.argv[i+1]}),null,2)); }
 catch(error){console.error(error.message);process.exitCode=1;}
}
