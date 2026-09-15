# Dependency Setup / 依赖准备

## Agent contract / Agent 执行约定

Installing a Skill normally copies instructions and files; it does not guarantee a post-install hook, tool installation, authentication or live tool discovery. This Skill's `director.mjs install-skill` also runs intake setup, but other Skill installers may only copy the folder. **Always ensure dependencies on first use.** Reuse the environment receipt only while its paths, versions and selected workflow remain unchanged.

安装 Skill 通常只是复制文件，不能假设安装器会连带安装软件。本仓库的 `install-skill` 会准备基础依赖，其他安装器可能只复制 Skill 文件夹，所以首次使用仍由 Agent 检查并补齐。用户只交素材和任务；不要把技术安装命令当作用户的默认步骤。

1. Resolve the Skill's real directory. On macOS/Linux run `sh scripts/bootstrap.sh --stage intake --apply`; on Windows invoke `scripts/bootstrap.ps1 --stage intake --apply` with PowerShell. Paths below are relative to that real directory. The wrappers reuse Node >=22 (including an available host runtime), otherwise acquire Node 22.23.2 from nodejs.org and verify the bundled SHA-256 before extraction. They keep it under the local data directory and never replace the system Node. An incomplete Node/npm distribution can be bypassed with `--fresh-node` as the first wrapper argument. Do not weaken a machine execution policy; resolve a permission refusal with the user only when it actually occurs.
2. Continue using the returned Node executable and PATH directories. `setup.mjs` installs the exact XML parser with the **Skill-local** lockfile, so copying only this Skill works. It reuses working FFmpeg/ffprobe/Git and uses Homebrew, WinGet or Debian/Ubuntu apt for missing native tools. It does not upgrade existing healthy tools. Installation logs go to stderr; JSON and a unique local receipt record the result.
3. `--apply` authorizes the routine dependency work in this workflow; without it `setup.mjs` and the wrappers check only. Process a failed result and every `agentActions` entry yourself. A diagnostic result is not completion. Repair the concrete cause once, retry that step, and stop repeating an identical failure without new evidence. Preserve partial downloads/installation logs as indicated; never delete unrelated tool directories or replace an existing Skill silently.
4. Separate **files installed**, **login**, **tools visible in this session**, and **real media execution**. `localReady` covers the selected setup checks only; `operationalReady` deliberately stays false. Run the real capability checks in [execution-and-evidence.md](execution-and-evidence.md); do not relabel setup rows as passed production capabilities.

以上入口由 Agent 运行：先复用 Node 22+；确实缺少才下载固定版本并校验。脚本依赖清单随 Skill 携带，不依赖仓库根目录。FFmpeg、ffprobe、Git 已有则复用，缺少走对应系统的包管理器。Agent 继续处理失败原因和待办，不能给用户一份“缺这些工具”的报告就结束。安装、登录、当前任务能否调用、实际执行成功必须分别核对。

## Prepare only the next stage / 按阶段准备

| Stage / 阶段 | Agent prepares / Agent 准备 |
|---|---|
| Intake / 首份分析 | Node/npm, XML parser, FFmpeg and ffprobe. Inspect the local recording and manuscript. While a slow prerequisite is being repaired, a reliable manuscript can support a clearly scoped preliminary content card; do not imply the unheard recording was checked. / 先准备轻量基础工具；可靠稿件可先出明确范围的初步分析，不能假装已听原片。 |
| Rough / 粗剪 | `setup.mjs --stage rough --apply --codex <bundled-cli>`; ChatCut hosted MCP registration, real connection, transcription and listening capability. Then content approval → source transcription/rough edit. No render framework or voice model is required just to inspect the manuscript. / 粗剪前补齐 ChatCut 官方连接和转写，沿用已有内容批准。 |
| Fine / 精剪 | `setup.mjs --stage fine --apply`; governed HyperFrames 0.7.90, missing authoring Skills from its exact Git revision, and `browser ensure`. Setup also lints and renders an anonymous 320×180 composition through that exact CLI and fully decodes the output. Agent binds the real evidence and checks project-specific media/fonts. / 补齐渲染器、创作 Skill 和浏览器，并自动渲染、完整解码小样；Agent 再核对单片素材和字体。 |
| Cutout / 抠像 | Add `--renderer cutout` to fine setup for HyperFrames 0.7.109. Follow the governed `remove-background` command: the first run downloads its checked model, later runs reuse the cache. Moving-matte QA still applies. / 只有选择抠像才下载模型，完整人物边缘验收不能省略。 |
| Remotion shot / Remotion 镜头 | Use the existing project/runtime if compatible. Otherwise Agent prepares a project outside the Skill using governed Remotion 4.0.504 and its matching CLI/renderer packages, resolves exact compatible React dependencies, runs `remotion browser ensure` through that project's installed CLI, then a tiny render. Record versions and the local lockfile. The setup receipt routes this as an Agent action because project-specific dependencies must be resolved in that project. / 只有该镜头需要 Remotion 才在单片工程装匹配版本与浏览器、实测，不为同一镜头同时装两套渲染器做比较。 |
| Optional / 可选 | Voice cloning, generated music, generative video, Docker and other research tools are not default dependencies. Install only for an authorized selected route. ASR normally comes from the active ChatCut host; missing cloud access is not permission to silently select a new provider. / 声音克隆、配乐生成、Docker 等按实际路线准备，不全部预装。 |

