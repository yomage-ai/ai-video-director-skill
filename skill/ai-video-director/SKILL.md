---
name: ai-video-director
description: Governed bilingual workflow for AI video creation and talking-head editing. Use when a user wants to turn a script or recorded talking-head video into a reviewed rough cut, visual fine edit, captions, sound, master, editable project, or reusable personal style memory. 适用于真人口播自动剪辑、脚本生成视频、内容锁定、ChatCut 粗剪审核、统一 EDL、FFmpeg 精确剪辑、HyperFrames/Remotion 视觉精剪、字幕音频、质量验收和反馈沉淀。
---

# AI Video Director

## Operating Contract

Reply in the user's language. Keep routine updates concise, but make every approval gate understandable in plain language.

This Skill is the director and decision system. It does not pretend that one model performs deterministic media work. Route each operation to the proper tool, preserve one canonical timeline, and record what was approved.

Own the technical setup. Do not ask the user to run installation, doctor, dependency, project-initialization, or render commands. Execute them yourself. Ask the user only when an account login, operating-system permission, paid action, identity consent, or media-rights decision cannot be completed safely without them.

For every new task:

1. Resolve this Skill directory and repository root from the current `SKILL.md` path.
2. Run `node scripts/director.mjs doctor` from this Skill directory. Report blockers before media work.
3. Run `node scripts/memory.mjs init`, then load the private base profile if it exists.
4. Create or load a project outside this repository. Never put personal media, face/voice references, secrets, unpublished renders, or private preferences in Git.
5. Lock the intended platform release specification before editing: target platform and jurisdiction, aspect ratio, required pixel dimensions, cadence, SDR/HDR, codec/container, AI-disclosure facts, and any platform UI or cover-crop constraints. If publication is in scope, read [platform-release-and-publish-package.md](references/platform-release-and-publish-package.md).
6. Inspect source media with `ffprobe` before transcoding. Record dimensions, rotation, frame rate, duration, codecs, audio, and color metadata, then identify the highest-quality approved source capable of meeting the release specification.
7. Read only the references needed for the current stage. Always read [workflow.md](references/workflow.md) and [production-standard.md](references/production-standard.md) for a fresh project.

### Approved-reference lock / 已通过参考锁

When the creator identifies a previously approved episode or says to continue an established style, that approved deliverable is a production dependency, not optional inspiration. Before changing captions or adding fine-edit graphics:

1. Resolve the exact approved project, timeline, export, decision record, and private-profile entry. Never guess from a nearby episode number or similarly named file.
2. Extract a machine-readable contract for caption presentation and pagination, caption lane, progress geometry and visual grammar, information-card safe region, presenter-insert layout/crop/size/position by run, any cutout matte/outline contract, outro geometry, color baseline, and dialogue loudness.
3. Render a reference contact sheet and a target pre-edit contact sheet at matching semantic beats. Record every intentional difference before implementation.
4. Treat the contract as invariants. A successful mutation, render, or contact-sheet export does not satisfy the gate.
5. Duplicate the approved timeline and create a new asset version before changing an approved reusable component. Write a change allowlist and an invariant list first; after the edit, diff track/item counts, timing, asset references, captions, audio, and unaffected pixels. Preserve the last approved version until the replacement passes. / 修改已通过的时间线或可复用组件前，必须先复制版本并新建素材，明确“允许变化项”和“必须不变项”；修改后做结构、时序、素材引用、字幕、音频及非目标像素差异检查，未通过前保留上一版，禁止原地覆盖。

An approved signature outro includes its motion contract, not only its raster artwork. Reuse the exact tilt, blink/wink, timing, scale envelope, and placement unless the user explicitly approves a redesign; a simplified rebuild that silently drops one of those beats is a failed reference match. / 已通过的签名片尾锁定的是完整动作契约，而不只是人物图片。歪头、眨眼、节奏、缩放包络和位置都必须原样继承；未经明确确认，不得用“简化版”悄悄删掉动作。

If the reference cannot be resolved, stop before visual redesign and report the missing dependency. Do not improvise a replacement style.

用户指定已通过的历史作品或要求沿用既有风格时，该参考是制作依赖，不是可选灵感。精剪前必须锁定准确工程、时间线、成片、决策记录与私有画像，提取字幕行为和安全区、进度条、信息卡、人物小窗或抠像、片尾、色彩与响度契约，并在相同语义节点做参考片与目标片联系表对照。无法锁定参考时，不得自行重设计。

