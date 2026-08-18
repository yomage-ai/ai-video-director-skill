import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = path.join(repoRoot, 'skill', 'ai-video-director', 'scripts');
const fixture = path.join(repoRoot, 'tests', 'fixtures', 'simple-chatcut.xml');

function runNode(script, args, options = {}) {
  return execFileSync(process.execPath, [path.join(scripts, script), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

test('ChatCut XML converts to a contiguous canonical EDL', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-edl-'));
  const output = path.join(temp, 'canonical-edl.json');
  runNode('chatcut-xml-to-canonical-edl.mjs', [fixture, output]);
  const edl = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(edl.schemaVersion, 1);
  assert.equal(edl.outputFps, 30);
  assert.equal(edl.durationFrames, 60);
  assert.equal(edl.durationSeconds, 2);
  assert.equal(edl.segments.length, 2);
  assert.equal(edl.segments[1].sourceFile, 'source.mp4');
  assert.equal(edl.segments[1].sourceStartSeconds, 2);
});

test('precise EDL renderer produces expected dimensions, frames and duration', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-render-'));
  const source = path.join(temp, 'source.mp4');
  const edlPath = path.join(temp, 'canonical-edl.json');
  const output = path.join(temp, 'a-roll.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000:duration=4',
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', source,
  ]);
  runNode('chatcut-xml-to-canonical-edl.mjs', [fixture, edlPath]);
  runNode('render-canonical-edl.mjs', [edlPath, source, output]);
  const probe = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', output,
  ], {encoding: 'utf8'}));
  const video = probe.streams.find((stream) => stream.codec_type === 'video');
  assert.equal(video.width, 320);
  assert.equal(video.height, 240);
  assert.equal(Number(video.nb_read_frames), 60);
  assert.ok(Math.abs(Number(probe.format.duration) - 2) < 0.08);
});

test('project scaffold stays outside the repository and includes decision artifacts', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-project-'));
  const projectsRoot = path.join(temp, 'projects');
  runNode('director.mjs', ['init-project', '--id', 'test-video', '--root', projectsRoot]);
  const project = path.join(projectsRoot, 'test-video');
  const state = JSON.parse(readFileSync(path.join(project, 'project-state.json'), 'utf8'));
  const intake = JSON.parse(readFileSync(path.join(project, 'intake.json'), 'utf8'));
  const roughCutReview = JSON.parse(
    readFileSync(path.join(project, 'analysis', 'rough-cut-review.json'), 'utf8'),
  );
  const publishPackage = JSON.parse(
    readFileSync(path.join(project, 'analysis', 'publish-package.json'), 'utf8'),
  );
  const learningScope = JSON.parse(
    readFileSync(path.join(project, 'analysis', 'learning-scope-ledger.json'), 'utf8'),
  );
  const deliveryManifest = JSON.parse(
    readFileSync(path.join(project, 'delivery', 'delivery-manifest.json'), 'utf8'),
  );
  assert.equal(state.projectId, 'test-video');
  assert.equal(intake.projectId, 'test-video');
  assert.equal(roughCutReview.projectId, 'test-video');
  assert.equal(roughCutReview.takeSelectionPolicy.principle, 'quality-first');
  assert.equal(roughCutReview.schemaVersion, 2);
  assert.equal(roughCutReview.fullCutReview.listenedFromStartToFinish, false);
  assert.equal(roughCutReview.joinReview.allPlacedItemBoundariesEnumerated, false);
  assert.equal(roughCutReview.manuscriptAudibilityAudit.openingWordsAudible, false);
  assert.equal(roughCutReview.manuscriptAudibilityAudit.verifiedBoundaries[0].normalSpeedAuditioned,
    false);
  assert.deepEqual(roughCutReview.manuscriptAudibilityAudit.acceptancePriority, [
    'intended-word-intelligibility',
    'natural-pause-and-mouth-noise-cleanup',
    'picture-continuity',
  ]);
  assert.equal(roughCutReview.playbackSpeedReview.sourceRate, 1);
  assert.equal(roughCutReview.dialogueLoudnessMatch.integratedLufsMatchedFirst, false);
  assert.equal(roughCutReview.audibleDuplicateAudit.crossSegmentAndClipBoundariesScanned, false);
  assert.equal(roughCutReview.structuralEditReadback.intentionalTransitionsChecked, false);
  assert.equal(roughCutReview.sourceColorNormalization.workflowStage,
    'rough-cut-before-approval');
  assert.equal(roughCutReview.sourceColorNormalization.fineEditReprocessingRequired, false);
  assert.equal(publishPackage.schemaVersion, 1);
  assert.equal(publishPackage.releaseMaster.upscaledReviewProxy, false);
  assert.equal(publishPackage.rulesVerification.guaranteedCompliantClaimAllowed, false);
  assert.equal(learningScope.projectId, 'test-video');
  assert.equal(learningScope.changeTypes.includes('pre-existing-hardened'), true);
  assert.equal(deliveryManifest.projectId, 'test-video');
  assert.equal(deliveryManifest.deliveryChecks.sharedWorkspaceRequiresDownload, false);
  assert.equal(state.currentStageId, '00-intake-preflight');
  assert.equal(path.relative(repoRoot, project).startsWith('..'), true);
});

test('Skill install and uninstall own only their symlink', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-codex-home-'));
  const env = {...process.env, CODEX_HOME: temp};
  const output = JSON.parse(runNode('director.mjs', ['install-skill'], {env}));
  assert.equal(output.status, 'installed');
  assert.equal(realpathSync(output.destination), realpathSync(path.join(repoRoot, 'skill', 'ai-video-director')));
  const removed = JSON.parse(runNode('director.mjs', ['uninstall-skill'], {env}));
  assert.equal(removed.status, 'uninstalled');
});

test('private feedback needs explicit approval before base-profile promotion', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-memory-'));
  const record = JSON.parse(runNode('memory.mjs', [
    'record', '--data-dir', temp, '--project', 'p1', '--category', 'captions',
    '--feedback', 'Use restrained caption motion', '--scope', 'base-candidate',
  ]));
  const denied = spawnSync(process.execPath, [
    path.join(scripts, 'memory.mjs'), 'promote', '--data-dir', temp,
    '--id', record.event.id, '--key', 'captions.motion', '--value-json', '"restrained"',
    '--reason', 'explicit preference',
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(denied.status, 0);

  runNode('memory.mjs', [
    'promote', '--data-dir', temp, '--id', record.event.id,
    '--key', 'captions.motion', '--value-json', '"restrained"',
    '--reason', 'explicit preference', '--confirm-user-approved',
  ]);
  const profile = JSON.parse(readFileSync(path.join(temp, 'profile.json'), 'utf8'));
  assert.equal(profile.preferences.captions.motion, 'restrained');
  assert.equal(profile.promotionHistory[0].sourceFeedbackId, record.event.id);
});

test('approved revisions are isolated and deliverables preserve source lineage', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'director-plan.template.json'),
    'utf8',
  ));
  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'production-standard.md'),
    'utf8',
  );
  const qa = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'qa-report.template.md'),
    'utf8',
  );

  assert.equal(state.roughCutPolicy.finishingPass.approvalChangeIsolation
    .approvedTimelineDuplicatedBeforeRevision, true);
  assert.equal(state.roughCutPolicy.finishingPass.approvalChangeIsolation
    .approvedReusableAssetOverwrittenInPlace, false);
  assert.equal(plan.finishingPass.chapterProgress.component.markerSelection
    .newAssetRequiresStillAndMotionPreview, true);
  assert.match(standard, /Any unexplained difference blocks export/);
  assert.match(standard, /Platform compatibility and source-quality mastery are separate gates/);
  assert.match(standard, /Do not convert a `30 fps` edit to `60 fps` through frame duplication/);
  assert.match(qa, /Last approved timeline, reusable assets, and export were preserved/);
  assert.match(qa, /Platform compatibility was verified separately from source-quality mastery/);
});

test('doctor passes required local dependencies with isolated private paths', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-doctor-'));
  const output = JSON.parse(runNode('director.mjs', ['doctor'], {
    env: {
      ...process.env,
      CODEX_HOME: path.join(temp, 'codex'),
      AI_VIDEO_DIRECTOR_DATA_DIR: path.join(temp, 'private'),
    },
  }));
  assert.equal(output.ok, true);
  assert.equal(output.checks.filter((check) => check.required && check.status !== 'pass').length, 0);
  const hyperframes = output.checks.find((check) => check.name === 'HyperFrames CLI');
  assert.ok(['pass', 'agent-managed-npx-ready'].includes(hyperframes.status));
  assert.match(hyperframes.note, /Installed command|governed pinned HyperFrames version/);
});

test('repeated takes use quality-first selection rather than a latest-take default', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const policy = state.roughCutPolicy.repeatedTakeSelection;
  assert.equal(policy.default, 'quality-first');
  assert.equal(policy.laterOccurrence, 'tie-breaker-only');
  assert.equal(policy.asrRole, 'candidate-detection-only');
  assert.deepEqual(policy.priority, [
    'semantic-correctness-completeness-and-intended-role',
    'delivery-and-visual-performance-quality',
    'audio-video-technical-usability',
    'natural-contextual-join',
  ]);

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /Never keep the last occurrence merely because it was recorded later/);
  assert.match(standard, /prefer the later occurrence as a tie-breaker/);
  assert.match(standard, /Do not remove intentional repetition/);
  assert.match(standard, /Treat a retake cluster as one editorial decision/);
  assert.match(standard, /Do not normalize every pause to one duration/);
  assert.match(standard, /map every `mustKeep` point to `spoken`, `on-screen`, or `both`/);
});

