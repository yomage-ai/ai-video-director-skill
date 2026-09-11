import {invariant,resolveArtifact,probe} from './media-contract.mjs';
const text=x=>typeof x==='string'&&x.trim().length>0;

export function checkInformationPlan(plan) {
  invariant(plan?.schemaVersion===1&&Array.isArray(plan.claims)&&plan.claims.length,'Information claims required');
  const ids=new Set();
  for(const c of plan.claims) {
    invariant(text(c.id)&&!ids.has(c.id)&&text(c.viewerBenefit),'Unique claim and viewer benefit required');ids.add(c.id);
    invariant(Array.isArray(c.occurrences)&&c.occurrences.length,'Claim occurrences required');
    invariant(c.occurrences.filter(o=>o.role==='primary').length===1,'Each claim needs exactly one primary telling');
    for(const o of c.occurrences) {
      invariant(['primary','support','recall','locked-source'].includes(o.role)&&text(o.sourceId)&&text(o.locator),'Claim occurrence requires source and role');
      invariant(['presenter','screen-dialogue','screen-explanation','other'].includes(o.speaker),'Information role is not the media filename');
      if(o.role!=='primary') invariant(text(o.addedValue),'Repeated/supporting content requires added value or locked-source rationale');
    }
  }
  return true;
}

export function checkPresentation(p,base,{sample,dimensions}={}) {
  invariant(p?.schemaVersion===1,'Presentation contract required');
  invariant(typeof p.cutoutUsed==='boolean','Declare whether a cutout is used');
  const required=['captions','progress','presenter','screen','graphics','audio'];
  invariant(['landscape','portrait'].includes(p.orientation),'Presentation orientation required');
  if(dimensions) invariant(p.orientation===(dimensions.width>=dimensions.height?'landscape':'portrait'),'Presentation orientation differs from canvas');
  for(const key of required) {
    const e=p.elements?.[key];invariant(['present','absent'].includes(e?.state)&&text(e.reason),`Declare ${key} present/absent and reason`);
    if(e.state==='present') {
      invariant(e.review?.normalSpeed===true&&text(e.review.method)&&text(e.review.observation),`${key} requires actual dynamic sample observation`);
      resolveArtifact(e.review.evidence,base,`${key} review evidence`);
      if(sample) invariant(e.review.sampleSha256===sample.sha256,`${key} reviewed another sample`);
    }
  }
  if(p.orientation==='landscape') invariant(p.portraitSafeCoordinatesApplied===false,'Do not inherit portrait coordinates on a landscape canvas');
  if(p.preset==='xiaoxiong-landscape-screen-v1') {
    invariant(p.elements.captions.state==='present'&&p.elements.progress.state==='present','Landscape preset includes captions and top progress');
    invariant(p.captions?.surface==='transparent'&&p.captions.align==='center'&&p.captions.layer==='topmost','Landscape captions must remain transparent, centered and topmost');
    invariant(p.progress?.edge==='top','Landscape progress belongs at top');
  }
  for(const r of p.screenRuns||[]) {
    invariant(['primary','support'].includes(r.role)&&text(r.sourceId)&&text(r.locator),'Screen run source and narrative role required');
    invariant(r.loop===false,'Repeated screen-operation loop is not valid supporting footage');
    invariant(['video','still'].includes(r.format),'Screen format required');
    if(r.format==='still') invariant(text(r.stillReason),'Still exception needs readability/content reason');
    if(r.role==='support') invariant(r.muted===true,'Supporting screen audio must be muted');
  }
  if(p.elements.screen.state==='present') invariant(p.screenRuns?.length,'Declare actual screen runs');
  if(p.cutoutUsed===true) {
    invariant(p.elements.presenter.state==='present','Cutout requires presenter');
    for(const key of ['hair','shoulders','hands','chairExcluded','temporalEdges']) invariant(text(p.matteReview?.[key]),`Moving matte review missing ${key}`);
    invariant(p.matteReview.normalSpeed===true,'Matte requires moving review');resolveArtifact(p.matteReview.evidence,base,'moving matte evidence');
  }
  if(sample) {
    const media=probe(resolveArtifact(sample,base,'complete dynamic sample'));
    invariant(media.streams.some(s=>s.codec_type==='video')&&media.streams.some(s=>s.codec_type==='audio'),'Complete sample must include video and audio');
  }
  return true;
}

export function checkInteriorReview(review,edl,programSha256,base) {
  invariant(review?.programSha256===programSha256,'Interior audit belongs to another render');
  invariant(Array.isArray(review.intervals)&&review.intervals.length===edl.segments.length,'Every retained interval needs an interior audit');
  const classes=['restart','mouth-preparation','blink-reset','literal-repeat','semantic-repeat'];
  for(const [i,s] of edl.segments.entries()) {
    const r=review.intervals[i];
    invariant(r.segmentId===s.id&&r.startFrame===s.outputStartFrame&&r.endFrame===s.outputEndFrameExclusive,'Interior interval differs from EDL');
    invariant(r.normalSpeedAudio===true&&r.normalSpeedMotion===true&&text(r.method),'Interior review requires actual sound and motion, not ASR/stills');
    resolveArtifact(r.evidence,base,'interior review evidence');
    for(const kind of classes) invariant(['clear','repaired','intentional'].includes(r.classes?.[kind]),`Unresolved interior defect class ${kind}`);
    invariant(text(r.observation),'Interior review observation required');
  }
}
