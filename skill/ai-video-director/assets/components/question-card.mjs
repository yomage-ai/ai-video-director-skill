// Renderer-neutral, seek-safe geometry. Caller renders text/icons, registers
// large/docked boxes in the program plan and schedules optional SFX separately.
export function questionCardState({frame,start,readEnd,settle,end,large,docked,titleSizes,entranceFrames=8}){
 if(![start,readEnd,settle,end,entranceFrames].every(Number.isInteger)||!(start<readEnd&&readEnd<settle&&settle<end)||entranceFrames<=0)throw Error('Question card needs ordered integer-frame phases');
 for(const b of [large,docked])if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0)throw Error('Question card rectangles required');
 if(titleSizes && (!Array.isArray(titleSizes)||titleSizes.length!==2||!titleSizes.every(x=>Number.isFinite(x)&&x>0)))throw Error('Two readable title sizes required');
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=t=>1-(1-t)**3;
 if(frame<start||frame>=end)return {visible:false,opacity:0,rect:{...large},phase:'absent'};
 const entry=ease(clamp((frame-start)/Math.min(entranceFrames,readEnd-start)));
 const t=ease(clamp((frame-readEnd)/(settle-readEnd))),rect={};
 for(const k of ['x','y','width','height'])rect[k]=large[k]+(docked[k]-large[k])*t;
 return {visible:true,opacity:entry,rect,phase:frame<readEnd?'question':frame<settle?'docking':'answer',titleSize:titleSizes?titleSizes[0]+(titleSizes[1]-titleSizes[0])*t:null,detailOpacity:1-t};
}
