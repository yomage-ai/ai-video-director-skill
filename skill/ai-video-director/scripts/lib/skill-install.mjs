import {mkdirSync,renameSync,symlinkSync,lstatSync,readlinkSync,unlinkSync} from 'node:fs';
import path from 'node:path';

// Caller verifies Skill identity and update authorization. Roll back only the
// link created by this transaction; a concurrent replacement belongs to others.
export function switchSkillWithRollback({destination,source,backupRoot,setup}) {
  mkdirSync(backupRoot,{recursive:true});
  const backup=path.join(backupRoot,`ai-video-director-${Date.now()}`);
  try { lstatSync(backup); throw new Error('Backup already exists'); }
  catch(e) { if(e.code!=='ENOENT') throw e; }
  renameSync(destination,backup);
  try { symlinkSync(source,destination,'dir'); }
  catch(e) { renameSync(backup,destination); throw e; }
  let result;
  try { result=setup(); }
  catch(e) { result={ok:false,error:e.message}; }
  if(result?.ok===true) return {status:'updated',destination,source,backup,setup:result};
  let owned=false;
  try { owned=lstatSync(destination).isSymbolicLink() && path.resolve(path.dirname(destination),readlinkSync(destination))===path.resolve(source); }
  catch(e) { if(e.code!=='ENOENT') throw e; }
  if(!owned) return {status:'recovery-required',destination,source,backup,setup:result,
    error:'Destination changed during setup; preserve it and the backup for Agent recovery.'};
  unlinkSync(destination);
  renameSync(backup,destination);
  return {status:'rolled-back',destination,source,setup:result,
    error:'Setup failed; previous Skill installation restored. Dependency-side changes are recorded in the setup receipt.'};
}
