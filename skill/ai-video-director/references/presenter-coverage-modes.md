# Presenter Coverage Modes

[English](#english) | [简体中文](#简体中文)

## English

Use two axes instead of treating every composition as one flat list. The first axis records whether A-roll and B-roll are visible. The second axis records how simultaneous A-roll and B-roll are arranged.

### Definitions

- `A-roll` is the primary, time-aligned speaking or performance footage.
- `B-roll` is substantive evidence, demonstration, artwork, screen content, or supporting footage. Captions, a logo, a progress rail, or decorative texture alone do not turn `A-only` into `AB-live`.
- `AB-live` means time-aligned A-roll and substantive B-roll are visible at the same time. It is a presence mode, not a layout.

### Presence Modes

| Mode | Meaning | Typical use |
|---|---|---|
| `A-only` | Only the presenter is the substantive visual source | direct address, emotion, identity, or an intentional visual reset |
| `B-only` | B-roll or evidence fills the substantive visual field | short proof cutaway, dense interface evidence, or a detail that needs the full canvas |
| `AB-live` | A-roll and B-roll remain visible together | a longer explanation where evidence and presenter continuity both matter |

### `AB-live` Layout Families

| Layout | Base and overlay | Use it when |
|---|---|---|
| `B-base-A-PiP` | Full-frame B-roll with A-roll inside a designed rectangle, circle, or other bounded crop | presenter continuity matters and a clean, predictable window is the safest treatment |
| `A-base-B-overlay` | Full-frame A-roll with a B-roll card, screenshot, or evidence layer above it | the presenter remains primary and the proof is compact or intermittent |
| `B-base-A-cutout` | Full-frame B-roll with a transparent, time-aligned presenter silhouette | an aesthetic showcase, list, product, artwork, or gesture-led explanation benefits from a sticker-like presenter |
| `AB-split` | A-roll and B-roll occupy explicit regions without one serving as a simple background | comparison, conversation, or two sources of similar importance; avoid as a default on narrow portrait canvases |

`AB-live-PiP` is a legacy alias for `AB-live` plus `B-base-A-PiP`. Do not treat `AB-live` and `PiP` as two peer modes.

### Selection Order

1. Classify the aggregate viewer-visible coverage run as `A-only`, `B-only`, or `AB-live`.
2. For `AB-live`, choose a layout from evidence density, presenter value, negative space, style fit, captions, platform controls, and target-device readability.
3. Use `B-base-A-cutout` only after the actual transparent result passes its matte gate. A style preference does not override broken edges or covered evidence.
4. Hold the chosen geometry throughout one continuous run. Change layout only at a semantic or layout boundary.

## HyperFrames Cutout Contract

### Source And Timing

- Start from the clean, locked A-roll after rough-cut and canonical timing lock. Do not matte a composite with baked captions, cards, logos, or other foreground graphics; they can leak into the person mask.
- Keep canonical dialogue audio on its own track and mute the cutout media layer. The transparent derivative is a visual layer, never a second timing or audio source.
- Preserve duration, frame rate, first and last frame, and every cut boundary. Rebuild the derivative after any structural A-roll change.

### Default Local Command

Use the governed version until it is rechecked:

```bash
npx --yes hyperframes@0.7.109 remove-background locked-a-roll.mp4 \
  -o presenter-cutout.webm \
  --device auto \
  --quality best \
  --json
```

- Use `balanced` for a disposable draft and `best` for the final VP9-alpha WebM.
- Use a `.mov` output when an editor round trip needs ProRes 4444. The quality flag is ignored for MOV.
- `--device auto` selects CoreML on supported Apple Silicon, CUDA when configured, and CPU otherwise.
- The Agent owns model download, runtime diagnosis, preprocessing, and cache handling. The user supplies no installation steps.

### Outline And Placement

- Derive the outline from the same alpha used for the presenter: `outlineAlpha = dilate(alpha, radius) - alpha`. Place the outline behind the cutout.
- In HyperFrames, prefer one transparent `<video>` with an alpha-aware SVG filter instead of two independently timed video elements. Compute `outlinePx` from the canvas width, set the example `radius="6"` to that value, then verify the filter in the real render:

```html
<svg width="0" height="0" aria-hidden="true">
  <filter id="presenter-outline" x="-20%" y="-20%" width="140%" height="140%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="expanded" />
    <feComposite in="expanded" in2="SourceAlpha" operator="out" result="ring" />
    <feFlood flood-color="#fff" result="color" />
    <feComposite in="color" in2="ring" operator="in" result="outline" />
    <feMerge>
      <feMergeNode in="outline" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</svg>
<video src="presenter-cutout.webm" muted playsinline style="filter:url(#presenter-outline)"></video>
```

- White is the default only when the approved style supports it. A reference-derived width of about `0.007-0.009` of canvas width is a starting candidate, not a universal constant.
- An outline may soften small edge noise but may not be used to disguise missing fingers, clipped hair, a leaking background, or unstable matte timing.
- Build a content-occupancy map for the B-roll. Bottom-left or bottom-right is a starting candidate, not a rule. Avoid captions, proof, faces, platform action rails, and progress semantics.
- Intentional bottom bleed is allowed when the body crop reads naturally. Keep the visible silhouette and its full motion envelope inside the effective semantic safe region everywhere else.
- Keep scale, anchor, side, and outline stable inside one coverage run. Do not make the presenter jump from corner to corner as B-roll cards change.

### Fail-Closed Matte Gate

Before selecting `B-base-A-cutout`, inspect early, middle, late, and every cut-boundary neighborhood over bright, dark, and busy test backgrounds:

- hair, glasses, shoulders, hands, and separated fingers;
- fast gestures, motion blur, translucent edges, and foreground props;
- background leakage, holes in clothing or body, color contamination, and edge halos;
- frame-to-frame edge crawling, alpha flicker, dropped frames, and timing drift;
- caption, evidence, progress, face, and platform-UI collisions at native and phone scale.

The gate passes only when the intended shot is acceptable as moving video, not merely in one still. If it fails, do not silently keep the broken matte. Prefer `B-base-A-PiP` when presenter continuity still matters, `A-base-B-overlay` when the presenter should remain primary, or `B-only` when evidence needs the canvas.

## 简体中文

不要把所有构图都压成一个扁平枚举。第一层记录 A-roll 和 B-roll 是否出现，第二层只在两者同时出现时记录具体排版。

### 定义

- `A-roll` 是主要人物口播或表演画面，并与当前口播时间一致。
- `B-roll` 是承担实质信息的证据、演示、作品、屏幕内容或辅助镜头。只有字幕、Logo、进度条或装饰纹理时，画面仍可属于 `A-only`。
- `AB-live` 表示 A-roll 与实质性 B-roll 同时可见。它是“人物与素材是否共存”的模式，不是具体版式。

### 出现模式

| 模式 | 含义 | 常见用途 |
|---|---|---|
| `A-only` | 只有人物是主要视觉来源 | 直接表达、情绪、身份建立或有意的画面重置 |
| `B-only` | B-roll 或证据占据主要画面 | 短证据镜头、密集界面或必须全屏阅读的细节 |
| `AB-live` | 人物与 B-roll 同时出现 | 较长讲解中既需要证据，也需要人物连续性 |

### `AB-live` 版式家族

| 版式 | 底层与叠加关系 | 适用情况 |
|---|---|---|
| `B-base-A-PiP` | B-roll 铺底，A-roll 放在矩形、圆形等有边界的小窗内 | 需要人物连续性，同时普通小窗最稳妥 |
| `A-base-B-overlay` | A-roll 铺底，B-roll 以素材卡、截图或证据层叠加 | 人物仍是主体，证据较小或间歇出现 |
| `B-base-A-cutout` | B-roll 铺底，叠加透明背景、口型同步的人物轮廓 | 审美展示、清单、产品、作品或手势讲解适合贴纸式人物 |
| `AB-split` | A、B 各占明确区域，没有简单的底图关系 | 对比、对话或两类信息同等重要；狭窄竖屏不默认使用 |

旧名称 `AB-live-PiP` 等价于 `AB-live` 加 `B-base-A-PiP`。不能把 `AB-live` 和 `PiP` 当作两个同级模式。

### 选择顺序

1. 先把观众连续看到的整段覆盖区间分类为 `A-only`、`B-only` 或 `AB-live`。
2. 只有选择 `AB-live` 后，才根据证据密度、人物价值、留白、风格、字幕、平台控件和目标设备选择具体版式。
3. `B-base-A-cutout` 必须先让真实透明视频通过抠像验收。风格偏好不能覆盖破碎边缘或证据遮挡。
4. 同一个连续区间内保持几何稳定，只在语义边界或版式边界改变。

## HyperFrames 人物抠像契约

### 素材与时序

- 使用粗剪与统一时间线锁定后的干净 A-roll。禁止对已经烧录字幕、卡片、Logo 或其他前景图形的合成画面抠像，否则这些元素可能被误识别进人物蒙版。
- 对白音频继续使用统一时间线上的独立音轨，抠像视频层必须静音。透明衍生素材只负责画面，不能成为第二套时序或音频来源。
- 保持时长、帧率、首尾帧和全部剪切边界一致。任何结构性 A-roll 修改都会使旧抠像失效，必须重建。

### 默认本地命令

在重新治理前使用已验证版本：

```bash
npx --yes hyperframes@0.7.109 remove-background locked-a-roll.mp4 \
  -o presenter-cutout.webm \
  --device auto \
  --quality best \
  --json
```

- 一次性草稿使用 `balanced`，最终 VP9 透明 WebM 使用 `best`。
- 需要进入剪辑软件往返时输出 `.mov`，得到 ProRes 4444；MOV 不使用 quality 参数。
- `--device auto` 会在支持的 Apple Silicon 上选择 CoreML，配置完成时选择 CUDA，否则使用 CPU。
- 模型下载、环境诊断、预处理和缓存都由 Agent 完成，不把安装步骤交给用户。

### 描边与摆放

- 描边必须从同一份人物 Alpha 生成：`outlineAlpha = dilate(alpha, radius) - alpha`，并放在人物层后方。
- 在 HyperFrames 中，优先让同一个透明 `<video>` 使用基于 Alpha 的 SVG 滤镜，不要用两个可能产生时序差异的视频层。根据画布宽度算出 `outlinePx`，使用英文部分给出的 `feMorphology + feComposite` 结构，并以真实渲染结果验收。
- 只有已确认风格适合时才默认白色。参考画面可从画布宽度的 `0.007-0.009` 作为描边宽度起点，但不能当成通用常量。
- 描边可以柔化轻微边缘噪点，不能用来掩盖手指缺失、头发被切、背景泄漏或蒙版时序抖动。
- 先做 B-roll 内容占用图。左下或右下只是候选位置，不是固定规则；必须避开字幕、证据、人脸、平台操作栏和进度语义。
- 身体底部有意出血可以保留，但其他可见轮廓及完整动作范围仍须位于有效语义安全区。
- 同一覆盖区间内保持缩放、锚点、左右位置和描边稳定，不能随着 B-roll 卡片切换让人物来回跳角。

### 默认不通过的抠像验收

选择 `B-base-A-cutout` 前，必须把开头、中段、结尾和全部剪切边界附近的画面，分别放到明亮、黑暗和复杂背景上检查：

- 头发、眼镜、肩部、双手和分开的手指；
- 快速手势、运动模糊、半透明边缘和前景道具；
- 背景泄漏、衣服或身体破洞、颜色污染和边缘光晕；
- 逐帧边缘爬动、Alpha 闪烁、丢帧和时序漂移；
- 原尺寸与手机尺寸下，字幕、证据、进度条、人脸和平台 UI 是否碰撞。

只有动态视频整体合格，而不是单张静帧好看时，才算通过。未通过时不得悄悄保留坏蒙版：仍需人物连续性时改用 `B-base-A-PiP`；人物应继续做主体时改用 `A-base-B-overlay`；证据需要完整画布时改用 `B-only`。
