# Code Motion Component System

[English](#english) | [简体中文](#简体中文)

## Contents / 目录

- English: [Classification](#classification), [Three-Layer Architecture](#three-layer-architecture), [Parameter Schema](#parameter-schema), [Content-Fit Gate](#content-fit-gate), [Seek-Safe Time Contract](#seek-safe-time-contract), [QA and Promotion](#qa-and-promotion), [Error Samples](#error-samples), [Work Chain](#work-chain)
- 简体中文：[分级体系](#分级体系)、[三层架构](#三层架构)、[参数 Schema](#参数-schema)、[内容适配门槛](#内容适配门槛)、[可定位时间契约](#可定位时间契约)、[QA 与沉淀](#qa-与沉淀)、[错误样本](#错误样本)、[标准工作链](#标准工作链)

## English

Use this reference when auditing, authoring, replacing, or promoting a code-authored motion graphic in ChatCut, Remotion, HyperFrames, or another frame-addressable renderer. It governs reusable component boundaries; renderer-specific syntax stays in the relevant tool Skill.

### Classification

Classify every component before reuse. Classification describes its safe reuse scope, not its visual quality.

| Grade | Meaning | Selection rule |
| --- | --- | --- |
| `G` | General mechanism | Repository-generic behavior with no creator identity, private media, project copy, or project timing. It may be a shared default only after cross-context proof. |
| `P` | Private adapter | Creator-owned identity art, logo, motion sequence, style tokens, or other private treatment. Keep it outside the generic repository and require the applicable approval and rights record. |
| `T` | Topic template | Reusable structure for a defined content family, such as a process, comparison, evidence tour, or convergence diagram. Copy, media, cues, and claims remain instance data. |
| `A` | Archive | Superseded but historically valid. Preserve for comparison or migration, exclude from automatic selection, and point to its replacement. |
| `X` | Error sample | Known-bad behavior retained only as a minimal regression fixture. It must never be placed in a deliverable or offered as a reusable option. |

A component may combine layers, such as a `G` progress mechanism with a `P` marker. Record both parts separately instead of promoting the composite to `G`. One approved episode proves only one instance; it does not prove generality.

Promotion rules:

- Promote `T` behavior to `G` only after it works in at least two materially different content contexts, all copy and timing are parameterized, private and project data are removed, and the generic default passes its own QA.
- Promote a treatment to `P` only after the creator approves the exact visual and motion contract. Keep the generic fallback independent.
- Move a component to `A` when a valid replacement is approved. Move it to `X` when its behavior is unsafe or misleading, even if some pixels remain useful.
- Never overwrite an approved component in place to change its class. Create a new version and preserve the reversible baseline.

### Three-Layer Architecture

Keep these layers separate in code, storage, and review:

1. **General mechanism:** frame mapping, state transitions, layout math, semantic anchors, overflow behavior, and generic QA. It must render with neutral defaults and without private dependencies.
2. **Private adapter:** creator-owned art, logos, poses, action sequences, voice-linked signatures, and private style tokens. Store these in the private profile or approved private asset system, never in the generic Skill repository.
3. **Project instance data:** viewer-facing copy, claims, chapter boundaries, cue frames, media IDs, crops, route points, target-player geometry, and approval records. Keep this in the video project.

Dependency direction is one way:

```text
project instance -> optional private adapter -> general mechanism
```

The general mechanism must not import a private adapter or project instance. A private adapter may depend on a documented generic contract. A project may select either the neutral default or an approved adapter.

Do not commit personal assets, identity media, unpublished screenshots, account data, absolute media paths, or project-specific identifiers to the generic repository. Record third-party code, asset, or method sources through tool governance. A `method-only` reference is not the same as installing a Skill, copying code, or using its visual assets; state the actual relationship precisely.

### Parameter Schema

Every reusable code component needs an explicit, versioned specification. The renderer may expose the fields differently, but the semantic groups are stable:

Start new records from [`code-motion-component.template.json`](../assets/templates/code-motion-component.template.json). The template is a reusable contract, not renderer source code: keep ChatCut Motion Graphic source in the editor asset and pass it through the connector as inline code; keep project copy, cue frames, asset IDs, and crops in the video project.

```ts
type CodeMotionComponentSpec = {
  componentId: string;
  version: number;
  classification: Array<"G" | "P" | "T" | "A" | "X">;
  semanticRole: string;
  renderer: string;
  naturalBox: {
    width: number;
    height: number;
    overflowPolicy: "contained" | "intentional-mask";
  };
  parameters: {
    content: Record<string, string | number | boolean | Array<unknown>>;
    timing: {
      cueFrames: Record<string, number>;
      ranges: Array<{id: string; startFrame: number; endFrameExclusive: number}>;
    };
    layout: {
      safeRegion: string;
      semanticAnchor?: {x: number; y: number; unit: "px" | "ratio"};
      markerFootprint?: {width: number; height: number; anchorX: number; anchorY: number};
    };
    style: Record<string, string | number>;
    media: Array<{role: string; kind: string; rightsRecordRequired: boolean}>;
    motion: {
      travelClock: "timeline-frame";
      actionClock?: "independent-local-frame";
      cycleFrames?: number;
    };
  };
  governance: {
    sourceRelationships: Array<{
      name: string;
      relationship: "runtime" | "method-only" | "code" | "asset";
      rightsRecord: string;
    }>;
    privateDataAllowed: false;
  };
  qa: {
    changeAllowlist: Array<string>;
    invariantList: Array<string>;
    requiredFrameWindows: Array<string>;
  };
};
```

Parameterize semantics, not only colors. The minimum useful schema normally includes:

- viewer copy, labels, asset roles, and claim text;
- semantic cue frames and half-open ranges, not guessed paragraph percentages;
- canvas or natural-box geometry, safe region, critical region, and visible contact-point anchor;
- palette, font, type scale, stroke, shadow, and contrast-surface tokens;
- media roles and rights requirements rather than local file paths;
- travel duration, action cadence, transition duration, and any deliberate hold;
- a change allowlist and invariants inherited from the approved reference.

Prefer arrays and named maps over fixed fields such as `step1` through `step7` when count is genuinely variable. Validate ordered ranges, finite numbers, nonnegative durations, asset readiness, and renderer-supported fonts before placement. A missing required parameter must fail closed instead of falling back to unrelated project content.

### Content-Fit Gate

A reusable component is not automatically appropriate. Before selection, answer:

1. What viewer task does it perform: orientation, evidence, comparison, causality, emphasis, or identity?
2. Which spoken claim or semantic range authorizes it, and when must it appear and disappear?
3. Does its metaphor match the content, presenter, and tone, or merely reflect an available asset?
4. Is the attention cost lower than the information value at normal playback speed?
5. Can its complete motion envelope fit the actual platform-safe layout without covering captions, evidence, picture-in-picture, or identity marks?
6. Are all media, fonts, identities, and method sources owned, approved, or governed?

Use a neutral `G` treatment when content does not justify a branded adapter. Writing, planning, or structured thinking may support a pen; direct software interaction may support a restrained cursor; lifestyle, diary, emotion, or celebration may support a botanical or character adapter. These are candidates, not genre presets. Reject any adapter that implies the wrong mood or competes with the argument.

Before the first reusable lock, show a representative still and a short real-speed motion sample. Approval of one adapter does not authorize replacing another approved adapter in place.

### Seek-Safe Time Contract

Every visible state must be a pure function of the requested frame, component parameters, and immutable assets.

- Use the renderer's timeline frame and declared duration. Do not use `Date`, wall-clock time, `requestAnimationFrame`, `setTimeout`, stateful counters, CSS real-time animation, or unseeded randomness.
- Derive continuous travel from floating-point progress. Quantize only discrete sprite or state indices, never the marker position or filled path.
- Drive travel, fill, and any percentage from one normalized progress value. Drive a walk, spin, blink, or writing wobble from a separate local action clock at its approved cadence.
- Do not stretch one action cycle across the whole program merely because the marker travels for the whole program. Do not reset global travel at a chapter or state boundary unless the semantic design explicitly requires a jump.
- Declare a semantic contact point. For a pen, cursor, pointer, or tool, the visible tip must remain aligned with the represented endpoint. Clamp the complete marker footprint to the safe rail. If footprint clamping would detach the contact point, use an endpoint pose, alternate anchor, or a larger safe inset; do not accept silent misalignment.
- Derive time constants from the actual timeline FPS when authored in seconds. Recheck after conforming to another timebase.
- A seek to the same frame must reproduce the same pixels. Loop closure, first-visible state, last-visible state, and internal transition windows are part of the contract.

Seek-safe pseudocode:

```js
const p = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
const endpointX = railStart + p * railWidth;
const actionFrame = ((frame - actionStart) % cycleFrames + cycleFrames) % cycleFrames;
const spriteIndex = Math.floor(actionFrame / holdFrames) % spriteCount;
```

### QA and Promotion

Verification is fail-closed. A successful mutation or one attractive still is not proof.

- Duplicate the approved timeline or component before revision. Record the change allowlist and every invariant that must remain fixed.
- Re-read the placed item, effective parameters, geometry, source ranges, layer order, and duration after mutation.
- Sample the beginning, middle, end, every semantic boundary, and both sides of every internal image, label, or state swap. Continuous coverage must not contain a blank intermediate frame or leaked underlay.
- Render short real-speed motion windows for the entrance, a representative loop, chapter or state boundaries, and the ending. Slow motion is diagnostic only; normal speed determines fluency and attention cost.
- Seek to nonsequential frames and render the same frame twice. Check deterministic pixels, monotonic travel, loop closure, and no boundary reset.
- For a declared contact point, measure endpoint error on representative frames. Keep it within one composition pixel unless an approved renderer-specific tolerance is documented.
- Check the complete transformed footprint, self-clipping, alpha continuity, and natural-box padding at every motion extreme. Layer order does not prevent an item from clipping its own children.
- Compare native size, phone size, bright and dark backgrounds, target-player crop, captions, evidence, picture-in-picture, and platform controls.
- Compare unaffected timeline structure and pixels with the approved baseline. For a visual-only change, prove that audio and caption behavior did not change.
- Inspect the actual export, not only the editor preview. Record the replacement ID, approval status, and whether the old component becomes `A` or `X`.

Additional promotion gates:

- `G`: neutral defaults, no private or project data, two independent content contexts, complete schema, and generic QA.
- `P`: explicit creator approval, owned identity assets, private storage, exact motion contract, and a neutral fallback.
- `T`: a named content family, parameterized copy/media/cues, and at least one variant beyond the source instance.
- `A`: replacement link and automatic-selection exclusion.
- `X`: minimal fixture, root cause, blocking rule, expected failure, and no deliverable placement path.

### Error Samples

Keep an `X` record small and explicit:

```json
{
  "id": "example.invalid-motion.v1",
  "classification": "X",
  "symptom": "what the viewer sees",
  "rootCause": "why the implementation fails",
  "blockedRule": "the invariant that rejects it",
  "expectedFailure": "the automated or visual failure",
  "replacementId": "example.valid-motion.v2"
}
```

Useful regression categories include wall-clock animation, unbounded marker footprints, contact-point drift, whole-character alpha dips, local facial patches over flattened art, approximate evidence crops, label/image phase mismatch, blank transition frames, collision with semantic safe areas, and in-place overwriting of an approved asset. Do not publish error media or preserve private material merely to document a failure; use an anonymous minimal fixture.

### Work Chain

1. Audit existing code components and classify each as `G`, `P`, `T`, `A`, or `X`.
2. Lock the approved reference, timeline, motion contract, and change allowlist.
3. Separate general behavior, optional private adapters, and project instance data.
4. Define and validate the parameter schema before writing or patching renderer code.
5. Apply the content-fit gate and choose a neutral default when the content does not justify an adapter.
6. Author with seek-safe frame clocks and explicit semantic anchors.
7. Place only on a reversible copy, then perform structural, motion, layout, rights, and export QA.
8. Obtain approval, classify the superseded version, and promote only the layer whose evidence supports reuse.

## 简体中文

当需要审计、编写、替换或沉淀 ChatCut、Remotion、HyperFrames 或其他可按帧定位的代码动画时，读取本参考。本文只管理可复用组件边界；具体渲染器语法仍由对应工具 Skill 负责。

### 分级体系

每个组件在复用前都必须分级。等级描述的是安全复用范围，不代表画面好坏。

| 等级 | 含义 | 选择规则 |
| --- | --- | --- |
| `G` | 通用机制 | 仓库级通用行为，不含创作者身份、私人素材、单片文案或单片时间。只有通过跨场景验证后，才能成为共享默认。 |
| `P` | 私人适配 | 创作者自有形象、Logo、动作序列、风格 token 或其他私人表达。保存在通用仓库之外，并满足对应授权与权利记录。 |
| `T` | 题材模板 | 面向明确内容类型的可复用结构，例如流程、对照、证据巡游或汇合图。文案、素材、口播节点和观点仍属于实例数据。 |
| `A` | 历史归档 | 已被替代但历史上有效。只用于比较或迁移，不能被自动选择，并且必须指向替代版本。 |
| `X` | 错误样本 | 已知错误，只保留匿名最小回归样本。禁止进入成片，也不能作为可复用选项提供。 |

一个画面可以同时包含多个层级，例如 `G` 级进度机制加 `P` 级人物播放头。必须分别记录两个部分，不能把整个组合直接提升为 `G`。一条已通过视频只能证明一个实例，不能证明通用性。

升级与降级规则：

- `T` 只有在至少两个明显不同的内容场景中成立、文案与时间全部参数化、私人和单片数据已移除，并通过通用默认 QA 后，才能提炼为 `G`。
- 视觉方案只有在创作者明确确认完整画面和动作契约后，才能沉淀为 `P`；通用中性兜底仍要独立存在。
- 有效组件被新版本替代后进入 `A`；行为不安全或误导时进入 `X`，即使其中部分像素仍可用。
- 改变等级时禁止原地覆盖已确认组件。必须新建版本并保留可回退基线。

### 三层架构

代码、存储和验收都要分开以下三层：

1. **通用机制层：** 帧映射、状态切换、布局计算、语义锚点、溢出行为和通用 QA。必须能在没有私人依赖时用中性默认值渲染。
2. **私人适配层：** 创作者自有形象、Logo、姿势、动作序列、口头签名和私人风格 token。保存在私人画像或已批准的私人素材系统中，禁止写入通用 Skill 仓库。
3. **单片实例层：** 给观众看的文案、观点、章节边界、口播 cueFrame、素材 ID、裁切、路线节点、目标播放器几何和审批记录。保存在视频项目中。

依赖只能单向流动：

```text
单片实例 -> 可选私人适配 -> 通用机制
```

通用机制不能反向导入私人适配或单片实例。私人适配可以依赖已记录的通用契约；单片可以选择中性默认或已批准适配。

禁止把个人素材、身份媒体、未发布截图、账号数据、绝对媒体路径或项目专有标识写入通用仓库。第三方代码、素材或方法必须进入工具治理记录。`method-only` 方法参考不等于安装 Skill、复制代码或使用其视觉素材，必须准确说明真实关系。

### 参数 Schema

每个可复用代码组件都要有明确、带版本的规格。渲染器暴露字段的方式可以不同，但语义分组保持一致：

新记录从 [`code-motion-component.template.json`](../assets/templates/code-motion-component.template.json) 开始。该模板是可复用契约，不是渲染器源码：ChatCut Motion Graphic 源码继续保存在编辑器素材中，并通过连接器以内联代码传递；单片文案、cue frame、素材 ID 和裁切仍保存在视频项目内。

```ts
type CodeMotionComponentSpec = {
  componentId: string;
  version: number;
  classification: Array<"G" | "P" | "T" | "A" | "X">;
  semanticRole: string;
  renderer: string;
  naturalBox: {
    width: number;
    height: number;
    overflowPolicy: "contained" | "intentional-mask";
  };
  parameters: {
    content: Record<string, string | number | boolean | Array<unknown>>;
    timing: {
      cueFrames: Record<string, number>;
      ranges: Array<{id: string; startFrame: number; endFrameExclusive: number}>;
    };
    layout: {
      safeRegion: string;
      semanticAnchor?: {x: number; y: number; unit: "px" | "ratio"};
      markerFootprint?: {width: number; height: number; anchorX: number; anchorY: number};
    };
    style: Record<string, string | number>;
    media: Array<{role: string; kind: string; rightsRecordRequired: boolean}>;
    motion: {
      travelClock: "timeline-frame";
      actionClock?: "independent-local-frame";
      cycleFrames?: number;
    };
  };
  governance: {
    sourceRelationships: Array<{
      name: string;
      relationship: "runtime" | "method-only" | "code" | "asset";
      rightsRecord: string;
    }>;
    privateDataAllowed: false;
  };
  qa: {
    changeAllowlist: Array<string>;
    invariantList: Array<string>;
    requiredFrameWindows: Array<string>;
  };
};
```

参数化的不只是颜色，还必须包括语义。最低可用 Schema 通常需要：

- 观众文案、标签、素材角色和观点文字；
- 语义 cueFrame 与左闭右开区间，不能用段落百分比猜时间；
- 画布或自然盒几何、安全区、关键区域和可见接触点锚点；
- 调色、字体、字号、描边、阴影和对比底带 token；
- 素材角色和权利要求，禁止直接保存本地文件路径；
- 行进时长、动作节奏、转场时长和有意保留的停顿；
- 相对已确认参考的允许变更清单和不变量。

当数量确实可变时，优先使用数组和命名映射，不要固定成 `step1` 到 `step7`。放置前校验区间有序、数值有限、时长非负、素材就绪和字体受渲染器支持。缺少必需参数时必须默认阻断，不能回退到其他项目的无关内容。

### 内容适配门槛

可复用不代表适合当前内容。选择前必须回答：

1. 它承担什么观看任务：导航、证据、对照、因果、强调还是身份表达？
2. 哪句口播或哪个语义区间允许它出现，准确入点和出点是什么？
3. 它的隐喻是否匹配内容、出镜者和语气，还是仅仅因为素材已经存在？
4. 正常速度下，它带来的注意力成本是否低于信息价值？
5. 完整动作包络能否放进真实平台安全布局，并避开字幕、证据、人物小窗和身份标识？
6. 所有素材、字体、身份和方法来源是否自有、已授权或已进入治理记录？

内容不支持品牌化适配时，使用中性的 `G` 方案。写作、计划或结构化思考可以考虑笔尖；直接软件操作可以考虑克制的鼠标或指针；生活、日记、情绪或庆祝可以考虑植物或人物。这些只是候选，不是机械题材预设。凡是暗示错误情绪或抢夺观点注意力的适配，都应否决。

第一次沉淀前必须展示代表静帧和正常速度短动效。确认一个适配，不代表可以原地替换另一个已经确认的适配。

### 可定位时间契约

每个可见状态都必须是“请求帧 + 组件参数 + 不变素材”的纯函数。

- 使用渲染器时间线帧和已声明时长。禁止使用 `Date`、墙钟时间、`requestAnimationFrame`、`setTimeout`、有状态计数器、CSS 实时时钟动画或未设种子的随机数。
- 连续位移使用浮点进度。只有离散贴图帧或状态索引可以取整，人物位置和路径填充不能取整。
- 行进、填充和百分比共用一个归一化进度；走路、转圈、眨眼或轻微书写摆动使用独立局部动作时钟，并保持已批准节奏。
- 不能因为人物移动贯穿全片，就把一个动作循环拉伸到全片。章节或状态切换默认不能重置全局行进，除非语义设计明确需要跳变。
- 声明语义接触点。笔尖、鼠标、指针或工具的可见尖端必须与所代表的终点对齐；完整播放头包络要钳在安全轨道内。如果包络钳制会让接触点脱离，应使用端点姿势、替代锚点或增大安全内缩，不能默许错位。
- 以秒设计的时间常量要按真实时间线 FPS 换算；转换到其他时基后重新验证。
- 跳转到同一帧必须得到相同像素。循环闭合、首个可见状态、最后可见状态和内部转场窗口都属于动作契约。

可定位伪代码：

```js
const p = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
const endpointX = railStart + p * railWidth;
const actionFrame = ((frame - actionStart) % cycleFrames + cycleFrames) % cycleFrames;
const spriteIndex = Math.floor(actionFrame / holdFrames) % spriteCount;
```

### QA 与沉淀

验收默认不通过，直到证据完整。成功修改或一张好看的静帧都不能证明组件合格。

- 修改前复制已确认时间线或组件，记录允许变更项和所有必须保持不变的内容。
- 修改后重新读取项目项、有效参数、几何、源区间、图层顺序和时长。
- 检查开头、中间、结尾、每个语义边界，以及所有图片、标签或状态切换的前后帧。需要连续覆盖时，不得出现空白中间帧或底层漏出。
- 为入场、代表循环、章节或状态边界和结尾渲染正常速度短片。慢放只用于诊断，是否流畅和是否抢注意力以正常速度为准。
- 非顺序跳转并重复渲染同一帧，检查像素确定性、行进单调、循环闭合和边界不重置。
- 对声明的接触点，在代表帧测量终点误差；除非记录了渲染器专有容差，否则控制在一个合成像素内。
- 在所有动作极值检查完整变换包络、自身裁切、alpha 连续性和自然盒 padding。图层位于最上方也不能防止组件裁切自己的子元素。
- 检查原始尺寸、手机尺寸、明暗背景、目标播放器裁切、字幕、证据、人物小窗和平台控件。
- 与已确认基线对比未改动的时间线结构和像素。仅改视觉时，必须证明声音和字幕行为没有变化。
- 检查真实导出，不只看编辑器预览；记录替代组件 ID、审批状态，以及旧组件进入 `A` 还是 `X`。

各等级的额外门槛：

- `G`：中性默认、无私人或单片数据、两个独立内容场景、完整 Schema 和通用 QA。
- `P`：创作者明确确认、自有身份素材、私人存储、精确动作契约和中性兜底。
- `T`：明确题材范围、文案/素材/cueFrame 已参数化，并且至少有一个不同于来源实例的变体。
- `A`：替代版本链接，并从自动选择中排除。
- `X`：匿名最小样本、根因、阻断规则、预期失败，并且不存在进入成片的路径。

### 错误样本

`X` 记录要保持最小且明确：

```json
{
  "id": "example.invalid-motion.v1",
  "classification": "X",
  "symptom": "观众看见的错误",
  "rootCause": "实现为什么失败",
  "blockedRule": "哪条不变量会阻断它",
  "expectedFailure": "自动或视觉验收的失败结果",
  "replacementId": "example.valid-motion.v2"
}
```

适合做回归测试的错误包括：墙钟动画、未限制的播放头包络、接触点漂移、完整人物 alpha 下陷、在扁平人物脸上打局部补丁、凭感觉猜证据区域、标签和画面不同步、转场空白帧、侵入语义安全区，以及原地覆盖已确认资产。记录错误时不能发布错误素材，也不能为了复盘保留私人内容；使用匿名最小样本。

### 标准工作链

1. 审计已有代码组件，分别标记为 `G`、`P`、`T`、`A` 或 `X`。
2. 锁定已确认参考、时间线、动作契约和允许变更清单。
3. 拆分通用机制、可选私人适配和单片实例数据。
4. 在编写或修改渲染器代码前定义并校验参数 Schema。
5. 通过内容适配门槛；内容不支持适配时使用中性默认。
6. 使用可定位的帧时钟和明确语义锚点编写动画。
7. 只放到可回退副本中，然后完成结构、运动、布局、权利和导出 QA。
8. 获得确认，给被替代版本重新分级，并且只沉淀证据真正支持复用的那一层。