The HyperFrames CLI tarball contains only some entry Skills. Setup fetches the remaining required authoring files from the governed repository revision, copies missing folders into the active Codex Skill root and preserves existing ones. Load additional domain references only when needed. Reuse a healthy exact CLI found on PATH, in the local managed runtime or the npm execution cache; having `npx` itself does not pass. An installed different version remains untouched; install the governed version alongside it. Generic upstream “always upgrade” or “update all Skills” guidance does not override this project's version-governance decision. Browser/runtime setup is not approval of a visual style or finished video.

HyperFrames 安装包只带部分入口 Skill，因此还要补齐匹配版本的创作文件。只复制缺少的目录；已有版本保持原样，使用前读取并核对适用性。不能把有 npx 当成渲染器已安装，也不能因为提示新版本就改掉已锁定版本。HyperFrames Doctor 中 Docker、可选 TTS/BGM 或“有更新”的提示不代表当前本地口播渲染缺依赖；按所选路线检查必需项，再实际渲染。

## ChatCut host and sign-in / 宿主和登录

Setup checks the existing hosted MCP registration first. It does not require, install, downgrade or update a ChatCut plugin to obtain the server. A missing registration is added through the current bundled CLI using the official URL/OAuth resource in `dependencies.json`; only the newly created registration receives the required surface header, with a private config backup. Existing registrations and disabled choices remain untouched. Plugin-registry failure is not permission to create a duplicate connection. When the active official adapter specifies different connection values, use those and record the actual contract before changing setup.

先复用现有官方 MCP 连接，插件版本不再是接入条件。缺少连接时 Agent 自动注册官方服务，为本次新建连接补齐必要标识并备份配置；已有连接与明确禁用决定保留。无需为此安装、重装或降级插件。注册表不可读时先修读取问题，不能猜成“未安装”。当前官方适配器明确给出新连接参数时，Agent 先核对并更新合同。

The upload wrapper is self-contained even when no plugin folder exists: omit `--helper` to acquire the governed official helper. Reviewed installed helpers are reused; unreviewed helpers remain untouched while an independently hash-verified official copy is acquired outside the Skill. Reuse that cache offline. Downloads have a size cap, 30-second attempt limit and two attempts; integrity failures never execute downloaded bytes. This isolates local version drift, not future service API changes. Verify current session arguments and real media readiness separately.

无插件目录时上传入口也能自行获取官方工具；省略 `--helper` 即可。已验证版本直接复用，未知版本保留原样，自动下载独立的官方固定版本并核对完整哈希，后续可离线复用缓存。下载有体积、单次 30 秒和最多两次限制，校验失败不执行。这个机制处理本地版本差异，不能保证未来服务接口任意变更后仍兼容；实际上传仍核对当前会话参数与素材状态。


Read the `chatcut` row from the bundled CLI's `mcp list --json` as well as `mcp get`. `not_logged_in` is a concrete authentication result; an installed plugin cannot repair it. Tell the user why sign-in/consent is required, open the official flow once, and let the user perform any required account action. Recheck authentication, search the active tools again and perform a read-only call. Tools may become available in the same task: request a new task only after re-discovery fails. Record an unresolved blocker while waiting, and preserve the chosen route instead of falling back to a different editor/model.

同时读取宿主 CLI 的 `mcp list --json` 与 `mcp get`。`not_logged_in` 表示未登录，重装不能解决。向用户说明登录/授权原因，打开一次官方流程，由用户完成需要其身份的操作；随后复查状态、发现工具并真实只读调用。等待时记录阻塞，不能改用其他编辑器或模型绕过。本任务可能就能恢复，不因最初没工具就要求换任务。

### Creator feedback / 创作者反馈

No listening model is an editing dependency. Do not propose, install or test Qwen audio understanding, GPT-Audio-1.5 or a replacement. Agent completes the existing technical/content checks, delivers the rough cut and receives creator feedback. Follow [creator-feedback-review.md](creator-feedback-review.md).

听审模型不是剪辑依赖。不再提议、安装或测试千问、GPT-Audio-1.5 或替代方案。Agent 按既有规范检查并交付粗剪，用户反馈后继续；不能因缺少音频模型暂停。
