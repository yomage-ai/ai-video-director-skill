# Locked Master And Screen-Led Revisions / 母版锁定与录屏主导修订

## Route / 路线

When the creator supplies their own edited sequence or approves an existing master, first distinguish **recutting content** from **changing named visual layers**. The master is the authority for selected ranges, order, speed, pauses and original audio; preserve its native canvas, not an assumed 16:9 or 9:16. Inspect the supplied file; a flattened export does not provide independently editable face/UI layers. Reuse approved decisions and assets, but never infer an approval from a filename or a tool success.

用户提供自己剪好的版本或批准母版后，先区分“重剪内容”和“修改指定画面层”。用户剪辑锁定选段、顺序、倍速、气口及原音轨；保留实际画布，不强制横屏一定是 16:9。一体导出不能冒充拥有分层工程，文件名和工具成功也不是用户批准。复用已有决定，不重复审批。

For visual-only, identity-timing, original-audio-preserved revisions, Agent initializes a **new external version directory** with `prepare-locked-revision.mjs <master> <new-directory> <version>`. It probes and binds the real master but leaves all approvals and reviews pending. Agent fills the plan and pipeline; these are not user setup tasks. A recut, retime, narration/BGM/SFX change must use the normal rough/fine route and its actual auditory gates. Never relabel an unreviewed raw cut as a locked master to avoid those gates. An explicit creator-approved master permits inheritance of that exact audio, not a claim that Agent independently listened. Keep earlier raw-cut limitations in their original record, and document which no-longer-required operations are outside this revision; do not falsely resolve blockers.

只改画面、不改时间和原声音时，Agent 用上述命令创建新版本目录并补齐计划。初始化不会自动批准。改选段、顺序、倍速或任何声音必须回正常剪辑与听审路线，不能借母版修订绕过粗剪。用户明确批准的原音可以继承，但不能写成 Agent 已独立听审。旧粗剪的限制保留原记录；仅说明本次修订为何不再依赖对应操作，不能伪造解除阻塞。

## Contracts / 输入合同

- `master` and user message: bind path + SHA-256, exact approval timestamp. `revision-plan.json`: `version`, `masterSha256`, `kind: visual-only`, `audio: preserve`, `timing: identity`, probed `outputSpec`.
- `changes`: each has `id`, `layer`, `reason`, half-open integer `startFrame/endFrame`, and a native-pixel `rect: {x,y,width,height}`. Only these pixels during these frames may change. Use the smallest honest affected region; a transition may need a full frame, a caption usually does not. Include effect tails/antialiasing in the planned region. `inheritedExceptions` records creator-chosen blanks/holds without “repairing” them silently.
- `informationPlan`: one `primary` telling per claim, a `viewerBenefit`, and each occurrence's source, locator and speaker (`presenter`, `screen-dialogue`, `screen-explanation`, `other`). `support/recall/locked-source` need `addedValue`; preserved duplication in an approved master is an inherited exception, not permission to recut it.
- `presentation`: copy `presentation.template.json`, adapt orientation and explicit per-element present/absent reasons. Every present element needs a normal-speed sample observation, actual evidence and `sampleSha256`. Screen runs declare source/locator, primary/support, video/still, no operation loop and muted support; stills need a reason. A cutout requires moving hair/shoulders/hands/chair-exclusion/temporal-edge review. `styleChanged: true` needs user approval of the complete new sample; unchanged styling still needs Agent preflight but not repeated style approval.
- Jobs bind render code, configuration, selected assets and all other consumed inputs; preserve output spec and use a new output path. Capabilities are actual local FFmpeg/ffprobe receipts no older than 24 hours, plus the job's real extra dependencies. Do not request ChatCut import or a new audio provider for an unchanged-audio visual job that does not use it.

Agent 写入以上合同：精确母版和批准依据、最小修改矩形及整数帧区间、合理保留的空白、信息归属、完整动态样片和真实依赖。每一观点只确定一个主要讲述来源；录屏对话、录屏讲解也能承担主叙事，人物只补充它们没讲清的内容。已锁定的重复不能擅自删。新风格先确认样片；旧风格只做本次必要预检。所有存在的层都要验证，不存在要写原因，不能漏字幕、顶部进度、人物、录屏、图解或声音决定。

## Execution And Evidence / 执行与证据

