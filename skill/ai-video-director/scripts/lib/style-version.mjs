import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const styleDigest=style=>createHash('sha256').update(JSON.stringify(canonical(style))).digest('hex');
// Adding an unrelated candidate must not invalidate a previously approved
// direction. Only explicitly recorded, byte-equivalent style contracts qualify.
export function compatibleStyleVersion(library,version,ids){
 if(version===library.libraryVersion)return true;
 const old=library.compatibleVersions?.[String(version)];
 return Array.isArray(ids)&&ids.length>0&&!!old&&ids.every(id=>{
  const style=library.styles.find(s=>s.id===id);return style&&old.styleDigests?.[id]===styleDigest(style);
 });
}
