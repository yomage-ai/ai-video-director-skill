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
| Rough / 粗剪 | `setup.mjs --stage rough --apply --codex <bundled-cli>`; ChatCut official plugin, real connection, transcription and listening capability. Then content approval → source transcription/rough edit. No render framework or voice model is required just to inspect the manuscript. / 粗剪前补齐 ChatCut、实际连接和转写，沿用已有内容批准。 |
| Fine / 精剪 | `setup.mjs --stage fine --apply`; governed HyperFrames 0.7.90, missing authoring Skills from its exact Git revision, and `browser ensure`. Setup also lints and renders an anonymous 320×180 composition through that exact CLI and fully decodes the output. Agent binds the real evidence and checks project-specific media/fonts. / 补齐渲染器、创作 Skill 和浏览器，并自动渲染、完整解码小样；Agent 再核对单片素材和字体。 |
| Cutout / 抠像 | Add `--renderer cutout` to fine setup for HyperFrames 0.7.109. Follow the governed `remove-background` command: the first run downloads its checked model, later runs reuse the cache. Moving-matte QA still applies. / 只有选择抠像才下载模型，完整人物边缘验收不能省略。 |
| Remotion shot / Remotion 镜头 | Use the existing project/runtime if compatible. Otherwise Agent prepares a project outside the Skill using governed Remotion 4.0.504 and its matching CLI/renderer packages, resolves exact compatible React dependencies, runs `remotion browser ensure` through that project's installed CLI, then a tiny render. Record versions and the local lockfile. The setup receipt routes this as an Agent action because project-specific dependencies must be resolved in that project. / 只有该镜头需要 Remotion 才在单片工程装匹配版本与浏览器、实测，不为同一镜头同时装两套渲染器做比较。 |
| Optional / 可选 | Voice cloning, generated music, generative video, Docker and other research tools are not default dependencies. Install only for an authorized selected route. ASR normally comes from the active ChatCut host; missing cloud access is not permission to silently select a new provider. / 声音克隆、配乐生成、Docker 等按实际路线准备，不全部预装。 |

The HyperFrames CLI tarball contains only some entry Skills. Setup fetches the remaining required authoring files from the governed repository revision, copies missing folders into the active Codex Skill root and preserves existing ones. Load additional domain references only when needed. Reuse a healthy exact CLI found on PATH, in the local managed runtime or the npm execution cache; having `npx` itself does not pass. An installed different version remains untouched; install the governed version alongside it. Generic upstream “always upgrade” or “update all Skills” guidance does not override this project's version-governance decision. Browser/runtime setup is not approval of a visual style or finished video.

HyperFrames 安装包只带部分入口 Skill，因此还要补齐匹配版本的创作文件。只复制缺少的目录；已有版本保持原样，使用前读取并核对适用性。不能把有 npx 当成渲染器已安装，也不能因为提示新版本就改掉已锁定版本。HyperFrames Doctor 中 Docker、可选 TTS/BGM 或“有更新”的提示不代表当前本地口播渲染缺依赖；按所选路线检查必需项，再实际渲染。

## ChatCut host and sign-in / 宿主和登录

Read the `chatcut` row from the bundled CLI's `mcp list --json` as well as `mcp get`. `not_logged_in` is a concrete authentication result; an installed plugin cannot repair it. Agent runs one login flow, rechecks authentication, then searches the active tools again and performs a read-only call. Tools may become available after login in the same task: request a new task only after re-discovery actually fails. Do not infer a host-reload requirement from missing tools alone.

同时读取宿主 CLI 的 `mcp list --json` 与 `mcp get`。`not_logged_in` 表示未登录，重装插件不能解决。Agent 发起一次登录、复查状态，再重新发现工具并真实只读调用；本任务内可能就能恢复，不能仅因最初没工具就让用户换任务。

### Auditory capability / 听审能力

This package installs editing dependencies; it does **not** bundle or provision an auditory-review model. The current ChatCut inspection contract returns timeline state, frames and transcripts, which do not establish that the calling model receives sound. Before rough execution, Agent must identify a supported real-audio input/reviewer, pass a short speech sample through that exact route, and record what was actually heard. Producing WAV files, showing a player, ASR or waveform analysis cannot fill this check. If no route works, identify that missing capability before rendering and keep production blocked. Do not silently upload private media to a new provider or start a paid service as a substitute. A configured and authorized alternative still needs its own sample test.

本包会准备剪辑依赖，但**没有内置或安装负责听感判断的模型**。当前 ChatCut 检查接口提供时间线、静帧和转写，不能证明调用模型收到了声音。粗剪前 Agent 必须找出本宿主可用的真实音频输入或审听者，用短口播实测并记录实际听到的内容。生成 WAV、展示播放器、转写和波形分析都不能通过此检查。没有可用路线时，应在渲染前明确缺失能力并阻断生产交付；不能暗中新增上传渠道或付费服务。已配置且获授权的替代路线也需要小样验证。

Before selecting the rough-edit host or starting any upload, read [chatcut-media-recovery.md](chatcut-media-recovery.md). Rough setup now automatically prepares the SHA-verified upload compatibility helper. The Agent uses `chatcut-upload.mjs` for actual hosted imports and retries; this entry also prepares it on demand. Reinstalling the original plugin alone does not remove its timeout, install Desktop or establish playback. / 粗剪准备会自动生成经完整校验的上传适配，上传和重试必须走内置 `chatcut-upload.mjs`；该入口也能即时自备，不靠用户另传文档或改参数。重装原插件本身不能代替这项修复，安装也不能冒充实际播放通过。

