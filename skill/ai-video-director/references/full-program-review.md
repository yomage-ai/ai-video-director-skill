# Whole-program states / 整片实际状态

Use after the creator approves the audiovisual direction and before the full render. The approved sample establishes a direction; it does not certify states that never appeared in it. New full-edit pipelines set `reviewSchemas.program: 1`. Stored projects without this version remain readable and are not silently re-approved or rewritten.

整体样片确认后、全片渲染前使用。样片只证明其中出现过的组合；新完整精剪工程启用整片检查，旧成片保留当时证据，不伪造新检查。

## One plan, two checks / 同一计划，两次检查

1. Agent fills `analysis/program-plan.json` from the canonical EDL, using `assets/templates/program-plan.template.json`. `canvas` is the exact final width/height/fps/durationFrames. Gapless `beats` cover the entire program; each has `id`, integer `startFrame/endFrame`, `viewerJob`, and `requiredLayers`. Each layer has a unique `id`, `kind`, range and `keyframes` containing motion extremes and state changes. Coordinates and layer lifetimes come from the actual renderer. Do not write a parallel hand-timed timeline.
For the question-card recipe, set `questionTreatment: "presenter-card-dock"`; question/answer beats declare their `role`. Each question has `questionTransition: {cardLayerId, settleFrame}`, a required `presenter` and `question` layer. Its read end is the question beat end; both read end and settle are card keyframes. The auditor rejects a missing card or an answer without a valid docking interval. / 选问答配方时，卡片须覆盖完整提问，并把读完和缩卡结束纳入实际关键帧检查。

2. Mark a screen-led answer `continuousScreen: true`. Its required screen layer covers the answer; an independent `presenter` layer cannot cut into it. A webcam baked into the original recording remains part of the screen. For screen-relative phrases, `screenReferences` records `phrase`, `sourceLocator` and the displayed `layerId`. If the operation is absent, remove the phrase, use neutral wording from the recorded source, or move the explanation to the matching operation. Never fabricate a matching UI.
3. `sfx` is `on` or `off`. Enabled cues have `id`, frame range, `reason` and a hash-bound audio `asset`; omitted sounds cannot be represented by plan text. If HyperFrames is used, `editableEntry` binds its sole root HTML; move extra full compositions outside root HTML discovery. Preserve native geometry instead of upscaling a review proxy or passing an unsupported resolution option.
4. Agent runs `prepare-program-review.mjs plan.json new-preflight.json`. This derives first/last frames, before/at/after every beat/layer/cue boundary, motion keys and hold midpoints. Render and inspect these actual states. Record image artifacts, observations and measured text/critical-object boxes. Overlaps require a frame-specific pair and reason. Empty boxes are appropriate only when no readable or critical objects exist; never use them to avoid checking. Existing renderer layout tooling may supply measurements.
5. `stage ... fine-render` requires this preflight and its source bindings. The output renderer owns the whole source/graphics/audio composition; avoid duplicate renders or competing hash/decode jobs on a slow source disk. A native-size short composite must pass before the heavy render, including actual dimensions, font rendering, source detail and audio mapping.
6. After rendering, prepare a **new final** review with `prepare-program-review.mjs plan.json new-final.json final-master.mp4`. Inspect the same states in the actual composite, including all question transitions and late states outside the sample. Bind it as `programFinalReview`. `stage ... deliver` verifies that it belongs to the exact master and unchanged plan.

Agent 从同一 EDL 生成内容段、图层与音效的帧时间。先检查整片所有边界、动效极值和稳定停留状态，再检查真实合成成片；本片选定连续录屏的区间禁止插回独立人物画面。选用问答卡配方时，问题读完才缩卡，回答图解在缩略标题下重新布局。标题、字幕、导航、图标要同时验收，不能各自单独通过后直接叠加。样片和整片使用相同渲染参数；外置盘上重渲染、全量哈希和解码串行运行。

## Sound verification / 真实混音核验

For a uniform dialogue + SFX mix, Agent runs:

```text
node scripts/verify-program-audio.mjs plan.json final.mp4 dialogue.wav sfx.wav new-audio-report.json 0.95
```

Use the **actual** gain, never copy the example number. The helper checks early/middle/late zero-offset decoded signals and every cue's residual after subtracting dialogue. It rejects missing effects and shifted/different mixes; this is signal verification, not listening. `audioMix` in the final review contains `status: verified`, the actual method and the report artifact. The gate binds the report's plan/master/stems and every cue. For more complex automation/EQ, first produce expected processed dialogue and SFX stems with the exact approved processing, then compare at their final summing gain. A very quiet cue that cannot pass is a diagnostic to inspect audibility and encoding, not permission to manufacture a pass.

音效必须在最终文件里核验；“写了动画/音效方案”不能代替实片。工具从成片减去已知口播，检查剩余声音是否含预期提示音，并核对首中尾混音。ASR、峰值、相关性或成功渲染均不等于 Agent 听过；创作者正常审片，缺音频输入不引入听审模型。

## Content and attention / 内容与注意力

- Before moving recorded phrases, reconstruct the **whole spoken sentence** in its proposed order. Check that references such as “these questions” have sufficient context. Question-first, result-first and other hooks are valid when the current video supports them. `informationPlan.claims[].dependsOn` can express required earlier context; the auditor verifies declaration order, not meaning. Use `$jiaoben` when actually writing/reviewing spoken copy.
- Choose a visual's entrance and exit from its semantic role. Choose hold length and numerical emphasis for this video: a number may be large, animated, normal-sized, or caption-only. Preserve factual qualifiers regardless of size. A visual may remain across a topic change when it still has a comparison, recall or context role; do not inherit another video’s exit time.
- Screen and presenter are information owners, not fixed A/B media labels. Keep exactly one primary telling. Insert original voice only for missing information over an appropriate genuine screen interval, muting conflicting original screen speech. If the original recording already explains a point, use that explanation; if it does not and the creator chooses omission, omit it.
- Match the graphic to the relation: sequence → process, categories → small cards, relationships → diagram, actual UI claim → original evidence. Text, a decorative icon, or constant motion alone is not added explanation.

先检查重排后的完整句意与指代，再剪源素材。开头顺序由本片内容决定，指代须有足够上下文。数字可以放大、动画强调或只留字幕；保留真实限定词不等于禁止大字。素材持续多久取决于阅读、对照和叙事用途，不继承另一条视频的退场时点。图解依据流程、类别、关系选择形式；真实界面才能证明实际操作。规则约束检查覆盖和版本，不保证未来零缺陷或发布留存提升。

Normal rough/fine stage renders now append output-bound iteration events and measured tool duration through the existing iteration log; final approval is recorded only after the delivery gate verifies the creator evidence. Counts cover observed events, not uninstrumented historical attempts. / 标准粗剪、精剪和交付也复用现有迭代日志；只统计实际记录，未知耗时保持空值。
