# RMCU Semantic Progress

[English](#english) | [简体中文](#简体中文)

## English

`rmcu.semantic-progress.v1` is the repository-owned, non-personal component contract for burned-in semantic chapter progress. RMCU means Reusable Motion Component Unit. It defines behavior and verification independently of one creator, project, editor timeline, or identity asset.

When this component is used inside a 9:16 talking-head composition, also read [portrait-talking-head-safe-layout.md](portrait-talking-head-safe-layout.md) for the approved combined caption/progress reference and multi-device semantic-safe rules.

### Shared Contract

- Accept an ordered list of two to seven approved chapters with `label`, `startFrame`, and `endFrameExclusive`. Use one unsegmented bar when meaningful chapters do not exist.
- Compute segment widths from real chapter duration. Drive fill, active state, and playhead from the local timeline frame; never divide the canvas into equal decorative slices.
- Keep labels on one line. Past and future labels remain static and use an ellipsis only when they overflow their own segment.
- Only the active label may move. Start a deterministic loop marquee only when the measured or conservatively estimated text width exceeds the available label viewport. Reset its local clock at the chapter boundary, hold before motion, move at constant speed, and repeat with a readable gap. Do not animate text that already fits.
- Preserve one stable layout box. Label changes, ellipsis, active weight, and marquee motion must not resize the component or shift neighboring content.
- Apply the same visual grammar and overflow behavior in landscape and portrait. Orientation may change placement, scale, and safe-area geometry, but not chapter behavior or decorative structure.
- Use two clean lanes in both variants: one uninterrupted progress track with no chapter ticks, then one label row with dividers only between adjacent chapter segments. Do not add leading dashes, per-label status marks, chapter numbers, active-segment panels, or duplicate separators by default.
- Let the neutral contrast surface bleed to both composition edges, but treat the progress track, playhead, duration-proportional label rail, and dividers as semantic foreground. Give those foreground rails one shared horizontal safe inset derived from the actual published player fit and crop; do not assume the composition edge is visible.
- For a `cover` player, compute `coverScale = max(playerWidth / canvasWidth, playerHeight / canvasHeight)`, `visibleCompositionWidth = playerWidth / coverScale`, and `horizontalCropPerSide = max(0, (canvasWidth - visibleCompositionWidth) / 2)`. Use a semantic inset of at least `horizontalCropPerSide + desiredVisibleMargin / coverScale`. Zero inset is allowed only when the target published player proves that it does not crop the foreground horizontally.
- Keep the playhead body inside the same semantic-safe rail by clamping the marker itself. The outer surface may remain full bleed; never confuse a full-width background with permission to place readable information at a cropped edge.
- Use a neutral playhead by default. Creator characters, logos, or personal-IP markers are optional adapters and never part of the repository default.
- Treat the overlay as visual orientation only. Seeking remains the platform player's responsibility.

### Landscape Variant

- Use a compact top rail on a 16:9 canvas. The contrast surface may remain full width; the track and semantic label row share the measured player-safe inset, with dividers only in the label row.
- Clip every label to its segment. Inactive overflow uses an ellipsis; active overflow uses the shared loop-marquee rule inside that same segment.
- Keep the rail close to the top edge of the horizontal program. Landscape playback commonly uses `contain` and therefore may not reproduce portrait left/right crop, but any `cover`, zoom, embedded-player, or vertical-platform presentation can crop another axis. Validate the actual player instead of assuming orientation makes the edges safe.

### Portrait Variant

- Use a platform-validated top-safe band when bottom descriptions or controls obscure semantic labels.
- Split the band into two lanes: a noncritical marker/track lane above and a semantic label lane below. Platform search chrome may overlap the noncritical lane only when the labels remain fully readable.
- Keep the component compact. Its contrast surface may remain full width, while the foreground rail uses the measured player-safe inset. Reflow nearby headings, evidence, and picture-in-picture instead of allowing them to sit under the semantic lane.
- Do not add a walking mascot by default. A neutral playhead preserves reuse across finance, tutorials, product explainers, and other speech-led formats.

### ChatCut Authoring

- Store this contract, the reusable parameter template, and tests in the Skill repository. Pass executable Motion Graphic JSX inline to ChatCut tools; do not stage JSX in repository files, temporary files, local servers, or guessed backend workspaces.
- Keep labels, chapter boundaries, colors, font, and motion parameters editable. Use the renderer-supported canonical `Noto Sans SC` family for neutral Simplified Chinese utility text unless the approved design specifies another licensed catalog font.
- Give the overlay a natural asset box and place it at explicit timeline geometry. Re-read the asset and item after mutation.

### Verification

- Render early, middle, late, every chapter boundary, the longest inactive label, the active marquee before motion, during motion, at its wrap point, and after a seek/re-render.
- Check A-roll, bright B-roll, dark B-roll, native size, phone size, the actual platform UI, full-bleed surface alignment, semantic-rail inset, stable segment geometry, monotonic playhead motion, and collisions with captions, headings, evidence, and picture-in-picture. Before publication, simulate the target player's `contain` or `cover` viewport; after publication, replace the assumption with a real target-device screenshot.
- Preserve the previous timeline or another reversible baseline until the user approves the new component.

## 简体中文

`rmcu.semantic-progress.v1` 是仓库级、非个人化的烧录式语义章节进度组件契约。RMCU 指 Reusable Motion Component Unit（可复用动效组件单元）。它只定义通用行为与验收方法，不绑定某位创作者、某条视频、某个剪辑时间线或个人形象资产。

当该组件用于 9:16 真人口播联合版式时，还要读取 [portrait-talking-head-safe-layout.md](portrait-talking-head-safe-layout.md)，使用其中已确认的字幕/进度条参考基线和多设备语义安全规则。

### 通用契约

- 接收两个至七个已确认章节，每章包含 `label`、`startFrame` 和 `endFrameExclusive`；没有真实多章节结构时退化为一条无分段进度条。
- 按章节真实时长计算分段宽度，并用本地时间线帧驱动填充、当前状态和播放头；不得为了装饰平均分段。
- 标题固定单行。过去和未来章节保持静止，仅在超出各自分段宽度时显示省略号。
- 只有当前章节标题可以移动，而且只有溢出时才启动确定性的循环滚动。进入章节后先停留，再匀速滚动，并以清晰间距循环；章节切换时重置局部时钟，能够完整显示的标题不得滚动。
- 组件外框和各分段尺寸始终稳定。文字切换、省略号、当前字重和滚动都不能推挤相邻内容。
- 横屏与竖屏必须使用同一套视觉语法和溢出行为。方向只允许改变摆放、安全区和缩放，不得改变章节行为或装饰结构。
- 两种方向都采用干净的双层结构：上层是一条没有章节刻度的连续进度轨道，下层是只在相邻章节之间保留分隔线的标题行。默认不添加标题开头短横杠、逐项状态标记、章节编号、当前区块底色或重复分隔。
- 中性对比底带可以铺满画面左右边缘，但进度轨道、播放头、按时长分段的标题栏和分隔线都属于语义前景。它们必须共用一个根据真实发布播放器适配与裁切计算出的水平安全内边距，不能默认认为合成画布边缘一定可见。
- 对采用 `cover` 的播放器，计算 `coverScale = max(playerWidth / canvasWidth, playerHeight / canvasHeight)`、`visibleCompositionWidth = playerWidth / coverScale` 和 `horizontalCropPerSide = max(0, (canvasWidth - visibleCompositionWidth) / 2)`；语义内边距至少为 `horizontalCropPerSide + desiredVisibleMargin / coverScale`。只有真实发布播放器证明不会横向裁切语义前景时，才允许使用零内边距。
- 播放头本体要钳制在同一条语义安全轨道内。外层底带可以满宽，但不能把“背景铺满”误当成“可读信息可以顶到被裁切的画布边缘”。
- 默认使用中性播放头。人物、Logo 或个人 IP 标记只能作为可选适配层，不能进入仓库默认组件。
- 该图层只负责视觉导航，实际拖动仍由平台播放器完成。

### 横屏版本

- 在 16:9 画面顶部使用紧凑导航条；对比底带可以满宽，进度轨道与语义标题行则共用实测播放器安全内边距，分隔线只出现在标题行。
- 每个标题都裁切在自身分段内；未激活标题溢出时省略，当前标题溢出时在自身分段内循环滚动。
- 横屏播放通常采用 `contain`，不一定复现竖屏的左右裁切；但任何 `cover`、放大、嵌入式播放器或横屏嵌入竖屏平台的呈现，都可能裁掉其他方向。必须复核真实播放器，不能因为横屏方向就默认边缘安全。

### 竖屏版本

- 当底部说明和控件遮挡章节文字时，使用经过平台验证的顶部安全带。
- 顶部安全带分为两层：上层放非关键信息的轨道与播放头，下层放必须完整可读的章节语义。只有在标题完全不受影响时，平台搜索框才可以覆盖上层的一部分。
- 组件保持紧凑；对比底带可以满宽，语义前景轨道使用实测播放器安全内边距。附近标题、证据卡和人物画中画必须绕开语义层，不能压在其下方。
- 默认不加入走路小人；中性播放头更适合金融、教程、产品讲解等不同口播类型。

### ChatCut 编写规则

- Skill 仓库保存本契约、通用参数模板和测试。可执行 Motion Graphic JSX 必须直接内联传给 ChatCut 工具，不得写入仓库文件、临时文件、本地服务器或猜测的后端工作区。
- 章节文字、边界、颜色、字体和动效参数保持可编辑。中性简体中文功能文字默认使用渲染器支持的规范名称 `Noto Sans SC`，除非已确认其他有授权的目录字体。
- 叠加组件使用自然尺寸资源框，并在时间线上明确设置几何位置。修改后必须重新读取资产和项目项。

### 验证要求

- 检查开头、中段、结尾、每个章节边界、最长未激活标题，以及当前滚动标题的停留、滚动、循环接点和跳转后重渲染。
- 覆盖真人画面、亮色 B-roll、暗色 B-roll、原始尺寸、手机缩略尺寸、真实平台 UI、满宽底带、语义轨道内边距、分段稳定性、播放头单调前进，以及与字幕、标题、证据和人物画中画的碰撞。发布前模拟目标播放器的 `contain` 或 `cover` 视口，发布后用真实目标设备截图替换假设。
- 用户确认新组件前，保留旧时间线或其他可逆基线。
