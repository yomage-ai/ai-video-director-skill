import {mkdirSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {json,invariant,resolveArtifact,artifact} from './media-contract.mjs';
import {externalProject} from './external-project.mjs';
import {createHash} from 'node:crypto';

const types=['request','render','qa','approval','timing','lesson'];
export function appendIteration(project,event) {
  project=externalProject(project);
  invariant(event?.schemaVersion===1&&/^[a-zA-Z0-9_-]+$/.test(event.id)&&event.projectId&&event.version,'Iteration identity required');
  invariant(types.includes(event.type)&&Number.isFinite(Date.parse(event.occurredAt)),'Iteration type/time required');
  resolveArtifact(event.evidence,project,'iteration evidence');
  if(event.artifact) resolveArtifact(event.artifact,project,'iteration artifact');
  if(['render','qa','approval'].includes(event.type)) invariant(event.artifact,'Output binding required');
  if(event.type==='request') invariant(['quality-repair','aesthetic-trial','content-change','packaging'].includes(event.category),'Request category required');
  if(event.type==='approval') invariant(event.approvedBy==='user','Only explicit user approval counts');
  if(event.type==='timing') invariant(['agent','tool','user-wait'].includes(event.category)&&Number.isFinite(Date.parse(event.startedAt))&&Date.parse(event.endedAt)>=Date.parse(event.startedAt),'Measured time interval required');
  if(event.type==='render') invariant(['full','partial'].includes(event.renderKind)&&['pass','failed'].includes(event.result),'Render kind/result required');
  const dir=path.join(project,'analysis','iterations');mkdirSync(dir,{recursive:true});
  const file=path.join(dir,event.id+'.json');
  if(existsSync(file)) invariant(JSON.stringify(json(file))===JSON.stringify(event),'Iteration id already exists with different contents');
  else writeFileSync(file,JSON.stringify(event,null,2)+'\n',{flag:'wx'});
  const summary=summarizeIterations(dir,event.projectId);
  writeFileSync(path.join(project,'analysis','iteration-summary.json'),JSON.stringify(summary,null,2)+'\n');
  return {event:file,summary};
}
export function summarizeIterations(dir,projectId) {
  const events=readdirSync(dir).filter(x=>x.endsWith('.json')).map(x=>json(path.join(dir,x))).filter(x=>x.projectId===projectId).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt)||a.id.localeCompare(b.id));
  const outputEvents=events.filter(x=>['render','qa','approval'].includes(x.type));
  const last=events.filter(x=>['request','render'].includes(x.type)).at(-1)||outputEvents.at(-1),version=last?.version||events.at(-1)?.version||null;
  const current=outputEvents.filter(x=>x.version===version),lastRender=current.filter(x=>x.type==='render').at(-1);
  const output=lastRender?.artifact||current.at(-1)?.artifact||null;
  const matching=current.filter(x=>x.artifact?.sha256===output?.sha256);
  const seconds=category=>{
    const ranges=events.filter(x=>x.type==='timing'&&x.category===category).map(x=>[Date.parse(x.startedAt),Date.parse(x.endedAt)]).sort((a,b)=>a[0]-b[0]);
    if(!ranges.length)return null;let total=0,a=ranges[0][0],b=ranges[0][1];
    for(const [c,d] of ranges.slice(1)) {if(c>b){total+=b-a;a=c;}b=Math.max(b,d);}return (total+b-a)/1000;
  };
  return {schemaVersion:1,projectId,currentVersion:version,currentOutput:output,creatorAccepted:matching.some(x=>x.type==='approval'&&x.approvedBy==='user'),
    currentQa:matching.filter(x=>x.type==='qa').at(-1)?.result||'unverified',
    requestCounts:Object.fromEntries(['quality-repair','aesthetic-trial','content-change','packaging'].map(k=>[k,events.filter(x=>x.type==='request'&&x.category===k).length])),
    renderCounts:Object.fromEntries(['full','partial'].map(k=>[k,events.filter(x=>x.type==='render'&&x.renderKind===k).length])),
    measuredSeconds:{agent:seconds('agent'),tool:seconds('tool'),'user-wait':seconds('user-wait')},
    lessonEvents:events.filter(x=>x.type==='lesson').length,eventCount:events.length,meaning:'Observed events only; missing time is null. A synthetic test or same-project repair does not establish cross-project quality.'};
}
export function recordStageEvent(c,type,result,evidenceFile) {
  const identity=createHash('sha256').update(JSON.stringify([c.projectId,c.p.version,artifact(c.output).sha256,artifact(evidenceFile).sha256])).digest('hex');
  const id=`${type}-${identity}`,existing=path.join(c.base,'analysis','iterations',id+'.json');
  const occurredAt=existsSync(existing)?json(existing).occurredAt:new Date().toISOString();
  if(['render','qa'].includes(type)) {
    const receipt=json(evidenceFile);
    if(receipt.startedAt&&receipt.completedAt) appendIteration(c.base,{schemaVersion:1,id:`timing-${id}`,projectId:c.projectId,version:c.p.version,type:'timing',category:'tool',occurredAt:receipt.completedAt,startedAt:receipt.startedAt,endedAt:receipt.completedAt,evidence:artifact(evidenceFile)});
  }
  return appendIteration(c.base,{schemaVersion:1,id,projectId:c.projectId,version:c.p.version,
    type,occurredAt,artifact:artifact(c.output),evidence:artifact(evidenceFile),result,
    ...(type==='render'?{renderKind:c.m.jobs['revision-render'].renderKind||'full'}:{}),...(type==='approval'?{approvedBy:'user'}:{})});
}
