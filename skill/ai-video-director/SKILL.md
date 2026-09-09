---
name: ai-video-director
description: Recorded talking-head editing with content and rough-cut review, audiovisual style samples, captions, evidence visuals, sound, editable delivery and feedback. 真人口播自动剪辑：内容确认、粗剪、视听精剪样片、字幕声音、验收与经验沉淀。
---

# AI Video Director

Reply in the user's language. Support Simplified Chinese and English. Own setup, probing, transcription, conversion, rendering and checks; ask only for decisions or actions the Agent cannot take on the user's behalf. Reuse existing authorization.

使用用户当前语言。Agent 完成安装、环境检查、转写、转换、渲染与验收；内容、粗剪、整体视听方向和最终成片由用户确认，已有授权不重复询问。

## Scope / 适用范围

The production path is recorded talking-head footage, including screen-demo footage with a baked-in webcam. Inspect flattened footage before promising to reposition the person: independent layers require separate sources or an explicitly reviewed reconstruction. Do not require separate recordings when the current trial explicitly uses one flattened source.

真人口播与屏幕演示是当前生产路径。屏幕和摄像头已经录成一张画面时，先检查素材，不承诺能无损移动人物；本轮明确采用一体录屏时，不强求重录分轨。

Digital-human/avatar production is paused. Never use SadTalker or the legacy `ai-auto-editing-director`. An explicitly authorized short voice sample uses [voice-clone.md](references/voice-clone.md); this does not authorize full voice replacement. New tool or model adoption uses [tool-governance.md](references/tool-governance.md).

数字人暂停；旧版导演 Skill 和 SadTalker 禁用。声音样本、付费、账号、身份与素材权利沿用各自已确认范围，不扩大授权。

## Start Or Resume / 开始或续接

1. Resolve the real Skill directory and read [dependency-setup.md](references/dependency-setup.md). Agent runs `sh scripts/bootstrap.sh --stage intake --apply` on macOS/Linux or `scripts/bootstrap.ps1 --stage intake --apply` in PowerShell on Windows. Reuse healthy dependencies; install missing ones. A Skill folder install has no universal dependency hook: do this on first use even if the folder already exists. Run `doctor` after repairs, using the resolved Node. Setup receipts are local installation evidence, not editor connectivity. Keep the first content card fast; prepare rough tools before rough execution and the selected renderer before fine work.
2. Keep projects and private media outside this repository. Create a project with `director.mjs init-project` or load its existing state. Never overwrite approved media, timelines or components; create a new version and retain the old one until the replacement passes.
3. Load the bundled Xiaoxiong style described in [xiaoxiong-public-style.md](references/xiaoxiong-public-style.md). Its audio, caption, color, palette, layout and content-fit defaults work without a private profile. Read the effective defaults and optional overrides with `memory.mjs show --stage intake --include-candidates`. Use `--stage rough|fine|release`, `--key`, `--style` and project overrides as needed. When Xiaoxiong identity use is selected, load `$xiaoxiong-ip` and pass its resolved directory with `--identity-skill`; otherwise no Xiaoxiong character or signoff is inserted. Prepare the exact font and neutral reference assets with `prepare-style-assets.mjs --out <external-project>/assets/xiaoxiong-style`. History is opt-in. Pending feedback is a proposal, not an effective default. Follow [memory-and-feedback.md](references/memory-and-feedback.md).
4. For a fresh project read [workflow.md](references/workflow.md). Read only the current stage's references below; query machine contract sections with `director.mjs contract --section roughCut` (or `bRollContinuity`, `finishingPass`) when needed. Do not load the entire contract or all references by default.

默认带入公开的小熊字幕、响度、配色和画面风格，新机不需要旧私人画像。小熊形象与片尾才加载 `xiaoxiong-ip`。首次核对真实安装、工程位置和当前偏好；续接时复用未变化的环境结果。私有素材不进入公共仓库。按阶段读取规范和有效偏好，历史与待试反馈不能自动覆盖当前决定。

首次使用必须由 Agent 补齐依赖，不能只运行 Doctor 后把安装清单交给用户。入口会复用或下载校验 Node 22+，补齐脚本依赖和 FFmpeg；粗剪前执行 `setup.mjs --stage rough --apply --codex <当前桌面宿主内置CLI绝对路径>`，补齐官方 ChatCut 插件及内置上传适配，再核对真实连接与转写。网页版插件的正常上传和重试，Agent 都必须调用 `chatcut-upload.mjs --helper <当前官方助手绝对路径> -- <官方上传参数>`；具体见 [上传恢复](references/chatcut-media-recovery.md)，不能仅阅读说明后仍调用旧的 120 秒入口，也不要求用户另传文档。精剪前执行 `setup.mjs --stage fine --apply`，复用或安装固定版本 HyperFrames、配套创作 Skill 和渲染浏览器；抠像才加 `--renderer cutout`。Agent 必须继续处理回执中的 `agentActions`，完成实际小样验证；仅登录、宿主不允许自动重载工具、系统权限或新费用需要用户参与。不能把 `localReady` 当作能剪辑，也不能用缺少可选模型阻塞首份分析。