test('dialogue joins require manuscript audibility and rendered mouth-noise review', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const policy = state.roughCutPolicy.pauseAndJoin;
  assert.equal(policy.universalPauseDuration, 'forbidden');
  assert.equal(policy.compactJoinCandidateRangeSeconds, '0.20-0.40-review-only');
  assert.equal(policy.swallowLipSmackAndMouthResetAtChangedJoin, 'remove');
  assert.equal(policy.expectedBoundaryTokensRecorded, true);
  assert.equal(policy.renderedNormalSpeedWindowRequired, true);
  assert.equal(policy.crossfadeRole,
    'click-protection-after-correct-boundary-not-boundary-repair');
  assert.deepEqual(policy.acceptancePriority, [
    'intended-word-intelligibility',
    'natural-pause-and-mouth-noise-cleanup',
    'picture-continuity',
  ]);
  assert.match(policy.repeatedBoundaryWordPolicy, /preserve-complete-retained-occurrence/);

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  const audit = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'dialogue-join-audit.md'),
    'utf8',
  );
  assert.match(standard, /expected last token and expected first token/);
  assert.match(standard, /crossfades as finishing protection, not boundary repair/);
  assert.match(standard, /normal-speed audio playback is unavailable, mark the rough cut unverified/);
  assert.match(audit, /Every intended sentence opening and closing word is fully audible/);
  assert.match(audit, /吞咽、咂嘴、口腔复位/);
  assert.match(audit, /0\.20-0\.40 s/);
  assert.match(audit, /intended word intelligibility -> natural pause and mouth-noise cleanup -> picture continuity/);
  assert.match(audit, /striking the first written occurrence preserves the second spoken onset/);
  assert.match(audit, /transcript strike may map to the wrong acoustic event/);
  assert.match(audit, /choose one acoustic occurrence before adding any crossfade/);
});

test('speed, creator color and loudness baselines are content- and evidence-driven', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  assert.equal(state.roughCutPolicy.playbackSpeed.defaultStartingPoint, '1.00x');
  assert.equal(state.roughCutPolicy.playbackSpeed.fixedHouseRate, 'forbidden');
  assert.equal(state.roughCutPolicy.playbackSpeed.denseExplainerCandidateRange,
    '1.02x-1.06x-review-only');
  assert.match(state.roughCutPolicy.sourceColorNormalization.approvedCreatorBaseline,
    /exact-private-profile-parameters/);
  assert.equal(state.roughCutPolicy.finishingPass.dialogueLoudness.primaryMatchMetric,
    'integrated-lufs');
  assert.equal(state.roughCutPolicy.finishingPass.dialogueLoudness.uiSliderOrPeakOnlyMatch,
    'invalid');

  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'director-plan.template.json'),
    'utf8',
  ));
  assert.equal(plan.roughCut.playbackSpeed.inheritRateFromAnotherVideo, false);
  assert.equal(plan.roughCut.creatorColorBaseline.privateProfileOnly, true);
  assert.equal(plan.finishingPass.dialogueLoudness.integratedLufsIsPrimaryMatchMetric, true);
  assert.equal(plan.finishingPass.dialogueLoudness.uiSliderOrPeakOnlyMatchIsValid, false);

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /Begin at `1\.00x`/);
  assert.match(standard, /test range, not a default/);
  assert.match(standard, /store its exact deterministic parameters/);
  assert.match(standard, /never substitute a remembered, rounded, or visually estimated variant/);
  assert.match(standard, /representative Y\/U\/V or equivalent measurements/);
  assert.match(standard, /integrated LUFS first/);
  assert.match(standard, /UI slider value, waveform height, or peak-only match/);
});

test('director plan schema carries reusable rough-cut and privacy guardrails', () => {
  const contentLock = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates', 'content-lock.template.json'),
    'utf8',
  ));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates', 'director-plan.template.json'),
    'utf8',
  ));
  assert.equal(plan.roughCut.takeSelection.laterOccurrence, 'tie-breaker-only');
  assert.equal(contentLock.recurringSignatureOutro.detected, false);
  assert.equal(contentLock.recurringSignatureOutro.candidateForStylePreview, false);
  assert.equal(plan.roughCut.pauseTreatment.universalDurationMilliseconds, null);
  assert.equal(plan.privacyPlan.criticalIdentifiersUseOpaqueMasks, true);
  assert.equal(plan.privacyPlan.focusCueWhenEvidenceIsNotObvious, 'required');
  assert.equal(plan.privacyPlan.uiEvidenceCapture.exactStatePathRequired, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.thumbnailGuessingAllowed, false);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.roiManifestRequired, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.preserveSourceAspectRatio, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.recordingOnlyWhenInteractionOrChangeIsEvidence,
    true);
  assert.equal(plan.presentationSafety.presenterInsertEntryFrame, 'normal-expression-eyes-open');
  assert.equal(plan.presentationSafety.platformUiExclusionZonesRequired, true);
  assert.equal(plan.finishingPass.voiceIsolation.processEachSourceRangeSeparately, true);
  assert.equal(plan.finishingPass.voiceIsolation.reuseDerivedAudioAcrossDifferentSourceRanges, false);
  assert.equal(plan.finishingPass.captions.reflowAfterScaling, true);
  assert.equal(plan.finishingPass.captions.separateCompletedThoughtFromNextThought, true);
  assert.equal(plan.roughCut.sourceColorNormalization.workflowStage,
    'rough-cut-before-approval');
  assert.equal(plan.roughCut.sourceColorNormalization.neutralizeCastBeforeCreativeLook, true);
  assert.equal(plan.roughCut.sourceColorNormalization.fineEditReprocessingDefault, false);
  assert.equal(plan.roughCut.audibleDuplicateAudit.captionDisplayOverrideCountsAsAudioRemoval, false);
  assert.equal(plan.roughCut.structuralEditReadback.requiredAfterScriptEdit, true);
  assert.equal(plan.bRollContinuity.continuousRunInteriorAlphaCoverage, 'required');
  assert.equal(plan.bRollContinuity.pairedInteriorFadesMayRevealARoll, false);
  assert.equal(plan.bRollContinuity.coverageRunClassification.durationBasis,
    'aggregate-viewer-visible-run');
  assert.equal(plan.bRollContinuity.coverageRunClassification.modeAxis,
    'visible-source-presence');
  assert.deepEqual(plan.bRollContinuity.coverageRunClassification.modes,
    ['A-only', 'B-only', 'AB-live']);
  assert.deepEqual(plan.bRollContinuity.coverageRunClassification.abLiveLayouts, [
    'B-base-A-PiP',
    'A-base-B-overlay',
    'B-base-A-cutout',
    'AB-split',
  ]);
  assert.equal(plan.bRollContinuity.coverageRunClassification.layoutAxis,
    'ab-live-composition');
  assert.equal(plan.bRollContinuity.coverageRunClassification.longRunDefault,
    'AB-live-only-when-presenter-continuity-helps-then-select-layout-by-content-occupancy-style-and-matte-quality');
  assert.equal(plan.bRollContinuity.transitionGrammar.continuousExplanationInterior,
    'direct-cuts-by-default');
  assert.equal(plan.bRollContinuity.transitionGrammar.synchronizeBrollAndPresenterLayer, true);
  assert.equal(plan.bRollContinuity.transitionGrammar.blanketPresetAcrossAllBoundaries, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.scaledUncroppedSourceDefault, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.contentOccupancyMapRequired, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.preferredCornerIsOnlyADefault, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.fixedGlobalSizeDefault, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.geometryStableWithinCoverageRun, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.visibleCropBoxVerificationRequired, true);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.layoutId, 'B-base-A-cutout');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.defaultEngine,
    'hyperframes-remove-background');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.testedVersion, '0.7.109');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.model, 'u2net_human_seg');
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .cleanLockedARollWithoutBakedCaptionsOrOverlaysRequired, true);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.cutoutLayerMustBeMuted, true);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.finalQuality, 'best');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.matteQualityGate.failClosed, true);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline.formula,
    'dilate-alpha-minus-source-alpha');
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .placement.geometryStableWithinCoverageRun, true);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.renderedPixelVerificationRequired, true);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.globalPunctuationRemovalWithoutExceptionAudit,
    false);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.sourceOfTruth,
    'supplied-manuscript');
  assert.equal(plan.finishingPass.captions.semanticPunctuation.pageAwareDisplay, true);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.internalPunctuation, 'preserve');
  assert.equal(plan.finishingPass.captions.semanticPunctuation.pageFinalDetachableSeparators,
    'omit-by-style');
  assert.equal(plan.finishingPass.captions.semanticPunctuation.pageFinalQuestionAndExclamation,
    'always-preserve');
  assert.equal(plan.finishingPass.captions.semanticPunctuation.pairedStructuralMarks,
    'always-preserve');
  assert.equal(plan.finishingPass.captions.semanticPunctuation.rerunAfterPaginationChange, true);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.globalHidePunctuationWhenExceptionsExist,
    false);
  assert.equal(plan.finishingPass.captions.semanticPunctuation.inventOrSubstituteSymbols, false);
  assert.equal(plan.finishingPass.captions.preserveApprovedVisualStyleUnlessExplicitChange, true);
  assert.equal(plan.finishingPass.captions.progressLayerRequestsDoNotRestyleCaptions, true);
  assert.equal(plan.finishingPass.chapterProgress.defaultEnabled, null);
  assert.equal(plan.finishingPass.chapterProgress.selectionMode, 'content-driven');
  assert.equal(plan.finishingPass.chapterProgress.enableWhen,
    'defensible-sections-or-approved-recurring-series-format');
  assert.equal(plan.finishingPass.chapterProgress.omitWhen,
    'decorative-only-or-attention-cost-exceeds-navigation-value');
  assert.equal(plan.finishingPass.chapterProgress.segmentWidth, 'duration-proportional');
  assert.equal(plan.finishingPass.chapterProgress.defaultVisualGrammar,
    'shared-two-lane-clean-track-with-label-boundary-dividers-only');
  assert.equal(plan.finishingPass.chapterProgress.component.id,
    'rmcu.semantic-progress.v1');
  assert.equal(plan.finishingPass.chapterProgress.component.scope,
    'repository-generic-non-personal');
  assert.equal(plan.finishingPass.chapterProgress.component.landscape,
    'compact-full-width-top-rail');
  assert.equal(plan.finishingPass.chapterProgress.component.portrait,
    'platform-safe-two-lane-top-band');
  assert.equal(plan.finishingPass.chapterProgress.component.inactiveOverflow,
    'single-line-ellipsis');
  assert.equal(plan.finishingPass.chapterProgress.component.activeOverflow,
    'loop-marquee-only-when-overflowing');
  assert.equal(plan.finishingPass.chapterProgress.component.sameVisualGrammarAcrossOrientations,
    true);
  assert.equal(plan.finishingPass.chapterProgress.component.upperProgressTrack,
    'continuous-without-chapter-ticks');
  assert.equal(plan.finishingPass.chapterProgress.component.lowerLabelRow,
    'dividers-only-between-adjacent-chapters');
  assert.equal(plan.finishingPass.chapterProgress.component.leadingLabelMarks, false);
  assert.equal(plan.finishingPass.chapterProgress.component.chapterNumbers, false);
  assert.equal(plan.finishingPass.chapterProgress.component.activeSegmentPanel, false);
  assert.equal(plan.finishingPass.chapterProgress.component.personalIdentityAssetRequired, false);
  assert.equal(plan.finishingPass.chapterProgress.verticalPlacement,
    'platform-validated-edge-band-bottom-first');
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.semanticLayer,
    'chapter-progress-not-caption-track');
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.contrastSurface,
    'narrow-full-width-translucent-neutral-strip');
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.perChapterBoxesDefault, false);
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.topPlacementDefault,
    'conditional-when-bottom-is-occluded-or-collides');
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.sceneBySceneColorInversion, false);
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.nativeAndPhoneScaleVerification,
    true);
  assert.equal(
    plan.finishingPass.chapterProgress.labelVisualBaseline.publishedTargetDeviceScreenshotVerification,
    true,
  );
  assert.equal(plan.finishingPass.chapterProgress.labelVisualBaseline.topBandReflowRequired, true);
  assert.equal(plan.finishingPass.chapterProgress.platformUiOcclusionPolicy,
    'semantic-label-occlusion-forbidden-relocate-strip-and-reflow-nearby-content');
  assert.equal(plan.finishingPass.chapterProgress.labelApproval.proposalStage,
    'director-plan-before-style-preview');
  assert.equal(plan.finishingPass.chapterProgress.labelApproval.approvalGate,
    'director-plan-approval');
  assert.equal(plan.finishingPass.chapterProgress.labelApproval.separateBlockingQuestionDefault,
    false);
  assert.equal(plan.finishingPass.chapterProgress.labelApproval.exactBoundaryStage,
    'after-rough-cut-timing-lock');
  assert.equal(plan.finishingPass.chapterProgress.labelApproval.wordingOnlyChangeRequiresRecut,
    false);
  assert.equal(plan.finishingPass.signatureOutro.ownedIdentityAssetPreferred, true);
  assert.equal(plan.finishingPass.signatureOutro.genericThirdPartyStickerDefault, false);
  assert.equal(plan.finishingPass.signatureOutro.firstReusableLockRequiresStillAndMotionPreview,
    true);
  assert.equal(plan.finishingPass.signatureOutro.microExpressionRule,
    'optional-single-motivated-beat-not-entrance');
  assert.deepEqual(plan.finishingPass.signatureOutro.microExpressionProof,
    ['open-before', 'closed-peak', 'open-after', 'phone-size']);
  assert.deepEqual(plan.finishingPass.signatureOutro.contextualAccessories, []);
  assert.equal(
    plan.finishingPass.signatureOutro.approvedMotionContract.reuseExactApprovedComponent,
    true,
  );
  assert.equal(
    plan.finishingPass.signatureOutro.approvedMotionContract.simplifiedRebuildMayDropMotionBeats,
    false,
  );
  assert.equal(plan.finishingPass.signatureOutro.privateProfilePromotionRequiresExplicitApproval,
    true);
  assert.equal(plan.finishingPass.signatureOutro.motionEnvelope.topTrackPreventsSelfClipping, false);
  assert.equal(plan.finishingPass.signatureOutro.motionEnvelope.hiddenOverflowDefault, false);
  assert.equal(plan.finishingPass.signatureOutro.motionEnvelope.visibleOverflowAloneIsSufficient,
    false);
  assert.equal(plan.finishingPass.signatureOutro.motionEnvelope.staticOuterNaturalBoxPreferred,
    true);
  assert.equal(
    plan.finishingPass.signatureOutro.motionEnvelope
      .paddedInnerAnimatedStageContainsEveryVisibleExtreme,
    true,
  );
  assert.deepEqual(plan.finishingPass.signatureOutro.motionEnvelope.verificationFrames,
    ['first-visible', 'entrance-extreme', 'overshoot', 'settled', 'encouragement-peak',
      'micro-expression-peak', 'reopen', 'final-visible']);
  assert.equal(plan.finishingPass.dialogueLoudness.measurementSource,
    'actual-rendered-timeline-after-cuts-denoise-fades-and-gain');
  assert.equal(plan.finishingPass.dialogueLoudness.clippedOutliersDefineTarget, false);
  assert.equal(plan.finishingPass.dialogueLoudness.perCutIndependentNormalizationDefault, false);
  assert.equal(plan.finishingPass.dialogueLoudness.postAdjustmentFullRenderRemeasureRequired, true);
  assert.equal(plan.finishingPass.dialogueLoudness.creatorSpecificTargetStorage,
    'private-profile-only');
  assert.equal(plan.finishingPass.fontGovernance.rendererCatalogLookupRequired, true);
  assert.equal(plan.finishingPass.fontGovernance.canonicalFamilyNameRequired, true);
  assert.equal(plan.finishingPass.fontGovernance.systemFontStacksAllowedInProductionMotionGraphics,
    false);
  assert.equal(plan.finishingPass.fontGovernance.freeDownloadIsLicenseProof, false);
  assert.equal(plan.finishingPass.fontGovernance.neutralSimplifiedChineseDefaultWhenSuitable,
    'Noto Sans SC');
  assert.equal(plan.finishingPass.fontGovernance.unsupportedFontWarningPolicy,
    'block-replace-and-reopen-export-preflight');
  assert.equal(plan.finishingPass.chapterProgress.fallbackWithoutMeaningfulChapters,
    'single-unsegmented-progress-bar');
  assert.equal(plan.finishingPass.chapterProgress.renderedOverlayIsInteractive, false);
  assert.equal(plan.finishingPass.chapterProgress.recomputeAfterStructuralTimingChange, true);
  assert.equal(plan.finishingPass.designAudit.requiredBeforeFinalRender, true);
  assert.equal(plan.finishingPass.designAudit.unreviewedIsNotOff, true);
  assert.deepEqual(Object.keys(plan.finishingPass.designAudit.categories), [
    'backgroundMusic',
    'soundEffects',
    'entryExitAnimation',
    'transitions',
    'decorativeEffects',
  ]);
  assert.equal(plan.timebaseIntegrity.copyRawFrameNumbersAcrossDifferentFps, false);
  assert.equal(plan.timebaseIntegrity.deriveDurationsFromAdjacentConvertedEndpoints, true);
  assert.deepEqual(plan.informationCoverage, []);
});

