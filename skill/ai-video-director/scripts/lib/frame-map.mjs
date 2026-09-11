import {invariant,finite} from './media-contract.mjs';

// Half-open integer frames; a single transform is shared by every visual layer.
export function validateFrameMap(map) {
  invariant(map?.schemaVersion===1 && typeof map.sourceVersion==='string' && map.sourceVersion.trim(),'Frame map requires sourceVersion');
  finite(map.sourceFps,'sourceFps',0.001,240);finite(map.outputFps,'outputFps',0.001,240);
  invariant(Number.isInteger(map.sourceFrames)&&map.sourceFrames>0,'sourceFrames required');
  invariant(Array.isArray(map.segments)&&map.segments.length,'Frame map segments required');
  let end=0;const ids=new Set();
  for(const s of map.segments) {
    invariant(typeof s.id==='string'&&s.id&&!ids.has(s.id),'Unique frame segment id required');ids.add(s.id);
    for(const k of ['sourceStartFrame','sourceEndFrame','startFrame','endFrame']) invariant(Number.isInteger(s[k]),`${s.id}.${k} must be an integer`);
    invariant(s.sourceStartFrame>=0&&s.sourceEndFrame>s.sourceStartFrame&&s.sourceEndFrame<=map.sourceFrames,'Source range out of bounds');
    invariant(s.startFrame===end&&s.endFrame>end,'Output map must be contiguous');
    finite(s.rate,'rate',0.01,100);
    const expected=Math.round((s.sourceEndFrame-s.sourceStartFrame)/map.sourceFps/s.rate*map.outputFps);
    invariant(s.endFrame-s.startFrame===expected,'Frame range does not match rate');end=s.endFrame;
  }
  invariant(end===map.durationFrames,'Frame map duration mismatch');return map;
}
export function rebaseLayers(map,layers) {
  validateFrameMap(map);invariant(layers?.sourceVersion===map.sourceVersion,'Layer source version differs');
  invariant(Array.isArray(layers.items),'Layer items required');const items=[],collapsed=[],ids=new Set();
  for(const item of layers.items) {
    invariant(!ids.has(item.id),'Duplicate layer item id');ids.add(item.id);
    invariant(item.id&&item.layer&&Number.isInteger(item.startFrame)&&Number.isInteger(item.endFrame)&&item.startFrame>=0&&item.endFrame>item.startFrame&&item.endFrame<=map.sourceFrames,'Invalid source layer interval');
    for(const s of map.segments) {
      const a=Math.max(item.startFrame,s.sourceStartFrame),b=Math.min(item.endFrame,s.sourceEndFrame);if(a>=b)continue;
      const at=n=>s.startFrame+Math.round((n-s.sourceStartFrame)/(s.sourceEndFrame-s.sourceStartFrame)*(s.endFrame-s.startFrame));
      const startFrame=at(a),endFrame=at(b);if(startFrame===endFrame){collapsed.push({sourceItemId:item.id,segmentId:s.id,reason:'Retimed interval rounds below one output frame; Agent must merge or relocate this cue.'});continue;}
      items.push({...item,id:`${item.id}@${s.id}`,sourceItemId:item.id,startFrame,endFrame,segmentId:s.id});
    }
  }
  items.sort((a,b)=>a.startFrame-b.startFrame||a.id.localeCompare(b.id));
  return {schemaVersion:1,sourceVersion:map.sourceVersion,fps:map.outputFps,durationFrames:map.durationFrames,items,collapsed,ready:collapsed.length===0};
}