For hosted ChatCut imports and retries, Agent must execute `chatcut-upload.mjs --helper <active-official-helper> -- <official arguments>` from this Skill. Rough setup prepares the verified compatibility helper; the upload entry also prepares/reuses it on demand. Do not leave this as a document-only recommendation or ask the user to transport a separate guide. Follow [media recovery](references/chatcut-media-recovery.md).

## Stage Routing / 阶段路由

| Stage / 阶段 | Action and required reference / 动作与必读 |
|---|---|
| Content / 内容 | Use a reliable manuscript and local media probe for a fast first card. Follow [first-approval-and-style-gates.md](references/first-approval-and-style-gates.md). Lock the claim, evidence, intended cuts and meaningful constraints; support count follows content and duration. Defer unapproved styling. / 先给人能读懂的内容与粗剪方案，有可靠稿件时不提前做重型处理。 |
| Rough / 粗剪 | Before importing or resuming media, read [chatcut-media-recovery.md](references/chatcut-media-recovery.md): distinguish host connection, pending upload and real playback; preserve the edit and use bounded recovery. Then read [production-standard.md](references/production-standard.md) and [dialogue-join-audit.md](references/dialogue-join-audit.md). Compare takes quality-first, verify every actual join and all repeated defect classes, preserve word onsets/tails, review pauses and early/middle/late pace. Normalize color and dialogue once using explicit processing. / 导入前核对素材路线；上传失败按有限恢复流程处理，不能无限重试或丢掉已有剪辑。全量核对拼接、气口与语速。 |
| Handoff / 交接 | Read [chatcut-handoff.md](references/chatcut-handoff.md). Export reviewed timing to canonical EDL; explicit constant retiming, video EQ and audio processing use a hash-bound processing plan. Unsupported XML effects must fail; use a reviewed source-quality derivative for complex processing. / 不支持的效果不能悄悄丢弃。 |
| Rough approval / 粗剪确认 | Render the exact A-roll, prepare review windows with `prepare-rough-review.mjs`, actually watch/listen, and run `audit-rough-cut-review.mjs`. The review binds the real EDL, sources, render and windows. User approval follows that review. For rough-cut-only scope, use the delivery branch below and finish here. / 自动生成窗口不等于已经听审。只做粗剪的任务在此确认后直接交付。 |
| Style / 整体样片 | Read [fine-edit-direction.md](references/fine-edit-direction.md) and [curated-style-library.md](references/curated-style-library.md). Exact approved reference → explicit user reference → curated candidates → [dynamic-style-adaptation.md](references/dynamic-style-adaptation.md). Recommend a complete 6–12 second audiovisual sample; include captions, evidence, presenter and BGM/SFX decisions together. Run `audit-fine-edit-direction.mjs`. / 用户确认整套视听方向，已有参考只审实际差异。 |
| Fine edit / 精剪 | Route per shot using [tool-selection.md](references/tool-selection.md). Read the conditional references below. Run targeted risky-boundary, caption, layout, matte, sound and color checks before a full render. / 每镜选择合适工具，先局部验证再全片。 |
| Release / 发布版 | Use [release-render-operations.md](references/release-render-operations.md) for heavy output. Apply a matching approved host preset as a whole bundle, preserve one heavy job, monitor memory and change strategy after failure. Check and fully decode the exact final file. / 代理通过不能代替正式尺寸验收。 |
| Delivery / 交付 | Use the stage gate and `audit-delivery-manifest.mjs`; deliver the master, editable project, timing, captions, rights, QA and learning records. Read [platform-release-and-publish-package.md](references/platform-release-and-publish-package.md) and run `audit-publish-package.mjs` only when publication is in scope. / 交付本地可打开文件与明确限制。 |

## Conditional References / 按需读取

- UI evidence: [evidence-state-roi-audit.md](references/evidence-state-roi-audit.md). Lock exact navigation and semantic ROI; use isolated demo data and a visible-module allowlist before capture. / 界面证据先锁状态、语义区域和隐私白名单。
- Presenter and simultaneous A/B coverage: [presenter-coverage-modes.md](references/presenter-coverage-modes.md), then `audit-coverage-boundaries.mjs`. Treat `B-base-A-cutout` independently from PiP; preserve canonical audio and test moving alpha. / 人物小窗、抠像与分屏分开判断，版式切点以整数帧为准。
- Captions: [caption-semantic-pagination.md](references/caption-semantic-pagination.md), then `audit-caption-pages.mjs`. Portrait short-form starts with one semantic line; readability or exact approved references may justify two. / 竖屏单行是可覆盖的推荐，不是绝对限制。
- Portrait safe layout: [portrait-talking-head-safe-layout.md](references/portrait-talking-head-safe-layout.md), including `layout.portrait-talking-head.safe-v1` when it matches the approved series. / 小熊风格的可缩放字幕与配色参数已经内置，实际占位按内容和平台复核。
- Semantic progress: [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md), `rmcu.semantic-progress.v1`. Use only when it helps navigation. Inactive long labels use ellipsis; active overflow follows the component contract. / 进度条按内容需要使用。
- Code motion reuse: [code-motion-components.md](references/code-motion-components.md); classify the component as `G`, `P`, `T`, `A`, or `X` and separate the general mechanism, private adapter and project instance. / 公共机制、私人适配与单片参数分开。
- ChatCut: follow its active host's basics, talking-head, transcription, verification and export skills as applicable. HyperFrames authoring reads `$hyperframes`; a renderer owns one shot. / 使用当前宿主支持的工具，不根据插件缓存猜测连接可用。

