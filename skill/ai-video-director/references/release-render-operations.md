# Release Render Operations / 发布渲染运行规范

Read this reference before a multi-minute 4K, HDR, alpha-heavy, or otherwise memory-intensive release render, and after any renderer crash, operating-system kill, or out-of-memory failure.

在多分钟 4K、HDR、大量透明层或其他高内存发布渲染前读取；渲染器崩溃、系统强杀或内存耗尽后也必须读取。

## English

### Preflight the actual workload

Record the renderer and exact version, composition duration and frame count, output pixels and cadence, source-media decode sizes, alpha and image-heavy layers, intermediate frame format, worker count, streaming or buffered mode, encoder settings, available memory, available disk, and every other heavy task currently running. A successful 1080 review render is not evidence that the same concurrency is safe at 4K.

Render one short sample at the exact release resolution before the full job. Inspect decoded pixels, audio, memory trend, and temporary-disk growth. Use this sample to choose the full-run mode; do not infer resource safety from authoring checks alone.

### Apply an approved host profile first

Before choosing concurrency, load the private base profile and look for an explicitly user-approved render-operations preset. Apply it only when the current renderer, operating system and architecture, installed memory, output class, and workload are within the recorded scope. A matching preset overrides the generic one-worker starting point below, but it does not override release resolution, cadence, quality, the one-heavy-job rule, exact-resolution preflight, monitoring, or stop conditions.

Execute a matching preset as one bundle. Worker count, automatic/intermediate frame mode, temporary pause and later restoration of nonessential heavy background work, and the memory circuit breaker belong together. Do not copy only a faster worker count while leaving the conflicting background workload active or disabling the guard.

### Conservative first full run

- Run only one heavy release render at a time.
- For multi-minute 4K, use a matching explicitly approved host profile when one exists. Otherwise begin with the renderer's supported streaming or low-memory path, automatic/intermediate frame selection, and one worker until measured headroom proves that more concurrency is safe.
- Treat flags such as HyperFrames `--low-memory-mode`, `--workers 1`, and `--video-frame-format auto` as version-specific examples, not universal commands. Confirm them against the pinned renderer version.
- Do not solve system-wide memory pressure by only increasing `NODE_OPTIONS` or the JavaScript heap. A larger process heap can worsen operating-system pressure when frame buffers, browser workers, decoders, and encoders live outside that heap.
- Do not start the same render through `nohup`, `screen`, an unattended background retry, or parallel shells after a resource failure. Keep one observable foreground job or one explicitly managed session.

### Memory circuit breaker

For a host-profile render, run the renderer through `scripts/run-memory-guarded.mjs` or an equivalent observable guard. Record the baseline and sample system memory pressure, swap growth, compressed memory where available, and aggregate RSS for the complete render process tree. Require consecutive violating samples before a normal trip so one short spike does not discard useful work. When the profile's limit is crossed, stop the complete render process tree before the operating system becomes unresponsive, preserve the guard log and renderer log, and classify the failure before retrying. A retry may fall back to one worker or low-memory mode; it may not silently repeat the same unsafe command.

The circuit breaker protects resource availability, not visual quality. Keep the approved output resolution, frame rate, bitrate or quality target, color mode, and audio settings unchanged unless the user separately approves a delivery change.

### Failure stop condition

After an out-of-memory error, operating-system kill, renderer crash, or repeated stall:

1. Stop the failed process and confirm that no old worker remains.
2. Preserve the command, renderer version, logs, work directory, last completed frame, peak-resource evidence when available, and incomplete output.
3. Classify the failure before retrying. Change the resource strategy: lower concurrency, enable streaming/low-memory mode, select a lighter intermediate frame format, pause other heavy tasks, or split the composition when the renderer requires it.
4. Do not repeat the same command more than once without a material change supported by the failure evidence.
5. If the safer mode also fails, stop and report the blocker instead of creating an unattended retry loop.

### Avoid unnecessary visual rerenders

When the exact approved video already passes and only loudness, audio identity, or another audio-only parameter changes, prefer stream-copying the approved video and re-encoding or remuxing only audio when container, codec, duration, and synchronization permit. Recheck duration, sync, integrated loudness, true peak, and full decode. Do not spend another full visual render merely to change audio.

### Completion evidence

The render is not complete at encoder exit. Probe and fully decode the exact file, verify expected frame count and duration, scan for black, blank, frozen, or missing ranges, listen through dialogue and critical cues, inspect representative and boundary frames at release pixels, and record the resource-safe reproducible command.

