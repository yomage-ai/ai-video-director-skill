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
5. Do not wait for ordinary narration to say a layout name. The director chooses the mode from the content and approved visual strategy. Synchronize the visible semantic state with the current claim; exact named-phrase switching is required only when the layout itself is being introduced, compared, or taught as evidence.

### Source-Cut And Layout-Boundary Conformance

Plan three clocks together: the canonical A-roll source cut, the viewer-visible coverage/layout boundary, and the first/last spoken token that permits the visual state.

- When a new take is meant to begin or end under a different layout, snap the source cut and layout boundary to the same program frame. Do not show the new take full-screen for a few frames before its PiP/B-roll layout arrives, or expose the old take after that layout exits.
- Treat integer frame indices as canonical at every snap boundary. Derive seconds from `frame / fps` without independently rounding to six decimals: at 30 fps, an authored `150.666667` starts on runtime frame 4521, while frame 4520 is `150.66666666666666`. Record `startFrame`/`endFrame` in the boundary manifest and let the audit reject a decimal that resolves to a different runtime frame.
- Merge adjacent information cards into one aggregate coverage run before judging duration. Inside a continuous B-roll run, cut directly between cards and keep one presenter PiP/cutout item spanning the run when its geometry is unchanged. A one-frame or sub-second A-only bridge is a failure.
- An intentional return to `A-only` must normally hold at least `2.0 s`. The creator profile may require longer. A shorter state is allowed only for a declared token-synchronized comparison or mode demonstration whose manifest records the exact first and last spoken tokens.
- Pre-roll entry animation while the clip is hidden so the first viewer-visible frame already contains the complete intended card and presenter geometry. An opacity-zero card on its first active frame is not covered.
- Do not create three visible states inside one second by separating a source cut from a nearby `A-only`/B-roll boundary. After any structural A-roll trim, rebase captions, B-roll, PiP/cutouts, progress, SFX, and outro cues from one canonical time transform.
- Build a boundary manifest and run `scripts/audit-coverage-boundaries.mjs`. Inspect at least two frames before, one before, on, one after, and two after every changed boundary in the actual render.

### Presenter Visual Priority

Classify the presenter's visual priority before placing or collision-routing it. This priority is independent of `PiP` versus `cutout` and of container-bottom versus canvas-bottom anchoring.

| Priority | Meaning | Occlusion rule |
|---|---|---|
| `foreground` | The face, expression, or gesture is part of the current claim | Protect the face, required gesture, silhouette, and readable container from captions, platform controls, crop reserves, and evidence |
| `supporting` | Presenter continuity matters but the interface or evidence is primary | Protect the face, required gesture, and bounded PiP; small planned overlap on nonessential body area is acceptable only when readability remains clear |
| `background` | The presenter is a low-salience continuity or atmosphere layer behind a large interface explanation | Captions and platform copy may intentionally overlay nonessential body area or bottom bleed; still protect the face, required gesture, critical evidence, and any identity mark that must be read |

Use a container-bottom anchor when the presenter should feel attached to a panel or interface stage. Use a canvas-bottom anchor when the presenter should grow from the frame edge. Neither anchor implies one priority: declare both the anchor and priority in the shot plan. A bounded PiP normally remains `foreground` or `supporting`; do not treat its window as disposable background merely because it is small.

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

- For portrait `B-base-A-cutout`, use outline `on` as the public recommended starting state. An exact approved reference or a documented content reason may turn it off; record that override and verify the chosen state on this shot.
- Select the outline color only after analyzing hair or headwear, clothing, skin-edge separation, all recurring underlying background families, the evidence/content palette, any approved creator or brand tendency, and phone-scale contrast. Do not reuse white, yellow, blue, or another house color merely because it worked before. A reference-derived width of about `0.007-0.009` of canvas width is a starting candidate, not a universal constant.
- An outline may soften small edge noise but may not be used to disguise missing fingers, clipped hair, a leaking background, or unstable matte timing.
- Build a content-occupancy map for the B-roll. For portrait `B-base-A-cutout`, begin with lower-left and lower-right as the public recommended zones, then choose the clearer side from evidence occupancy, gaze, gesture, captions, and platform controls. Another edge or center-weighted placement is allowed when both lower corners conflict with evidence/UI or an exact approved reference requires it; record the override. A private creator profile may remove a previously rejected anchor instead of carrying that old option into every new director plan. Foreground and bounded PiP still reserve their readable region; a background cutout may sit behind nonessential copy but never hide critical proof or sacrifice the face or required gesture.
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
5. 普通口播不需要先说出版式名称，导演应根据内容和已确认的视觉策略主动选择画面形式。真正必须同步的是观众看到的语义状态与当前口播观点；只有视频本身正在介绍、比较或教学某种版式时，才要求按说到该名称的准确词点切换。