test('app evidence uses exact state paths and semantic ROI instead of guessed callouts', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const evidence = state.roughCutPolicy.screenshotEvidence;
  assert.match(evidence.exactStatePath, /page-primary-tab-subtab/);
  assert.equal(evidence.thumbnailOrVisualGuessing, 'forbidden');
  assert.match(evidence.roiManifest, /actual-output/);
  assert.equal(evidence.stableStateCapture, 'still-preferred');
  assert.equal(evidence.interactionCapture,
    'recording-only-when-interaction-or-change-is-the-evidence');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  const audit = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'evidence-state-roi-audit.md'),
    'utf8',
  );
  const qa = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'qa-report.template.md'),
    'utf8',
  );
  assert.match(standard, /## Exact UI Evidence And Semantic ROI/);
  assert.match(standard, /DOM\/accessibility text and control bounds first/);
  assert.match(standard, /Never guess a rectangle from a thumbnail/);
  assert.match(standard, /requested bounds, actual output dimensions/);
  assert.match(audit, /rejected state `Monthly Report`/);
  assert.match(audit, /Keep requested and output bounds separate/);
  assert.match(audit, /before\/on\/after frames of every state or image transition/);
  assert.match(audit, /禁止从编辑器缩略图/);
  assert.match(qa, /Exact evidence state path/);
  assert.match(qa, /Every critical ROI was derived/);
});

test('approved signature outro inherits the complete motion contract', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const outro = state.roughCutPolicy.finishingPass.signatureOutro;
  assert.match(outro.approvedMotionContract, /tilt-blink-or-wink/);
  assert.equal(outro.simplifiedRebuildMayDropMotionBeats, false);
  assert.equal(outro.redesignRequiresExplicitApproval, true);

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  const qa = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'qa-report.template.md'),
    'utf8',
  );
  assert.match(standard, /tilt, blink\/wink, timing, scale envelope, placement/);
  assert.match(standard, /simplified reconstruction.*regression/);
  assert.match(qa, /no simplified rebuild silently removed a motion beat/);
});

test('rough cut owns natural color while finishing separates captions from progress labels', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const finishing = state.roughCutPolicy.finishingPass;
  const color = state.roughCutPolicy.sourceColorNormalization;
  assert.equal(finishing.voiceIsolation.reuseShortDerivativeAcrossDifferentSourceOffsets, 'forbidden');
  assert.equal(finishing.voiceIsolation.verification, 'early-and-late-timeline-audible-samples');
  assert.equal(finishing.captions.scaleChange, 'requires-reflow-and-box-resize');
  assert.equal(color.workflowStage, 'rough-cut-before-approval');
  assert.equal(color.order, 'neutralize-cast-before-creative-look');
  assert.equal(color.continuousRecordingCorrectionScope, 'source-track-or-global-first');
  assert.equal(color.sameParametersProvePerceptualConsistency, false);
  assert.equal(color.rollbackIfInconsistent,
    'remove-correction-and-keep-last-stable-source');
  assert.equal(color.fineEditReprocessingDefault, 'forbidden');
  assert.equal(color.stageUpdateAfterRollback,
    'required-with-attempt-result-rollback-and-next-decision');
  assert.equal(finishing.captions.approvedVisualStyle,
    'preserve-unless-explicit-caption-redesign');
  assert.equal(finishing.captions.progressLayerRequests, 'must-not-restyle-captions');
  assert.equal(finishing.chapterProgress.labelVisualBaseline.positionDefault,
    'bottom-first-after-platform-exclusion-validation');
  assert.equal(finishing.chapterProgress.labelVisualBaseline.topPlacementDefault,
    'conditional-after-platform-proof');
  assert.equal(finishing.chapterProgress.labelVisualBaseline.perChapterBoxesDefault, 'forbidden');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /never attach one short derivative to unrelated clips/);
  assert.match(standard, /early and a late timeline section/);
  assert.match(standard, /When caption size changes, treat it as a layout change/);
  assert.match(standard, /Normalize the recorded talking-head source during rough cut/);
  assert.match(standard, /applying the same settings as separate per-clip effects does not prove perceptual consistency/);
  assert.match(standard, /remove the correction and keep the last stable source state/);
  assert.match(standard, /Send a stage update that states what was attempted/);
  assert.match(standard, /Fine edit should inherit this approved color/);
  assert.match(standard, /Preserve the approved caption visual language/);
  assert.match(standard, /separate semantic layer from captions/);
  assert.match(standard, /narrow, full-width translucent neutral strip/);
  assert.match(standard, /A reserved top-safe band is the preferred fallback/);
  assert.match(standard, /Validate against screenshots from the actual published phone, tablet, and player surfaces/);
  assert.match(standard, /representative A-roll, bright B-roll, and dark B-roll/);
});