## Current Supported Path

The production path is recorded talking-head footage. An authorized Qwen3-TTS short voice sample is an optional, separately approved branch. Digital-human/avatar generation is paused. Never use SadTalker. Do not invoke the legacy `ai-auto-editing-director` Skill.

## Workflow

Use the stage order and return paths in [workflow.md](references/workflow.md):

1. Intake and technical preflight.
2. ASR with word timing, transcript correction, and full-source listening.
3. Compact content lock: one primary claim, at most two supporting points, order, and real-evidence cold open.
4. Director plan: retain/remove rules, rough-cut intent, visual beats, evidence needs, risks, and the early release/publication constraints that can affect composition.
5. ChatCut visual rough-cut review; edit on a multitrack timeline and listen through every join. For repeated takes, select quality-first rather than keeping the last occurrence by default; use a later occurrence only as a tie-breaker when the candidates are materially equal. Audit repeated words across segment boundaries against audible playback because caption-only hiding does not remove speech. Before rough-cut approval, run the complete manuscript-head/tail, mouth-noise, and pause audit in [dialogue-join-audit.md](references/dialogue-join-audit.md): intelligibility is the first gate, so the last intended word before each changed boundary and the first intended word after it must both be clearly audible before pause length or visual pose is optimized. When removing a repeated word at a segment edge, explicitly keep the second complete occurrence rather than trusting a transcript strike or segment boundary; render and ASR/listen to the exact word window. Swallow, lip-smack, dead-air, and gaze-reset material is not protected as a "natural breath." Classify pauses by function, audit every must-keep point as spoken/on-screen/both, choose playback speed from content and performance rather than a house preset, and record the result with `assets/templates/rough-cut-review.template.json`. Before rough-cut approval, normalize the original talking-head color once at source, track, or global scope: target natural exposure and skin rather than a beauty look, inspect early/middle/late and cut-boundary frames, and roll back with a stage update if the result drifts gray, red, or otherwise inconsistent. Reuse exact approved creator color parameters only as a named private-profile baseline for comparable camera and lighting conditions; otherwise treat them as a starting point and revalidate. After a structural Script edit, re-read transitions and downstream B-roll timing, then reapply only the intentional audio transitions that the rebuild removed. Match dialogue loudness to recent clean format-matched creator references by rendered integrated LUFS first, keep true-peak headroom, and record both measurements; do not match from a UI volume number or peak alone. Follow [production-standard.md](references/production-standard.md).
6. Export Final Cut Pro XML and convert it to the sole canonical EDL.
7. Render exact A-roll from original-quality media with FFmpeg. After the last edit, watch and listen from start to finish, approve the source-level color decision, then lock the rough cut. Fine edit inherits this approved A-roll color and does not reprocess it unless the user makes a new explicit request or the source lighting/camera state genuinely changes.
8. Produce three style keyframes and one short motion sample; ask the user to choose or adjust them.
9. Resolve assets and rights. Prefer owned real evidence; Pinterest is reference-only. Before capturing any product/app screenshot or screen recording, use an isolated demo profile or database with fabricated data and make a visible-module allowlist. Hide unrelated monetization, affiliate/order-guide, admin, debug, test, account, notification, and identity-bearing modules in the source UI before capture; never rely on a later blur, crop, cover card, or caption to conceal them. Lock the exact navigation state first: page, primary tab, subtab, view mode, filters, and scroll position. Derive every critical ROI from source semantics such as DOM/accessibility text bounds, design-layer geometry, or a user-confirmed reference; never guess a box from a thumbnail or draw an approximate callout over a nearby region. Record an ROI manifest with state path, viewport, requested and actual output bounds, proof label, privacy allowlist, and explicitly rejected adjacent states. Use a still when one state proves the claim and a recording only when interaction or change over time is itself the evidence. Follow [evidence-state-roi-audit.md](references/evidence-state-roi-audit.md). Capture only after both a DOM/text forbidden-string check and a pixel review pass, then clear the temporary demo state and retain the approved clean asset under an unambiguous name. / 在截取产品或 App 画面前，必须使用隔离的演示账号或演示数据库，只展示与口播证据直接相关的模块；下单导购、联盟营销、后台、调试、测试、账号、通知及任何可识别个人信息的模块，都必须在源界面截图前隐藏，不得事后用模糊、裁切、遮盖卡或字幕补救。先锁定页面、主页签、子页签、视图、筛选和滚动位置；再根据 DOM、无障碍文本边界、设计图层或用户确认参考确定 ROI，禁止凭缩略图猜框或在相邻区域画近似标注。ROI 清单必须记录状态路径、视口、请求与实际输出尺寸、证据标签、隐私白名单及明确排除的相邻状态。静态状态能证明时用截图，只有交互过程本身是证据时才录屏。截图前同时执行 DOM/文本禁用词检查和像素审看，截图后清理临时演示状态，并以无歧义文件名保留合格素材。
10. Route each visual shot independently to HyperFrames, Remotion, real footage, screenshots, or a simple FFmpeg operation. Classify every aggregate coverage run on two axes: `A-only`, `B-only`, or `AB-live` for visible sources, then `B-base-A-PiP`, `A-base-B-overlay`, `B-base-A-cutout`, or `AB-split` when `AB-live` is selected. Read [presenter-coverage-modes.md](references/presenter-coverage-modes.md) before planning any simultaneous presenter/B-roll run or changing a source-cut-adjacent layout. Its boundary contract requires one manifest for source cuts, aggregate coverage runs, presenter spans, and spoken token windows: snap a layout to the same program frame when it is intended to enter on a new take; store canonical integer `startFrame`/`endFrame` values and derive seconds from `frame / fps` without six-decimal rounding; prohibit sub-two-second A-only resets unless a token-synchronized demo is explicitly declared; and run `scripts/audit-coverage-boundaries.mjs`. Before collision routing, also declare the presenter as `foreground`, `supporting`, or `background`, independently choose a container-bottom or canvas-bottom anchor, and apply the matching occlusion rule: bounded PiP and foreground people reserve a readable region, while a deliberately low-salience background cutout may sit behind captions or platform copy if its face, required gesture, critical evidence, and identity marks remain readable. Before reusing, replacing, or promoting a code-authored motion graphic, read [code-motion-components.md](references/code-motion-components.md): classify the component as `G`, `P`, `T`, `A`, or `X`; keep the general mechanism, private adapter, and project instance data separate; define its parameter schema and seek-safe clock; and preserve approved versions until structural, motion, layout, rights, and export QA pass. / 每段覆盖区间先判断纯人物、纯素材或人物素材同时出现；选择同时出现后，再单独决定普通小窗、人物底加素材、人物抠像或分屏。任何靠近源片剪点的版式变更都要读取人物覆盖规范，并用同一份清单记录真实剪点、连续覆盖区间、人物素材跨度和首尾口播词点：新片段本来就要以新布局进入时必须同帧对齐；边界以整数 `startFrame`/`endFrame` 为准，秒数只能由 `frame / fps` 推导，禁止再四舍五入到六位小数；不足两秒的 A-only 重置默认禁止，只有明确登记逐词同步演示才例外；随后运行 `scripts/audit-coverage-boundaries.mjs`。处理遮挡前，还要把人物声明为前景、辅助或背景层，并独立选择容器底边或画布底边锚点：有边界小窗和前景人物需要预留完整可读区；有意做成弱背景的抠像可以位于字幕或平台文案之后，但必须保住脸、必要手势、关键证据和身份标识。代码动画复用前必须先分级并拆分通用机制、私人适配和单片数据，禁止把个人资产或单片参数混入通用仓库。
11. Add caption styling, a content-driven transition grammar, restrained sound effects, and deliberately designed presenter inserts. Preserve the approved caption visual language instead of silently redesigning it; only relocate or reflow captions for an explicit user request or a documented hard collision, then recheck the changed layout at native and phone scale. Treat progress-bar text, chapter labels, and bottom navigation copy as the semantic progress layer, never as the caption track. Give progress labels one stable cross-background baseline: a narrow full-width translucent neutral strip, light text with a restrained dark shadow or stroke, no per-chapter boxes, and placement in a platform-validated edge band. Test bottom placement below captions first, but reject it when actual platform descriptions or controls obscure the semantic labels; use a reserved top-safe band or another proven band and reflow nearby headings, picture-in-picture, presenter cutouts, and information cards. Express current, past, and future state through weight, opacity, fill, and playhead rather than scene-by-scene color inversion. Propose each chapter label, order, and one-sentence scope in the director plan before style preview; director-plan approval locks the semantic labels, while exact duration-proportional boundaries are computed after rough-cut timing lock and shown in the motion sample. Prove progress-label readability on A-roll, bright B-roll, dark B-roll, and chapter boundaries at native and phone scale, then confirm it on available published target-device screenshots. Use the repository-owned `rmcu.semantic-progress.v1` contract for generic landscape and portrait behavior: both orientations share one clean two-lane grammar, with an uninterrupted progress track above a label row whose only dividers sit between adjacent chapters. Do not add track ticks, leading label dashes, chapter numbers, active-segment panels, or duplicate separators by default. Inactive long labels use ellipsis, while only the active overflowing label loops inside its stable segment. Decide whether a progress strip has a real navigation or established-series job; omit it when it would be decoration only. Select any pen, cursor, character, flower, or logo playhead from the video's meaning and attention budget, not from asset availability. When a creator has a recurring spoken sign-off, treat it as a named signature-outro component: prefer owned identity artwork over generic third-party stickers, preserve the live performance, and show one still plus one short motion sample before its first reusable lock. Validate the component's complete motion envelope so scale, rotation, translation, internal marks, and overshoot cannot clip inside its own box even when it is already on the top track. Prefer a static outer natural box with a padded inner animated stage that contains every visible extreme; visible overflow alone is not cross-renderer proof. Keep generic progress behavior in this repository; store only creator-specific progress tokens, optional identity-marker adapters, and signature-outro choices in the private style profile after explicit approval. Run and record an explicit finishing-design audit for background music, sound effects, entry/exit animation, transitions, and decorative effects; `off` or `none` must be a reasoned decision, not an unreviewed default. BGM stays off unless the user enables it and every item has a rights record. When isolating speech on a recut, process each clip's actual source range; never reuse a short derived-audio asset across clips with different source offsets. Inside a continuous B-roll run, preserve full visual coverage instead of letting paired fades or tiny gaps expose one-frame A-roll flashes. Never shrink the uncropped A-roll into one fixed corner by default; define a PiP's crop, shape, size, and content-safe position from the actual card. For `B-base-A-cutout`, use governed HyperFrames `remove-background` on the clean, locked A-roll only after canonical timing lock, mute the transparent layer, derive any outline from the same alpha, and adopt the result only after the moving matte passes bright/dark/busy-background, edge-stability, cut-boundary, and collision checks. Choose size and position for the composed card or coverage run, keep that geometry stable inside the run, and change it only at a semantic or layout boundary. When a justified progress strip is used after structural timing lock, derive short labels and duration-proportional segments from real content blocks; without meaningful chapters, use one unsegmented bar. The rendered strip is visual navigation; actual seeking remains the platform player's control. / 进度条不是必加装饰；人物抠像必须来自锁定后的干净 A-roll，由 HyperFrames 本地处理并通过动态蒙版验收，不能用描边掩盖坏抠像。
12. Run targeted audio, transition, layout, keyframe, inherited-color-continuity, and resolution checks before a full render. Measure dialogue loudness from the actual rendered timeline after cuts, denoise, fades, and gain; compare it with clean non-clipping references from the selected private profile when available, apply one consistent gain across a continuous same-session recording, and re-render to prove integrated loudness and true-peak headroom. Before generating or reflowing captions, read [caption-semantic-pagination.md](references/caption-semantic-pagination.md), lock the approved break profile, and run `scripts/audit-caption-pages.mjs`; fixed-width code-point splitting is forbidden. After enlarging captions, reflow them and recheck the longest two-line card against presenter inserts, information cards, and platform safe areas. Lock semantic pagination before styling punctuation. Preserve every manuscript punctuation mark inside a caption page; omit detachable separators or terminators such as commas, periods, semicolons, colons, and enumeration commas only when they are the page's final character. Always preserve page-final question and exclamation marks, and never strip a paired structural closer such as a quotation mark or bracket. When the caption renderer's `hidePunctuation` contract performs exactly this page-final cleanup while retaining internal punctuation, use it and verify the exceptions; do not leave it `false` merely because punctuation must remain inside the page. Re-run this audit after any pagination change and verify both the complete Card list and composed pixels. Do not invent or substitute visible symbols; if an exact glyph is stripped, change renderer/style, use an authored caption/card, or separate pages by meaning. Inspect changed B-roll seams on the boundary frames and separate a completed thought from the next thought in viewer-facing caption pages.
   When an approved reference is locked, QA is a fail-closed invariant audit: compare caption `displayMode`, `highlightUnit`, punctuation visibility, pacing/`wordsPerPage`, max lines, max characters, and geometry exactly; reject word-by-word or karaoke behavior unless the reference uses it. Build a collision matrix for every full-frame visual and boundary: top progress band versus headings/PiP, information content versus the caption lane, caption ink versus platform description controls, and outro art versus caption/underline. Sample the middle and both boundary neighborhoods of every visual run, not only one attractive settled frame. For every internal image, state, or label swap, sample the complete transition window; outgoing and incoming visibility must overlap when continuous coverage is intended, and the label must use the same phase as its image. A blank intermediate frame, leaked underlay, or label/image mismatch blocks export. Any critical copy or evidence inside/below the caption lane, any progress strip covering a heading, any unplanned dark/translucent band, or any missing required presenter insert blocks export. Compare the final target contact sheet beside the approved reference contact sheet before claiming QA passed.

   已锁定参考片时，验收必须“默认不通过，证据齐全才通过”：逐项比对字幕整句/逐字、强调、标点、分页与位置；为每个画面和边界建立进度条、标题、小窗、信息区、字幕区、平台控件和片尾的碰撞矩阵；每段检查开头、中间、结尾邻域。内部图片、状态或标签切换必须检查完整过渡窗；需要连续覆盖时，出入画透明度必须重叠，标签与图片必须使用同一阶段。空白中间帧、底层漏出或标签画面错配均阻断导出。字幕区内或其下方出现关键信息、进度条压标题、未经批准的暗色透明横条、应有而缺失的人物小窗，任一项都阻断导出。
