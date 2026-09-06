import {createHash} from 'node:crypto';
import {openSync, readSync, closeSync, readFileSync, statSync, realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

export function sha256(file) {
  const fd = openSync(file, 'r');
  const hash = createHash('sha256');
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let length;
    while ((length = readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, length));
    return hash.digest('hex');
  } finally { closeSync(fd); }
}
export const sameFile = (a,b) => realpathSync(a) === realpathSync(b);
export const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
export function invariant(condition, message) { if (!condition) throw new Error(message); }
export function finite(value, name, min = 0, max = Infinity) {
  invariant(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max,
    `${name} must be a finite number in [${min}, ${max}]`);
  return value;
}
export function artifact(file) {
  invariant(statSync(file).isFile() && statSync(file).size > 0, `Empty/non-file artifact: ${file}`);
  return {path: realpathSync(file), sha256: sha256(file)};
}
export function resolveArtifact(ref, base, label = 'artifact') {
  invariant(ref && typeof ref.path === 'string' && /^[a-f0-9]{64}$/.test(ref.sha256), `${label}: path and SHA-256 required`);
  const file = path.resolve(base, ref.path);
  invariant(statSync(file).isFile() && statSync(file).size > 0, `${label}: missing or empty file`);
  invariant(sha256(file) === ref.sha256, `${label}: stale file hash`);
  return file;
}
export function probe(file) {
  return JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding:'utf8'}));
}
export function decode(file) {
  execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-map', '0:v?', '-map', '0:a?', '-f', 'null', '-'], {stdio:'pipe'});
}
export function verifyAudioWindow(program,window,startSeconds,durationSeconds) {
  const maxBuffer=Math.ceil(durationSeconds*48000*2)+1024*1024;
  const pcm=(file,seek)=>execFileSync('ffmpeg',['-v','error',...(seek ? ['-ss',String(startSeconds)] : []),'-i',file,
    '-t',String(durationSeconds),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le','-f','s16le','pipe:1'],{maxBuffer});
  const hash=b=>createHash('sha256').update(b).digest('hex');
  invariant(hash(pcm(program,true))===hash(pcm(window,false)),'Window audio does not match the claimed program interval; regenerate it from this render');
}
export function validateEdl(edl) {
  invariant([1, 2].includes(edl.schemaVersion), 'Unsupported EDL schema');
  finite(edl.outputFps, 'outputFps', 0.001, 240);
  invariant(Number.isInteger(edl.durationFrames) && edl.durationFrames > 0, 'durationFrames must be a positive integer');
  invariant(Array.isArray(edl.segments) && edl.segments.length > 0, 'EDL has no segments');
  let end = 0;
  const ids = new Set();
  for (const s of edl.segments) {
    invariant(typeof s.id === 'string' && s.id && !ids.has(s.id), 'EDL segment IDs must be unique');
    ids.add(s.id);
    invariant(s.outputStartFrame === end && Number.isInteger(s.outputEndFrameExclusive) && s.outputEndFrameExclusive > end, `Noncontiguous EDL: ${s.id}`);
    const duration = (s.outputEndFrameExclusive - s.outputStartFrame) / edl.outputFps;
    finite(s.sourceStartSeconds, `${s.id}.sourceStartSeconds`);
    finite(s.durationSeconds, `${s.id}.durationSeconds`, 0.000001);
    invariant(Math.abs(s.durationSeconds - duration) < 1e-7, `Output duration mismatch: ${s.id}`);
    const rate = finite(s.playbackRate ?? 1, `${s.id}.playbackRate`, 0.25, 4);
    if (s.sourceFps !== undefined) finite(s.sourceFps, `${s.id}.sourceFps`, 0.001, 240);
    if (edl.schemaVersion === 2) {
      invariant(typeof s.sourceId === 'string' && s.sourceId, `Missing sourceId: ${s.id}`);
      finite(s.sourceEndSeconds, `${s.id}.sourceEndSeconds`, s.sourceStartSeconds + 0.000001);
      invariant(Math.abs(s.sourceEndSeconds - s.sourceStartSeconds - duration * rate) <= 1.5 / (s.sourceFps || edl.outputFps), `Source duration/rate mismatch: ${s.id}`);
    }
    validateProcessing(s.processing || {}, duration);
    end = s.outputEndFrameExclusive;
  }
  invariant(end === edl.durationFrames, 'EDL final frame mismatch');
  invariant(Math.abs(edl.durationSeconds - end / edl.outputFps) < 1e-7, 'EDL total duration mismatch');
  return edl;
}
export function validateProcessing(p, duration) {
  invariant(p && typeof p === 'object' && !Array.isArray(p), 'processing must be an object');
  for (const key of Object.keys(p)) invariant(['video','audio'].includes(key), `Unsupported processing: ${key}`);
  for (const key of ['video','audio']) if (p[key] !== undefined) {
    invariant(p[key] && typeof p[key] === 'object' && !Array.isArray(p[key]), `${key} processing must be an object`);
  }
  const limits = {brightness:[-1,1], contrast:[0,4], saturation:[0,4], gamma:[0.1,10]};
  for (const [k,v] of Object.entries(p.video || {})) {
    invariant(limits[k], `Unsupported video operation: ${k}`);
    finite(v, k, ...limits[k]);
  }
  for (const [k,v] of Object.entries(p.audio || {})) {
    invariant(['gainDb','fadeInSeconds','fadeOutSeconds'].includes(k), `Unsupported audio operation: ${k}`);
    finite(v,k,k==='gainDb'?-60:0,k==='gainDb'?24:duration/2);
  }
}
export function joins(edl) {
  return edl.segments.slice(1).map((s,i)=>({boundaryId:`${edl.segments[i].id}--${s.id}`,
    timelineFrame:s.outputStartFrame, timelineTimeSeconds:s.outputStartFrame/edl.outputFps}));
}
export function verifyRenderReceipt(ref, base) {
  const file = resolveArtifact(ref,base,'renderReceipt');
  const receipt = json(file);
  const dir = path.dirname(file);
  invariant(receipt.schemaVersion === 1 && receipt.fullDecodePassed === true, 'Render receipt requires a completed full decode');
  const edlPath = resolveArtifact(receipt.edl,dir,'render EDL');
  const edl = validateEdl(json(edlPath));
  if (edl.timingSource) resolveArtifact(edl.timingSource,path.dirname(edlPath),'timing XML');
  if (edl.processingPlan) resolveArtifact(edl.processingPlan,path.dirname(edlPath),'processing plan');
  const program = resolveArtifact(receipt.output,dir,'render output');
  invariant(Array.isArray(receipt.sources) && receipt.sources.length > 0, 'Render source bindings required');
  for (const source of receipt.sources) {
    resolveArtifact(source,dir,'render source');
    if(source.lineage) {
      resolveArtifact(source.lineage.original,dir,'derived original');
      resolveArtifact(source.lineage.derivation,dir,'derivation record');
    }
  }
  const sourceIds = receipt.sources.map(s=>s.sourceId);
  invariant(new Set(sourceIds).size === sourceIds.length, 'Duplicate render source IDs');
  for (const s of edl.segments) invariant(sourceIds.includes(s.sourceId || s.sourceFile), `Unbound render source: ${s.id}`);
  const media = probe(program);
  const video = media.streams.find(s=>s.codec_type==='video');
  const audio = media.streams.find(s=>s.codec_type==='audio');
  invariant(video && audio, 'Render output requires video and audio');
  invariant(Math.abs(Number(media.format.duration)-edl.durationSeconds)<Math.max(0.1,2/edl.outputFps), 'Render duration differs from EDL');
  invariant(Number(video.nb_frames) === edl.durationFrames, 'Render frame count differs from EDL');
  return {receipt,file,edl,edlPath,program,media};
}