test('timeline handoff requires time-based boundary conversion across frame rates', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const policy = state.roughCutPolicy.timebaseIntegrity;
  assert.equal(policy.rawFrameNumbersAcrossDifferentFps, 'forbidden');
  assert.equal(policy.boundaryConversion, 'targetFrame=round(sourceFrame*targetFps/sourceFps)');
  assert.equal(policy.durationDerivation, 'adjacent-converted-endpoints');
  assert.ok(policy.postConformVerification.includes('pairwise-contiguity'));

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  const handoff = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'chatcut-handoff.md'),
    'utf8',
  );
  assert.match(standard, /Never copy canonical EDL or source-timeline frame numbers directly/);
  assert.match(standard, /derive each item duration from adjacent converted endpoints/);
  assert.match(handoff, /Frame numbers are not portable between timebases/);
  assert.match(handoff, /Never change the locked canonical EDL/);
});

test('cross-boundary audio and B-roll continuity require rendered proof', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  assert.equal(state.roughCutPolicy.audibleDuplicateAudit.scope, 'cross-segment-and-cross-clip-boundaries');
  assert.equal(state.roughCutPolicy.audibleDuplicateAudit.captionDisplayOverrideRemovesAudio, false);
  assert.equal(state.roughCutPolicy.structuralEditReadback.restoreOnlyIntentionalTransitions, true);
  assert.equal(state.roughCutPolicy.bRollContinuity.pairedInteriorFadeMayExposeARoll, 'forbidden');
  assert.equal(state.roughCutPolicy.finishingPass.captions.semanticPagination,
    'completed-thought-and-next-thought-use-separate-cards');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /Audit repeated tokens across transcript-segment and clip boundaries/);
  assert.match(standard, /caption display override can hide text, but it does not remove the spoken word/);
  assert.match(standard, /re-read the active timeline before continuing/);
  assert.match(standard, /one-frame or few-frame presenter flash/);
  assert.match(standard, /immediately before, on, and immediately after the boundary/);
  assert.match(standard, /A completed thought and the next thought should not share one card/);
});

test('continuous B-roll planning classifies aggregate runs before individual cards', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const policy = state.roughCutPolicy.bRollContinuity.coverageRunClassification;
  assert.equal(policy.mergeAdjacentOrNearAdjacentBeats, true);
  assert.equal(policy.durationBasis, 'aggregate-viewer-visible-run');
  assert.equal(policy.modeAxis, 'visible-source-presence');
  assert.deepEqual(policy.modes, ['A-only', 'B-only', 'AB-live']);
  assert.deepEqual(policy.abLiveLayouts, [
    'B-base-A-PiP',
    'A-base-B-overlay',
    'B-base-A-cutout',
    'AB-split',
  ]);
  assert.equal(policy.layoutAxis, 'ab-live-composition');
  assert.equal(policy.presenterPriorityAxis, 'semantic-visual-layer-independent-of-layout');
  assert.deepEqual(policy.presenterPriorities, ['foreground', 'supporting', 'background']);
  assert.equal(policy.presenterAnchorAxis, 'placement-independent-of-priority');
  assert.deepEqual(policy.presenterAnchors, [
    'container-bottom',
    'canvas-bottom',
    'bounded-pip-region',
    'other-declared-anchor',
  ]);
  assert.deepEqual(policy.legacyModeAliases['AB-live-PiP'], {
    mode: 'AB-live',
    layout: 'B-base-A-PiP',
  });
  assert.equal(policy.longRunDefault,
    'AB-live-only-when-presenter-continuity-helps-then-select-layout-by-content-occupancy-style-and-matte-quality');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /merge adjacent or near-adjacent B-roll beats/);
  assert.match(standard, /Measure and classify the aggregate run, not each card in isolation/);
  assert.match(standard, /Treat `AB-live` as a presence mode, not a synonym for picture-in-picture/);
  assert.match(standard, /use `AB-live` when both evidence and presenter continuity genuinely help/);
  assert.match(standard, /`B-base-A-PiP`, `A-base-B-overlay`, `B-base-A-cutout`, or `AB-split`/);
});

test('presenter cutout is governed, bilingual and fail-closed', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const cutout = state.roughCutPolicy.presentationSafety.presenterCutoutDesign;
  assert.equal(cutout.layoutId, 'B-base-A-cutout');
  assert.equal(cutout.defaultEngine, 'hyperframes-remove-background');
  assert.equal(cutout.testedVersion, '0.7.109');
  assert.equal(cutout.model, 'u2net_human_seg');
  assert.equal(cutout.sourceRequirement,
    'clean-locked-a-roll-without-baked-captions-or-overlays');
  assert.equal(cutout.canonicalAudio, 'keep-separate-and-mute-the-cutout-layer');
  assert.equal(cutout.device, 'auto');
  assert.equal(cutout.finalQuality, 'best');
  assert.equal(cutout.matteQualityGate.failClosed, true);
  assert.ok(cutout.matteQualityGate.inspect.includes('hands-and-fingers'));
  assert.deepEqual(cutout.matteQualityGate.backgroundProof, ['bright', 'dark', 'busy']);
  assert.equal(cutout.outline.formula, 'dilate-alpha-minus-source-alpha');
  assert.equal(cutout.outline.implementation,
    'single-hyperframes-video-with-svg-feMorphology-and-feComposite');
  assert.equal(cutout.outline.mustTrackTheSameAlpha, true);
  assert.equal(cutout.placement.visualPriorityRequired, true);
  assert.deepEqual(cutout.placement.visualPriorityValues,
    ['foreground', 'supporting', 'background']);
  assert.equal(cutout.placement.anchorRequired, true);
  assert.match(cutout.placement.backgroundCollisionPolicy,
    /captions-and-platform-copy-may-overlay-nonessential-body-area/);
  assert.equal(cutout.placement.geometryStableWithinCoverageRun, true);

  const guide = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'presenter-coverage-modes.md'),
    'utf8',
  );
  assert.match(guide, /## English/);
  assert.match(guide, /## 简体中文/);
  assert.match(guide, /`AB-live` means time-aligned A-roll and substantive B-roll/);
  assert.match(guide, /hyperframes@0\.7\.109 remove-background/);
  assert.match(guide, /outlineAlpha = dilate\(alpha, radius\) - alpha/);
  assert.match(guide, /feMorphology/);
  assert.match(guide, /feComposite/);
  assert.match(guide, /The gate passes only when the intended shot is acceptable as moving video/);
  assert.match(guide, /### Presenter Visual Priority/);
  assert.match(guide, /container-bottom anchor/);
  assert.match(guide, /`background`/);
  assert.match(guide, /### 人物视觉层级/);
  assert.match(guide, /字幕和平台说明可以有意叠在非关键身体区/);
  assert.match(guide, /模型下载、环境诊断、预处理和缓存都由 Agent 完成/);

  const governance = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'governance-hyperframes-background-removal.json'),
    'utf8',
  ));
  assert.equal(governance.decisionStatus, 'approved-local-capability');
  assert.equal(governance.identity.version, 'HyperFrames CLI 0.7.109');
  assert.equal(governance.licensing.software.license, 'Apache-2.0');
  assert.match(governance.licensing.modelWeights.license, /Apache-2\.0/);
  assert.equal(governance.rightsAndPrivacy.uploadsUserMedia, false);
  assert.equal(governance.evidence.metrics.framesProcessed, 30);
  assert.equal(governance.evidence.metrics.outputPixelFormatWithLibvpxDecoder, 'yuva420p');
  assert.equal(governance.recommendation.priority, 'P1-conditional');
  assert.match(governance.recommendation.allowedRole, /clean locked A-roll/);

  const registry = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'tool-registry.json'),
    'utf8',
  ));
  const registryEntry = registry.tools.find((tool) => tool.id === 'hyperframes-remove-background');
  assert.equal(registryEntry.priority, 'P1-conditional');
  assert.match(registryEntry.activeRole, /B-base-A-cutout/);

  const qa = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'qa-report.template.md'),
    'utf8',
  );
  assert.match(qa, /Moving matte proof over bright, dark, and busy backgrounds/);
  assert.match(qa, /cutout layer was muted/);
  assert.match(qa, /derived from the same alpha/);
  assert.match(qa, /Every presenter run records `foreground`, `supporting`, or `background`/);
});

