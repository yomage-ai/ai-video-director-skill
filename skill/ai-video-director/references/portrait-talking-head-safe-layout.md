# Portrait Talking-Head Safe Layout

[English](#english) | [简体中文](#简体中文)

## English

`layout.portrait-talking-head.safe-v1` is the approved repository-level reference for a 9:16 talking-head composition that combines captions, semantic chapter progress, B-roll, picture-in-picture or presenter cutouts, and platform UI safety. It is non-personal and does not contain creator assets or project timeline IDs.

### Player Geometry

- Keep the delivery master at 9:16 unless the target platform requires another ratio. Changing `2160x3840` to `1080x1920` changes pixel count, not crop percentage.
- A player may preserve aspect ratio while constraining the video by height. A viewport narrower than 9:16 clips the left and right edges; a wider viewport shows pillarboxing. Do not assume the encoded canvas edge is visible.
- For a height-constrained player, compute `heightScale = playerHeight / canvasHeight`, `sourceVisibleWidth = min(canvasWidth, playerWidth / heightScale)`, and `sourceHorizontalCropPerSide = max(0, (canvasWidth - sourceVisibleWidth) / 2)`.
- The effective semantic safe region is the intersection of the visible source region and the platform UI-free region for that vertical band. Top search chrome, right action rails, and bottom descriptions create different exclusion masks.

### Layer Contract

- Let backgrounds, noncritical photo or video edges, and the progress contrast surface bleed to the canvas edges.
- Keep caption glyphs, progress rails and labels, information-card copy, proof marks, declared B-roll critical regions, picture-in-picture visible boxes, presenter-cutout silhouettes and motion envelopes, logos, and identity marks inside the effective semantic safe region.
- Do not shrink every B-roll shot. Declare the important region of interest. If it does not fit, contain it with padding, recompose it, crop to a readable detail, or split dense evidence across shots.

### Approved Reference Baseline

- Reference canvas: `2160x3840`.
- Captions: `left=120`, `top=2700`, `width=1920`, `height=500`; `Noto Sans SC`, `120px`, weight `700`, white fill, `8px` dark stroke, restrained shadow, no background or highlight, and at most two lines. Scale from the normalized values in the template, then prove the actual rendered glyph bounds rather than trusting the caption box alone.
- Portrait progress: `left=0`, `top=220`, `width=2160`, `height=180`. The contrast surface is full bleed; the semantic rails use a validated reference inset of `243px` per side. Recompute that inset for each target player instead of treating `243px` as universal.
- Preserve the approved caption lane when progress moves to the top. Reflow headings, information cards, picture-in-picture, and presenter cutouts around the top band. Move or shorten a decorative outro underline before moving approved captions, and keep it visibly below the rendered caption ink.
- Keep creator-specific caption exceptions, identity art, and one-project collision fixes in private profiles or project overrides, not in this repository baseline.

### Verification

- Simulate a narrow tall phone, a reference 9:16 viewport, and a wide tablet before delivery. Inspect native and phone scale.
- Check early, middle, late, every chapter boundary, the longest two-line caption, densest information card, picture-in-picture or presenter-cutout motion extremes, and the signature outro.
- Re-run the checks after any geometry, pagination, platform placement, or player-fit change. Replace simulated assumptions with real published-device screenshots when available.

## 简体中文

`layout.portrait-talking-head.safe-v1` 是仓库级、已确认的 9:16 竖屏口播联合版式参考，统一约束字幕、语义章节进度、B-roll、人物画中画或人物抠像和平台 UI 安全区。它不绑定个人资产，也不保存具体项目的时间线 ID。

### 播放器几何

- 除非目标平台明确要求其他画幅，成片继续使用 9:16。把 `2160x3840` 改成 `1080x1920` 只会改变像素数量，不会改变裁切比例。
- 播放器可能保持视频比例并按高度显示。比 9:16 更窄的视口会裁掉左右边缘，更宽的视口会出现左右黑边，不能默认编码画布边缘一定可见。
- 对按高度显示的播放器，计算 `heightScale = playerHeight / canvasHeight`、`sourceVisibleWidth = min(canvasWidth, playerWidth / heightScale)` 和 `sourceHorizontalCropPerSide = max(0, (canvasWidth - sourceVisibleWidth) / 2)`。
- 最终语义安全区是“视频实际可见区域”和“该高度区段的平台 UI 无遮挡区域”的交集。顶部搜索区、右侧操作栏和底部说明区必须分别建遮挡蒙版。

### 图层契约

- 背景色、背景纹理、非关键照片或视频边缘，以及进度条对比底带可以铺满画布并接受裁切。
- 字幕实际字形、进度轨道与标题、信息卡文案、证据标记、B-roll 关键区域、画中画可见框、人物抠像轮廓及完整运动范围、Logo 和身份标记必须留在有效语义安全区内。
- 不要默认缩小全部 B-roll。先声明重要区域；若重要区域不安全，则使用留白承载、重新排版、裁成可读细节镜头，或把密集证据拆成多个镜头。

### 已确认参考基线

- 参考画布：`2160x3840`。
- 字幕：`left=120`、`top=2700`、`width=1920`、`height=500`；`Noto Sans SC`、`120px`、字重 `700`、白字、`8px` 深色描边、克制阴影、无底色和高亮，最多两行。其他尺寸按模板里的归一化比例换算，并检查实际渲染字形边界，不能只看字幕框。
- 竖屏进度条：`left=0`、`top=220`、`width=2160`、`height=180`。对比底带保持满宽，语义轨道使用左右各 `243px` 的已验证参考内边距；每个新播放器仍需重新计算，不能把 `243px` 当成所有平台的固定值。
- 进度条移到顶部时保留已确认字幕轨道，标题、信息卡、人物画中画和人物抠像绕开顶部安全带。片尾装饰下划线应先移动或缩短，并与字幕实际字形保持清晰间距，不能为了装饰线再次移动已确认字幕。
- 个人化字幕特例、身份形象和单项目碰撞修复只进入私有风格档案或项目覆盖层，不写入仓库通用基线。

### 验证要求

- 发布前同时模拟狭长手机、标准 9:16 视口和宽屏平板，并检查原始尺寸和手机尺寸。
- 检查开头、中段、结尾、每个章节边界、最长两行字幕、最密信息卡、画中画或人物抠像运动极值和片尾。
- 任何几何、分页、平台位置或播放器适配方式变化后都要重验；存在真实发布设备截图时，以截图替代模拟假设。
