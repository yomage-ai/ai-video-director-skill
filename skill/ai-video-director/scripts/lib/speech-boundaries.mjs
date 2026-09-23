import path from 'node:path';
import {invariant,joins,resolveArtifact,verifyAudioWindow} from './media-contract.mjs';
const text=x=>typeof x==='string'&&x.trim();
// Conditional protection of source-labelled words, NOT automatic speech recognition.
export function checkSpeechBoundaries(data,bound,base,{verifyWindows=true}={}){
 invariant(data.schemaVersion===1,'Source speech boundary schema 1 required');
 invariant(data.programSha256===bound.receipt.output.sha256&&data.edlSha256===bound.receipt.edl.sha256,'Speech boundary evidence belongs to another render/EDL');
 const expected=joins(bound.edl),fps=bound.edl.outputFps,sourceFiles=new Map();
 invariant(data.joins?.length===expected.length,'Protect both source words at every join');
 return expected.map((join,i)=>{
  const row=data.joins[i];invariant(row.boundaryId===join.boundaryId,'Source word evidence join mismatch');
  const mapped={};
  for(const [side,segment] of [['outgoing',bound.edl.segments[i]],['incoming',bound.edl.segments[i+1]]]){
   const x=row[side],rate=segment.playbackRate??1,sourceId=segment.sourceId||segment.sourceFile;
   invariant(x&&x.sourceId===sourceId&&text(x.token)&&text(x.locationMethod)&&text(x.uncertaintyReason),'Source ID, boundary word, location method and uncertainty explanation required');
   invariant(['waveform-and-word-context','spectrogram-and-word-context','creator-confirmed-source'].includes(x.basis),'ASR or silence threshold alone is not source boundary evidence');
   invariant(Array.isArray(x.protectedRange)&&x.protectedRange.length===2&&x.protectedRange.every(Number.isFinite)&&x.protectedRange[0]>=0&&x.protectedRange[1]>x.protectedRange[0],'Protected complete word range required');
   invariant(Array.isArray(x.edgeRange)&&x.edgeRange.length===2&&x.edgeRange.every(Number.isFinite)&&x.edgeRange[0]>=x.protectedRange[0]&&x.edgeRange[1]>=x.edgeRange[0]&&x.edgeRange[1]<=x.protectedRange[1],'Speech edge uncertainty range must be within protected word');
   invariant(side==='outgoing'?x.edgeRange[1]===x.protectedRange[1]:x.edgeRange[0]===x.protectedRange[0],'Protection must include the outer uncertain speech edge');
   const sourceEnd=segment.sourceEndSeconds??segment.sourceStartSeconds+segment.durationSeconds*rate;
   const fade=segment.processing?.audio||{};
   // A frame tolerance here could silently remove a soft consonant: no edit tolerance.
   invariant(x.protectedRange[0]>=segment.sourceStartSeconds+(fade.fadeInSeconds||0)*rate-1e-9&&x.protectedRange[1]<=sourceEnd-(fade.fadeOutSeconds||0)*rate+1e-9,'Cut or fade intrudes into protected speech; widen cut handles, do not move the label to make it pass');
   if(verifyWindows){
    const src=bound.receipt.sources?.find(s=>s.sourceId===sourceId);invariant(src,'Unbound source for speech evidence');
    if(!sourceFiles.has(sourceId))sourceFiles.set(sourceId,resolveArtifact(src,path.dirname(bound.file),'source word media'));
    const source=sourceFiles.get(sourceId);
    const w=x.window;invariant(w&&Number.isFinite(w.startSeconds)&&Number.isFinite(w.endSeconds)&&w.startSeconds>=0&&w.startSeconds<=x.protectedRange[0]&&w.endSeconds>=x.protectedRange[1],'Source context window must contain protected word');
    const wav=resolveArtifact(w.audio,base,'source context WAV');resolveArtifact(w.spectrogram,base,'source context spectrogram');
    verifyAudioWindow(source,wav,w.startSeconds,w.endSeconds-w.startSeconds);
   }
   mapped[side]=x.edgeRange.map(t=>segment.outputStartFrame/fps+(t-segment.sourceStartSeconds)/rate);
  }
  if(verifyWindows){
   const w=row.renderedWindow;invariant(w&&Number.isFinite(w.startSeconds)&&Number.isFinite(w.endSeconds)&&w.startSeconds>=0&&w.startSeconds<=mapped.outgoing[0]&&w.endSeconds>=mapped.incoming[1],'Rendered comparison window must cover both speech edges');
   const wav=resolveArtifact(w.audio,base,'rendered comparison WAV');resolveArtifact(w.spectrogram,base,'rendered comparison spectrogram');
   verifyAudioWindow(bound.program,wav,w.startSeconds,w.endSeconds-w.startSeconds);
  }
  return {boundaryId:join.boundaryId,...mapped,gapRangeSeconds:[mapped.incoming[0]-mapped.outgoing[1],mapped.incoming[1]-mapped.outgoing[0]]};
 });
}