## 简体中文

### 先预检真实负载

记录渲染器及精确版本、时长与总帧数、输出尺寸与帧率、源视频解码尺寸、透明层和图片密度、中间帧格式、worker 数、流式或缓存模式、编码参数、可用内存、可用磁盘，以及同时运行的其他重任务。1080 审片版成功，不代表同样并发参数在 4K 也安全。

完整渲染前，先用真实发布分辨率做一段短样片，检查解码画面、声音、内存趋势和临时磁盘增长，再决定完整任务参数。不能只凭代码检查通过就判断资源安全。

### 优先应用已确认的主机配置

选择并发前，先读取私人基础画像，查找用户明确确认过的渲染运行配置。只有当前渲染器、操作系统与架构、安装内存、输出类型和任务负载都落在记录范围内时，才能使用。匹配的配置可以覆盖下面“先从单 worker 开始”的通用兜底，但不能覆盖发布分辨率、帧率、画质、同一时间只跑一个重任务、真实分辨率预检、持续监控和停止条件。

匹配配置必须整套执行。worker 数、自动或中间帧模式、暂时停止并在渲染后恢复非必要后台重任务，以及内存熔断保护属于同一个方案。不能只拿更快的 worker 数，同时放任冲突的后台任务继续运行或关闭保护。

### 第一次完整渲染要保守

- 同一时间只运行一个重型发布渲染。
- 多分钟 4K 存在匹配且由用户明确确认的主机配置时，优先使用该配置；没有匹配配置时，再从当前版本支持的流式或低内存路径、自动或更轻的中间帧格式和单 worker 开始，只有测得足够余量后才增加并发。
- HyperFrames 的 `--low-memory-mode`、`--workers 1`、`--video-frame-format auto` 只是版本相关示例，必须按项目锁定的版本确认，不能复制成所有渲染器的万能命令。
- 不能只把 `NODE_OPTIONS` 或 JavaScript 堆从 4GB 提到 16GB、20GB 来解决整机内存压力。浏览器 worker、帧缓存、解码器和编码器可能不在这块堆里，更大的进程堆反而会放大系统压力。
- 资源失败以后，不得用 `nohup`、`screen`、无人值守后台任务或多个终端重复启动同一渲染。只保留一个可观察的前台任务或一个明确管理的会话。

### 内存熔断保护

使用主机配置渲染时，通过 `scripts/run-memory-guarded.mjs` 或同等可观察保护启动渲染器。先记录基线，再持续采样整机内存压力、Swap 增量、可获取时的压缩内存，以及整个渲染进程树的 RSS。普通熔断应要求连续多次越线，避免一次短峰值浪费已完成进度。达到配置阈值后，在系统失去响应前停止完整渲染进程树，保留保护日志和渲染日志，分类原因后再决定是否降到单 worker 或低内存模式；不能静默重复同一条不安全命令。

熔断保护只管理资源，不改变画质。除非用户另外批准交付规格变化，否则发布分辨率、帧率、码率或画质目标、色彩模式和音频设置都保持不变。

### 失败后的停止条件

发生内存耗尽、系统强杀、渲染器崩溃或反复卡住时：

1. 停止失败进程，并确认旧 worker 没有残留。
2. 保留命令、版本、日志、工作目录、最后完成帧、可获得的峰值资源证据和未完成输出。
3. 先分类原因再重试，必须实质改变资源策略，例如降并发、开启流式/低内存模式、换更轻中间帧格式、暂停其他重任务，或在渲染器确实需要时拆段。
4. 没有证据支持的实质变化，同一命令最多尝试一次，不得盲目循环。
5. 更安全的模式仍失败时，停止并报告阻塞，不创建无人值守重试循环。

### 不做没必要的全片重渲染

精确已确认的视频已经通过，只修改响度、音频身份或其他纯声音参数时，只要容器、编码、时长和同步允许，优先复制已确认视频流，仅重新编码或封装音频。之后重新检查时长、同步、综合响度、真峰值和完整解码，不要为一次纯声音改动再跑一遍完整视觉渲染。

### 完成证据

编码器退出不等于完成。必须探测并完整解码精确交付文件，核对帧数与时长，扫描黑帧、空白、冻结和缺段，完整听审对白与关键音效，在发布像素下检查代表帧和边界帧，并记录可以安全复现的最终命令。