test('PiP, transitions and semantic punctuation are planned from composed content', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const safety = state.roughCutPolicy.presentationSafety.pictureInPictureDesign;
  const transition = state.roughCutPolicy.bRollContinuity.transitionGrammar;
  const punctuation = state.roughCutPolicy.finishingPass.captions.semanticPunctuation;
  assert.equal(safety.defaultVisualPriority, 'foreground-or-supporting');
  assert.equal(safety.boundedWindowMayBeTreatedAsDisposableBackground, false);
  assert.equal(safety.scaledUncroppedSourceDefault, 'forbidden');
  assert.equal(safety.fixedGlobalSize, 'forbidden');
  assert.equal(safety.sizeSelection, 'per-card-and-coverage-run-composition');
  assert.equal(safety.visibleBoxProof, 'inspect-visible-crop-not-only-stored-item-frame');
  assert.equal(safety.positionSelection, 'per-card-content-occupancy-map');
  assert.equal(safety.preferredCorner, 'default-only-not-a-rule');
  assert.equal(transition.continuousExplanationInterior, 'direct-cuts-by-default');
  assert.equal(transition.blanketPresetAcrossAllBoundaries, 'forbidden');
  assert.equal(punctuation.globalRemovalWithoutExceptionAudit, 'forbidden');
  assert.equal(punctuation.verification, 'composed-pixels-not-metadata-only');
  assert.equal(punctuation.sourceOfTruth, 'supplied-manuscript');
  assert.equal(punctuation.pageAwareDisplay, true);
  assert.equal(punctuation.internalPunctuation, 'preserve');
  assert.equal(punctuation.pageFinalDetachableSeparators, 'omit-by-style');
  assert.equal(punctuation.pageFinalQuestionAndExclamation, 'always-preserve');
  assert.equal(punctuation.pairedStructuralMarks, 'always-preserve');
  assert.equal(punctuation.punctuationEmbeddedInTermsNumbersAndUnits, 'preserve');
  assert.equal(punctuation.rerunAfterPaginationChange, true);
  assert.equal(punctuation.globalHidePunctuationWhenExceptionsExist, false);
  assert.equal(punctuation.semanticAndStructuralMarks, 'must-match-manuscript');
  assert.equal(punctuation.inventOrSubstituteSymbols, 'forbidden');
  assert.ok(state.approvedCapabilities.includes(
    'page-aware-caption-punctuation-with-final-question-and-exclamation-preservation',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'rough-cut-source-color-normalization-before-fine-edit',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'progress-label-layer-separation-from-captions',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'platform-validated-progress-label-baseline-with-cross-background-and-device-proof',
  ));

  const designAudit = state.roughCutPolicy.finishingPass.designAudit;
  assert.equal(designAudit.requiredBeforeFinalRender, true);
  assert.equal(designAudit.unreviewedCountsAsOff, false);
  assert.ok(designAudit.categories.includes('background-music'));
  assert.ok(designAudit.categories.includes('decorative-effects'));

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /picture-in-picture as a designed portrait/);
  assert.match(standard, /content-occupancy map for every underlying card/);
  assert.match(standard, /preferred corner is only a default/);
  assert.match(standard, /Do not use one global picture-in-picture size/);
  assert.match(standard, /Judge the visible crop rectangle, not only the stored media frame/);
  assert.match(standard, /Define transitions by editorial relationship/);
  assert.match(standard, /Use direct cuts between cards inside one continuous explanation/);
  assert.match(standard, /Preserve every manuscript punctuation mark that remains inside one caption page/);
  assert.match(standard, /Always preserve a question or exclamation mark even when it is page-final/);
  assert.match(standard, /Preserve paired structural closers/);
  assert.match(standard, /Pagination changes invalidate the punctuation decision/);
  assert.match(standard, /Do not use a renderer switch that strips every punctuation mark/);
  assert.match(standard, /setting named `hidePunctuation` is acceptable only when its verified contract is page-aware/);
  assert.match(standard, /Caption metadata is not visual proof/);
  assert.match(standard, /supplied manuscript as the punctuation source of truth/);
  assert.match(standard, /Do not invent title marks, replace enumeration commas with vertical bars/);
  assert.match(standard, /explicitly assess and record five categories/);
  assert.match(standard, /an unreviewed category is not the same as an intentional omission/);

  const chapterProgress = state.roughCutPolicy.finishingPass.chapterProgress;
  const rmcuTemplate = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'semantic-progress-rmcu.template.json'),
    'utf8',
  ));
  assert.equal(chapterProgress.default, 'content-driven-after-structural-timing-lock');
  assert.equal(chapterProgress.enableWhen,
    'defensible-sections-or-approved-recurring-series-format');
  assert.equal(chapterProgress.omitWhen,
    'decorative-only-or-attention-cost-exceeds-navigation-value');
  assert.equal(chapterProgress.segmentWidth, 'duration-proportional');
  assert.equal(chapterProgress.defaultVisualGrammar,
    'shared-two-lane-clean-track-with-label-boundary-dividers-only');
  assert.equal(chapterProgress.platformUiOcclusionPolicy,
    'semantic-label-occlusion-forbidden-relocate-strip-and-reflow-nearby-content');
  assert.equal(chapterProgress.renderedOverlayInteractive, false);
  assert.equal(chapterProgress.recomputeAfterStructuralTimingChange, true);
  assert.equal(chapterProgress.labelVisualBaseline.semanticLayer,
    'chapter-progress-not-caption-track');
  assert.equal(chapterProgress.labelVisualBaseline.sceneBySceneColorInversion, 'forbidden');
  assert.equal(chapterProgress.labelApproval.proposalStage,
    'director-plan-before-style-preview');
  assert.equal(chapterProgress.labelApproval.approvalGate, 'director-plan-approval');
  assert.equal(chapterProgress.labelApproval.separateBlockingQuestionDefault, false);
  assert.equal(chapterProgress.labelApproval.exactBoundaryStage,
    'after-rough-cut-timing-lock');
  assert.equal(chapterProgress.component.id, 'rmcu.semantic-progress.v1');
  assert.equal(chapterProgress.component.scope, 'repository-generic-non-personal');
  assert.equal(chapterProgress.component.variants.landscape,
    'compact-full-width-top-rail');
  assert.equal(chapterProgress.component.variants.portrait,
    'platform-safe-two-lane-top-band');
  assert.equal(chapterProgress.component.inactiveOverflow, 'single-line-ellipsis');
  assert.equal(chapterProgress.component.activeOverflow,
    'loop-marquee-only-when-overflowing');
  assert.equal(chapterProgress.component.sameVisualGrammarAcrossOrientations, true);
  assert.equal(chapterProgress.component.upperProgressTrack,
    'continuous-without-chapter-ticks');
  assert.equal(chapterProgress.component.lowerLabelRow,
    'dividers-only-between-adjacent-chapters');
  assert.equal(chapterProgress.component.outerSurfaceHorizontalInset,
    'zero-full-bleed-allowed');
  assert.equal(chapterProgress.component.semanticHorizontalInset,
    'platform-player-validated-cover-aware');
  assert.equal(chapterProgress.component.semanticRailsShareInset, true);
  assert.equal(chapterProgress.component.leadingLabelMarks, 'forbidden');
  assert.equal(chapterProgress.component.chapterNumbers, 'forbidden-by-default');
  assert.equal(chapterProgress.component.activeSegmentPanel, 'forbidden-by-default');
  assert.equal(chapterProgress.component.personalIdentityAssetRequired, false);
  assert.equal(chapterProgress.component.markerSelection.basis,
    'content-meaning-creator-fit-and-attention-budget');
  assert.equal(chapterProgress.component.markerSelection.semanticContactPointAnchorRequired, true);
  assert.equal(chapterProgress.component.markerSelection.markerOnlyChangePreservesAllOtherApprovedLayers,
    true);
  assert.equal(chapterProgress.component.markerSelection.approvedAssetPreservedUntilReplacementPasses,
    true);
  assert.equal(rmcuTemplate.componentId, 'rmcu.semantic-progress.v1');
  assert.equal(rmcuTemplate.behavior.activeOverflow.onlyWhenOverflowing, true);
  assert.equal(rmcuTemplate.behavior.activeOverflow.layoutBoxRemainsStable, true);
  assert.equal(rmcuTemplate.behavior.sameAcrossOrientations, true);
  assert.equal(rmcuTemplate.visual.upperProgressTrack,
    'continuous-clean-no-chapter-ticks');
  assert.equal(rmcuTemplate.visual.outerSurfaceHorizontalInsetPx, 0);
  assert.equal(rmcuTemplate.visual.semanticHorizontalInsetPolicy,
    'platform-player-validated-cover-aware');
  assert.equal(rmcuTemplate.visual.semanticHorizontalInsetPx, null);
  assert.equal(rmcuTemplate.visual.upperProgressTrackHorizontalInsetPx, null);
  assert.equal(rmcuTemplate.visual.lowerLabelRow,
    'boundary-dividers-only-between-adjacent-segments');
  assert.equal(rmcuTemplate.visual.lowerLabelRailHorizontalInsetPx, null);
  assert.equal(rmcuTemplate.visual.semanticRailsShareInset, true);
  assert.equal(rmcuTemplate.visual.markerEdgePolicy,
    'clamp-marker-body-inside-semantic-safe-rail');
  assert.equal(rmcuTemplate.playerViewport.horizontalCropPerSideFormula,
    'max(0,(canvasWidth-visibleCompositionWidth)/2)');
  assert.equal(rmcuTemplate.playerViewport.zeroSemanticInsetAllowedOnlyAfterPublishedPlayerProof,
    true);
  assert.equal(rmcuTemplate.visual.leadingLabelMarks, false);
  assert.equal(rmcuTemplate.variants.landscape.lanes, 2);
  assert.equal(rmcuTemplate.variants.portrait.lanes, 2);
  assert.equal(rmcuTemplate.variants.portrait.walkingMascotDefault, false);
  assert.equal(rmcuTemplate.verification.preserveReversibleBaselineUntilApproval, true);
  assert.ok(state.approvedCapabilities.includes(
    'time-driven-semantic-chapter-progress-with-plain-bar-fallback',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'platform-safe-edge-band-chapter-strip-with-clean-track-and-label-only-dividers',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'chapter-label-director-plan-approval-before-style-lock',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'repository-owned-rmcu-semantic-progress-landscape-and-portrait',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'inactive-ellipsis-and-active-only-overflow-marquee',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'orientation-consistent-progress-grammar-without-track-ticks-or-leading-label-marks',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'player-cover-aware-semantic-progress-safe-inset-with-full-bleed-surface',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'private-profile-progress-token-or-identity-marker-overrides-only',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'content-driven-progress-selection-and-semantic-marker-anchor',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'approved-version-duplication-change-allowlist-and-post-edit-diff',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'review-proxy-platform-release-and-source-quality-master-classification',
  ));
  assert.ok(state.approvedCapabilities.includes(
    'owned-identity-signature-outro-with-preview-before-reuse',
  ));
  assert.match(standard, /Derive its sections from the approved semantic structure/);
  assert.match(standard, /Propose the label, order, and one-sentence scope of every section/);
  assert.match(standard, /Map every approved label to a contiguous transcript or narrative range/);
  assert.match(standard, /use one unsegmented progress bar instead of inventing chapters/);
  assert.match(standard, /narrow, full-width translucent neutral strip that spans the composition/);
  assert.match(standard, /one uninterrupted progress track above one semantic label row/);
  assert.match(standard, /contrast surface may bleed to both composition edges/i);
  assert.match(standard, /track, playhead, duration-proportional label rail, and dividers must share a horizontal safe inset/);
  assert.match(standard, /Permit zero semantic inset only after published-player proof/);
  assert.match(standard, /Clamp the marker body inside that semantic-safe rail/);
  assert.match(standard, /Do not add chapter ticks to the track, leading label dashes/);
  assert.match(standard, /Landscape and portrait share the same two-lane visual grammar/);
  assert.match(standard, /Do not accept platform descriptions, controls, or action rails covering them/);
  assert.match(standard, /reserved top-safe band/);
  assert.match(standard, /real target-device screenshots/);
  assert.match(standard, /rendered progress strip is visual orientation, not an interactive seek target/);
  assert.match(standard, /Verify early, middle, late, and every chapter boundary/);
  assert.match(standard, /repository-owned `rmcu\.semantic-progress\.v1` contract/);
  assert.match(standard, /Only the active label may move/);
  assert.match(standard, /Walking characters, logos, and personal-IP markers are optional private adapters/);
  assert.match(standard, /Choose the marker role from the content, creator identity, and attention budget/);
  assert.match(standard, /visible tip must coincide with the filled rail endpoint within one composition pixel/);
  assert.match(standard, /Replacing only a marker does not authorize a redesign/);
  assert.match(standard, /## Approval Memory And Change Isolation/);
  assert.match(standard, /Write a change allowlist and an invariant list before editing/);
  assert.match(standard, /Classify each render as `review-proxy`, `platform-release`, or `source-quality-master`/);
  assert.match(standard, /Never upscale or rename the proxy to imply source-quality mastery/);
  assert.match(standard, /private style profile may lock only creator-specific token overrides/);
  assert.match(standard, /## Recurring Signature Outro/);
  assert.match(standard, /## Dialogue Loudness Calibration/);
  assert.match(standard, /full motion envelope/);
  assert.match(standard, /Prefer owned or explicitly approved identity artwork/);
  assert.match(standard, /one still plus one short motion sample/);

  const signatureOutro = state.roughCutPolicy.finishingPass.signatureOutro;
  assert.equal(signatureOutro.preferredAssetSource,
    'owned-or-explicitly-approved-identity-art');
  assert.equal(signatureOutro.genericThirdPartyStickerDefault, 'forbidden');
  assert.equal(signatureOutro.preserveLivePerformance, true);
  assert.equal(signatureOutro.privateProfilePromotion, 'explicit-approval-required');

  const qaTemplate = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates', 'qa-report.template.md'),
    'utf8',
  );
  assert.match(qaTemplate, /## Finishing Design Audit/);
  assert.match(qaTemplate, /`Off`\/`none` is valid; `unreviewed` is not/);
  assert.match(qaTemplate, /No semantic punctuation was invented or replaced/);
  assert.match(qaTemplate, /Every manuscript punctuation mark inside a caption page is preserved/);
  assert.match(qaTemplate, /Page-final question and exclamation marks are always preserved/);
  assert.match(qaTemplate, /fine edit inherited the approved A-roll color without a second treatment/);
  assert.match(qaTemplate, /Approved caption visual style was preserved/);
  assert.match(qaTemplate, /Progress labels were audited separately from subtitles/);
  assert.match(qaTemplate, /## Semantic Chapter Progress/);
  assert.match(qaTemplate, /duration-proportional boundaries/);
  assert.match(qaTemplate, /one uninterrupted progress track without chapter ticks/);
  assert.match(qaTemplate, /contrast surface is allowed to bleed to both composition edges/i);
  assert.match(qaTemplate, /share one platform\/player-validated horizontal safe inset/);
  assert.match(qaTemplate, /zero semantic inset was used only with published-player proof/);
  assert.match(qaTemplate, /No leading label dashes, chapter numbers, active-segment panels/);
  assert.match(qaTemplate, /A-roll, bright B-roll, dark B-roll, chapter-boundary/);
  assert.match(qaTemplate, /platform-validated edge band/);
  assert.match(qaTemplate, /Published target-device screenshots prove/);
  assert.match(qaTemplate, /visual orientation only/);
  assert.match(qaTemplate, /Chapter labels, order, and one-sentence scopes were shown/);
  assert.match(qaTemplate, /Landscape and portrait use the same two-lane grammar/);
  assert.match(qaTemplate, /Only the active overflowing label loops/);
  assert.match(qaTemplate, /generic component uses a neutral playhead/);
  assert.match(qaTemplate, /## Approved-Version Change Isolation/);
  assert.match(qaTemplate, /Marker choice is justified by content meaning/);
  assert.match(qaTemplate, /visible contact point matches the filled-rail endpoint within one composition pixel/);
  assert.match(qaTemplate, /Deliverable classification \(`review-proxy\|platform-release\|source-quality-master`\)/);
  assert.match(qaTemplate, /## Signature Outro/);
  assert.match(qaTemplate, /Owned or explicitly approved identity art is used/);
});

test('approved portrait layout separates crop-tolerant bleed from multi-device semantic safety', () => {
  const template = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'portrait-talking-head-safe-layout.template.json'),
    'utf8',
  ));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'director-plan.template.json'),
    'utf8',
  ));
  const rmcuTemplate = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'semantic-progress-rmcu.template.json'),
    'utf8',
  ));
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  const reference = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'portrait-talking-head-safe-layout.md'),
    'utf8',
  );
  const qaTemplate = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'qa-report.template.md'),
    'utf8',
  );

  assert.equal(template.presetId, 'layout.portrait-talking-head.safe-v1');
  assert.equal(template.scope, 'repository-generic-non-personal');
  assert.equal(template.referenceCanvas.widthPx, 2160);
  assert.equal(template.referenceCanvas.heightPx, 3840);
  assert.equal(template.resolutionPolicy.sameAspectPixelResizeChangesCropPercentage, false);
  assert.equal(template.playerGeometry.publishedTargetDeviceScreenshotsOverrideAssumptions, true);
  assert.equal(template.layerModel.fullBleedVisualLayer.mayBeCropped, true);
  assert.equal(template.layerModel.semanticForegroundLayer.mustRemainInsideEffectiveSafeRegion, true);
  assert.deepEqual(template.captionBaseline.geometryPx,
    {left: 120, top: 2748, width: 1920, height: 500});
  assert.equal(template.captionBaseline.typography.fontFamily, 'Noto Sans SC');
  assert.equal(template.captionBaseline.typography.fontSizePx, 120);
  assert.equal(template.captionBaseline.typography.strokeWidthPx, 8);
  assert.equal(template.captionBaseline.pagination.maximumLines, 2);
  assert.equal(template.captionBaseline.pagination.actualRenderedGlyphBoundsMustFitEffectiveSafeRegion,
    true);
  assert.equal(template.progressBaseline.notchAndStatusProof.railMustRemainBelowObstruction, true);
  assert.equal(template.signatureOutroPlacement.anchor, 'active-caption-card-top');
  assert.equal(template.signatureOutroPlacement.wholeCharacterBaseRemainsOpaqueDuringExpressionSwap,
    true);
  assert.deepEqual(template.progressBaseline.geometryPx,
    {left: 0, top: 220, width: 2160, height: 180});
  assert.equal(template.progressBaseline.semanticRailInset.referencePx, 243);
  assert.equal(template.progressBaseline.semanticRailInset.referenceRatio, 0.1125);
  assert.equal(template.progressBaseline.display.inactiveOverflow, 'single-line-ellipsis');
  assert.equal(template.progressBaseline.display.activeOverflow,
    'loop-marquee-only-when-overflowing');
  assert.equal(template.bRollAndOverlaySafety.criticalRoiRequiredForEvidenceAndScreenContent, true);
  assert.equal(template.bRollAndOverlaySafety.shrinkingEveryFullBleedVisualByDefault, false);
  assert.equal(template.collisionPriority.moveOrShortenDecorationBeforeMovingApprovedCaptions, true);
  assert.deepEqual(template.verification.deviceClasses,
    ['narrow-tall-phone', 'reference-9-by-16-viewport', 'wide-tablet']);

  const example = template.playerGeometry.validatedNarrowPhoneExample;
  const heightScale = example.playerHeightPx / template.referenceCanvas.heightPx;
  const visibleSourceWidth = example.playerWidthPx / heightScale;
  const cropPerSide = (template.referenceCanvas.widthPx - visibleSourceWidth) / 2;
  assert.ok(Math.abs(visibleSourceWidth - example.sourceVisibleWidthPx) < 0.000001);
  assert.ok(Math.abs(cropPerSide - example.sourceHorizontalCropPerSidePx) < 0.000001);
  assert.ok(example.referenceSemanticInsetPx > cropPerSide);

  assert.equal(plan.presentationSafety.portraitDeliveryLayout.presetId,
    'layout.portrait-talking-head.safe-v1');
  assert.equal(plan.presentationSafety.portraitDeliveryLayout.declaredBrollCriticalRoiRequired, true);
  assert.equal(plan.finishingPass.captions.portraitReferenceLayout,
    'layout.portrait-talking-head.safe-v1');
  assert.equal(plan.finishingPass.captions.actualRenderedGlyphBoundsInsideEffectiveSafeRegion, true);
  assert.equal(plan.finishingPass.chapterProgress.component.portraitDeliveryLayoutPreset,
    'layout.portrait-talking-head.safe-v1');
  assert.equal(rmcuTemplate.relatedLayoutPresets.portraitTalkingHead,
    'layout.portrait-talking-head.safe-v1');
  assert.equal(rmcuTemplate.variants.portrait.approvedReferenceLayout,
    'layout.portrait-talking-head.safe-v1');
  assert.equal(state.roughCutPolicy.presentationSafety.portraitDeliveryLayout.presetId,
    'layout.portrait-talking-head.safe-v1');
  assert.ok(state.approvedCapabilities.includes(
    'multi-device-portrait-safe-region-for-captions-b-roll-pip-and-overlays'));
  assert.ok(state.approvedCapabilities.includes(
    'full-bleed-visual-layer-with-crop-safe-semantic-foreground'));

  assert.match(standard, /same-ratio resize.*cannot change the percentage cropped/);
  assert.match(standard, /effective semantic safe region as the intersection/);
  assert.match(standard, /Do not shrink every B-roll shot by default/);
  assert.match(standard, /move or shorten the decoration before relocating approved captions/);
  assert.match(reference, /## English/);
  assert.match(reference, /## 简体中文/);
  assert.match(reference, /changing `2160x3840` to `1080x1920`/i);
  assert.match(reference, /把 `2160x3840` 改成 `1080x1920`/);
  assert.match(qaTemplate, /## Portrait Multi-Device Safety/);
  assert.match(qaTemplate, /declares its critical region of interest/);
  assert.match(qaTemplate, /underline remains visibly below the rendered caption ink/);
});

test('bilingual trigger forward tests cover realistic Chinese and English edit requests', () => {
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const readmeEn = readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const readmeZh = readFileSync(path.join(repoRoot, 'README.zh-CN.md'), 'utf8');
  const chineseRequest = '请继续处理这段口播视频，修掉跨片段重复词和 B-roll 闪帧。';
  const englishRequest = 'Continue editing this talking-head video and fix cross-segment repeated words and B-roll flashes.';
  const chineseProgressRequest = '给这条竖屏口播加通用 RMCU 章节进度条，未激活长标题省略，当前标题溢出才循环滚动。';
  const englishProgressRequest = 'Add the generic portrait RMCU chapter progress component; ellipsize inactive overflow and marquee only the active overflow.';
  const chineseSafeLayoutRequest = '使用已确认的竖屏口播安全版式，让字幕、B-roll 重要信息和进度条在 iPhone 与 iPad 都可见。';
  const englishSafeLayoutRequest = 'Use the approved portrait talking-head safe layout and keep captions, critical B-roll, and progress visible on narrow phones and wide tablets.';
  const chineseCutoutRequest = '用 B-roll 铺底，把口型同步的人物抠成带白色轮廓的透明贴纸，抠像不合格就回退小窗。';
  const englishCutoutRequest = 'Put B-roll underneath a time-aligned outlined presenter cutout, and fall back to a designed PiP if the moving matte fails.';
  const chineseComponentRequest = '把这些代码动画分成通用机制、私人适配、题材模板、历史归档和错误样本，再沉淀可复用部分。';
  const englishComponentRequest = 'Classify these code motion graphics as general mechanisms, private adapters, topic templates, archives, or error samples before reuse.';
  assert.match(chineseRequest, /口播/);
  assert.match(englishRequest, /talking-head/);
  assert.match(skill, /真人口播自动剪辑/);
  assert.match(skill, /talking-head editing/);
  assert.match(chineseProgressRequest, /竖屏口播/);
  assert.match(englishProgressRequest, /portrait RMCU/);
  assert.match(chineseSafeLayoutRequest, /竖屏口播安全版式/);
  assert.match(englishSafeLayoutRequest, /portrait talking-head safe layout/);
  assert.match(chineseCutoutRequest, /人物抠成带白色轮廓的透明贴纸/);
  assert.match(englishCutoutRequest, /outlined presenter cutout/);
  assert.match(chineseComponentRequest, /代码动画/);
  assert.match(englishComponentRequest, /code motion graphics/);
  assert.match(skill, /rmcu\.semantic-progress\.v1/);
  assert.match(skill, /layout\.portrait-talking-head\.safe-v1/);
  assert.match(skill, /presenter-coverage-modes\.md/);
  assert.match(skill, /B-base-A-cutout/);
  assert.match(skill, /code-motion-components\.md/);
  assert.match(skill, /Inactive long labels use ellipsis/);
  assert.match(skill, /Reply in the user's language/);
  assert.match(readmeEn, /generic RMCU semantic progress component/);
  assert.match(readmeEn, /loop only the active label when it overflows/);
  assert.match(readmeZh, /通用 RMCU 语义进度组件/);
  assert.match(readmeZh, /只有当前标题溢出时才循环滚动/);
  assert.match(readmeEn, /approved portrait talking-head safe layout/);
  assert.match(readmeZh, /已确认的竖屏口播安全版式/);
  assert.match(readmeEn, /outlined live-presenter cutout style/);
  assert.match(readmeZh, /带描边的实时人物抠像/);
  assert.match(readmeEn, /code motion component system/);
  assert.match(readmeEn, /general mechanisms, private creator adapters, topic templates, archives, or error samples/);
  assert.match(readmeZh, /代码动画组件体系/);
  assert.match(readmeZh, /通用机制、私人创作者适配、题材模板、历史归档和错误样本/);
});

test('code motion component reference defines reusable layers and fail-closed QA bilingually', () => {
  const reference = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'code-motion-components.md'),
    'utf8',
  );
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const template = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'code-motion-component.template.json'),
    'utf8',
  ));

  assert.match(reference, /## English/);
  assert.match(reference, /## 简体中文/);
  assert.match(reference, /\| `G` \| General mechanism/);
  assert.match(reference, /\| `P` \| Private adapter/);
  assert.match(reference, /\| `T` \| Topic template/);
  assert.match(reference, /\| `A` \| Archive/);
  assert.match(reference, /\| `X` \| Error sample/);
  assert.match(reference, /General mechanism:[\s\S]*Private adapter:[\s\S]*Project instance data:/);
  assert.match(reference, /通用机制层：[\s\S]*私人适配层：[\s\S]*单片实例层：/);
  assert.match(reference, /type CodeMotionComponentSpec/);
  assert.match(reference, /privateDataAllowed: false/);
  assert.match(reference, /method-only/);
  assert.match(reference, /requestAnimationFrame/);
  assert.match(reference, /same frame must reproduce the same pixels/);
  assert.match(reference, /同一帧必须得到相同像素/);
  assert.match(reference, /within one composition pixel/);
  assert.match(reference, /一个合成像素内/);
  assert.match(reference, /expectedFailure/);
  assert.match(reference, /Verification is fail-closed/);
  assert.match(reference, /验收默认不通过/);
  assert.match(skill, /code-motion-components\.md/);
  assert.match(skill, /classify the component as `G`, `P`, `T`, `A`, or `X`/);
  assert.equal(template.schemaVersion, 1);
  assert.equal(template.layers.generalMechanism.privateDependenciesAllowed, false);
  assert.equal(template.layers.generalMechanism.projectDependenciesAllowed, false);
  assert.equal(template.layers.privateAdapter.storedOutsideGenericRepository, true);
  assert.equal(template.layers.projectInstance.storedInVideoProject, true);
  assert.equal(template.parameters.motion.travelClock, 'timeline-frame');
  assert.equal(template.governance.privateDataAllowed, false);
  assert.equal(template.qa.contactPointErrorMaximumCompositionPx, 1);
  assert.equal(template.replacement.reversibleBaselinePreserved, true);
  assert.match(reference, /code-motion-component\.template\.json/);
});

