# ChatCut Media Readiness And Recovery / 素材可用性与上传恢复

Read before the first ChatCut media import, when resuming a pending asset, or after an upload stalls. The Agent diagnoses and performs supported recovery; the user handles only unavailable account, permission or physical-device actions. Preserve existing content approval and the current edit.

首次导入 ChatCut、续接未完成素材或上传卡住时读取。Agent 排查并执行支持的恢复操作；用户只处理 Agent 无法代办的登录、权限或实体操作。沿用内容批准，保留已有剪辑。

## Automatic upload entry / Agent 自动执行入口

For every authorized hosted import or same-asset retry with the governed Plugin 0.2.26 helper, **run this Skill's executable entry below**. Obtain the session and arguments from the official `import_media` / `asset-import` flow; resolve the original helper from that active Skill, not a workspace copy. The Agent supplies paths and session values; these are not user setup steps.

```text
node <director-skill>/scripts/chatcut-upload.mjs --helper <absolute-official-upload-media.mjs> -- <official-upload-arguments>
```

The entry automatically checks the full official helper hash, prepares/reuses an isolated local compatibility copy, and executes it in the foreground. Its fixed profile sets **two parallel parts per file, a 600-second request ceiling and two attempts**; retry arguments retain `--no-transcribe` when selected. The official session, media preparation, server-assigned part sizes, storage upload, asset IDs, finalization and result JSON remain in the upstream flow. The original plugin stays unchanged. A large failed recording runs alone; additional files would still share bandwidth.

The rough-stage setup prepares this compatibility copy automatically from the installed plugin registry; the upload entry also prepares it on demand, so a copied Skill works without an earlier setup receipt. Preparation needs no upload, login, new npm package or user editing. Unknown upstream hashes or modified cached copies stop before execution and require Agent review. Do not silently run the old 120-second helper after this check fails. Use the existing supported recovery route if the active host explicitly disallows a compatibility copy.

**正常上传和失败重试都由 Agent 调用上面的 Skill 入口，不能只读本文后仍直接运行旧脚本。** 入口自动校验官方版本，生成或复用本地适配副本：每个文件同时传 2 个分片、单次请求最多等 10 分钟、失败最多尝试 2 次。素材编号、转写选择和官方上传流程保留，原插件不动。大文件单独传。粗剪前的 setup 会自动准备；漏跑 setup 时上传入口也会自行准备。用户不用复制脚本、改参数或另外拿一份文档。未知插件版本由 Agent 检查，不擅自套补丁或退回旧入口死循环。

This is a version-bound reliability fix, not unlimited waiting or a cure for offline/auth/permission/storage failures. The 600-second value is this helper's ceiling; lower transport/service limits can still fail earlier. See [compatibility governance](governance-chatcut-upload-compat.json) for the fixed scope and [profile](chatcut-upload-profile.json) for exact values. / 这次确实有可执行修复；断网、登录失效、权限或存储不足仍要按实际原因处理，其他网络层也可能先报错，不能承诺任意网络永远成功。

## Identify the actual failure / 先分清卡在哪里

Record locally: active host surface and plugin/helper revision, source size/duration, prepared upload size when reported, asset state, failed operation, progress and exact error. Read available local files and logs before asking the user. Keep tokens, signed URLs, account/project IDs and private paths out of public reports and Git.

Agent 在单片工程记录实际宿主、插件/脚本版本、原片大小与时长、已报告的待上传文件大小、素材状态、失败步骤、进度和原始报错。优先读取本机日志，不让用户抄一遍。凭据、签名网址、账号/工程编号和私人路径不得进入公共报告或 Git。

| Evidence / 证据 | Meaning and action / 判断与动作 |
|---|---|
| Host command returns a running session / 命令返回仍在运行的会话 | Continue that foreground session; a short tool polling interval is not an upload limit. Do not launch another helper. / 继续读取同一会话；工具暂时返回不等于上传失败，不另开一份上传。 |
| `request timed out after 120s`, especially `multipart upload … part …` | A request attempt exceeded the helper's wall-clock limit. It is not a two-minute video-duration limit. Preserve the failed part/operation and completed progress. / 某次请求超过脚本等待时间，不是视频不能超过两分钟；记录失败分片和已完成进度。 |
| Media probe, loudness scan or conversion error / 探测、响度分析或转换报错 | Diagnose the named local operation and its own timeout; increasing upload wait cannot fix it. / 按实际步骤排查，延长上传等待不能修好本地转换。 |
| HTTP authentication, expiry, rate, storage or format error / 登录、过期、限流、存储或格式错误 | Follow the structured error and current official guidance; do not assume every failure is slow bandwidth. / 按真实错误处理，不能一律归因网速。 |
| Asset/timeline exists but media is pending / 素材卡和时间线已有，媒体未完成 | Registration is not uploaded-byte readiness or successful playback. / 建立了引用不等于上传完成，也不等于已经能播放。 |

