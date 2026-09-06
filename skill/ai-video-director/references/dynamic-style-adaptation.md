# Dynamic Fine-Edit Adaptation / 动态精剪适配

Read this reference after rough-cut lock when no public curated style is a strong enough match, when the content needs a hybrid, or whenever the selected style still requires new visual assets.

粗剪锁定后，如果公共策展风格没有足够匹配的条目、内容需要混合方案，或者选中的风格仍然缺少本片专用视觉素材，就读取本参考。

## English

### The library is a reference set, not a ceiling

The curated library preserves styles that were liked, used, approved, or deliberately marked for future work. Those entries provide retrieval cues, proven patterns, and a quality floor. They are not the complete universe of acceptable visuals and not a closed asset picker.

Content fit remains the primary decision. A dynamic direction may:

- use one curated style as the main grammar and author new transcript-specific assets;
- borrow compatible roles from two references, such as one composition grammar and another evidence treatment;
- design a new visual system when no active entry is strong enough;
- select real footage, screenshots, documents, generated raster art, code-authored motion, typography, icons, licensed media, or a hybrid per semantic beat.

Do not combine styles merely to appear creative. A hybrid needs one dominant system and a written reason for every borrowed role.

### Beat-first asset decisions

For every major semantic beat, record:

1. the viewer job and spoken or semantic cue;
2. whether the beat needs proof, explanation, comparison, atmosphere, transition, emphasis, or no additional asset;
3. the selected asset form and why it is more suitable than the alternatives;
4. whether the asset is creator-provided, owned, captured, code-authored, generated, licensed, or not applicable;
5. the renderer or tool and the expected visible result;
6. the evidence, privacy, rights, cost, and platform-safe boundary;
7. how the asset inherits or extends the chosen visual system.

Use real evidence when the viewer must verify a state or claim. Use designed or generated material when the viewer needs an explanation, metaphor, orientation, mood, or impossible-to-film illustration. Label uncertainty instead of making generated material look like documentary evidence.

Before paid generation, licensed acquisition, account login, identity use, or rights-sensitive capture, apply the existing approval gate. Prefer code-authored or owned assets when they can perform the same semantic job with lower rights and reproducibility risk.

### Synthesize one audiovisual system

When the library does not supply a complete match, define these roles before full authoring:

- **Palette:** background, ink, primary accent, secondary semantic accents, warning/error, success/resolution, and evidence-neutral surfaces.
- **Typography:** display, body, number/data, caption relationship, maximum hierarchy depth, and phone-scale limits.
- **Composition:** reading order, evidence plane, presenter role, card geometry, safe regions, and how layouts change between semantic beats.
- **Imagery and icons:** photographic, illustrative, geometric, hand-drawn, interface-native, or mixed, with one coherence rule.
- **Motion:** entry, hold, internal state, exit, transition, cadence, and the maximum simultaneous motion budget.
- **Music:** energy, texture, density, dialogue carve, and where silence is stronger.
- **Sound effects:** a small semantic vocabulary for actions, reveals, comparisons, errors, confirmations, or punchlines.

The visual asset, animation, BGM, and SFX must support the same tone. A playful icon system with clinical music, or a quiet evidence piece with constant pop sounds, is a fit failure even when each layer is individually polished.

### Dynamic-adaptation trigger

Use `styleSource.mode = dynamic-adaptation` when any of these conditions applies:

- no active public style passes the content-fit review;
- a strong candidate covers only part of the viewer job and needs a new dominant system;
- the topic, audience, platform, evidence, or presenter produces a combination not represented by the library;
- the best direction is an intentional hybrid whose dominant grammar and borrowed roles can be named.

Record at least two considered library ids, rejection or borrowing reasons, the fit gap, the new system, and the asset decisions. `content-derived` is accepted only as a legacy alias for older project records; new work uses `dynamic-adaptation`.

### Verification

Dynamic does not mean ungoverned. Before full fine edit:

- render one representative still and a normal-speed `6-12` second audiovisual sample;
- verify the actual asset outputs, not only prompts or descriptions;
- inspect every generated or designed asset for text accuracy, factual implication, continuity, artifacts, and rights status;
- check native and phone scale, captions, platform controls, presenter, evidence ROI, bright/dark/busy surfaces, and transition boundaries;
- confirm that the full video can reuse the system without turning every beat into a different art direction;
- record what should become a new public style candidate after the project and what remains project-only.

