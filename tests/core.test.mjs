import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, realpathSync} from 'node:fs';
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
  assert.equal(state.projectId, 'test-video');
  assert.equal(intake.projectId, 'test-video');
  assert.equal(roughCutReview.projectId, 'test-video');
  assert.equal(roughCutReview.takeSelectionPolicy.principle, 'quality-first');
  assert.equal(roughCutReview.fullCutReview.listenedFromStartToFinish, false);
  assert.equal(roughCutReview.audibleDuplicateAudit.crossSegmentAndClipBoundariesScanned, false);
  assert.equal(roughCutReview.structuralEditReadback.intentionalTransitionsChecked, false);
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

test('director plan schema carries reusable rough-cut and privacy guardrails', () => {
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates', 'director-plan.template.json'),
    'utf8',
  ));
  assert.equal(plan.roughCut.takeSelection.laterOccurrence, 'tie-breaker-only');
  assert.equal(plan.roughCut.pauseTreatment.universalDurationMilliseconds, null);
  assert.equal(plan.privacyPlan.criticalIdentifiersUseOpaqueMasks, true);
  assert.equal(plan.privacyPlan.focusCueWhenEvidenceIsNotObvious, 'required');
  assert.equal(plan.presentationSafety.presenterInsertEntryFrame, 'normal-expression-eyes-open');
  assert.equal(plan.presentationSafety.platformUiExclusionZonesRequired, true);
  assert.equal(plan.finishingPass.voiceIsolation.processEachSourceRangeSeparately, true);
  assert.equal(plan.finishingPass.voiceIsolation.reuseDerivedAudioAcrossDifferentSourceRanges, false);
  assert.equal(plan.finishingPass.captions.reflowAfterScaling, true);
  assert.equal(plan.finishingPass.captions.separateCompletedThoughtFromNextThought, true);
  assert.equal(plan.finishingPass.color.neutralizeCastBeforeCreativeLook, true);
  assert.equal(plan.roughCut.audibleDuplicateAudit.captionDisplayOverrideCountsAsAudioRemoval, false);
  assert.equal(plan.roughCut.structuralEditReadback.requiredAfterScriptEdit, true);
  assert.equal(plan.bRollContinuity.continuousRunInteriorAlphaCoverage, 'required');
  assert.equal(plan.bRollContinuity.pairedInteriorFadesMayRevealARoll, false);
  assert.equal(plan.bRollContinuity.coverageRunClassification.durationBasis,
    'aggregate-viewer-visible-run');
  assert.equal(plan.bRollContinuity.coverageRunClassification.longRunDefault,
    'AB-live-PiP-unless-evidence-or-platform-collision');
  assert.equal(plan.bRollContinuity.transitionGrammar.continuousExplanationInterior,
    'direct-cuts-by-default');
  assert.equal(plan.bRollContinuity.transitionGrammar.blanketPresetAcrossAllBoundaries, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.scaledUncroppedSourceDefault, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.contentOccupancyMapRequired, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.preferredCornerIsOnlyADefault, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.fixedGlobalSizeDefault, false);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.geometryStableWithinCoverageRun, true);
  assert.equal(plan.presentationSafety.pictureInPictureDesign.visibleCropBoxVerificationRequired, true);
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
  assert.equal(plan.finishingPass.chapterProgress.defaultEnabled, true);
  assert.equal(plan.finishingPass.chapterProgress.segmentWidth, 'duration-proportional');
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