Checked 2026-09-06: official Agent Plugin `0.2.26`, revision `a7b75b22e8d26a91ecaf02c67b9d20fd02006ab8`, sets `UPLOAD_RETRY_ATTEMPT_TIMEOUT_MS = 120_000` and `UPLOAD_RETRY_MAX_ATTEMPTS = 5`. Its multipart loop signs batches of 32 and starts up to 32 part PUTs concurrently **per file**; up to four files can run together. The server supplies part sizes. These are implementation facts at this revision, not a claim that concurrency caused a particular user's failure. Check the actual target revision before applying them.

上述是未适配官方版本的实现，不是本 Skill 入口采用的参数。慢上行、链路不稳定或并发争用可能触发旧超时，具体原因仍看目标机器日志。官方没有公开的上传超时或分片并发参数，因此本 Skill 使用经过完整哈希校验的固定适配；另一个同为 120 秒的响度分析计时器保持原样。总上传耗时超过 120 秒不一定失败，只要每次请求在限时内完成即可。只延长 Codex 工具等待不会改变内部计时器。

## Bounded hosted recovery / 网页插件的有限恢复

1. Follow the active hosted plugin's `asset-import` and `known-errors` flow, using the automatic compatibility entry above for execution. Query existing assets first. Keep one invocation active and read its foreground output through completion. Run a large failed file alone to avoid competing file uploads.
2. Preserve the current timeline/version and source map before repair. After failure, query asset state again. Reuse completed assets. When structured `retry` is returned, obtain the requested fresh session and pass the retry arguments through **the same Skill upload entry**, preserving the pending asset ID and transcription choice. The compatibility copy fixes the upstream hint's missing `--no-transcribe`. Never invent an asset ID, backend API or upload endpoint. Same-asset recovery is not proof of resumable part/byte transfer across sessions.
3. A fresh session can fix expired credentials; the compatibility profile addresses the old request timer/concurrency. Respect its two-attempt bound. If the same failure recurs after one justified recovery with changed conditions, stop automatic relaunches and use supported editor recovery. Do not rebuild the project, reimport completed clips or stack background uploads.
4. On the existing asset card, use the supported **Retry Upload**, **Grant file access** or **Relink File** action matching its actual state. Relink selects the matching original and preserves the existing reference; it is not permission to substitute an arbitrary compressed file. Agent uses official tools/UI where available. If the host cannot perform a file picker or permission grant, give the user that one exact action and continue afterward. A UI retry is an alternative official path, not a guarantee of upload success.
5. If the valid upload still fails, preserve a compact, redacted incident record and the edit. Prepare an official support report describing version, time, failed step and observed retries. Sending it externally requires the user's authorization. Do not claim a support report or an untested workaround fixed the affected computer.

Agent 先查已有素材，等当前上传结束；失败后按官方 `retry` 给的新会话和原素材编号，再经本 Skill 入口恢复。成功素材和已有剪辑不重建，用户关闭的云端转写不重开。适配后仍反复失败则停止重开，按素材卡状态使用官方“重试上传／授予文件访问权限／重新关联”，选择原文件；仍失败再考虑下方本地媒体路线。只有真正无法代办的文件授权交给用户，不能一直显示“马上完成”。

These alternatives address technical failures, not denied permission. If host policy denies transfer or another required action, stop that action and state the actual denial; do not use another upload path or local editing to bypass it. / 以上替代路线只处理技术故障；宿主拒绝传输或权限时，明确说明拒绝原因，不能换上传渠道或本地编辑来绕过。

## Large local recordings / 大型本地原片

When the source is local and cloud transfer blocks editing, prefer an **already connected ChatCut Desktop local-media surface** when it supports this project. Desktop can read supported local media for editing and local export before full upload. Its local MCP bridge is separate from the hosted `chatcut` plugin; installing the hosted plugin alone does not install or connect Desktop. Both apps must be on the same computer and Desktop must be open.

If Desktop is not present, treat it as a conditional route, not an already-tested default. Agent checks current official installation, platform, terms and governance, then performs the supported installation/connection work within existing authorization. Do not put routine installation commands on the user. Login, OS permission or a host-required new session may need the user. Do not silently switch a user who explicitly selected Web. Current official downloads list macOS and Windows; do not promise a Linux build. No new Desktop version is adopted merely by reading this guide.