## 简体中文

### 风格库提供参考，不封住上限

公共策展风格库会保留我们喜欢过、使用过、确认过或专门标记过的风格。它们提供检索线索、经过实践的办法和精剪下限，但不是所有可用视觉的全集，也不是一个封闭素材选择器。

内容适配始终优先。动态方案可以这样工作。

- 选择一个公共风格作为主语法，同时为当前口播重新制作素材。
- 从两个参考中借用能够共存的角色，例如使用一套构图语法，加上另一套证据呈现方法。
- 没有公共条目足够适合时，为本片建立新的视觉系统。
- 每个语义节点分别选择实拍、截图、文档、生成图片、代码动画、排版、图标、授权素材或混合形式。

不能为了显得丰富就拼接风格。混合方案必须有一个主系统，并写清每个借用部分解决了什么问题。

### 先按内容节点决定素材

每个主要语义节点都要记录这些信息。

1. 观众任务和对应口播或语义节点。
2. 当前需要的是证据、解释、对比、氛围、转场、强调，还是不需要新增素材。
3. 选择哪种素材形式，以及它为什么比其他候选更适合。
4. 素材来自创作者、已有自有素材、现场截取、代码制作、AI 生成、授权素材库，还是不适用。
5. 使用什么渲染器或工具，预期在画面上看到什么。
6. 证据、隐私、版权、成本和平台安全边界。
7. 它怎样继承或扩展当前视觉系统。

观众需要核验状态和观点时使用真实证据。观众需要解释、比喻、定位、情绪或现实中无法拍摄的画面时，可以使用设计或生成素材。生成内容不能伪装成纪实证据，不确定的地方要明确标记。

涉及付费生成、购买授权素材、账号登录、身份使用或版权敏感截取时，继续执行已有确认门。代码制作或自有素材能完成同一语义任务时，优先选择权利和复现风险更低的路线。

### 合成一套完整视听系统

现有风格不能完整覆盖内容时，完整制作前要定义这些角色。

- **配色**包括背景、文字、主强调、辅助语义色、警告或错误、成功或解决，以及证据中性底面。
- **字体**包括标题、正文、数字或数据、字幕关系、最多层级和手机尺寸下限。
- **构图**包括阅读顺序、证据主平面、人物角色、卡片几何、安全区，以及语义节点之间怎样换版式。
- **图片和图标**明确使用摄影、插画、几何、手绘、界面原生或混合形式，并设定一条统一规则。
- **动效**明确入场、停留、内部状态、退场、转场、节奏，以及同一时刻最多允许多少运动。
- **音乐**明确能量、质感、密度、人声让位和哪些地方安静更好。
- **音效**只保留一组小而稳定的语义词汇，用于操作、揭示、比较、错误、确认或笑点。

画面素材、动画、音乐和音效必须支持同一种气质。可爱跳动的图标配上临床式冷音乐，或者安静证据内容一直响弹出音，即使每层单看都很精致，整体仍然属于适配失败。

### 什么时候启动动态适配

出现下面任一情况时，使用 `styleSource.mode = dynamic-adaptation`。

- 没有公共风格通过内容适配检查。
- 某个候选只覆盖一部分观众任务，仍然需要新的主系统。
- 题材、受众、平台、证据和人物的组合不在现有风格库中。
- 最优方向是有意设计的混合方案，并且可以说清主语法和借用角色。

记录至少两个比较过的公共风格编号、拒绝或借用理由、适配缺口、新视觉系统和素材决定。`content-derived` 只作为旧项目记录的兼容别名，新项目统一使用 `dynamic-adaptation`。

### 验收

动态适配不等于不受约束。进入完整精剪前要完成这些检查。

- 渲染一个代表性静帧和 `6 至 12 秒` 正常速度视听样片。
- 检查真正生成或制作出来的素材，不能只检查提示词和文字描述。
- 逐项检查生成或设计素材的文字准确性、事实暗示、连续性、瑕疵和权利状态。
- 检查原始尺寸、手机尺寸、字幕、平台控件、人物、证据 ROI、明暗复杂背景和转场边界。
- 确认整条视频能够持续复用这套系统，不会每个节点都变成另一种美术方向。
- 记录哪些做法值得在项目结束后升级为新的公共风格候选，哪些只属于本片。