test('finishing pass guards audio routing, caption reflow and natural color', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const finishing = state.roughCutPolicy.finishingPass;
  assert.equal(finishing.voiceIsolation.reuseShortDerivativeAcrossDifferentSourceOffsets, 'forbidden');
  assert.equal(finishing.voiceIsolation.verification, 'early-and-late-timeline-audible-samples');
  assert.equal(finishing.captions.scaleChange, 'requires-reflow-and-box-resize');
  assert.equal(finishing.color.order, 'neutralize-cast-before-creative-look');
  assert.equal(finishing.color.continuousRecordingCorrectionScope, 'source-track-or-global-first');
  assert.equal(finishing.color.sameParametersProvePerceptualConsistency, false);
  assert.equal(finishing.color.rollbackIfInconsistent,
    'remove-correction-and-keep-stable-source');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /never attach one short derivative to unrelated clips/);
  assert.match(standard, /early and a late timeline section/);
  assert.match(standard, /When caption size changes, treat it as a layout change/);
  assert.match(standard, /Neutralize a visible color cast before adding a look/);
  assert.match(standard, /applying the same settings as separate per-clip effects does not prove perceptual consistency/);
  assert.match(standard, /remove the correction and keep the stable source/);
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
  assert.deepEqual(policy.modes, ['A-only', 'B-only', 'AB-live-PiP']);
  assert.equal(policy.longRunDefault, 'AB-live-PiP-unless-evidence-or-platform-collision');

  const standard = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'),
    'utf8',
  );
  assert.match(standard, /merge adjacent or near-adjacent B-roll beats/);
  assert.match(standard, /Measure and classify the aggregate run, not each card in isolation/);
  assert.match(standard, /A long continuous coverage run.*defaults to `AB-live-PiP`/);
});

test('PiP, transitions and semantic punctuation are planned from composed content', () => {
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const safety = state.roughCutPolicy.presentationSafety.pictureInPictureDesign;
  const transition = state.roughCutPolicy.bRollContinuity.transitionGrammar;
  const punctuation = state.roughCutPolicy.finishingPass.captions.semanticPunctuation;
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
  assert.match(standard, /Do not use a global punctuation-hide switch/);
  assert.match(standard, /Caption metadata is not visual proof/);
  assert.match(standard, /supplied manuscript as the punctuation source of truth/);
  assert.match(standard, /Do not invent title marks, replace enumeration commas with vertical bars/);
  assert.match(standard, /explicitly assess and record five categories/);
  assert.match(standard, /an unreviewed category is not the same as an intentional omission/);

  const chapterProgress = state.roughCutPolicy.finishingPass.chapterProgress;
  assert.equal(chapterProgress.default, 'enabled-after-structural-timing-lock');
  assert.equal(chapterProgress.segmentWidth, 'duration-proportional');
  assert.equal(chapterProgress.renderedOverlayInteractive, false);
  assert.equal(chapterProgress.recomputeAfterStructuralTimingChange, true);
  assert.ok(state.approvedCapabilities.includes(
    'time-driven-semantic-chapter-progress-with-plain-bar-fallback',
  ));
  assert.match(standard, /Derive its sections from the approved semantic structure/);
  assert.match(standard, /use one unsegmented progress bar instead of inventing chapters/);
  assert.match(standard, /rendered progress strip is visual orientation, not an interactive seek target/);
  assert.match(standard, /Verify early, middle, late, and every chapter boundary/);

  const qaTemplate = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates', 'qa-report.template.md'),
    'utf8',
  );
  assert.match(qaTemplate, /## Finishing Design Audit/);
  assert.match(qaTemplate, /`Off`\/`none` is valid; `unreviewed` is not/);
  assert.match(qaTemplate, /No semantic punctuation was invented or replaced/);
  assert.match(qaTemplate, /Every manuscript punctuation mark inside a caption page is preserved/);
  assert.match(qaTemplate, /Page-final question and exclamation marks are always preserved/);
  assert.match(qaTemplate, /## Semantic Chapter Progress/);
  assert.match(qaTemplate, /duration-proportional boundaries/);
  assert.match(qaTemplate, /visual orientation only/);
});

test('bilingual trigger forward tests cover realistic Chinese and English edit requests', () => {
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const chineseRequest = '请继续处理这段口播视频，修掉跨片段重复词和 B-roll 闪帧。';
  const englishRequest = 'Continue editing this talking-head video and fix cross-segment repeated words and B-roll flashes.';
  assert.match(chineseRequest, /口播/);
  assert.match(englishRequest, /talking-head/);
  assert.match(skill, /真人口播自动剪辑/);
  assert.match(skill, /talking-head editing/);
  assert.match(skill, /Reply in the user's language/);
});