13. Render the exact release candidate at the already-locked required dimensions from the highest-quality approved sources, then listen to the complete dialogue, inspect representative and boundary frames, probe the delivered file, and verify rights. A lower-resolution review proxy may accelerate iteration but may not receive final publication approval on behalf of a different 4K or otherwise higher-spec render.
14. After that exact candidate passes QA, create the publication package with `assets/templates/publish-package.template.json`: verify current official platform rules, provide multiple accurate cover/caption/tag choices, plan the platform-native AI declaration and viewer-facing disclosure when applicable, and run `scripts/audit-publish-package.mjs`. Do not claim open-source availability, automation, evidence, compliance, or campaign eligibility unless it is true at posting time.
15. Deliver the final video together with the editable project, canonical EDL, captions, decision record, rights manifest, QA report, and publication package.
16. Record feedback privately. Promote it to the base profile only after explicit user approval or repeated confirmation.

Progress placement safety overrides the bottom-first candidate described above. A semantic chapter strip must remain readable on the actual delivery surface; platform UI exclusion zones are constraints, not acceptable occlusion. Validate published screenshots on the target phone, tablet, and player surfaces. If bottom descriptions or controls obscure the strip, relocate it to a reserved top-safe band or another proven safe band, then reflow headings, picture-in-picture, and information cards below or around it while preserving the approved caption lane. Never solve the move by laying progress labels over existing headings.