test('caption pagination profile is bilingual and fails closed on punctuation and token splits', () => {
  const reference = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'caption-semantic-pagination.md'),
    'utf8',
  );
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const templatePath = path.join(repoRoot, 'skill', 'ai-video-director', 'assets',
    'templates', 'caption-pagination.template.json');

  const valid = JSON.parse(runNode('audit-caption-pages.mjs', [templatePath]));
  assert.equal(valid.result, 'pass');
  assert.equal(valid.pages, 2);

  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-caption-audit-'));
  const invalidPath = path.join(temp, 'invalid.json');
  writeFileSync(invalidPath, JSON.stringify({
    schemaVersion: 1,
    profileId: 'comma-and-sentence-short-card-v1',
    maxUnits: 26,
    forceBreakPunctuation: ['，', '。', ',', '.'],
    protectedTerms: ['Remotion'],
    segments: [{
      id: 'bad',
      sourceText: '选择 Remotion，然后输出。',
      pages: [
        {rawText: '选择 Remot', displayText: '选择 Remot'},
        {rawText: 'ion，然后输出。', displayText: 'ion，然后输出'},
      ],
    }],
  }));
  const invalid = spawnSync(process.execPath, [
    path.join(scripts, 'audit-caption-pages.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /boundary splits a Latin token/);
  assert.match(invalid.stdout, /force-break punctuation/);
  assert.match(invalid.stdout, /protected term/);

  const captions = state.roughCutPolicy.finishingPass.captions;
  assert.equal(captions.fixedWidthCodePointSplit, 'forbidden');
  assert.equal(captions.paginationProfiles.commaAndSentenceShortCard
    .commaPeriodSemicolonColonQuestionExclamation, 'force-new-card');
  assert.ok(state.approvedCapabilities.includes(
    'audited-caption-pagination-with-no-fixed-width-code-point-splits'));
  assert.match(reference, /fixed-width code-point fallback/);
  assert.match(reference, /固定字符数硬切/);
  assert.match(reference, /Every comma, period, semicolon, colon/);
  assert.match(reference, /每个逗号、句号、分号、冒号/);
  assert.match(skill, /caption-semantic-pagination\.md/);
  assert.match(skill, /audit-caption-pages\.mjs/);
});

test('coverage boundary audit blocks short A-roll bridges and unsnapped source-cut layout changes', () => {
  const reference = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'presenter-coverage-modes.md'),
    'utf8',
  );
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const templatePath = path.join(repoRoot, 'skill', 'ai-video-director', 'assets',
    'templates', 'coverage-boundary-audit.template.json');

  const valid = JSON.parse(runNode('audit-coverage-boundaries.mjs', [templatePath]));
  assert.equal(valid.result, 'pass');
  assert.equal(valid.aggregateRuns, 4);
  assert.ok(valid.frameBoundaryChecks >= 8);

  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-coverage-audit-'));
  const invalidPath = path.join(temp, 'invalid.json');
  writeFileSync(invalidPath, JSON.stringify({
    schemaVersion: 1,
    fps: 30,
    durationSeconds: 8,
    minimumIntentionalDwellSeconds: 2,
    nearSourceCutSeconds: 1,
    sourceCuts: [0, 4, 8],
    sourceCutFrames: [0, 120, 240],
    runs: [
      {id: 'b-before', startSec: 0, endSec: 3.8, startFrame: 0, endFrame: 114, mode: 'AB-live', layout: 'B-base-A-PiP'},
      {id: 'flash', startSec: 3.800001, endSec: 4.2, startFrame: 114, endFrame: 126, mode: 'A-only'},
      {id: 'b-after', startSec: 4.2, endSec: 8, startFrame: 126, endFrame: 240, mode: 'AB-live', layout: 'B-base-A-PiP'},
    ],
    continuousRuns: [{
      id: 'broken-cards',
      startSec: 0,
      endSec: 8,
      presenterRequired: true,
      presenter: {id: 'short-pip', startSec: 0, endSec: 3.8},
      cards: [
        {id: 'a', startSec: 0, endSec: 3.8},
        {id: 'b', startSec: 4.2, endSec: 8},
      ],
    }],
  }));
  const invalid = spawnSync(process.execPath, [
    path.join(scripts, 'audit-coverage-boundaries.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /dwell is below/);
  assert.match(invalid.stdout, /becomes runtime frame/);
  assert.match(invalid.stdout, /A-only\/layout boundary/);
  assert.match(invalid.stdout, /card gap\/overlap/);
  assert.match(invalid.stdout, /stable presenter interval/);

  const continuity = state.roughCutPolicy.bRollContinuity;
  assert.equal(continuity.coverageRunClassification.minimumIntentionalARollResetSeconds, 2);
  assert.equal(continuity.coverageBoundaryAudit.continuousCardRunsForbidAOnlyBridge, true);
  assert.equal(continuity.coverageBoundaryAudit.canonicalBoundaryUnit,
    'integer-frame-index');
  assert.equal(continuity.coverageBoundaryAudit.runtimeFrameResolutionAudit, true);
  assert.ok(state.approvedCapabilities.includes(
    'source-cut-and-layout-boundary-conformance-audit'));
  assert.match(reference, /Source-Cut And Layout-Boundary Conformance/);
  assert.match(reference, /源片剪点与版式边界统一/);
  assert.match(reference, /same program frame/);
  assert.match(reference, /150\.666667/);
  assert.match(reference, /同一个节目帧/);
  assert.match(skill, /audit-coverage-boundaries\.mjs/);
});

test('platform publication package locks the exact release master and rejects risky claims', () => {
  const reference = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'platform-release-and-publish-package.md'),
    'utf8',
  );
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'director-plan.template.json'),
    'utf8',
  ));
  const template = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'publish-package.template.json'),
    'utf8',
  ));
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-publish-audit-'));
  const validPath = path.join(temp, 'valid.json');
  const valid = structuredClone(template);
  valid.target.platform = 'douyin';
  valid.target.jurisdiction = 'CN';
  valid.rulesVerification.checkedAt = '2026-08-18';
  valid.rulesVerification.officialSources = [{
    title: 'Current official rules',
    url: 'https://example.gov/rules',
  }];
  valid.releaseMaster.path = '/outside-repo/release-4k.mp4';
  valid.releaseMaster.sourceLineage = ['/outside-repo/source-4k.mov'];
  valid.releaseMaster.required.width = 2160;
  valid.releaseMaster.required.height = 3840;
  valid.releaseMaster.probed.width = 2160;
  valid.releaseMaster.probed.height = 3840;
  valid.releaseMaster.exactCandidateQaPassed = true;
  valid.aiDisclosure.realHumanRecording = true;
  valid.aiDisclosure.realHumanVoice = true;
  valid.aiDisclosure.aiAssistedEditing = true;
  valid.aiDisclosure.aiGeneratedGraphicsOrAnimation = true;
  valid.aiDisclosure.syntheticVoice = false;
  valid.aiDisclosure.faceReplacement = false;
  valid.aiDisclosure.platformDeclarationPlanned = true;
  valid.aiDisclosure.viewerFacingCopy = 'Real recording with AI-assisted editing and graphics.';
  valid.variants.forEach((variant, index) => {
    variant.coverTitle = `Accurate cover ${index + 1}`;
    variant.postCaption = `Accurate finished-video description ${index + 1}`;
    variant.hashtags = ['#AIVideoEditing', '#VideoCreation'];
    variant.rationale = 'Matches the finished video.';
  });
  writeFileSync(validPath, JSON.stringify(valid));
  const validResult = JSON.parse(runNode('audit-publish-package.mjs', [validPath]));
  assert.equal(validResult.ok, true);

  const invalidPath = path.join(temp, 'invalid.json');
  const invalidData = structuredClone(valid);
  invalidData.releaseMaster.upscaledReviewProxy = true;
  invalidData.aiDisclosure.platformDeclarationPlanned = false;
  invalidData.campaignTags = ['#UnverifiedCampaign'];
  invalidData.campaignEligibilityVerified = false;
  invalidData.variants[0].postCaption = '保证不违规，私信领取 https://example.com';
  writeFileSync(invalidPath, JSON.stringify(invalidData));
  const invalid = spawnSync(process.execPath, [
    path.join(scripts, 'audit-publish-package.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /upscaled review proxy/);
  assert.match(invalid.stdout, /platform declaration is not planned/);
  assert.match(invalid.stdout, /prohibited guarantee/);
  assert.match(invalid.stdout, /Campaign tags require verified eligibility/);

  assert.equal(plan.releaseAndPublicationPlan.reviewProxyMayReceiveFinalPublicationApproval,
    false);
  assert.equal(plan.releaseAndPublicationPlan.exactReleaseCandidateQaAndApprovalRequired, true);
  assert.equal(state.releaseAndPublicationPolicy.publishPackage.minimumVariantCount, 3);
  assert.equal(state.releaseAndPublicationPolicy.releaseMaster.upscaleReviewProxyAndCallItMaster,
    'forbidden');
  assert.match(reference, /Publishing work begins early and finishes late/);
  assert.match(reference, /发布不是精剪完成后才临时补一句文案/);
  assert.match(reference, /Do not claim that a workflow is public, open source, free/);
  assert.match(skill, /platform-release-and-publish-package\.md/);
  assert.match(skill, /audit-publish-package\.mjs/);
});

test('ordinary visual modes are director-selected while explicit mode demos are token-synchronized', () => {
  const standard = readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'), 'utf8');
  const coverage = readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references', 'presenter-coverage-modes.md'), 'utf8');
  const plan = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'director-plan.template.json'), 'utf8'));
  assert.match(standard, /Ordinary narration does not need to name a layout/);
  assert.match(standard, /semantic-state synchronization/);
  assert.match(standard, /普通视频的画面形式由内容和导演决策决定/);
  assert.match(coverage, /Do not wait for ordinary narration to say a layout name/);
  assert.match(coverage, /普通口播不需要先说出版式名称/);
  assert.equal(plan.bRollContinuity.coverageRunClassification
    .ordinaryLayoutRequiresSpokenModeName, false);
  assert.equal(plan.bRollContinuity.coverageRunClassification
    .semanticStateSynchronizationRequired, true);
  assert.equal(plan.spokenCueSynchronization
    .exactNamedModePhraseAppliesOnlyToExplicitModeIntroductionComparisonOrTeaching, true);
});