### 源片剪点与版式边界统一

导演方案必须同时管理三套时钟：统一 A-roll 的真实剪点、观众看到的覆盖/版式边界，以及允许该画面出现和消失的首尾口播词点。

- 新片段本来就要以另一种版式进入或退出时，源片剪点与版式边界必须落在同一个节目帧。禁止先闪几帧新 A-roll 全屏再进入小窗/B-roll，也禁止版式先退出后又露出几帧旧 A-roll。
- 所有对齐边界都以整数帧号为准，秒数只能由 `frame / fps` 推导，不能再独立四舍五入到六位小数。例如 30 fps 下写成 `150.666667` 会在运行时第 4521 帧才出现，而第 4520 帧应写成 `150.66666666666666`。边界清单必须记录 `startFrame`/`endFrame`，审计要拒绝会落到另一运行帧的小数。
- 先把相邻信息卡合并为观众实际看到的连续覆盖区间，再判断时长。连续 B-roll 内部直接切卡；人物几何不变时，优先用一条跨越整段的小窗或抠像素材。任何一帧或不足一秒的 A-roll 回闪都算失败。
- 有意回到 `A-only` 时，默认至少稳定停留 `2.0 s`；创作者画像可以要求更长。只有明确声明的逐词同步对比或画面模式演示可以更短，而且清单中必须记录允许它出现和结束的准确首尾词。
- 入场动画要在素材尚未对观众可见时预卷，使第一个可见帧已经具备完整信息卡和人物几何。素材生效首帧仍是透明状态，不算完成覆盖。
- 不能因为源片剪点与附近的 `A-only`/B-roll 边界没有对齐，而在一秒内制造三种观众可见状态。任何结构性 A-roll 收紧之后，字幕、B-roll、小窗/抠像、进度、音效和片尾都必须通过同一份统一时间变换整体重算。
- 必须建立边界清单并运行 `scripts/audit-coverage-boundaries.mjs`。真实渲染中，每个修改边界至少检查前两帧、前一帧、边界帧、后一帧和后两帧。

### 人物视觉层级

摆放人物和处理遮挡前，先声明人物的视觉层级。这个层级与“小窗还是抠像”、“贴容器底边还是贴画布底边”是互相独立的决策。

| 层级 | 含义 | 遮挡规则 |
|---|---|---|
| `foreground` 前景 | 脸、表情或手势正在承担当前信息 | 脸、必要手势、完整轮廓和可读容器都要避开字幕、平台控件、裁切预留和证据 |
| `supporting` 辅助 | 需要人物连续性，但界面或证据才是主体 | 保护脸、必要手势和有边界的小窗；只有在可读性不受影响时，才允许少量规划好的非关键身体区重叠 |
| `background` 背景 | 人物只作为大块界面讲解后的弱存在感或连续层 | 字幕和平台说明可以有意叠在非关键身体区或底部出血上；仍要保护脸、必要手势、关键证据和必须读取的身份标识 |

想让人物像站在面板或界面舞台上时，使用容器底边锚点；想让人物从整个画面左下或右下生长时，使用画布底边锚点。任何锚点都不自动对应某一层级；导演方案必须同时记录锚点和层级。有明确边界的小窗通常是前景或辅助层，不能因为它小就把整个窗口当成可随意遮挡的背景。

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
- 竖屏使用 `B-base-A-cutout` 人物抠像时，公共推荐默认开启描边。精确已确认参考或有记录的内容理由可以关闭描边，但必须记录覆盖原因，并在本片背景上复核。
- 描边颜色必须先综合分析头发或头饰、衣服、肤色边缘、这一覆盖段会出现的全部背景素材、内容或品牌配色、创作者已确认倾向，以及手机尺度对比度。不能因为白色、黄色或蓝色以前成功过就机械复用。参考画面可从画布宽度的 `0.007-0.009` 作为描边宽度起点，但不能当成通用常量。
- 描边可以柔化轻微边缘噪点，不能用来掩盖手指缺失、头发被切、背景泄漏或蒙版时序抖动。
- 先做 B-roll 内容占用图。竖屏使用 `B-base-A-cutout` 时，公共推荐先从左下和右下选择，再根据证据占位、视线、手势、字幕和平台控件决定更清楚的一侧。只有两个下角都与证据或平台 UI 冲突，或者精确已确认参考明确要求时，才改用其他边缘或偏中心位置并记录原因。私人创作者画像已经否定的旧锚点应直接移除，不能每次导演方案又把它当候选带回来。前景人物和有边界小窗仍要预留完整可读区；背景抠像可以位于非关键信息之后，但不能遮住关键证据，也不能牺牲脸或必要手势。
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