For Codex desktop, first locate the **CLI bundled with the currently running desktop app**, verify it with `--version`, and pass its absolute path to setup. On macOS inspect the actual app bundle's `Contents/Resources/codex`; do not assume the app name or use a random standalone `codex` from PATH. On Windows locate the installed desktop app/runtime from the host environment and inspect its bundled CLI. The installer uses the official marketplace, reads its assigned name, installs only a missing plugin and then inspects the actual plugin registry and `mcp get chatcut`. It preserves an existing marketplace and never guesses success from its cache folder. Newly acquired plugin code is pinned in [dependencies.json](dependencies.json); a different offered version requires an upstream/governance check before installation.

Next discover the live ChatCut tools and make an actual read-only call. Missing tools can mean unauthenticated or not loaded in this session; do not claim you diagnosed one solely from the other. When authentication is required, Agent runs `<bundled-cli> mcp login chatcut`, tells the user to complete the opened browser sign-in, and keeps only one OAuth flow active. Do not request tokens or passwords in chat. After a successful install/login, if tools still cannot appear in this task, save the current source paths, content decision, setup result and next action in the video project. Explain that a new session is required by the host's plugin loading; supply a short continuation request. Do not create a new task unless the user requested one, and do not promise the current session can hot-load tools.

For an already callable ChatCut Desktop surface, reuse that surface and its own instructions; do not install a second hosted editor. A hosted plugin does not require installing the separate ChatCut Desktop app. In another supported local agent, use that host's current official ChatCut installer instead of invoking Codex's CLI. In an isolated cloud/web task, local desktop installation is not possible: keep the prepared handoff and explain this exact limitation. Installation itself uploads no footage; preserve the existing media-upload, rights and cost authorization before actual transcription/editing.

Codex 桌面版由 Agent 找到当前应用内置的 CLI 并安装官方插件；已有插件不重装。随后必须真实调用一次只读工具。需要登录时，Agent 打开登录流程，用户只完成浏览器登录授权；不要让用户复制密钥。新插件未能进入当前任务时，保存素材路径、分析与进度，再明确提示开新任务续接，这是宿主限制。已在 ChatCut Desktop 内可正常调用时直接复用；网页版插件不要求额外安装 Desktop 客户端。其他 Agent 使用对应官方安装方式，云端隔离任务不能冒充安装到了用户电脑。

## Native-tool recovery / 原生工具补齐

If a package manager is absent, this is **an Agent setup step**, not a default user chore:

- macOS: reuse a working Homebrew or verified host-bundled tools. Otherwise inspect the current [official Homebrew installer](https://brew.sh/) and let the Agent run it. If Xcode Command Line Tools or an administrator confirmation is actually required, ask for that specific OS action and resume `brew install ffmpeg git` after it completes. Do not prompt for Git installation merely because Xcode's placeholder command exists; verify the actual command.
- Windows: reuse verified host Git and WinGet. If WinGet is absent, Agent follows Microsoft's [App Installer setup](https://learn.microsoft.com/windows/package-manager/winget/). User involvement is only for a Store/system restriction or administrator confirmation. Install `Gyan.FFmpeg` and `Git.Git` only when missing. Re-resolve newly installed executable paths; an existing shell's PATH may be stale. Setup checks WinGet links and FFmpeg's package bin folders without rewriting the user's PATH.
- Linux: Debian/Ubuntu apt is automated when root or existing noninteractive sudo authorization permits it. If permission is denied, state the precise action needed. Other distributions use their official FFmpeg/Git packages after Agent checks the package names and build capabilities.
- Network or disk failures: diagnose the actual error, reuse the user's already configured network, and resume the missing package. Do not spray guessed proxy ports, remove arbitrary caches or tell the user to reinstall everything. A checksum mismatch must block execution.

缺包管理器也由 Agent 接着处理。macOS 安装 Homebrew 时可能需要系统确认，Windows 的应用安装器可能受商店或管理员策略限制；只把这种实际无法代办的一步交给用户。网络、磁盘、PATH 或下载损坏由 Agent 排查，不能让用户重装所有工具，也不能未校验就运行下载文件。

## Sources and validation boundary / 来源与验证范围

Installation commands were checked on 2026-09-06 against [ChatCut's official installer](https://chatcut.io/chatgpt), [plugin lifecycle documentation](https://chatcut.io/docs/agent-plugin), [HyperFrames CLI documentation](https://github.com/heygen-com/hyperframes/blob/1e51eaec2cb6c058fbb5349c8c3dae9770d7f30c/docs/packages/cli.mdx), [Node downloads](https://nodejs.org/en/download) and [FFmpeg downloads](https://ffmpeg.org/download.html). Governance is recorded in [governance-dependency-setup.json](governance-dependency-setup.json). Ordinary install permission does not approve cloud spending, new voice identity use or publishing.

macOS has local execution evidence; Windows/Linux acquisition routes require their own target-device validation. Command-planning tests do not prove those devices were tested. Fresh accounts still require their owner's login, and every new machine still needs its first real media smoke check. / macOS 有本机执行证据；Windows、Linux 仍需目标机器实测。命令规划测试不能冒充跨平台实测，安装依赖也不能冒充实际成片验收。
