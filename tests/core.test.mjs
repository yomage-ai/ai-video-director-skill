import {sha256} from '../skill/ai-video-director/scripts/lib/media-contract.mjs';
import {bindRoughReview,bindFineDirection} from './fixtures/media-fixture.mjs';
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
  assert.equal(edl.schemaVersion, 2);
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
  runNode('director.mjs', [
    'init-project', '--id', 'test-video', '--root', projectsRoot, '--language', 'zh-CN',
  ]);
  const project = path.join(projectsRoot, 'test-video');
  const state = JSON.parse(readFileSync(path.join(project, 'project-state.json'), 'utf8'));
  const intake = JSON.parse(readFileSync(path.join(project, 'intake.json'), 'utf8'));
  const roughCutReview = JSON.parse(
    readFileSync(path.join(project, 'analysis', 'rough-cut-review.json'), 'utf8'),
  );
  const fineEditDirection = JSON.parse(
    readFileSync(path.join(project, 'analysis', 'fine-edit-direction.json'), 'utf8'),
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
  const directorBrief = readFileSync(
    path.join(project, 'analysis', 'director-brief.md'), 'utf8',
  );
  assert.equal(state.projectId, 'test-video');
  assert.equal(intake.projectId, 'test-video');
  assert.equal(roughCutReview.projectId, 'test-video');
  assert.equal(roughCutReview.takeSelectionPolicy.principle, 'quality-first');
  assert.equal(roughCutReview.schemaVersion, 4);
  assert.equal(roughCutReview.timelineInventory.allRealJoinsRepresented, false);
  assert.equal(roughCutReview.paceConsistencyReview.comparisonWindows.length, 3);
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
  assert.equal(roughCutReview.playbackSpeedReview.retimeApplied, null);
  assert.equal(roughCutReview.paceConsistencyReview.postRetimeRevalidation.status,
    'not-applicable|pending|pass');
  assert.equal(roughCutReview.dialogueLoudnessMatch.integratedLufsMatchedFirst, false);
  assert.equal(roughCutReview.audibleDuplicateAudit.crossSegmentAndClipBoundariesScanned, false);
  assert.equal(roughCutReview.structuralEditReadback.intentionalTransitionsChecked, false);
  assert.equal(roughCutReview.sourceColorNormalization.workflowStage,
    'rough-cut-before-approval');
  assert.equal(roughCutReview.sourceColorNormalization.fineEditReprocessingRequired, false);
  assert.equal(fineEditDirection.projectId, 'test-video');
  assert.equal(fineEditDirection.screenEvidence.onePrimaryEvidencePlaneDefault, true);
  assert.equal(fineEditDirection.audio.backgroundMusic.auditionedInStyleSample, false);
  assert.equal(publishPackage.schemaVersion, 1);
  assert.equal(publishPackage.releaseMaster.upscaledReviewProxy, false);
  assert.equal(publishPackage.rulesVerification.guaranteedCompliantClaimAllowed, false);
  assert.equal(learningScope.projectId, 'test-video');
  assert.equal(learningScope.changeTypes.includes('pre-existing-hardened'), true);
  assert.equal(learningScope.changeTypes.includes('new-public-curated-style'), true);
  assert.equal(learningScope.promotionLayers.includes('public-curated-style-library'), true);
  assert.equal(deliveryManifest.projectId, 'test-video');
  assert.equal(deliveryManifest.deliveryChecks.sharedWorkspaceRequiresDownload, false);
  assert.match(directorBrief, /## 内容锁定/);
  assert.match(directorBrief, /## 本轮确认/);
  assert.equal(state.currentStageId, '00-intake-preflight');
  assert.equal(path.relative(repoRoot, project).startsWith('..'), true);
});

test('director brief audit keeps approval human-facing and in the user language', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-director-brief-'));
  const validPath = path.join(temp, 'valid.md');
  writeFileSync(validPath, [
    '# 内容锁定卡与粗剪方案',
    '## 内容锁定',
    '- 核心观点：AI 可以执行学习流程，但真正掌握仍要经过真实任务验收。',
    '- 必须保留：任务停止、Token 消耗和学成一首歌的反转。',
    '## 导演判断',
    '- 推荐方向：先证明问题，再给解决方法和边界。',
    '- 判断理由：观众需要先理解为什么旧方案不可靠。',
    '## 粗剪方案',
    '- 节奏目标：保留自然表达，同时修复字头、长停顿和中段语速漂移。',
    '- 验收方式：逐个衔接正常速度听审，并比较开头、中段和结尾。',
    '## 证据计划',
    '- 真实素材：使用操作录屏和 Token 页面证明当前口播。',
    '## 暂缓确认的精剪项',
    '- 精剪风格：粗剪锁定后再用视听样片确认，当前暂不锁定。',
    '## 本轮确认',
    '- 推荐结论：先确认内容与粗剪方案。',
    '- 请确认：以上内容是否可以进入粗剪？确认后 Agent 会完成全片听审。',
  ].join('\n'));
  const valid = JSON.parse(runNode('audit-director-brief.mjs', [
    validPath, '--language', 'zh-CN',
  ]));
  assert.equal(valid.ok, true);

  const invalidPath = path.join(temp, 'invalid.md');
  writeFileSync(invalidPath, [
    '# Director plan',
    '```json',
    '{"schemaVersion": 3, "projectId": "private-project"}',
    '```',
  ].join('\n'));
  const invalid = spawnSync(process.execPath, [
    path.join(scripts, 'audit-director-brief.mjs'), invalidPath, '--language', 'zh-CN',
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /must not expose internal machine JSON/);
  assert.match(invalid.stdout, /missing user-facing heading/);
  assert.match(invalid.stdout, /substantive Chinese explanations/);
});

test('curated style library provides a public, content-routed fine-edit floor', () => {
  const registryPath = path.join(
    repoRoot, 'skill', 'ai-video-director', 'references',
    'curated-style-library.json');
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  assert.equal(registry.schemaVersion, 1);
  assert.ok(registry.libraryVersion >= 1);
  assert.ok(registry.selectionPolicy.candidateComparisonMinimum >= 2);
  assert.equal(registry.selectionPolicy.universalTemplateLock, false);
  assert.equal(registry.referencePolicy.keepMarkedStyles, true);
  assert.equal(registry.referencePolicy.outsideLibraryAllowed, true);
  assert.equal(registry.referencePolicy.hybridAllowed, true);
  assert.equal(registry.sharedQualityFloor.realEvidenceMayNotBeReplacedByIllustration, true);
  const active = registry.styles.filter((style) => style.status === 'active');
  assert.ok(active.length >= 4);
  assert.equal(new Set(active.map((style) => style.id)).size, active.length);
  for (const style of active) {
    assert.match(style.id, /^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/);
    assert.ok(style.label.en.length > 0);
    assert.ok(style.label['zh-CN'].length > 0);
    assert.ok(style.curationSignals.length > 0);
    assert.ok(style.contentFit.viewerJobs.length > 0);
    assert.ok(style.contentFit.strongSignals.length > 0);
    assert.ok(style.contentFit.avoidWhen.length > 0);
    assert.ok(Object.keys(style.visualContract.palette).length >= 4);
    assert.ok(style.brollGrammar.primaryForms.length > 0);
    assert.ok(style.motionGrammar.entrances.length > 0);
    assert.ok(style.soundGrammar.candidates.length > 0);
    assert.equal(style.provenance.sourceAssetDistributed, false);
  }

  const audit = JSON.parse(runNode('audit-curated-style-library.mjs', [registryPath]));
  assert.equal(audit.ok, true);
  assert.equal(audit.activeStyleCount, active.length);

  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-style-library-'));
  const invalidRegistry = structuredClone(registry);
  invalidRegistry.styles[0].contentFit.avoidWhen = [];
  const invalidPath = path.join(temp, 'invalid-library.json');
  writeFileSync(invalidPath, JSON.stringify(invalidRegistry));
  const failed = spawnSync(process.execPath, [
    path.join(scripts, 'audit-curated-style-library.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(failed.status, 0);
  assert.match(failed.stdout, /contentFit.avoidWhen must contain/);
});

test('rough-cut review audit blocks incomplete joins, unresolved pauses, and unverified pace', () => {
  const template = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'rough-cut-review.template.json'), 'utf8'));
  const valid = structuredClone(template);
  valid.status = 'ready-for-user-review';
  valid.timelineInventory = {
    durationSeconds: 30,
    placedMediaItems: 2,
    expectedJoinCount: 1,
    actualJoinCount: 1,
    allRealJoinsRepresented: true,
  };
  valid.joinReview.allPlacedItemBoundariesEnumerated = true;
  valid.joinReview.everyRealJoinReviewedAtNormalSpeed = true;
  valid.joinReview.everyChangedBoundaryReviewedAtFullSpeed = true;
  valid.joinReview.auditoryReviewCompletedByAgent = true;
  valid.manuscriptAudibilityAudit.openingWordsAudible = true;
  valid.manuscriptAudibilityAudit.closingWordsAudible = true;
  valid.manuscriptAudibilityAudit.everyChangedBoundaryHasExpectedTokens = true;
  valid.manuscriptAudibilityAudit.verifiedBoundaries = [{
    boundaryId: 'clip-1-to-clip-2',
    timelineTimeSeconds: 15,
    expectedLastToken: '它',
    expectedFirstToken: '会停',
    audibleLastToken: '它',
    audibleFirstToken: '会停',
    retainedOccurrenceHasCompleteOnset: true,
    pauseSeconds: 0.28,
    renderedWindow: 'renders/audit/join-001.wav',
    mouthNoise: 'none',
    visualState: 'pass',
    normalSpeedAuditioned: true,
    status: 'repaired',
    notes: ['Restored the incoming onset.'],
  }];
  valid.pauseScan.scannedRenderedProgram = true;
  valid.pauseScan.candidateCount = 1;
  valid.pauseScan.resolvedCount = 1;
  valid.pauseScan.unresolvedCount = 0;
  valid.pauseScan.longestUnexplainedSeconds = null;
  valid.issueClassSweep = {
    userFeedbackNamedRepeatableDefect: true,
    patchOnlyListedTimestamps: false,
    fullRelevantTimelineSwept: true,
    classes: [{
      id: 'overlong-joins',
      detectionMethod: 'Scan every rendered join and every 0.6s+ pause candidate at normal speed.',
      hitCount: 3,
      resolvedCount: 3,
      evidence: 'renders/audit/all-overlong-join-candidates.json',
    }],
  };
  valid.expressiveMomentReview.decisions = [{
    id: 'laugh-1',
    type: 'laughter',
    treatment: 'shorten',
    reason: 'Keep the genuine reaction while preserving the surrounding pace.',
    normalSpeedAudiovisualReviewed: true,
  }];
  valid.paceConsistencyReview.comparisonWindows.forEach((window, index) => {
    window.startSeconds = index * 10;
    window.endSeconds = index * 10 + 6;
    window.activeSpeechUnitsPerSecond = 4.2 + index * 0.05;
    window.selectedPlaybackRate = 1.04;
    window.normalSpeedAuditioned = true;
    window.status = index === 1 ? 'repaired' : 'pass';
  });
  valid.paceConsistencyReview.wholeProgramFeelsConsistent = true;
  valid.paceConsistencyReview.postRetimeRevalidation = {
    status: 'pass',
    joinsAndBreaths: 'pass',
    timelineDurationAndBoundaries: 'pass',
    captions: 'pass',
    bRoll: 'pass',
    presenterOrCutout: 'pass',
    soundEffects: 'pass',
    backgroundMusicAndDucking: 'pass',
    layoutAndMotion: 'pass',
    chapterProgress: 'not-present',
    transitions: 'pass',
    outro: 'pass',
    normalSpeedAudiovisualReviewCompleted: true,
    evidence: ['renders/audit/post-retime-full-program.mp4'],
  };
  valid.playbackSpeedReview.testedRates = [1, 1.04];
  valid.playbackSpeedReview.selectedRate = 1.04;
  valid.playbackSpeedReview.retimeApplied = true;
  valid.playbackSpeedReview.contentAndPerformanceRationale =
    'A stable middle-range adjustment matches the already natural opening and ending pace.';
  valid.playbackSpeedReview.representativeRenderedPassageReviewed = true;
  valid.playbackSpeedReview.boundaryAuditRerunAfterRateSelection = true;
  valid.playbackSpeedReview.pitchPreserved = true;
  valid.playbackSpeedReview.stableRateRanges = [{startSeconds: 0, endSeconds: 30, rate: 1.04}];
  valid.fullCutReview = {
    watchedFromStartToFinish: true,
    listenedFromStartToFinish: true,
    normalSpeedAuditoryReview: true,
    automationUsedAsSoleProof: false,
    reviewer: 'fixture-human-audition',
    unresolvedIssues: [],
  };

  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-rough-audit-'));
  const validPath = path.join(temp, 'valid.json');
  bindRoughReview(valid);
  writeFileSync(validPath, JSON.stringify(valid));
  const validResult = JSON.parse(runNode('audit-rough-cut-review.mjs', [validPath]));
  assert.equal(validResult.ok, true);
  assert.equal(validResult.counts.joins, 1);

  const noRetime = structuredClone(valid);
  noRetime.playbackSpeedReview.testedRates = [1];
  noRetime.playbackSpeedReview.selectedRate = 1;
  noRetime.playbackSpeedReview.retimeApplied = false;
  noRetime.playbackSpeedReview.pitchPreserved = false;
  noRetime.playbackSpeedReview.stableRateRanges = [{startSeconds: 0, endSeconds: 30, rate: 1}];
  noRetime.paceConsistencyReview.comparisonWindows.forEach((window) => {
    window.selectedPlaybackRate = 1;
  });
  noRetime.paceConsistencyReview.postRetimeRevalidation.status = 'not-applicable';
  const noRetimePath = path.join(temp, 'no-retime.json');
  bindRoughReview(noRetime);
  writeFileSync(noRetimePath, JSON.stringify(noRetime));
  const noRetimeResult = JSON.parse(runNode('audit-rough-cut-review.mjs', [noRetimePath]));
  assert.equal(noRetimeResult.ok, true);

  const motivatedFreeze = structuredClone(valid);
  motivatedFreeze.expressiveMomentReview.decisions[0].treatment = 'motivated-freeze';
  motivatedFreeze.expressiveMomentReview.decisions[0].reason =
    'A one-beat freeze makes this specific comic reveal clearer without creating a fake stall.';
  const motivatedFreezePath = path.join(temp, 'motivated-freeze.json');
  writeFileSync(motivatedFreezePath, JSON.stringify(motivatedFreeze));
  const motivatedFreezeResult = JSON.parse(runNode(
    'audit-rough-cut-review.mjs', [motivatedFreezePath]));
  assert.equal(motivatedFreezeResult.ok, true);

  const invalid = structuredClone(valid);
  invalid.timelineInventory.placedMediaItems = 3;
  invalid.pauseScan.unresolvedCount = 1;
  invalid.paceConsistencyReview.comparisonWindows[1].normalSpeedAuditioned = false;
  invalid.paceConsistencyReview.postRetimeRevalidation.presenterOrCutout = 'pending';
  invalid.playbackSpeedReview.pitchPreserved = false;
  invalid.expressiveMomentReview.automaticFreezeOrRemoval = true;
  invalid.issueClassSweep.fullRelevantTimelineSwept = false;
  const invalidPath = path.join(temp, 'invalid.json');
  writeFileSync(invalidPath, JSON.stringify(invalid));
  const failed = spawnSync(process.execPath, [
    path.join(scripts, 'audit-rough-cut-review.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(failed.status, 0);
  assert.match(failed.stdout, /expectedJoinCount must equal placedMediaItems - 1/);
  assert.match(failed.stdout, /unresolvedCount must be 0/);
  assert.match(failed.stdout, /normalSpeedAuditioned must be true/);
  assert.match(failed.stdout, /presenterOrCutout must be pass or not-present after retiming/);
  assert.match(failed.stdout, /pitchPreserved must be true/);
  assert.match(failed.stdout, /automaticFreezeOrRemoval must be false/);
  assert.match(failed.stdout, /fullRelevantTimelineSwept must be true/);
});

test('fine-edit direction audit requires a content-led audiovisual sample', () => {
  const template = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'fine-edit-direction.template.json'), 'utf8'));
  const valid = structuredClone(template);
  valid.status = 'ready-for-user-review';
  valid.basedOn.roughCutApproved = true;
  valid.styleSource.mode = 'curated-library';
  valid.styleSource.referenceId = 'bold-evidence-editorial-v1';
  valid.styleSource.contractExtracted = true;
  valid.styleSource.curatedLibrary = {
    reviewed: true,
    libraryVersion: 1,
    candidateStyleIds: [
      'bold-evidence-editorial-v1',
      'color-block-explainer-v1',
    ],
    selectedStyleId: 'bold-evidence-editorial-v1',
    selectionReason: 'The viewer must inspect source-backed screens and one verified numeric result.',
    adaptationSummary: 'Use the evidence-first grid with the fixture screens, caption lane, and presenter occupancy rather than copying sample geometry.',
    rejectionReasons: [{
      styleId: 'color-block-explainer-v1',
      reason: 'Peer-category cards would weaken the exact proof state in this fixture.',
    }],
  };
  valid.contentDirection.primaryViewerJob = 'Understand where the learning effort actually went.';
  valid.contentDirection.majorNarrativeBeatsAudited = true;
  valid.contentDirection.beats = [{
    id: 'reveal',
    viewerJob: 'Understand the scale and feel the contradiction.',
    narrativeRole: 'proof-reveal',
    emphasisDecision: 'both',
    emphasisReason: 'One restrained number animation and cue make the verified reveal legible.',
  }];
  valid.visualAssetPlan = {
    contentFitPrimary: true,
    referenceLibraryIsNotWhitelist: true,
    coherencePlan: 'Use one evidence-first editorial system across the proof run while adapting every asset to the current screen state and caption lane.',
    decisions: [{
      beatId: 'reveal',
      viewerJob: 'Inspect the verified result and understand why it matters.',
      semanticRole: 'proof',
      assetForm: 'hybrid',
      referenceStyleIds: ['bold-evidence-editorial-v1'],
      selectionReason: 'The real screen proves the state while one code-authored number cue explains its scale.',
      sourceOrGenerationPlan: 'Use the cleared fixture recording and author a local deterministic number treatment.',
      rendererOrTool: 'HyperFrames plus source screen recording',
      plannedVisibleResult: 'Full evidence plane followed by one exact ROI and one large verified number.',
      styleAdaptation: 'Inherit editorial contrast and timing, but derive geometry from the fixture evidence and caption safe area.',
      rightsEvidencePrivacyBoundary: 'Use fabricated fixture data, retain exact evidence state, and introduce no third-party visual asset.',
    }],
  };
  valid.screenEvidence.used = true;
  valid.screenEvidence.sourceRangesAllocatedBeforeFullFineEdit = true;
  valid.screenEvidence.crossRunSourceReuseAudited = true;
  valid.screenEvidence.runs = [{
    id: 'screen-1',
    viewerJob: 'Read the result and then inspect the relevant control.',
    layoutReason: 'A full view establishes context before one semantic push-in.',
    narrativeRole: 'detail',
    sourceRangeId: 'token-dashboard-detail-01',
    newInformationComparedWithEarlierRuns: 'Shows the task rows and model columns not used in the cold open.',
    reusesEarlierSourceRange: false,
    reuseJustification: null,
    recordingProvided: true,
    candidateFormatsConsidered: ['recording', 'still'],
    recordingReviewedFirst: true,
    representativeStillCompared: true,
    selectedFormat: 'recording',
    formatReason: 'The cursor path materially improves understanding in this beat.',
    automaticFormatRuleApplied: false,
    primaryEvidencePlaneDeclared: true,
    persistentSynchronizedDuplicate: false,
    simultaneousSourceCopies: 1,
  }];
  valid.presenter.used = true;
  valid.presenter.cutoutUsed = true;
  valid.presenter.previewIncludesPlannedTreatment = true;
  valid.presenter.portraitCutoutPlacement = {
    selectionSource: 'content-derived',
    publicRecommendedStartingZones: ['lower-left', 'lower-right'],
    publicRecommendationConsidered: true,
    candidateZonesCompared: ['lower-right', 'upper-left', 'bounded-center'],
    universalCornerDefaultApplied: false,
    selectedZone: 'lower-right',
    publicRecommendationOverrideReason: null,
    selectionReason: 'The lower-right keeps the presenter natural and leaves the active proof clear.',
    stableWithinCoverageRun: true,
  };
  valid.presenter.cutoutOutline = {
    selectionSource: 'content-derived',
    publicRecommendedStartingState: 'on',
    publicRecommendationConsidered: true,
    recommendationOverridable: true,
    candidateStatesCompared: ['on', 'off'],
    universalOutlineDefaultApplied: false,
    decision: 'on',
    publicRecommendationOverrideReason: null,
    decisionReason: 'A restrained outline separates dark hair and a white shirt across mixed screens.',
    derivedFromSameAlpha: true,
    colorSelectionIsContentDriven: true,
    paletteAnalysis: {
      hairOrHeadwear: 'near-black hair',
      clothing: 'white shirt',
      underlyingBackgroundFamilies: ['warm-white-ui', 'dark-graphite-chart'],
      contentOrBrandPalette: ['editorial-yellow', 'cobalt-accent'],
      contrastRisks: ['dark hair over graphite', 'white shirt over warm white'],
    },
    selectedColor: '#2F80ED',
    selectedWidthToCanvasWidth: 0.008,
    brightDarkBusyAndPhoneScaleReviewed: true,
  };
  valid.captions.selectionSource = 'content-and-phone-scale';
  valid.captions.publicRecommendedMaximumLines = 1;
  valid.captions.publicRecommendationConsidered = true;
  valid.captions.recommendationOverridable = true;
  valid.captions.candidateMaximumLinesCompared = [1, 2];
  valid.captions.selectedMaximumLines = 1;
  valid.captions.publicRecommendationOverrideReason = null;
  valid.captions.selectionReason =
    'One line matches the approved pacing in this fixture without over-fragmenting the speech.';
  valid.captions.universalOneLineDefaultApplied = false;
  valid.captions.phoneScaleReviewed = true;
  valid.audio.backgroundMusic = {
    decision: 'on',
    auditionedInStyleSample: true,
    dialogueOnlyComparisonAuditionedWhenNoStyleWasLocked: true,
    reason: 'A restrained bed supports pace without masking speech.',
    rightsStatus: 'cleared',
    speechIntelligibilityReviewed: true,
    provenance: {
      originType: 'ai-generated',
      providerOrLibrary: 'fixture-music-model',
      rightsManifestItemId: 'generated-bgm-fixture',
      generationJobOrAssetId: 'job-fixture-1',
      exclusiveOriginalityVerified: false,
      creatorFacingSummary: 'Generated for this project; exclusivity is not claimed.',
    },
  };
  valid.audio.soundEffects = {
    decision: 'on',
    auditionedInStyleSample: true,
    reason: 'One short cue lands the numeric reveal.',
    cueList: [{token: 'twenty-billion', role: 'reveal'}],
    rightsStatus: 'cleared',
    provenance: {
      originType: 'licensed-library',
      providerOrLibrary: 'fixture-sfx-library',
      rightsManifestItemId: 'licensed-sfx-fixture',
      generationJobOrAssetId: null,
      exclusiveOriginalityVerified: false,
      creatorFacingSummary: 'Licensed library sounds with project-specific timing and mixing.',
    },
  };
  valid.audiovisualSample = {
    durationSeconds: 8,
    containsActualOrTimingFaithfulDialogue: true,
    containsFinalLikeCaptions: true,
    containsPlannedEvidenceTreatment: true,
    containsPlannedPresenterTreatmentWhenUsed: true,
    containsProposedBgmAndSfxState: true,
    silent: false,
    dialogueOnlyIsIntentionalFinalRecommendation: false,
    creatorFacingReviewLanguage: 'zh-CN',
    reviewArtifact: 'renders/style-sample-v1.mp4',
  };
  valid.approval.question = '这套视听风格是否可以进入完整精剪？';

  const temp = mkdtempSync(path.join(os.tmpdir(), 'ai-video-fine-audit-'));
  const validPath = path.join(temp, 'valid.json');
  bindFineDirection(valid);
  writeFileSync(validPath, JSON.stringify(valid));
  const validResult = JSON.parse(runNode('audit-fine-edit-direction.mjs', [validPath]));
  assert.equal(validResult.ok, true);

  const unknownCuratedStyle = structuredClone(valid);
  unknownCuratedStyle.styleSource.referenceId = 'unknown-style-v1';
  unknownCuratedStyle.styleSource.curatedLibrary.selectedStyleId = 'unknown-style-v1';
  unknownCuratedStyle.styleSource.curatedLibrary.candidateStyleIds[0] = 'unknown-style-v1';
  const unknownCuratedStylePath = path.join(temp, 'unknown-curated-style.json');
  writeFileSync(unknownCuratedStylePath, JSON.stringify(unknownCuratedStyle));
  const unknownCuratedStyleResult = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), unknownCuratedStylePath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(unknownCuratedStyleResult.status, 0);
  assert.match(unknownCuratedStyleResult.stdout, /not an active library style/);

  const ungroundedOriginal = structuredClone(valid);
  ungroundedOriginal.styleSource.mode = 'content-derived';
  ungroundedOriginal.styleSource.referenceId = null;
  ungroundedOriginal.styleSource.contractExtracted = false;
  ungroundedOriginal.styleSource.curatedLibrary.selectedStyleId = null;
  ungroundedOriginal.styleSource.curatedLibrary.rejectionReasons = [];
  const ungroundedOriginalPath = path.join(temp, 'ungrounded-original.json');
  writeFileSync(ungroundedOriginalPath, JSON.stringify(ungroundedOriginal));
  const ungroundedOriginalResult = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), ungroundedOriginalPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(ungroundedOriginalResult.status, 0);
  assert.match(ungroundedOriginalResult.stdout,
    /rejectionReasons must assess every candidate/);

  const validDynamic = structuredClone(valid);
  validDynamic.styleSource.mode = 'dynamic-adaptation';
  validDynamic.styleSource.referenceId = null;
  validDynamic.styleSource.contractExtracted = false;
  validDynamic.styleSource.curatedLibrary.selectedStyleId = null;
  validDynamic.styleSource.curatedLibrary.selectionReason =
    'No single public entry covers both exact interface proof and the quiet systems metaphor required by the conclusion.';
  validDynamic.styleSource.curatedLibrary.adaptationSummary =
    'Build a new restrained systems-evidence direction while borrowing only the editorial proof hierarchy.';
  validDynamic.styleSource.curatedLibrary.rejectionReasons = [
    {
      styleId: 'bold-evidence-editorial-v1',
      reason: 'Strong for proof, but too forceful as the dominant grammar for the reflective conclusion; borrow only the evidence hierarchy.',
    },
    {
      styleId: 'color-block-explainer-v1',
      reason: 'Peer modules imply a list structure that the causal narrative does not have.',
    },
  ];
  validDynamic.styleSource.dynamicAdaptation = {
    triggerReason: 'The viewer job changes from exact verification to a restrained causal explanation.',
    fitGap: 'Existing styles cover either proof or modular explanation, but not the required evidence-to-system transition.',
    dominantSystem: 'Quiet evidence-to-system editorial with neutral surfaces and one progressive line motif.',
    borrowedReferenceRoles: [{
      styleId: 'bold-evidence-editorial-v1',
      role: 'proof hierarchy',
      reason: 'It preserves exact source state and one semantic ROI before the new system explanation.',
    }],
    notLimitedToLibrary: true,
    visualSystem: {
      palette: 'Warm neutral evidence surfaces, graphite ink, one yellow proof accent, and a restrained green resolution state.',
      typography: 'Compact editorial labels, one large verified number, and final-like semantic captions.',
      composition: 'Full evidence plane transitions into one causal line and two uncluttered system nodes.',
      imageryAndIcons: 'Real screen evidence plus code-authored geometric nodes; no stock illustration.',
      motion: 'Semantic push-in, progressive line draw, and a quiet final settle.',
      transitions: 'One source-motivated wipe from evidence to the causal diagram.',
      music: 'Low-density neutral pulse compared with dialogue-only.',
      soundEffects: 'One confirmation cue and one restrained line-completion cue.',
    },
  };
  const validDynamicPath = path.join(temp, 'valid-dynamic.json');
  writeFileSync(validDynamicPath, JSON.stringify(validDynamic));
  const validDynamicResult = JSON.parse(runNode(
    'audit-fine-edit-direction.mjs', [validDynamicPath]));
  assert.equal(validDynamicResult.ok, true);

  const stillPreferred = structuredClone(valid);
  stillPreferred.screenEvidence.runs[0].selectedFormat = 'still';
  stillPreferred.screenEvidence.runs[0].formatReason =
    'The selected still is clearer at phone scale even though the recording was reviewed first.';
  const stillPreferredPath = path.join(temp, 'still-preferred.json');
  writeFileSync(stillPreferredPath, JSON.stringify(stillPreferred));
  const stillPreferredResult = JSON.parse(runNode(
    'audit-fine-edit-direction.mjs', [stillPreferredPath]));
  assert.equal(stillPreferredResult.ok, true);

  const outlineOff = structuredClone(valid);
  outlineOff.presenter.cutoutOutline.decision = 'off';
  outlineOff.presenter.cutoutOutline.publicRecommendationOverrideReason =
    'The approved monochrome treatment intentionally omits the public outline starting point.';
  outlineOff.presenter.cutoutOutline.decisionReason =
    'The approved monochrome treatment already separates the silhouette without a ring.';
  outlineOff.presenter.cutoutOutline.selectedColor = null;
  outlineOff.presenter.cutoutOutline.selectedWidthToCanvasWidth = null;
  outlineOff.presenter.cutoutOutline.brightDarkBusyAndPhoneScaleReviewed = false;
  const outlineOffPath = path.join(temp, 'outline-off.json');
  writeFileSync(outlineOffPath, JSON.stringify(outlineOff));
  const outlineOffResult = JSON.parse(runNode(
    'audit-fine-edit-direction.mjs', [outlineOffPath]));
  assert.equal(outlineOffResult.ok, true);

  const outlineOffWithoutReason = structuredClone(outlineOff);
  outlineOffWithoutReason.presenter.cutoutOutline.publicRecommendationOverrideReason = null;
  const outlineOffWithoutReasonPath = path.join(temp, 'outline-off-without-reason.json');
  writeFileSync(outlineOffWithoutReasonPath, JSON.stringify(outlineOffWithoutReason));
  const outlineOffWithoutReasonResult = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), outlineOffWithoutReasonPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(outlineOffWithoutReasonResult.status, 0);
  assert.match(outlineOffWithoutReasonResult.stdout,
    /cutoutOutline.publicRecommendationOverrideReason must be a non-empty string/);

  const nonLowerCornerWithoutReason = structuredClone(valid);
  nonLowerCornerWithoutReason.presenter.portraitCutoutPlacement.selectedZone = 'upper-left';
  nonLowerCornerWithoutReason.presenter.portraitCutoutPlacement.publicRecommendationOverrideReason = null;
  const nonLowerCornerWithoutReasonPath = path.join(temp, 'non-lower-corner-without-reason.json');
  writeFileSync(nonLowerCornerWithoutReasonPath, JSON.stringify(nonLowerCornerWithoutReason));
  const nonLowerCornerWithoutReasonResult = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), nonLowerCornerWithoutReasonPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(nonLowerCornerWithoutReasonResult.status, 0);
  assert.match(nonLowerCornerWithoutReasonResult.stdout,
    /portraitCutoutPlacement.publicRecommendationOverrideReason must be a non-empty string/);

  const twoLineCaptions = structuredClone(valid);
  twoLineCaptions.captions.selectedMaximumLines = 2;
  twoLineCaptions.captions.publicRecommendationOverrideReason =
    'Two lines preserve one semantic unit without tiny type or over-fast caption cards.';
  const twoLineCaptionsPath = path.join(temp, 'two-line-captions.json');
  writeFileSync(twoLineCaptionsPath, JSON.stringify(twoLineCaptions));
  const twoLineCaptionsResult = JSON.parse(runNode(
    'audit-fine-edit-direction.mjs', [twoLineCaptionsPath]));
  assert.equal(twoLineCaptionsResult.ok, true);

  const twoLineCaptionsWithoutReason = structuredClone(twoLineCaptions);
  twoLineCaptionsWithoutReason.captions.publicRecommendationOverrideReason = null;
  const twoLineCaptionsWithoutReasonPath = path.join(temp, 'two-line-captions-without-reason.json');
  writeFileSync(twoLineCaptionsWithoutReasonPath, JSON.stringify(twoLineCaptionsWithoutReason));
  const twoLineCaptionsWithoutReasonResult = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), twoLineCaptionsWithoutReasonPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(twoLineCaptionsWithoutReasonResult.status, 0);
  assert.match(twoLineCaptionsWithoutReasonResult.stdout,
    /captions.publicRecommendationOverrideReason must be a non-empty string/);

  const invalid = structuredClone(valid);
  invalid.screenEvidence.runs[0].persistentSynchronizedDuplicate = true;
  invalid.screenEvidence.runs[0].automaticFormatRuleApplied = true;
  invalid.screenEvidence.runs.push({
    ...structuredClone(invalid.screenEvidence.runs[0]),
    id: 'screen-2',
    reusesEarlierSourceRange: false,
    reuseJustification: null,
  });
  invalid.presenter.portraitCutoutPlacement.universalCornerDefaultApplied = true;
  invalid.presenter.portraitCutoutPlacement.publicRecommendationConsidered = false;
  invalid.presenter.cutoutOutline.selectedColor = null;
  invalid.presenter.cutoutOutline.publicRecommendationConsidered = false;
  invalid.captions.universalOneLineDefaultApplied = true;
  invalid.captions.publicRecommendationConsidered = false;
  invalid.audio.soundEffects.provenance.exclusiveOriginalityVerified = true;
  invalid.audio.backgroundMusic.auditionedInStyleSample = false;
  invalid.audiovisualSample.durationSeconds = 3;
  invalid.audiovisualSample.silent = true;
  const invalidPath = path.join(temp, 'invalid.json');
  writeFileSync(invalidPath, JSON.stringify(invalid));
  const failed = spawnSync(process.execPath, [
    path.join(scripts, 'audit-fine-edit-direction.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(failed.status, 0);
  assert.match(failed.stdout, /may not persistently duplicate/);
  assert.match(failed.stdout, /automaticFormatRuleApplied must be false/);
  assert.match(failed.stdout, /reusesEarlierSourceRange must be true/);
  assert.match(failed.stdout, /universalCornerDefaultApplied must be false/);
  assert.match(failed.stdout, /portraitCutoutPlacement.publicRecommendationConsidered must be true/);
  assert.match(failed.stdout, /cutoutOutline.publicRecommendationConsidered must be true/);
  assert.match(failed.stdout, /selectedColor must be a non-empty string/);
  assert.match(failed.stdout, /universalOneLineDefaultApplied must be false/);
  assert.match(failed.stdout, /captions.publicRecommendationConsidered must be true/);
  assert.match(failed.stdout, /licensed-library audio cannot be marked exclusive original/);
  assert.match(failed.stdout, /auditionedInStyleSample must be true/);
  assert.match(failed.stdout, /durationSeconds must be between 6 and 12/);
  assert.match(failed.stdout, /cannot be silent/);
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
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'director-contract.json'),
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
  assert.equal(policy.everyRealPlacedItemJoinMustBeAudited, true);
  assert.equal(policy.selectiveImportantJoinListIsSufficient, false);
  assert.equal(policy.auditScript, 'scripts/audit-rough-cut-review.mjs');
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
  assert.equal(state.roughCutPolicy.playbackSpeed.earlyMiddleLateComparisonRequired, true);
  assert.match(state.roughCutPolicy.playbackSpeed.retimeMethod, /stable-pitch-preserving/);
  assert.equal(state.roughCutPolicy.playbackSpeed.retimeRequiresCompleteDownstreamRevalidation,
    true);
  assert.ok(state.roughCutPolicy.playbackSpeed.postRetimeLayers.includes('presenter-or-cutout'));
  assert.ok(state.roughCutPolicy.playbackSpeed.postRetimeLayers.includes('sound-effects'));
  assert.match(state.roughCutPolicy.sourceColorNormalization.approvedCreatorBaseline,
    /exact-private-profile-parameters/);
  assert.equal(state.roughCutPolicy.finishingPass.dialogueLoudness.primaryMatchMetric,
    'integrated-lufs');
  assert.equal(state.roughCutPolicy.finishingPass.dialogueLoudness.uiSliderOrPeakOnlyMatch,
    'invalid');

  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'director-contract.json'),
    'utf8',
  ));
  assert.equal(plan.roughCut.playbackSpeed.inheritRateFromAnotherVideo, false);
  assert.equal(plan.roughCut.playbackSpeed.compareEarlyMiddleLate, true);
  assert.equal(plan.roughCut.playbackSpeed.postRetimeRevalidationRequired, true);
  assert.ok(plan.roughCut.playbackSpeed.postRetimeLayers.includes('layout-and-motion'));
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
  const rightsManifest = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
      'rights-manifest.template.json'),
    'utf8',
  ));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'director-contract.json'),
    'utf8',
  ));
  assert.equal(plan.roughCut.takeSelection.laterOccurrence, 'tie-breaker-only');
  assert.equal(plan.userFacingApproval.format, 'plain-language-markdown');
  assert.equal(plan.userFacingApproval.machineJsonMayBeShownByDefault, false);
  assert.equal(plan.userFacingApproval.firstApprovalWorkBudget
    .targetMinutesWhenReliableManuscriptAndLocalMediaAreReadable, 15);
  assert.equal(plan.userFacingApproval.firstApprovalWorkBudget.silentHeavyWorkAfterTargetExceeded,
    false);
  assert.equal(contentLock.recurringSignatureOutro.detected, false);
  assert.equal(contentLock.recurringSignatureOutro.candidateForStylePreview, false);
  assert.equal(plan.roughCut.pauseTreatment.universalDurationMilliseconds, null);
  assert.equal(plan.privacyPlan.criticalIdentifiersUseOpaqueMasks, true);
  assert.equal(plan.privacyPlan.focusCueWhenEvidenceIsNotObvious, 'required');
  assert.equal(plan.privacyPlan.uiEvidenceCapture.exactStatePathRequired, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.thumbnailGuessingAllowed, false);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.roiManifestRequired, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.preserveSourceAspectRatio, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.formatSelectionIsContentDriven, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.suppliedRecordingReviewedFirst, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture
    .representativeStillComparedWhenRecordingSupplied, true);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.recordingAutomaticallyRequired, false);
  assert.equal(plan.privacyPlan.uiEvidenceCapture.stillAutomaticallyRequired, false);
  assert.equal(plan.presentationSafety.presenterInsertEntryFrame, 'normal-expression-eyes-open');
  assert.equal(plan.presentationSafety.platformUiExclusionZonesRequired, true);
  assert.equal(plan.finishingPass.voiceIsolation.processEachSourceRangeSeparately, true);
  assert.equal(plan.finishingPass.voiceIsolation.reuseDerivedAudioAcrossDifferentSourceRanges, false);
  assert.equal(plan.finishingPass.captions.reflowAfterScaling, true);
  assert.equal(plan.finishingPass.captions.separateCompletedThoughtFromNextThought, true);
  assert.equal(plan.finishingPass.captions.portraitShortFormUniversalMaximumLines, null);
  assert.equal(plan.finishingPass.captions.portraitRecommendedMaximumLines, 1);
  assert.equal(plan.finishingPass.captions.recommendationOverridable, true);
  assert.deepEqual(plan.finishingPass.captions.twoLineOverrideReasons, [
    'tiny-type',
    'over-fast-card-changes',
    'semantic-fragmentation',
    'exact-approved-reference',
  ]);
  assert.deepEqual(plan.finishingPass.captions.portraitCandidateMaximumLines, [1, 2]);
  assert.equal(plan.finishingPass.captions.splitIntoConsecutiveSemanticCardsBeforeWrapping, true);
  assert.equal(plan.roughCut.sourceColorNormalization.workflowStage,
    'rough-cut-before-approval');
  assert.equal(plan.roughCut.sourceColorNormalization.neutralizeCastBeforeCreativeLook, true);
  assert.equal(plan.roughCut.sourceColorNormalization.fineEditReprocessingDefault, false);
  assert.equal(plan.roughCut.audibleDuplicateAudit.captionDisplayOverrideCountsAsAudioRemoval, false);
  assert.equal(plan.roughCut.structuralEditReadback.requiredAfterScriptEdit, true);
  assert.equal(plan.bRollContinuity.continuousRunInteriorAlphaCoverage, 'required');
  assert.equal(plan.bRollContinuity.pairedInteriorFadesMayRevealARoll, false);
  assert.equal(plan.bRollContinuity.evidenceComposition.onePrimaryEvidencePlaneDefault, true);
  assert.equal(plan.bRollContinuity.evidenceComposition.persistentSynchronizedDuplicateDefault,
    false);
  assert.equal(plan.bRollContinuity.evidenceComposition.temporaryDetailCropMaximumSeconds, 2.5);
  assert.equal(plan.stylePreview.plannedEvidenceTreatmentRequired, true);
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
  assert.equal(plan.presentationSafety.recommendedDefaultsPolicy
    .startingTreatmentIsNotAStyleLock, true);
  assert.equal(plan.presentationSafety.recommendedDefaultsPolicy
    .portraitCaptionRecommendedMaximumLines, 1);
  assert.deepEqual(plan.presentationSafety.recommendedDefaultsPolicy
    .portraitCutoutRecommendedStartingZones, ['lower-left', 'lower-right']);
  assert.equal(plan.presentationSafety.recommendedDefaultsPolicy
    .portraitCutoutRecommendedOutlineState, 'on');
  assert.equal(plan.presentationSafety.recommendedDefaultsPolicy
    .portraitCutoutRecommendationAppliesOnlyToBBaseACutout, true);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline.universalStartingState,
    null);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline
    .publicRecommendedStartingState, 'on');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline
    .recommendationAppliesTo, 'portrait-B-base-A-cutout');
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline
    .recommendationOverridable, true);
  assert.deepEqual(plan.presentationSafety.presenterCutoutDesign.outline.candidateStates,
    ['on', 'off']);
  assert.equal(plan.presentationSafety.presenterCutoutDesign.outline.fixedHouseColor, false);
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .placement.portraitUniversalStartingZones, null);
  assert.deepEqual(plan.presentationSafety.presenterCutoutDesign
    .placement.portraitRecommendedStartingZones, ['lower-left', 'lower-right']);
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .placement.recommendationAppliesTo, 'portrait-B-base-A-cutout');
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .placement.recommendationOverridable, true);
  assert.ok(plan.presentationSafety.presenterCutoutDesign
    .placement.candidateZonesDerivedFrom.includes('content-occupancy'));
  assert.equal(plan.presentationSafety.presenterCutoutDesign
    .placement.geometryStableWithinCoverageRun, true);
  assert.match(rightsManifest.items[0].originType, /ai-generated/);
  assert.equal(rightsManifest.items[0].exclusiveOriginalityVerified, false);
  assert.equal(rightsManifest.items[0].generation.jobId, null);
  assert.equal(rightsManifest.items[0].creatorFacingProvenanceSummary, '');
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
  assert.equal(plan.finishingPass.designAudit.categories.backgroundMusic
    .offIsAResultNotAnIntakeDefault, true);
  assert.equal(plan.finishingPass.designAudit.categories.backgroundMusic
    .provenanceDisclosureWhenEnabled.creatorFacingSummaryRequired, true);
  assert.equal(plan.finishingPass.designAudit.categories.soundEffects
    .microCueContract.licensedLibraryAudioMayBeCalledOriginal, false);
  assert.equal(plan.stylePreview.motionSampleSecondsRange[0], 6);
  assert.equal(plan.stylePreview.motionSampleSecondsRange[1], 12);
  assert.equal(plan.stylePreview.silentPreviewMayApproveAudiovisualStyle, false);
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
  assert.equal(evidence.captureFormatSelection,
    'content-driven-still-recording-or-hybrid');
  assert.match(evidence.suppliedRecordingReview, /inspect-first/);
  assert.match(evidence.recordingPreference, /prefer-only-when/);
  assert.equal(evidence.automaticStillOrRecordingRule, 'forbidden');

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
  assert.equal(cutout.outline.universalStartingState, null);
  assert.equal(cutout.outline.publicRecommendedStartingState, 'on');
  assert.equal(cutout.outline.recommendationAppliesTo, 'portrait-B-base-A-cutout');
  assert.equal(cutout.outline.recommendationOverridable, true);
  assert.equal(cutout.outline.overrideReasonRequiredWhenOff, true);
  assert.deepEqual(cutout.outline.candidateStates, ['on', 'off']);
  assert.equal(cutout.outline.fixedHouseColor, false);
  assert.equal(cutout.placement.visualPriorityRequired, true);
  assert.deepEqual(cutout.placement.visualPriorityValues,
    ['foreground', 'supporting', 'background']);
  assert.equal(cutout.placement.anchorRequired, true);
  assert.equal(cutout.placement.portraitUniversalStartingZones, null);
  assert.deepEqual(cutout.placement.portraitRecommendedStartingZones,
    ['lower-left', 'lower-right']);
  assert.equal(cutout.placement.recommendationAppliesTo, 'portrait-B-base-A-cutout');
  assert.equal(cutout.placement.recommendationOverridable, true);
  assert.equal(cutout.placement.nonLowerCornerOverrideReasonRequired, true);
  assert.ok(cutout.placement.candidateZonesDerivedFrom.includes('content-occupancy'));
  assert.ok(cutout.placement.candidateZonesDerivedFrom
    .includes('public-lower-corner-recommendation'));
  assert.equal(cutout.placement.privateProfileMayRemoveExplicitlyRejectedOldAnchors, true);
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
  assert.match(guide, /outline `on` as the public recommended starting state/);
  assert.match(guide, /hair or headwear, clothing/);
  assert.match(guide, /lower-left and lower-right as the public recommended zones/);
  assert.match(guide, /The gate passes only when the intended shot is acceptable as moving video/);
  assert.match(guide, /### Presenter Visual Priority/);
  assert.match(guide, /container-bottom anchor/);
  assert.match(guide, /`background`/);
  assert.match(guide, /### 人物视觉层级/);
  assert.match(guide, /字幕和平台说明可以有意叠在非关键身体区/);
  assert.match(guide, /模型下载、环境诊断、预处理和缓存都由 Agent 完成/);
  assert.match(guide, /公共推荐默认开启描边/);
  assert.match(guide, /公共推荐先从左下和右下选择/);
  assert.match(guide, /头发或头饰、衣服/);

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
  assert.equal(designAudit.recommendedDefaultsPolicy.startingTreatmentIsNotAStyleLock, true);
  assert.equal(designAudit.audioProvenanceDisclosure
    .aiGeneratedDoesNotImplyVerifiedExclusiveOriginality, true);
  assert.equal(designAudit.audioProvenanceDisclosure
    .licensedLibraryAudioMayBeCalledOriginal, false);

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
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'director-contract.json'),
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
  assert.match(readmeEn, /What You Receive/);
  assert.match(readmeZh, /你会得到什么/);
  assert.doesNotMatch(readmeEn, /Optional prompt modifiers/);
  assert.doesNotMatch(readmeZh, /可选提示词补充项/);
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
  const renderOperations = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references',
      'release-render-operations.md'),
    'utf8',
  );
  const skill = readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'SKILL.md'),
    'utf8',
  );
  const state = JSON.parse(readFileSync(path.join(repoRoot, 'PROJECT_STATE.json'), 'utf8'));
  const plan = JSON.parse(readFileSync(
    path.join(repoRoot, 'skill', 'ai-video-director', 'references', 'director-contract.json'),
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
  valid.claimEvidence = [{
    id: 'course-material-size',
    claimText: 'The supplied archive contains about 220 GB of course materials.',
    publicationWording: 'About 220 GB of course materials',
    precision: 'rounded',
    scope: 'The creator-supplied course-material archive inspected for this project.',
    timeWindow: null,
    sourceEvidence: 'analysis/source-manifest.json measuredBytes and measuredGiB',
    status: 'verified',
  }];
  const labels = ['alpha', 'beta', 'gamma'];
  valid.variants.forEach((variant, index) => {
    variant.coverTitle = `Accurate cover ${labels[index]}`;
    variant.postCaption = `Accurate finished-video description ${labels[index]}`;
    variant.hashtags = ['#AIVideoEditing', '#VideoCreation'];
    variant.rationale = 'Matches the finished video.';
  });
  valid.variants[0].coverTitle = 'About 220 GB of course materials';
  valid.variants[0].claimEvidenceIds = ['course-material-size'];
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
  invalidData.variants[1].postCaption = 'Token usage reached 20 billion.';
  invalidData.postPublishVerification.titleSearchUsedAsSoleViolationEvidence = true;
  writeFileSync(invalidPath, JSON.stringify(invalidData));
  const invalid = spawnSync(process.execPath, [
    path.join(scripts, 'audit-publish-package.mjs'), invalidPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /upscaled review proxy/);
  assert.match(invalid.stdout, /platform declaration is not planned/);
  assert.match(invalid.stdout, /prohibited guarantee/);
  assert.match(invalid.stdout, /Campaign tags require verified eligibility/);
  assert.match(invalid.stdout, /numeric or measured claim but has no claimEvidenceIds/);
  assert.match(invalid.stdout, /Title search may not be used as the sole evidence/);

  assert.equal(plan.releaseAndPublicationPlan.reviewProxyMayReceiveFinalPublicationApproval,
    false);
  assert.equal(plan.releaseAndPublicationPlan.exactReleaseCandidateQaAndApprovalRequired, true);
  assert.equal(state.releaseAndPublicationPolicy.publishPackage.minimumVariantCount, 3);
  assert.equal(state.releaseAndPublicationPolicy.releaseMaster.upscaleReviewProxyAndCallItMaster,
    'forbidden');
  assert.equal(state.releaseAndPublicationPolicy.renderOperations.oneObservableHeavyRenderAtATime,
    true);
  assert.equal(state.releaseAndPublicationPolicy.renderOperations
    .approvedMatchingPrivateHostProfileOverridesGenericWorkerStart, true);
  assert.deepEqual(state.releaseAndPublicationPolicy.renderOperations
    .approvedHostProfileMustApplyAsCompleteBundle, [
    'worker-count',
    'intermediate-frame-mode',
    'temporary-background-work-pause-and-resume',
    'memory-circuit-breaker',
  ]);
  assert.equal(state.releaseAndPublicationPolicy.renderOperations
    .memoryGuardStopsWholeRenderProcessTree, true);
  assert.equal(state.releaseAndPublicationPolicy.renderOperations
    .backgroundOrParallelRetryAfterResourceFailure, 'forbidden');
  assert.match(reference, /Publishing work begins early and finishes late/);
  assert.match(reference, /发布不是精剪完成后才临时补一句文案/);
  assert.match(reference, /Do not claim that a workflow is public, open source, free/);
  assert.match(reference, /Claim-Evidence Ledger/);
  assert.match(reference, /Zero views after a few minutes/);
  assert.match(renderOperations, /Do not solve system-wide memory pressure by only increasing `NODE_OPTIONS`/);
  assert.match(renderOperations, /Do not repeat the same command more than once without a material change/);
  assert.match(renderOperations, /Apply an approved host profile first/);
  assert.match(renderOperations, /Memory circuit breaker/);
  assert.match(renderOperations, /优先应用已确认的主机配置/);
  assert.match(renderOperations, /内存熔断保护/);
  assert.match(renderOperations, /不能只把 `NODE_OPTIONS`/);
  assert.match(skill, /platform-release-and-publish-package\.md/);
  assert.match(skill, /release-render-operations\.md/);
  assert.match(skill, /audit-publish-package\.mjs/);
});

test('memory guard passes a healthy command and trips on a tiny process RSS ceiling', () => {
  const healthy = spawnSync(process.execPath, [
    path.join(scripts, 'run-memory-guarded.mjs'),
    '--max-process-rss-gib', '100',
    '--poll-seconds', '0.05',
    '--trip-count', '1',
    '--',
    process.execPath, '-e', 'setTimeout(() => process.exit(0), 120)',
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.equal(healthy.status, 0, healthy.stderr);
  assert.match(healthy.stderr, /"event":"completed"/);

  const tripped = spawnSync(process.execPath, [
    path.join(scripts, 'run-memory-guarded.mjs'),
    '--max-process-rss-gib', '0.001',
    '--poll-seconds', '0.05',
    '--trip-count', '1',
    '--terminate-grace-seconds', '0.1',
    '--',
    process.execPath, '-e', 'setTimeout(() => process.exit(0), 5000)',
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.equal(tripped.status, 70, tripped.stderr);
  assert.match(tripped.stderr, /"event":"tripped"/);
  assert.match(tripped.stderr, /process-rss/);
});

test('ordinary visual modes are director-selected while explicit mode demos are token-synchronized', () => {
  const standard = readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references', 'production-standard.md'), 'utf8');
  const coverage = readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references', 'presenter-coverage-modes.md'), 'utf8');
  const plan = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references',
    'director-contract.json'), 'utf8'));
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
    linkedEntryIds: ['creator-screen-evidence-preference'],
    implementation: {
      publicRepositoryFiles: ['references/presenter-coverage-modes.md'],
      privateProfileKeys: [],
      projectArtifacts: [files['storyboard.json']],
      externalKnowledgeRecords: ['KNO-EXAMPLE-CONTENT-DRIVEN-EVIDENCE'],
    },
    privacyReason: 'No identity asset or creator-specific coordinate enters the public rule.',
    evidence: ['user-approved episode review'],
    approvedByUser: true,
  };
  learningTemplate.entries.push({
    id: 'creator-screen-evidence-preference',
    title: 'Creator screen-evidence candidate order',
    sourceFeedback: 'The creator prefers reviewing usable screen recordings first.',
    changeType: 'new-private-preference',
    promotionLayer: 'private-profile',
    previousContract: 'No creator-specific candidate ordering was stored.',
    observedFailure: 'A personal preference risked becoming a universal public rule.',
    generalizedInvariant: 'Personal candidate order cannot override content fit.',
    projectSpecificInstance: 'Review supplied recording first, then compare stills.',
    linkedEntryIds: ['semantic-state-sync'],
    implementation: {
      publicRepositoryFiles: [],
      privateProfileKeys: ['talkingHead.editorialJudgment.screenEvidence'],
      projectArtifacts: [files['storyboard.json']],
      externalKnowledgeRecords: ['KNO-EXAMPLE-CONTENT-DRIVEN-EVIDENCE'],
    },
    privacyReason: 'Creator preference stays outside the public repository.',
    evidence: ['explicit creator feedback'],
    approvedByUser: true,
  });
  learningTemplate.entries.push({
    id: 'public-evidence-editorial-style',
    title: 'Public evidence editorial style',
    sourceFeedback: 'A shareable proof-led visual treatment should remain available when no user reference exists.',
    changeType: 'new-public-curated-style',
    promotionLayer: 'public-curated-style-library',
    previousContract: 'The repository had production rules but no auditable public aesthetic fallback.',
    observedFailure: 'A creator without a reference would receive a competent rough cut but no reusable fine-edit direction.',
    generalizedInvariant: 'A public style entry needs content fit, avoid rules, visual and editing grammar, provenance, and QA.',
    projectSpecificInstance: 'The fixture selects a proof-led editorial treatment for source-backed screens.',
    linkedEntryIds: [],
    implementation: {
      publicRepositoryFiles: ['references/curated-style-library.json'],
      privateProfileKeys: [],
      projectArtifacts: [files['storyboard.json']],
      externalKnowledgeRecords: [],
    },
    privacyReason: 'The public recipe contains no creator identity, private reference asset, or exact project geometry.',
    evidence: ['user-approved public curation boundary'],
    approvedByUser: true,
  });
  writeFileSync(files['learning.json'], JSON.stringify(learningTemplate));
  const learningResult = JSON.parse(runNode('audit-learning-scope-ledger.mjs', [files['learning.json']]));
  assert.equal(learningResult.ok, true);
  const invalidLearning = structuredClone(learningTemplate);
  invalidLearning.entries[1].linkedEntryIds = ['missing-public-rule'];
  invalidLearning.entries[1].implementation.externalKnowledgeRecords = [''];
  const invalidLearningPath = path.join(temp, 'learning-invalid.json');
  writeFileSync(invalidLearningPath, JSON.stringify(invalidLearning));
  const failedLearning = spawnSync(process.execPath, [
    path.join(scripts, 'audit-learning-scope-ledger.mjs'), invalidLearningPath,
  ], {cwd: repoRoot, encoding: 'utf8'});
  assert.notEqual(failedLearning.status, 0);
  assert.match(failedLearning.stdout, /references missing entry missing-public-rule/);
  assert.match(failedLearning.stdout, /externalKnowledgeRecords must be an array of non-empty strings/);

  const memoryReference = readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'references', 'memory-and-feedback.md'), 'utf8');
  assert.match(memoryReference, /Split it into linked records/);
  assert.match(memoryReference, /截图、录屏或混合形式按内容选择/);
  assert.match(memoryReference, /个人知识库保存来源、状态、冲突和实践历史/);

  const delivery = JSON.parse(readFileSync(path.join(
    repoRoot, 'skill', 'ai-video-director', 'assets', 'templates',
    'delivery-manifest.template.json'), 'utf8'));
  delivery.projectId = 'fixture-project';
  delivery.status = 'ready';
  delivery.releaseMaster.absolutePath = files['master.mp4'];
  delivery.releaseMaster.sha256 = sha256(files['master.mp4']);
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
  assert.match(readme, /## License/);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
