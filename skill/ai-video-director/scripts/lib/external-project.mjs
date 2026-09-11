import {existsSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {invariant} from './media-contract.mjs';
export function externalProject(target) {
  let ancestor=path.resolve(target);const missing=[];
  while(!existsSync(ancestor)){missing.unshift(path.basename(ancestor));const parent=path.dirname(ancestor);invariant(parent!==ancestor,'Cannot resolve project parent');ancestor=parent;}
  const resolved=path.resolve(realpathSync(ancestor),...missing),skill=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'));
  const repo=path.resolve(skill,'../..'),boundaries=[skill];
  if(existsSync(path.join(repo,'package.json'))&&existsSync(path.join(repo,'skill','ai-video-director')))boundaries.push(realpathSync(repo));
  invariant(!boundaries.some(root=>resolved===root||resolved.startsWith(root+path.sep)),'Project and private artifacts must remain outside the Skill repository');
  return resolved;
}