test('learning scope and delivery manifests make project handoff auditable', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-delivery-audit-'));
  const projectDir = path.join(temp, 'editable-project');
  mkdirSync(projectDir);
  const files = {};
  for (const name of ['master.mp4', 'qa.md', 'index.html', 'rough.xml', 'edl.json',
    'aroll.mp4', 'captions.json', 'storyboard.json', 'director.json', 'rights.json',
    'publish.json', 'learning.json']) {
    files[name] = path.join(temp, name);
    writeFileSync(files[name], 'fixture');
  }

  const learningTemplate = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'learning-scope-ledger.template.json'), 'utf8'));
  learningTemplate.projectId = 'fixture-project';
  learningTemplate.updatedAt = '2026-08-18';
  learningTemplate.entries[0] = {
    id: 'semantic-state-sync',
    title: 'Semantic state synchronization',
    sourceFeedback: 'A later visual state appeared before its matching narration.',
    changeType: 'corrected-overgeneralization',
    promotionLayer: 'public-repository',
    previousContract: 'Explicit mode demonstrations used exact named-phrase timing.',
    observedFailure: 'The summary made that exception sound universal.',
    generalizedInvariant: 'Director-selected layouts must match the current claim.',
    projectSpecificInstance: 'This episode explicitly teaches A-roll and B-roll modes.',
    implementation: {
      publicRepositoryFiles: ['references/presenter-coverage-modes.md'],
      privateProfileKeys: [],
      projectArtifacts: [files['storyboard.json']],
    },
    privacyReason: 'No identity asset or creator-specific coordinate enters the public rule.',
    evidence: ['user-approved episode review'],
    approvedByUser: true,
  };
  writeFileSync(files['learning.json'], JSON.stringify(learningTemplate));
  const learningResult = JSON.parse(runNode('audit-learning-scope-ledger.mjs', [files['learning.json']]));
  assert.equal(learningResult.ok, true);

  const delivery = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'delivery-manifest.template.json'), 'utf8'));
  delivery.projectId = 'fixture-project';
  delivery.status = 'ready';
  delivery.releaseMaster.absolutePath = files['master.mp4'];
  delivery.releaseMaster.sha256 = 'fixture-sha256';
  delivery.releaseMaster.qaReportAbsolutePath = files['qa.md'];
  delivery.editableProjects[0] = {
    role: 'fine-edit',
    format: 'HyperFrames',
    absolutePath: projectDir,
    entryPointAbsolutePath: files['index.html'],
    openOrPreviewCommand: 'npm run dev',
    studioOrProjectUrl: 'http://localhost:3002/#project/editable-project',
    checkCommand: 'npm run check',
    renderCommand: 'npm run render -- --resolution portrait-4k',
    requiredRuntimeOrAccount: ['Node.js'],
    verifiedOpenable: true,
  };
  delivery.roughCut.fcpXmlAbsolutePath = files['rough.xml'];
  delivery.roughCut.canonicalEdlAbsolutePath = files['edl.json'];
  delivery.roughCut.lockedArollAbsolutePath = files['aroll.mp4'];
  delivery.supportingArtifacts = {
    captionsAbsolutePath: files['captions.json'],
    storyboardAbsolutePath: files['storyboard.json'],
    directorPlanAbsolutePath: files['director.json'],
    rightsManifestAbsolutePath: files['rights.json'],
    publicationPackageAbsolutePath: files['publish.json'],
    learningScopeLedgerAbsolutePath: files['learning.json'],
  };
  delivery.deliveryChecks = {
    allDeclaredLocalPathsAreAbsolute: true,
    allRequiredLocalFilesExist: true,
    editableProjectOpenedOrChecked: true,
    renderCommandIsReproducible: true,
    finalResponseListsPathsAndOpeningInstructions: true,
    sharedWorkspaceRequiresDownload: false,
  };
  const deliveryPath = path.join(temp, 'delivery.json');
  writeFileSync(deliveryPath, JSON.stringify(delivery));
  const deliveryResult = JSON.parse(runNode('audit-delivery-manifest.mjs', [deliveryPath]));
  assert.equal(deliveryResult.ok, true);
  assert.match(deliveryResult.warnings[0], /not yet been approved/);
});

test('public repository is Apache-2.0 and contains no personal media or exposed commit email', () => {
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const license = readFileSync(path.join(repoRoot, 'LICENSE'), 'utf8');
  const readme = readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const result = JSON.parse(runNode('audit-public-repository.mjs', []));
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.license, 'Apache-2.0');
  assert.match(license, /Apache License/);
  assert.match(readme, /License And Privacy Boundary/);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
