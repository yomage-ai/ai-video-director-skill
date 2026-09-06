# Execution And Evidence / 执行与证据

## English

The normal workflow uses `pipeline.json` and `stage.mjs`. These gates check actual files and the declared dependency graph; they do not prove human perception, user identity, or OS-level unbypassability. Never fabricate a listening record or user approval to satisfy a validator.

### Bind files and approvals

`node scripts/evidence.mjs bind <file>...` computes absolute paths and streaming SHA-256 hashes. Use these records for sources, configuration, code, user-message excerpts, capability results and media. Relative paths in records resolve against the containing JSON file. Keep all private records outside this repository.

The four approvals in `pipeline.json` contain `approvedBy: "user"`, the actual `approvedAt`, an `artifact` binding and an `evidence` binding to the relevant explicit user message. Preserve prior valid approval; no separate caption/music/PiP questions when the complete style sample already covered them. Approval of a sample binds the fine-direction document, whose evidence includes the actual sample and rough-render receipt. Updating any bound artifact invalidates that approval.

The rough auditor also compares decoded PCM against the actual program interval. An unrelated audio file with a valid path, hash and duration does not pass. Use the generated lossless WAV windows; regenerate instead of substituting a lossy preview. Window extraction seeks directly to the interval so each join does not require decoding the whole preceding program.

### Capability checks happen when needed

- Default `director.mjs doctor` checks installation only. A cached plugin is `installed-unverified`; npx availability is not renderer readiness.
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

Never backfill old records as if these checks happened historically. Regenerate schema-4 rough review from the current render receipt. Keep legacy projects and approved outputs intact. EDL v1 can be rendered for straight-cut compatibility, but new XML conversion produces v2. A current rough review always requires a fresh media receipt.

Use `trial-metrics.json` for the next independent production. Record actual first-card latency, active time, revision and rerender counts, repeated defects, host preset, RSS and swap evidence, and creator acceptance. Keep missing data null. Unit tests, a synthetic clip, retrospective replay and a new real production are different evidence classes.

## 简体中文

统一入口为 `pipeline.json` 与 `stage.mjs`。它检查实际文件和明确登记的依赖，不能证明人的听感、用户身份或系统级无法绕过；不得为通过审计编造听审或批准。

### 文件与批准

Agent 用 `evidence.mjs bind` 为文件生成绝对路径和 SHA-256。相对路径按记录所在 JSON 目录解析。私有媒体、用户消息和审片记录留在公共仓库之外。

四个批准记录保存真实用户、时间、批准对象及原话依据的文件哈希。已有有效批准直接继承；整体样片已经覆盖的字幕、配乐、人物形式不另设重复问题。修改绑定文件会使原批准失效。

粗剪审计还会对照对应成片区间的实际音频采样；路径、哈希和时长都正确的无关声音也不能通过。使用生成的无损 WAV 窗口，不能换成有损代理。提取时直接定位区间，避免每个剪点都从片头重新解码。

### 能力与阶段

轻量 Doctor 只代表安装检查。`capability-probe.mjs` 真正做一次很小的本地编码和探测；剪辑器、ASR、听审能力和精剪渲染器必须由 Agent 在使用前留下实际工具响应或小样证据，每项记录版本、方法、时间与证据。24 小时过期或环境变化后重新核对。插件缓存和转写文本不能分别冒充连接与听审能力。

正确顺序：内容批准 → 粗剪候选 → 从真实时间线生成全量听审窗口 → Agent 实际听看与审计 → 用户批准粗剪 → 整体样片与审计 → 用户批准风格 → 完整精剪 → 用户批准精确成片 → 交付检查。不能要求尚未生成的粗剪先通过自己的听审，也不能用旧版审片批准新版文件。

听审窗口默认剪点前后各 2.5 秒，到片头片尾才截短；上下文不足时 Agent 延长。记录的变速范围必须与实际 EDL 一致。

只做粗剪时，Agent 将 `outputScope` 设为 `rough-cut`，用 `evidence.mjs bind` 为 `roughDelivery.editableProject` 与 `roughDelivery.captions` 绑定可编辑 XML/工程文件及当前字幕。内容与精确粗剪通过后直接运行 `stage.mjs run pipeline.json deliver`，交付 A-roll、EDL、工程与字幕并结束。无需样片、精剪、发布包，也不重复确认相同粗剪文件。交付时明确这是粗剪版本；完整精剪才保留 `full-edit` 并继续后续阶段。

Agent 将任务的执行参数放入 `jobs`，命令使用数组、不经 shell；输入绑定包括代码、素材、字体、字幕、音频、配置和源映射。重渲染套用已确认的内存保护。成功后生成与输出绑定的回执；既有输出不覆盖，依赖变化会阻断。`check` 只预检，`run` 执行对应阶段。

每个渲染任务的 `outputSpec` 必须填入已约定的宽、高、帧率和总帧数。执行器核对真实文件的尺寸、帧率和时长；渲染命令成功但规格不符仍然失败。经验复盘确实没有新增时，学习账本允许 `entries: []`、`reviewedNoNewLearning: true` 和具体 `noNewLearningReason`，不为填表编造新经验。The same explicit no-new-learning fields are allowed after an actual review that found nothing new.

交付重新检查实际成片、批准、粗剪与风格依赖、可编辑工程和完整解码；只有任务要求发布时才检查发布包。旧项目不回填“当时做过”的证据，新版粗剪记录从当前媒体回执重新生成。下一条独立实片用 `trial-metrics.json` 记录返工、等待、总耗时和资源实测，缺少的数据保持空值。
