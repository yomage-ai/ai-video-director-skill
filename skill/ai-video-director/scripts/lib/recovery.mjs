import {artifact,invariant,resolveArtifact} from './media-contract.mjs';

const userKinds=new Set(['authentication','permission','billing','route-change']);
const kinds=new Set([...userKinds,'capability','quality','technical']);

// Classify the real obstruction without choosing a substitute provider or model.
export function recoveryAction(kind,provider,detail) {
  invariant(kinds.has(kind),'Unknown recovery kind');
  invariant(typeof provider==='string' && provider.trim(),'Recovery provider required');
  invariant(typeof detail==='string' && detail.trim(),'Concrete recovery detail required');
  return {kind,provider,detail,actor:userKinds.has(kind)?'user':'agent',
    dependentExecution:'blocked',automaticFallbackAllowed:false,
    next:kind==='authentication'?'Show the official sign-in flow, let the user complete login/consent, then verify a real call.'
      :kind==='permission'?'Show the denied action, destination and data scope; wait for user authorization.'
      :kind==='billing'?'Show the required charge or quota and wait for the user; do not purchase or change providers.'
      :kind==='route-change'?'Present the exact model/provider, privacy, cost and quality impact; wait for the user.'
      :kind==='capability'?'Verify the current host input path. If a different model/provider is needed, record a route-change blocker and ask before adopting it.'
      :kind==='quality'?'Repair and recheck the affected defect class across the full relevant program; preserve the acceptance standard.'
      :'Diagnose and repair the same authorized route; escalate any login, permission, charge or route change.'};
}

export function verifyRecovery(recovery,base) {
  if (recovery===undefined) return []; // Existing manifests can migrate on resume.
  invariant(recovery?.schemaVersion===1 && Array.isArray(recovery.blockers),'Invalid recovery state');
  const evidence=[],ids=new Set();
  for (const b of recovery.blockers) {
    invariant(b && typeof b.id==='string' && b.id && !ids.has(b.id),'Recovery blocker requires a unique id');
    ids.add(b.id);
    invariant(kinds.has(b.kind) && b.provider && b.detail,'Recovery blocker requires kind, provider and concrete detail');
    invariant(b.status==='resolved',`Recovery blocked: ${b.id} (${b.kind}): ${b.detail}`);
    invariant(b.qualityRequirementsPreserved===true,'Recovery cannot lower the acceptance standard');
    invariant(b.resolution && Number.isFinite(Date.parse(b.resolution.verifiedAt)),'Recovery needs a verified resolution');
    evidence.push(artifact(resolveArtifact(b.resolution.evidence,base,'recovery verification evidence')));
    if (userKinds.has(b.kind) || b.alternativeRoute) {
      const consent=b.resolution.userAuthorization;
      invariant(consent?.approvedBy==='user' && Number.isFinite(Date.parse(consent.approvedAt)),
        'Recovery requires user authorization; successful fallback is not consent');
      evidence.push(artifact(resolveArtifact(consent.evidence,base,'recovery user authorization')));
    }
  }
  return evidence;
}