For an existing edit, preserve a named version and export/read back the current timing when available. Open the same account/project in Desktop and repair matching local-source references through its supported UI/tools. Verify project identity, source identity, clip order/count, offsets, duration and opening/middle/ending playback before continuing. Do not promise all hosted effects or an unfinished hosted placeholder transfer automatically. If the source must become a new asset, build and verify a separate working version with an explicit source map rather than overwriting the existing edit.

原片就在电脑上、上传阻塞剪辑时，优先复用已连接且支持本工程的 ChatCut Desktop 本地素材能力。它与网页版插件是两条连接：装了插件不代表装了客户端或接通本地工具。未安装时由 Agent 检查并准备官方安装与连接，真正的登录、系统权限或宿主重载才交给用户；明确指定网页版时不擅自切换。旧工程先保留版本，在同账号同工程重新关联原片，核对素材、剪点、总时长和实际播放后继续。客户端不是全离线，云端转写、生成或协作功能仍可能需要上传。

## Review proxies and finish gates / 轻量审片与完成标准

A small review proxy with source-quality conform is a previously used project workaround. Use it only through a preparation/import route supported by the **active host**. The hosted path retains official helper preparation/upload through the governed compatibility entry. Do not replace it with handwritten FFmpeg/curl/presigned-upload commands, edit plugin cache files or improvise other helper patches. If the host has no supported proxy route, use official editor recovery or the conditional Desktop route above.

When a supported proxy workflow is selected, retain the original, record both hashes and the timing mapping, and validate duration, start offset, rotation, cadence and audio sync at the beginning/middle/end and changed joins. A 30 fps proxy and 60 fps original may map by time; frame numbers cannot be copied between them. Preserve the exact source intervals through [chatcut-handoff.md](chatcut-handoff.md). Build final output from the original or a reviewed source-quality derivative, never by enlarging the proxy. Relinking a different file under the original identity without validating this mapping is unsafe.

以前用过“小文件审剪点、原片出成片”，当前宿主支持才执行。不要为了压小文件替换官方上传流程、修改插件缓存或临时另造补丁；只使用上面固定、可校验的 Skill 适配。支持代理时，Agent 保留原片与时间映射，检查首尾、中段和剪点音画同步；不同帧率按时间换算，最终回原片出片，不放大低清文件冒充原画质。

Continue independent local analysis and permitted timeline metadata edits while transfer is pending. Cloud export and remote frame inspection require confirmed upload readiness; Desktop local playback requires confirmed local access. Rough-cut approval still requires actual end-to-end watching/listening after the last edit. Record **installed**, **connected**, **registered**, **bytes ready**, **playable** and **reviewed** separately. Dependency installation tests, source inspection and documentation review do not establish a successful large-file upload on another computer.

上传期间可继续独立的本地分析和允许的时间线编辑；依赖云端文件的操作必须等上传就绪，本地播放必须确认文件可读。粗剪通过仍要实际完整看听。安装好、连接成功、素材已登记、文件就绪、能播放、已审片分别记录，不能互相冒充。

## Sources and boundary / 来源与边界

- [Official helper at the inspected revision](https://github.com/ChatCut-Inc/agent-plugin/blob/a7b75b22e8d26a91ecaf02c67b9d20fd02006ab8/codex/skills/asset-import/scripts/upload-media.mjs): request timer, retries, part batching and same-asset retry contract. The public repository HEAD matched this revision when checked; no newer helper fix was verified.
- [Official hosted import contract](https://github.com/ChatCut-Inc/agent-plugin/blob/a7b75b22e8d26a91ecaf02c67b9d20fd02006ab8/codex/skills/asset-import/SKILL.md).
- [My Assets: retry and relink](https://chatcut.io/docs/my-assets), [Desktop: local media and local MCP](https://chatcut.io/docs/desktop-app), [workflow failures](https://chatcut.io/docs/workflow-failures).

Validation separates the executable compatibility tests from live cloud/device checks. The integration fixture runs the real original and adapted helpers with anonymous video, controlled loopback HTTP, full-byte/hash/finalization checks, same-asset recovery and preserved transcription choice. It can hold requests for 125 seconds to reproduce the old timer and verify the compatibility entry. This does not test a real ChatCut account/storage service or the affected computer. Exact run results belong in the governance evidence and project state; do not infer success merely because the test script exists.

验证脚本会实际运行原版和适配版助手，用匿名视频及本地 HTTP 测试上传、字节完整性、素材登记和原编号恢复；可让请求持续 125 秒，对照旧超时和新入口。真实 ChatCut 账号、云存储和故障电脑仍是另一项验证。结果看实际运行回执，不能把有测试脚本当作测试已经通过。
