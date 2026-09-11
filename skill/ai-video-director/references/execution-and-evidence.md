# Execution And Evidence / 执行与证据

## English

The normal workflow uses `pipeline.json` and `stage.mjs`. These gates check actual files and the declared dependency graph; they do not prove human perception, user identity, or OS-level unbypassability. Never fabricate a listening record or user approval to satisfy a validator.

A generic request to rough-cut or “try cutting it first” does not waive source listening or quality gates. Do not invent a `trialOnly` mode or use a custom renderer to turn a failed gate into a user-facing rough-cut delivery. An explicitly requested unreviewed experiment can remain an experiment, but does not fulfill reviewed editing. Require a nonempty structured stage result: exit code zero without a result is not a passed check. Directory-symlink installations are supported by the CLI entry point.

“先剪出来”“试着粗剪”不代表用户放弃听审和质量要求。Agent 不得自行创造 `trialOnly` 模式或另写渲染脚本，把失败的门禁变成可交付粗剪。用户明确要求的未审实验只能作为实验，不代表剪辑要求已完成。阶段命令必须返回非空结构化结果；仅退出码为零、没有结果不能算通过。入口支持目录符号链接安装。

### Recovery and route changes / 阻塞恢复与路线变化

Scope a blocker to the selected operation. `stage.mjs` controls gated renders and delivery, not every editor tool call. An unresolved auditory review can coexist with authorized ChatCut import, transcription and provisional editable timeline work. Keep the quality blocker until real review passes; do not mark it resolved merely to resume those independent operations. A proposed paid reviewer is optional until selected, and its credentials must not become a blanket prerequisite for the established editor route.

阻塞对应所选操作。`stage.mjs` 管的是需要验收条件的渲染与交付，不是所有编辑器工具调用。听审未完成时，仍可做已授权的 ChatCut 导入、转写和候选可编辑时间线；质量阻塞保持未解决，不为继续这些独立操作而伪造通过。拟议付费审听模型尚未选定时，其凭据不能成为既有剪辑路线的统一前提。

On a real login, permission, billing, capability or quality obstruction, append a record to `pipeline.recovery.blockers` before further dependent execution. Preserve the original provider and concrete failure; `recoveryAction()` in `scripts/lib/recovery.mjs` separates user account/consent decisions from Agent technical repair. Tell the user what action, destination/data scope, and cost are involved. Wait on actual required input, while continuing independent authorized preparation. Do not bypass an authorization denial with another tool or provider, or silently reduce review quality.

遇到真实登录、权限、费用、能力或质量阻塞，先在 `pipeline.recovery.blockers` 留下记录。说明原服务、实际失败、用户操作、涉及素材与费用；需要用户的输入就等待，同时继续独立且获授权的准备工作。不得换工具或服务绕过拒绝，不得偷偷降低质量要求。

```json
{"schemaVersion":1,"blockers":[{"id":"editor-login","kind":"authentication","provider":"selected-editor","detail":"Official tool returned not_logged_in","status":"blocked"}]}
```

`stage.mjs` rejects every unresolved blocker. A resolved record needs `qualityRequirementsPreserved:true` plus `resolution.verifiedAt` and hash-bound `resolution.evidence` from a real verification. Authentication, permission, billing and route-change records (or any `alternativeRoute`) additionally need `resolution.userAuthorization` with `approvedBy:"user"`, `approvedAt`, and bound message evidence. Existing consent is reusable; successful technical fallback is not consent. These receipts enforce the normal workflow, not an OS-wide or semantic guarantee.

`stage.mjs` 在所有阶段阻断未解决记录。解决时保留质量标准，并绑定真实验证时间和文件；涉及用户身份、授权、费用或改换路线时，还需绑定用户决定。已获授权可复用，替代路线运行成功不能代替授权。回执不能证明感知质量，也不宣称操作系统级防绕过。

### Bind files and approvals

`node scripts/evidence.mjs bind <file>...` computes absolute paths and streaming SHA-256 hashes. Use these records for sources, configuration, code, user-message excerpts, capability results and media. Relative paths in records resolve against the containing JSON file. Keep all private records outside this repository.

The four approvals in `pipeline.json` contain `approvedBy: "user"`, the actual `approvedAt`, an `artifact` binding and an `evidence` binding to the relevant explicit user message. Preserve prior valid approval; no separate caption/music/PiP questions when the complete style sample already covered them. Approval of a sample binds the fine-direction document, whose evidence includes the actual sample and rough-render receipt. Updating any bound artifact invalidates that approval.

