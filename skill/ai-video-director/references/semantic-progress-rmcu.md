# RMCU Semantic Progress

[English](#english) | [简体中文](#简体中文)

## English

`rmcu.semantic-progress.v1` is the repository-owned, non-personal component contract for burned-in semantic chapter progress. RMCU means Reusable Motion Component Unit. It defines behavior and verification independently of one creator, project, editor timeline, or identity asset.

### Shared Contract

- Accept an ordered list of two to seven approved chapters with `label`, `startFrame`, and `endFrameExclusive`. Use one unsegmented bar when meaningful chapters do not exist.
- Compute segment widths from real chapter duration. Drive fill, active state, and playhead from the local timeline frame; never divide the canvas into equal decorative slices.
- Keep labels on one line. Past and future labels remain static and use an ellipsis only when they overflow their own segment.
- Only the active label may move. Start a deterministic loop marquee only when the measured or conservatively estimated text width exceeds the available label viewport. Reset its local clock at the chapter boundary, hold before motion, move at constant speed, and repeat with a readable gap. Do not animate text that already fits.
- Preserve one stable layout box. Label changes, ellipsis, active weight, and marquee motion must not resize the component or shift neighboring content.
- Apply the same visual grammar and overflow behavior in landscape and portrait. Orientation may change placement, scale, and safe-area geometry, but not chapter behavior or decorative structure.
- Use two clean lanes in both variants: one uninterrupted progress track with no chapter ticks, then one label row with dividers only between adjacent chapter segments. Do not add leading dashes, per-label status marks, chapter numbers, active-segment panels, or duplicate separators by default.
- Use a neutral playhead by default. Creator characters, logos, or personal-IP markers are optional adapters and never part of the repository default.
- Treat the overlay as visual orientation only. Seeking remains the platform player's responsibility.

### Landscape Variant

- Use a compact full-width top rail on a 16:9 canvas. Keep the clean progress track above the semantic label row, with dividers only in the label row.
- Clip every label to its segment. Inactive overflow uses an ellipsis; active overflow uses the shared loop-marquee rule inside that same segment.
- Keep the rail close to the top edge of the horizontal program. When the horizontal program is letterboxed inside a vertical platform, validate against the actual player crop and controls rather than a generic safe-area diagram.

### Portrait Variant

- Use a platform-validated top-safe band when bottom descriptions or controls obscure semantic labels.
- Split the band into two lanes: a noncritical marker/track lane above and a semantic label lane below. Platform search chrome may overlap the noncritical lane only when the labels remain fully readable.
- Keep the component full width and compact. Reflow nearby headings, evidence, and picture-in-picture instead of allowing them to sit under the semantic lane.
- Do not add a walking mascot by default. A neutral playhead preserves reuse across finance, tutorials, product explainers, and other speech-led formats.

### ChatCut Authoring

- Store this contract, the reusable parameter template, and tests in the Skill repository. Pass executable Motion Graphic JSX inline to ChatCut tools; do not stage JSX in repository files, temporary files, local servers, or guessed backend workspaces.
- Keep labels, chapter boundaries, colors, font, and motion parameters editable. Use the renderer-supported canonical `Noto Sans SC` family for neutral Simplified Chinese utility text unless the approved design specifies another licensed catalog font.
- Give the overlay a natural asset box and place it at explicit timeline geometry. Re-read the asset and item after mutation.

### Verification

- Render early, middle, late, every chapter boundary, the longest inactive label, the active marquee before motion, during motion, at its wrap point, and after a seek/re-render.
- Check A-roll, bright B-roll, dark B-roll, native size, phone size, the actual platform UI, full-width alignment, stable segment geometry, monotonic playhead motion, and collisions with captions, headings, evidence, and picture-in-picture.
- Preserve the previous timeline or another reversible baseline until the user approves the new component.

## 简体中文

`rmcu.semantic-progress.v1` 是仓库级、非个人化的烧录式语义章节进度组件契约。RMCU 指 Reusable Motion Component Unit（可复用动效组件单元）。它只定义通用行为与验收方法，不绑定某位创作者、某条视频、某个剪辑时间线或个人形象资产。

### 通用契约

- 接收两个至七个已确认章节，每章包含 `label`、`startFrame` 和 `endFrameExclusive`；没有真实多章节结构时退化为一条无分段进度条。
- 按章节真实时长计算分段宽度，并用本地时间线帧驱动填充、当前状态和播放头；不得为了装饰平均分段。
- 标题固定单行。过去和未来章节保持静止，仅在超出各自分段宽度时显示省略号。
- 只有当前章节标题可以移动，而且只有溢出时才启动确定性的循环滚动。进入章节后先停留，再匀速滚动，并以清晰间距循环；章节切换时重置局部时钟，能够完整显示的标题不得滚动。
- 组件外框和各分段尺寸始终稳定。文字切换、省略号、当前字重和滚动都不能推挤相邻内容。
- 横屏与竖屏必须使用同一套视觉语法和溢出行为。方向只允许改变摆放、安全区和缩放，不得改变章节行为或装饰结构。
- 两种方向都采用干净的双层结构：上层是一条没有章节刻度的连续进度轨道，下层是只在相邻章节之间保留分隔线的标题行。默认不添加标题开头短横杠、逐项状态标记、章节编号、当前区块底色或重复分隔。
- 默认使用中性播放头。人物、Logo 或个人 IP 标记只能作为可选适配层，不能进入仓库默认组件。
- 该图层只负责视觉导航，实际拖动仍由平台播放器完成。

### 横屏版本

- 在 16:9 画面顶部使用紧凑的满宽导航条，把干净的连续进度轨道放在语义标题行上方，分隔线只出现在标题行。
- 每个标题都裁切在自身分段内；未激活标题溢出时省略，当前标题溢出时在自身分段内循环滚动。
- 横屏内容被嵌入竖屏平台时，必须根据真实播放器裁切和控件复核，不能只依赖通用安全区示意图。

### 竖屏版本

- 当底部说明和控件遮挡章节文字时，使用经过平台验证的顶部安全带。
- 顶部安全带分为两层：上层放非关键信息的轨道与播放头，下层放必须完整可读的章节语义。只有在标题完全不受影响时，平台搜索框才可以覆盖上层的一部分。
- 组件保持满宽且紧凑。附近标题、证据卡和人物画中画必须绕开语义层，不能压在其下方。
- 默认不加入走路小人；中性播放头更适合金融、教程、产品讲解等不同口播类型。

### ChatCut 编写规则

- Skill 仓库保存本契约、通用参数模板和测试。可执行 Motion Graphic JSX 必须直接内联传给 ChatCut 工具，不得写入仓库文件、临时文件、本地服务器或猜测的后端工作区。
- 章节文字、边界、颜色、字体和动效参数保持可编辑。中性简体中文功能文字默认使用渲染器支持的规范名称 `Noto Sans SC`，除非已确认其他有授权的目录字体。
- 叠加组件使用自然尺寸资源框，并在时间线上明确设置几何位置。修改后必须重新读取资产和项目项。

### 验证要求

- 检查开头、中段、结尾、每个章节边界、最长未激活标题，以及当前滚动标题的停留、滚动、循环接点和跳转后重渲染。
- 覆盖真人画面、亮色 B-roll、暗色 B-roll、原始尺寸、手机缩略尺寸、真实平台 UI、满宽对齐、分段稳定性、播放头单调前进，以及与字幕、标题、证据和人物画中画的碰撞。
- 用户确认新组件前，保留旧时间线或其他可逆基线。