For semantic progress, full bleed applies only to the neutral contrast surface. Derive one shared horizontal safe inset for the track, playhead, duration-proportional label rail, and dividers from the actual player `contain`/`cover` behavior; zero semantic inset requires published-player proof. Simulate the target viewport before publication, then replace that assumption with real target-device screenshots when available. See [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md) for the bilingual formula and orientation rules.

Read [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md) whenever implementing or reviewing the reusable landscape or portrait semantic-progress component family.

For 9:16 talking-head delivery, read [portrait-talking-head-safe-layout.md](references/portrait-talking-head-safe-layout.md) and start from `layout.portrait-talking-head.safe-v1` when the approved design matches it. Treat its `2160x3840` caption and top-progress geometry as a normalized reference baseline, not a universal hardcode. Keep crop-tolerant backgrounds full bleed, but constrain caption glyphs, progress semantics, information copy, declared B-roll critical regions, picture-in-picture boxes, presenter-cutout silhouettes and motion envelopes, and identity marks to the intersection of the actual visible source region and the platform-UI-free region for their vertical band. Changing pixel dimensions without changing aspect ratio does not solve player crop.

Preserve an approved caption lane when adding or relocating progress. Reflow nearby headings, evidence, and picture-in-picture first. A decorative outro underline must remain visibly below the rendered caption ink; move or shorten the decoration before moving approved captions unless the user explicitly changes the caption layout or a documented hard collision leaves no other valid option.