## Executable Gates / 可执行门禁

Read [execution-and-evidence.md](references/execution-and-evidence.md) before the first render. Use `stage.mjs check|run pipeline.json rough-render|fine-render|deliver` as the normal execution path. The A-roll candidate necessarily exists before its own rough-cut review; fine render requires the approved rough cut and style sample. Delivery binds the exact final file and rechecks dependency hashes.

使用统一阶段入口。粗剪候选先渲染、后听审；正式精剪必须通过粗剪和样片门禁；交付必须对应实际批准的最终文件。上游变动使旧证据失效。此机制约束正常工作流，不宣称是操作系统级防绕过。

For a rough-cut-only request, set `outputScope: "rough-cut"`, bind `roughDelivery.editableProject` and `roughDelivery.captions`, then run `stage.mjs run pipeline.json deliver` after rough approval. Deliver approved A-roll, EDL, the editable timing project and captions. Skip style, fine render and publication; no additional final-master approval is needed for the same approved rough file. See [execution-and-evidence.md](references/execution-and-evidence.md).

只做粗剪：Agent 设置上述范围并绑定可编辑工程和字幕，粗剪批准后直接运行交付。相同粗剪文件不重复确认；不要求样片、精剪或发布包。

Never mark a file reviewed from a successful tool call, an ASR transcript, a checked boolean or one attractive still. Missing auditory or visual capability must remain an explicit unverified item. The Agent records actual listening and rendered evidence; user approval is preserved with its source, timestamp and artifact hash.

Keep ChatCut as the rough-editing route. Native audio/video input in the controlling model is not required for transcript-linked editing or returned-frame inspection. Authorized import, transcription, project setup and provisional timeline edits can continue while auditory review is unresolved; they do not constitute reviewed output or bypass gated render/delivery checks. Establish actual auditory review before claiming sound quality. This package does not bundle a listening model or mandate a paid audio API; model specifications alone do not establish the active host's media-input path. Preserve the chosen host/model/provider. When an actual login, consent, permission or billing requirement blocks the selected operation, surface the exact user action and wait; do not silently install a substitute model or switch editors. A proposed replacement needs user agreement and a real sample test. Record actual blockers, not a speculative provider's missing credentials, in `pipeline.recovery` using [execution-and-evidence.md](references/execution-and-evidence.md). Audit retained clip interiors as well as joins: ASR can hide repetitions and adjacent stills can miss motion.

粗剪继续使用 ChatCut。主模型无需原生音视频输入，也能调用转写关联剪辑并查看返回的画面。听审未完成时，可继续已授权的导入、转写、建工程和候选时间线修改；这些不等于验收通过，也不豁免渲染与交付检查。声称听感通过前须落实真实审听。本包没有内置听感模型，也不强制购买音频 API；模型规格不能单独证明当前宿主的媒体输入能力。保留选定宿主、模型和服务；所选操作真正遇到登录、授权、权限或费用要求时，再说明具体用户操作并等待，不能默默换模型或剪辑器。更换方案须先征得同意并通过小样；`pipeline.recovery` 记录实际阻塞，不能把尚未选定服务的缺少凭据写成整个剪辑任务的前提。保留片段内部与衔接都要审：转写可能漏重复，相邻静帧可能漏快眨眼和表情复位。

工具成功、转写存在、勾选字段或单张好看的图，都不能证明质量通过。Agent 必须留下实际检查方式与对应版本；缺少视听能力时如实标记未验证。

## Feedback And Verification / 反馈与验证

Use [interaction.md](references/interaction.md) to keep four normal user decisions compact: content, rough cut, audiovisual style and final master. Merge caption/music/presenter decisions into the style sample; inherit existing authorization. Follow [memory-and-feedback.md](references/memory-and-feedback.md) for public rules, curated styles, private preferences and project-only lessons.

优先保留四个清楚的确认点，不把各个样式细节拆成重复审批。已采用的决定不再询问；已授权共享的小熊风格随公共 Skill 版本维护；个人形象进 IP Skill，其他用户覆盖和单片经验各自保存。

Track the next independent real project with `analysis/trial-metrics.json`: first-card latency, revisions, repeated defects, render count, active time and measured resources. Test results are not proof of stable editing quality. Follow the current recorded promotion decision; publishing source code does not mark a pending real-project trial as completed.

下一条独立实片记录等待时间、返工、重复缺陷、重渲染次数与资源曲线。代码通过不等于成片稳定；遵守当前推广决定，提交源码不能把待做的实片验证改为已完成。