The rough auditor also compares decoded PCM against the actual program interval. An unrelated audio file with a valid path, hash and duration does not pass. Use the generated lossless WAV windows; regenerate instead of substituting a lossy preview. Window extraction seeks directly to the interval so each join does not require decoding the whole preceding program.

### Capability checks happen when needed

- First use runs the Agent-owned [dependency setup](dependency-setup.md), repairing missing tools before their stage. Default `director.mjs doctor` remains read-only and checks installation only. A cached plugin is `installed-unverified`; npx availability is not renderer readiness.
- `capability-probe.mjs <new-capabilities.json>` performs a tiny local encode/probe and saves real FFmpeg/ffprobe evidence. It does not download tools or contact an editor.
- Before rough execution, the Agent adds current checks for `chatcut`, `asr`, and `source-listen` from actual host/tool results. Before fine/release execution, add `fine-renderer` from the exact selected version and a successful small render.
- Each check has `name`, `status: "pass"`, `version`, `method`, `checkedAt`, and a hash-bound `evidence` file. Evidence expires after 24 hours and on a relevant environment change. For listening, name the actual playback/analysis modality and permitted reviewer; ASR text alone cannot demonstrate auditory capability. The data format is an attestation with traceable evidence, not a proof that software heard speech.
- `director.mjs doctor --stage rough|fine|release --capabilities <file>` rejects missing operational checks. The stage runner also calls this check.

### Execute without a circular approval dependency

1. Content approval → `stage.mjs run pipeline.json rough-render`. This may produce an unapproved candidate. Bind the timing XML/EDL, source map, source media, processing plan and scripts in `jobs.rough-render.inputs`. Use the precise renderer as the job; it generates `<video>.render.json` after full decode and media/source hash checks.
2. `prepare-rough-review.mjs <video>.render.json <new-review.json>` derives every boundary from the EDL and extracts real normal-speed audio windows with 2.5 seconds on each side, clipped at program edges. Extend a window when a phrase needs more context. The Agent completes actual listening, decisions, pace/pause scans, skin/exposure review and measured LUFS/true peak. The helper deliberately leaves these unapproved. `audit-rough-cut-review.mjs` validates the evidence and editorial record before user review.
3. Rough approval → create the style sample. `fine-edit-direction.json.evidenceBinding` contains `roughRenderReceipt`, `sample`, and nonempty `dependencies` with the actual media/code/asset bindings used for that sample. The fine audit verifies real streams, duration, sample identity, dependencies and the rough timebase. Dialogue-only still has audible speech; it is not silence.
4. Style approval → `stage.mjs run pipeline.json fine-render`. Every render job uses `argv` as an array, `inputs` as file bindings, `requiresCapabilities`, a new `outputPath`, and `outputSpec` with the agreed `width`, `height`, `fps` and `durationFrames`. No shell is involved. Bind all rendering code, assets, fonts, captions, sound, configuration and source maps, not just a directory name. Wrap heavy output in the approved memory guard. The runner writes `<output>.stage.json`, binds required upstream artifacts and declared inputs, decodes the exact output and checks its actual resolution/timebase/duration. It refuses existing outputs and changed dependencies.
5. Final approval → `stage.mjs run pipeline.json deliver`. It reruns rough/style/delivery checks, verifies the exact final hash, the fine-render dependency receipt and current approvals, runs publication checks only when requested, and fully decodes the delivered master. `artifacts.fineRenderReceipt` points to the actual `.stage.json` file.

Use `check` instead of `run` for read-only preflight. A completed render remains a review candidate until its specific approval; neither the renderer nor the prepare helper sets creator approval automatically. A job failure retains the incomplete output and evidence; select a new version for an evidence-based retry.

### Rough-cut-only delivery

When the user asks to stop after rough editing, set `outputScope: "rough-cut"` in `pipeline.json`. After the content and exact rough-cut approvals, bind `roughDelivery.editableProject` to the editable XML/project file and `roughDelivery.captions` to the current timed captions with `evidence.mjs bind`. Run `stage.mjs run pipeline.json deliver`. This branch checks the approved A-roll/EDL/render receipt and these handoff files, then ends. It does not require style approval, fine-direction artifacts, fine render, publication materials, or a second approval of the unchanged rough file. State that the delivery is a rough cut, not a finished publication master. For a full edit retain `outputScope: "full-edit"` and continue steps 3–5 above.

### Existing projects and regression