Do not begin full production until the user approves the content lock and director plan. Do not silently start credit-consuming or paid generation.

## Tool Routing

Read [tool-selection.md](references/tool-selection.md) before selecting engines.

- Use ChatCut for multitrack visual review, transcript-linked editing, preview, and human adjustment. When ChatCut is active, follow `$chatcut:chatcut-plugin-basics`, `$chatcut:talking-head-guide`, `$chatcut:transcription`, `$chatcut:verification`, and `$chatcut:export` as relevant. Before copying or rebuilding clip boundaries, compare the canonical and target timeline frame rates; never reuse raw frame numbers across different timebases.
- Treat ChatCut's FCP XML as a reviewed edit source, not a second permanent timeline. Convert it with `scripts/chatcut-xml-to-canonical-edl.mjs`; all downstream timing must use the resulting canonical EDL. Read [chatcut-handoff.md](references/chatcut-handoff.md).
- Use FFmpeg `-c copy` only for a fast, approximate preview. Use precise re-encoding for locked A-roll and the master.
- Use HyperFrames for real-media composition, direct visual authorship, fixed structures, simpler variables, and governed local presenter background removal. Read `$hyperframes` first whenever selected; for a presenter cutout also follow [presenter-coverage-modes.md](references/presenter-coverage-modes.md) and its shot-level fail-closed matte gate.
- Use Remotion for nested data, conditional layouts, reusable React components, and many structured variants. Do not render the same shot in both engines unless running a declared A/B test.
- Treat video-use as boundary and acceptance logic already absorbed into this workflow, not as a second orchestrator layer.
- Use the Qwen3-TTS helper only for an authorized short sample under [voice-clone.md](references/voice-clone.md). ASR and human listening remain mandatory.