1. `stage.mjs check|run pipeline.json revision-render`: verifies approved master and changes, complete sample, dependencies, native geometry and recovery state. Render produces a hash-bound `.stage.json`; old outputs cannot be overwritten.
2. `stage.mjs run pipeline.json revision-review`: decodes the whole candidate; checks frame count and continuous CFR timestamps, original decoded audio samples and audio start/duration, and masked SSIM outside authorized pixels on every frame (minimum 0.995). This is a lossy-codec similarity check, **not pixel identity or perceptual proof**. Review changed regions and adjacent joins in actual motion; check text and callouts against narration. ASR or isolated stills are not listening/motion review.
3. `revision-visual-review.json` binds `outputSha256`, `normalSpeedMotion`, `method`, and exactly one `{id,status:pass,observation,evidence}` per change. `stage.mjs run pipeline.json deliver` additionally requires exact final user approval, real editable project/captions/learning ledger and fresh dependency hashes. Delivery is local; it does not upload or publish.

Agent 按渲染 → 全片技术比较 → 实际动态复核 → 用户确认最终文件 → 本地交付执行。SSIM 只筛查未授权区域是否出现明显变化，不能证明每个像素一致或观感自然。任何音频修改、时间漂移、缺检查、过期文件或真实阻塞都不能当作通过。发布、提交、推送必须遵守当前独立授权。

## Faster Revisions / 加速修订

For a change confined to the beginning, render a fresh prefix through the first usable original keyframe after the last affected frame, including transition handles. `join-rendered-prefix.mjs <master> <new-prefix> <new-output>` requires matching H.264 codec headers, timebase, color and geometry, then copies the untouched video tail and whole original audio. It verifies tail bitstream hashes and full decode. `needsRevisionQa` stays true; this is not an approval. An incompatible stream, non-keyframe join, VFR source or changed time map needs another validated route/full render, never a silent fallback or a new source upload. Follow the existing heavy-render resource policy; one heavy job at a time.

只改开头时，Agent 将新前段渲染到修改结束后的可用原关键帧，再无损复用尾段和原音。编码头、色彩、时间基准不一致或切点不是关键帧，工具会拒绝，不能硬拼。复用后仍需完整解码、修改范围比较与真实动态检查。一般中段多处改动暂不自动切缓存块；明确能力边界，不承诺所有修改都能局部复用。

When a separately authorized structural edit reorders or speeds sections, use `rebase-layers.mjs <frame-map.json> <source-layers.json> <new-output.json>`: schema-1 map binds `sourceVersion`, source/output fps, sourceFrames, durationFrames and ordered `{id,sourceStartFrame,sourceEndFrame,startFrame,endFrame,rate}`. Layer items have `id,layer,startFrame,endFrame` in that same source version. Half-open integer frames split/rebase captions, progress, callouts, presenter, effects and sound cues together. It maps cue timing only; it does not stretch audio, rewrite caption words or generate missing narration. Recompute semantic chapter labels/callout targets and audit the rendered result.

另行获准换序或变速时，用同一整数帧映射重算所有层；不能字幕改完、顶部进度还用旧时间。映射工具只移动时间区间，不生成文案或处理音频；句意、小节名称、圈选目标与最终画面仍由 Agent 复核。变速后不足一帧的提示会写入 `collapsed` 并以失败状态返回，Agent 必须合并或重新安排，不得静默丢失字幕或提示。Intervals collapsed below one frame are reported and fail readiness; Agent must merge or relocate them.

## Iteration Records / 每轮记录

Revision render, technical QA and exact release approval automatically append hash-bound events under `analysis/iterations/` and refresh `analysis/iteration-summary.json`. Agent adds request/timing/lesson events through `record-iteration.mjs <external-project> <event.json>`. Schema-1 events have a unique id, projectId, version, type, occurredAt and hash-bound evidence; output events bind artifact. Request categories: quality-repair, aesthetic-trial, content-change, packaging. Timing categories: agent, tool, user-wait, with actual startedAt/endedAt; overlapping intervals merge. Unknown durations remain null. A past-version approval cannot reset current-version status. A render/technical QA event does not mark creator acceptance.

渲染、技术验收和精确成片批准自动留事件并刷新版本摘要；Agent 补充需求归类、实测耗时和经验。质量返修、审美试验、内容变更、包装调整分开计数；Agent 工作、工具运行、等待用户分开统计，未知不编造。公共机制、创作者风格和单片决定仍写入 `learning-scope-ledger.json`；空模板不得交付，没有新经验也要明确记录核对理由。事件统计不会自动把经验升级成规则或已完成独立实片验证。