Never backfill old records as if these checks happened historically. Regenerate schema-5 rough review from the current render receipt, including `retainedInteriorReview` for every kept interval. New fine directions use schema 2: `informationPlan` plus `presentation` from the complete dynamic sample. Old schema-4/1 documents remain readable with warnings; new work must not select old formats to skip checks. Keep legacy projects and approved outputs intact. EDL v1 can be rendered for straight-cut compatibility, but new XML conversion produces v2. A current rough review always requires a fresh media receipt.

For an explicitly approved master with visual-only changes, use the separate [locked-master revision route](locked-master-revisions.md). It inherits only the exact approved audio and timing, compares all unchanged regions, and never represents inheritance as a fresh auditory review. / 已批准母版仅改画面时用独立修订路线，继承原音和时间并比较未改区域，不冒充重新听审。

Use `trial-metrics.json` for the next independent production. Record actual first-card latency, active time, revision and rerender counts, repeated defects, host preset, RSS and swap evidence, and creator acceptance. Keep missing data null. Unit tests, a synthetic clip, retrospective replay and a new real production are different evidence classes.

## 简体中文

统一入口为 `pipeline.json` 与 `stage.mjs`。它检查实际文件和明确登记的依赖，不能证明人的听感、用户身份或系统级无法绕过；不得为通过审计编造听审或批准。

### 文件与批准

Agent 用 `evidence.mjs bind` 为文件生成绝对路径和 SHA-256。相对路径按记录所在 JSON 目录解析。私有媒体、用户消息和审片记录留在公共仓库之外。

四个批准记录保存真实用户、时间、批准对象及原话依据的文件哈希。已有有效批准直接继承；整体样片已经覆盖的字幕、配乐、人物形式不另设重复问题。修改绑定文件会使原批准失效。

粗剪审计还会对照对应成片区间的实际音频采样；路径、哈希和时长都正确的无关声音也不能通过。使用生成的无损 WAV 窗口，不能换成有损代理。提取时直接定位区间，避免每个剪点都从片头重新解码。

### 能力与阶段

首次使用先按 [依赖准备](dependency-setup.md) 自动补齐所需工具；轻量 Doctor 保持只读，只代表安装检查。`capability-probe.mjs` 真正做一次很小的本地编码和探测；剪辑器、ASR、听审能力和精剪渲染器必须由 Agent 在使用前留下实际工具响应或小样证据，每项记录版本、方法、时间与证据。24 小时过期或环境变化后重新核对。插件缓存和转写文本不能分别冒充连接与听审能力。

正确顺序：内容批准 → 粗剪候选 → 从真实时间线生成全量听审窗口 → Agent 实际听看与审计 → 用户批准粗剪 → 整体样片与审计 → 用户批准风格 → 完整精剪 → 用户批准精确成片 → 交付检查。不能要求尚未生成的粗剪先通过自己的听审，也不能用旧版审片批准新版文件。

听审窗口默认剪点前后各 2.5 秒，到片头片尾才截短；上下文不足时 Agent 延长。记录的变速范围必须与实际 EDL 一致。

只做粗剪时，Agent 将 `outputScope` 设为 `rough-cut`，用 `evidence.mjs bind` 为 `roughDelivery.editableProject` 与 `roughDelivery.captions` 绑定可编辑 XML/工程文件及当前字幕。内容与精确粗剪通过后直接运行 `stage.mjs run pipeline.json deliver`，交付 A-roll、EDL、工程与字幕并结束。无需样片、精剪、发布包，也不重复确认相同粗剪文件。交付时明确这是粗剪版本；完整精剪才保留 `full-edit` 并继续后续阶段。

Agent 将任务的执行参数放入 `jobs`，命令使用数组、不经 shell；输入绑定包括代码、素材、字体、字幕、音频、配置和源映射。重渲染套用已确认的内存保护。成功后生成与输出绑定的回执；既有输出不覆盖，依赖变化会阻断。`check` 只预检，`run` 执行对应阶段。

每个渲染任务的 `outputSpec` 必须填入已约定的宽、高、帧率和总帧数。执行器核对真实文件的尺寸、帧率和时长；渲染命令成功但规格不符仍然失败。经验复盘确实没有新增时，学习账本允许 `entries: []`、`reviewedNoNewLearning: true` 和具体 `noNewLearningReason`，不为填表编造新经验。The same explicit no-new-learning fields are allowed after an actual review that found nothing new.

交付重新检查实际成片、批准、粗剪与风格依赖、可编辑工程和完整解码；只有任务要求发布时才检查发布包。旧项目不回填“当时做过”的证据，新版粗剪记录从当前媒体回执重新生成。下一条独立实片用 `trial-metrics.json` 记录返工、等待、总耗时和资源实测，缺少的数据保持空值。