## Approval Gates

At each gate, show what is being decided, a recommended option first, two or three alternatives at most, cost/rights implications, and what becomes invalid if changed later. Follow [interaction.md](references/interaction.md).

Required gates:

- Content lock and director plan.
- Rough-cut preview and canonical EDL lock.
- Three keyframes and short motion sample.
- Asset rights and any paid/credit operation.
- Caption style and optional audio mix.
- Exact release master, publication package, and feedback promotion.

## Memory

Follow [memory-and-feedback.md](references/memory-and-feedback.md). Keep three layers separate:

- Repository defaults: generic, non-personal, versioned here.
- Private base profile: reusable user preferences in `AI_VIDEO_DIRECTOR_DATA_DIR`.
- Project overrides: choices that apply only to one video.

Never infer a permanent preference from one isolated choice. Record the reason and evidence for every promotion.
At delivery, also complete `assets/templates/learning-scope-ledger.template.json`. For every lesson, distinguish `pre-existing-confirmed`, `pre-existing-hardened`, `corrected-overgeneralization`, `new-general-rule`, `new-private-preference`, and `project-only-decision`, then state whether it lives in the public repository, private profile, or project only. / 交付时必须逐条说明规则是原有确认、原有加固、纠正过度泛化、新增通用规则、新增私人偏好还是仅本片决定，并标明实际进入公共仓库、私人画像或单片工程，不能把所有清单都说成“这次新加”。

## Governance And Delivery

Before adopting or upgrading a tool, model, service, font, music source, effect library, or asset library, complete a governance card using `assets/templates/tool-governance-card.template.json`. Follow [tool-governance.md](references/tool-governance.md).

Every delivery must include:

- Final master and platform variants.
- Editable project/source.
- Canonical EDL and timing map.
- Corrected transcript and captions.
- Director/edit decisions.
- Rights manifest.
- QA report and unresolved limitations.
- Dated publication package with official-rule sources, alternate cover/caption/tag choices, and the AI-disclosure decision when publishing is in scope.
- Learning-scope ledger that identifies what was pre-existing, hardened, corrected, newly generalized, private, or project-only.
- Delivery manifest with the absolute local path of every final file and editable project, the editor/project format, entry point, open or preview command, reproducible render command, and any runtime/account dependency. In a shared workspace, link the existing local artifacts instead of telling the user to download another copy.

Classify every rendered file as a `review-proxy`, `platform-release`, or `source-quality-master`. Passing a platform's dimensions and codec rules proves compatibility, not source-quality lineage. When the approved edit was built from a lower-resolution proxy and the original is materially better, render the release/master from the original-quality media; never relabel or upscale the proxy as the master. Preserve the intended timeline cadence instead of manufacturing a higher frame-rate label by duplicating frames. / 每个输出必须明确标注为“审片代理、平台发布版或源质量母版”。平台规格兼容不等于母版质量；原片明显优于代理素材时，发布版应从原片重建，不能把代理文件放大后冒充母版，也不能靠重复帧虚增帧率。

Do not claim that copying this Skill alone makes the workflow portable. Report missing runtimes, accounts, plugins, models, fonts, and project media.

## Internal Agent Commands

These are Agent operations, not a user setup checklist. Run them yourself and summarize only blockers that require user action.

Run from this Skill directory:

```bash
node scripts/director.mjs doctor
node scripts/director.mjs init-project --id my-video --root ~/Documents/ai-video-projects
node scripts/memory.mjs show
node scripts/chatcut-xml-to-canonical-edl.mjs review.xml canonical-edl.json
node scripts/render-canonical-edl.mjs canonical-edl.json source.mov a-roll-master.mp4
node scripts/audit-publish-package.mjs publish-package.json
```

Keep the root README limited to bilingual natural-language invocation, inputs the user must provide, unavoidable approval points, and essential rights/privacy disclosures. Do not move internal workflow, tool selection, technical setup, or maintainer commands back into it.

## References

- [workflow.md](references/workflow.md): complete stage graph, artifacts, and restart rules.
- [production-standard.md](references/production-standard.md): rough/fine boundaries, media handling, QA, and delivery.
- [platform-release-and-publish-package.md](references/platform-release-and-publish-package.md): two-phase platform constraints, exact release-master approval, dated official-rule verification, AI disclosure, and multiple publication-copy variants.
- [dialogue-join-audit.md](references/dialogue-join-audit.md): bilingual boundary workflow for manuscript audibility, natural pauses, mouth-noise removal, and rendered join proof.
- [evidence-state-roi-audit.md](references/evidence-state-roi-audit.md): bilingual exact-state and semantic-ROI workflow for app/dashboard screenshots and recordings.
- [code-motion-components.md](references/code-motion-components.md): bilingual `G/P/T/A/X` classification, three-layer component architecture, parameter schema, content-fit gate, seek-safe clocks, QA, promotion, and error-sample rules for code-authored motion graphics. Start a reusable record from `assets/templates/code-motion-component.template.json` instead of rebuilding its governance fields from memory.
- [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md): generic landscape and portrait RMCU behavior, parameters, and verification.
- [portrait-talking-head-safe-layout.md](references/portrait-talking-head-safe-layout.md): approved 9:16 caption/progress reference layout and multi-device semantic-safe composition rules.
- [presenter-coverage-modes.md](references/presenter-coverage-modes.md): bilingual two-axis A/B coverage taxonomy plus governed HyperFrames presenter-cutout, outline, placement, matte QA, and fallback rules.
- [tool-selection.md](references/tool-selection.md): current priority, strengths, weaknesses, cost, and exclusions.
- [research-and-tests.md](references/research-and-tests.md): eight-case union and controlled component evidence.
- [chatcut-handoff.md](references/chatcut-handoff.md): visual timeline to canonical EDL handoff.
- [interaction.md](references/interaction.md): concise user choices and approval gates.
- [memory-and-feedback.md](references/memory-and-feedback.md): private evolving style memory.
- [tool-governance.md](references/tool-governance.md): license, cost, privacy, and evidence checks.
- [voice-clone.md](references/voice-clone.md): approved short-sample Qwen3-TTS boundary.
