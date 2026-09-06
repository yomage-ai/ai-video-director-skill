# Curated Fine-Edit Style Library / 公共策展精剪风格库

Read this reference after rough-cut lock whenever a talking-head project needs a fine-edit direction. Also read the machine registry in [`curated-style-library.json`](curated-style-library.json); the JSON ids and version are the auditable selection contract.

口播粗剪锁定、需要选择精剪方向时读取本参考。同时读取 [`curated-style-library.json`](curated-style-library.json)。其中的风格编号与版本是可审计的选择契约。

## English

### What this layer is

The public repository has two different kinds of reusable knowledge:

1. Universal production rules prevent broken speech, false evidence, unreadable captions, unsafe crops, rights failures, and non-deterministic renders.
2. The bundled Xiaoxiong profile supplies the default audio, exact caption/palette tokens and content-fit priorities; the curated style library provides shareable aesthetic starting points with a content-fit rule, visual contract, B-roll grammar, motion grammar, sound candidates, and QA floor.

A curated style is not a universal template and not a private preference. It is a public, versioned candidate that an unrelated creator can use without access to the original creator's identity art, private project, or reference file. The library intentionally keeps styles that were liked, used, approved, or marked for future work, but those references do not form a closed whitelist.

### Selection order

Use this order after the rough cut is locked:

1. Reuse an exact approved reference when the creator names one and it can be resolved.
2. Translate an explicit style request or supplied reference into the current content.
3. When no style was supplied, retain the bundled Xiaoxiong audio/caption/palette grammar and compare at least two plausible entries using its content-fit priorities. Recommend the best fit, adapting only where content or readability requires it.
4. Start dynamic adaptation only after documenting why at least two curated candidates do not fit fully, or which compatible roles will be borrowed into a new dominant system. Read [dynamic-style-adaptation.md](dynamic-style-adaptation.md).

Do not ask the creator to invent an aesthetic direction merely because they omitted a reference. The Skill owns the first recommendation. Show more than one direction only when two candidates remain meaningfully close. When one candidate clearly wins, one complete `6-12` second audiovisual sample is better than three shallow moodboards.

Selection is based on the viewer's job, evidence type, narrative shape, information density, presenter value, target platform, safe area, and attention cost. Style names are retrieval handles, not reasons.

### Adaptation contract

Selecting a style locks its grammar, not its sample copy or geometry.

- Rewrite all visible copy from the current transcript and evidence.
- Keep the selected palette roles, type hierarchy, icon family, motion character, and B-roll logic coherent across the video.
- Adapt layout to the actual evidence, presenter, captions, aspect ratio, and platform controls.
- Use real screenshots, recordings, documents, and quotes when the viewer's job is proof. Illustration may explain proof but may not replace it.
- Do not distribute or trace a source reference, copy its diagram, or assume its fonts and icons are licensed.
- Treat creator characters, logos, signature outro art, face or voice assets, and exact private project geometry as optional private adapters outside this repository.

Even after a style is selected, choose or author the actual assets from the current semantic beats. A library entry may guide the look of a generated illustration, code motion graphic, screenshot frame, icon set, or licensed clip; it does not require the project to reuse a fixed asset. When no entry is strong enough, the Agent may create a new or hybrid audiovisual direction under the same evidence, rights, cost, privacy, and approval gates.

### Shared visual floor

Every selected style must produce a readable system rather than a pile of decorations.

- One frame has one primary reading order and one dominant viewer task.
- Color has stable semantic roles across cards.
- Icon stroke, corner, fill, and shadow logic stay consistent.
- Dense diagrams reveal sequentially and remain legible at phone size.
- Entrances, internal states, and exits follow the canonical timeline and semantic cues.
- Captions, platform controls, evidence ROIs, presenter faces and gestures, and identity marks have explicit non-collision regions.
- BGM and SFX are heard in the style sample. Dialogue-only remains valid when it wins the comparison.
- Normal-speed motion, native-size frames, phone-size frames, boundary windows, and the final export must all pass.

### Current entries

#### `handdrawn-knowledge-map-v1`

Use for processes, stage gates, system relationships, concept grouping, and abstract AI or software explanations. It uses warm paper, a green main path, yellow/coral/blue semantic accents, hand-drawn frames, arrows, highlighter bands, and compact outline icons. Build one module per spoken beat. Use source evidence separately when the claim depends on exact state.

#### `warm-notebook-journey-v1`

Use for experiments, lessons, progress, chaptered how-tos, creator journeys, and stories whose meaning changes over time. It uses warm paper, paths, tabs, notes, checks, stamps, and framed real media. Navigation elements appear only when real chapters exist. Personal characters or signature markers are private adapters, not part of the public recipe.

#### `bold-evidence-editorial-v1`

Use for proof-led product stories, screen evidence, diagnosis and resolution, numerical results, and before/after comparison. It uses neutral evidence surfaces, one strong accent family, large editorial type, exact ROI callouts, semantic push-ins, and sparse audio hits. The source state remains primary and may not be redrawn or guessed.

#### `color-block-explainer-v1`

Use for comparisons, lists, tool families, pros and cons, myth/fact, and problem/solution structures. It uses stable flat-color categories, modular cards, geometric icons, and a small repeated motion vocabulary. Avoid it when the source evidence is already visually dense or when the topic needs a quiet or photographic tone.

### Adding another style

Add a public style only when it can be expressed without private identity or unlicensed source assets. A new entry needs:

- a stable id and version;
- a viewer-job and content-fit rule;
- strong signals and explicit avoid conditions;
- palette roles, type hierarchy, composition and icon grammar;
- B-roll, presenter, motion and sound guidance;
- evidence, rights, safe-area and phone-readability boundaries;
- provenance that states whether the relationship is method-only, genericized from an approved method, or an original public contract;
- a validation level that does not overclaim what one still or one project proved.

After editing the registry, run `node scripts/audit-curated-style-library.mjs` and the repository test suite before using the new entry in a project.

When a style originated in one creator's work, remove the creator's character, logo, signature motion, unpublished media, exact project copy/timecodes, account state, and private asset ids before public promotion. The creator-approved scalable coordinates, exact colors and ranking priorities are intentionally public in the Xiaoxiong default profile. They are style tokens, not secret project data.

## 简体中文

### 这一层解决什么

公共仓库里需要同时保存两类可复用知识。

1. 通用制作规则负责避免口播断字、证据失真、字幕不可读、平台裁切、版权缺失和渲染不稳定。
2. 内置小熊风格先提供字幕、响度、色值、可缩放坐标和候选优先级；公共策展风格库负责提供可分享的审美起点。每个条目都要写清内容适配、视觉契约、B-roll 语法、动效语法、声音候选和验收下限。

策展风格既不是所有视频必须套用的万能模板，也不是只能留在某个用户私有画像里的个人偏好。它是公开、可版本化的候选方案。陌生创作者不需要拿到原作者的个人 IP、私有工程和参考原图，也能用它做出达到下限的精剪。风格库会有意保留我们喜欢过、使用过、确认过或标记过的方向，但这些参考不组成封闭白名单。

### 选择顺序

粗剪锁定后按下面的顺序选择精剪方向。

1. 用户点名准确的已确认作品，并且可以锁定完整契约时，优先继承该参考。
2. 用户明确提出风格或提供新参考时，把它翻译到本片内容。
3. 用户没有提供风格时，从公共策展风格库中至少比较两个合理候选，由 Agent 推荐内容适配最好的一项。
4. 至少两个公共候选都不能完整适配，或者需要借用其中部分角色建立新主系统时，启动动态适配，并读取 [dynamic-style-adaptation.md](dynamic-style-adaptation.md)。

用户没有提供参考，不代表要把审美任务退回给用户。Skill 必须先给出推荐。只有两个方向在内容、证据和观看成本上确实接近时，才展示多个方向。一个候选明显更合适时，做完整的 `6 至 12 秒` 视听样片，比给三张浅层情绪板更有用。

选择依据包括观众任务、证据类型、叙事形状、信息密度、人物价值、目标平台、安全区和注意力成本。风格名称只是检索入口，不能充当选择理由。

### 改编边界

选中风格以后，锁定的是它的视觉与剪辑语法，不是示例文案和固定坐标。

- 所有可见文案都从当前口播和证据重新编写。
- 同一条视频要保持配色角色、字号层级、图标家族、动效性格和 B-roll 逻辑一致。
- 具体版式按照真实证据、人物、字幕、画幅和平台控件重新排。
- 观众需要核验证据时，必须使用真实截图、录屏、文档或原话。插画可以帮助解释，不能替代证据。
- 禁止分发或描摹参考原图，禁止复制原图的图解、文案，也不能默认其字体和图标已经获得授权。
- 创作者角色、Logo、签名片尾、脸和声音资产，以及私有工程的准确几何，继续作为仓库外的私人适配。

即使已经选中一个风格，本片真正使用的素材仍然按当前语义节点重新选择或制作。公共条目可以指导生成插画、代码动画、截图相框、图标或授权镜头的视觉语言，不要求项目重复使用固定素材。没有条目足够适合时，Agent 可以在同样的证据、版权、成本、隐私和确认边界下，新做动态方案或混合方案。

### 共同精剪下限

每个风格都必须形成可读系统，不能只堆装饰。

- 每一帧只有一个主要阅读顺序和一个主观众任务。
- 同一颜色在不同卡片里保持稳定语义。
- 图标的描边、圆角、填充和阴影逻辑统一。
- 密集图解按口播逐步展开，并在手机尺度保持可读。
- 入场、内部状态和退场都服从统一时间线与语义节点。
- 字幕、平台控件、证据 ROI、人物脸和必要手势、身份标识都有明确的不碰撞区域。
- 视听样片必须真实试听 BGM 和音效。比较后纯人声更合适时可以关闭。
- 正常速度动效、原始尺寸、手机尺寸、边界窗口和最终导出都要检查。

### 当前风格条目

#### `handdrawn-knowledge-map-v1` 暖纸手绘知识地图

适合流程、阶段门槛、系统关系、概念分组，以及抽象的 AI 或软件知识。使用暖白纸张、绿色主路径、黄粉蓝语义点缀、手绘边框、箭头、荧光笔标签和线稿小图标。每个口播节点只增加一个模块。需要核验准确状态时，另用真实证据画面。

#### `warm-notebook-journey-v1` 暖色手账旅程

适合实验、经验、复盘、章节式教程、创作者旅程，以及前后意义发生变化的故事。使用纸张、路径、标签、便签、勾选、印章和真实素材相框。只有存在真实章节时才使用进度与导航。个人角色和签名标记仍属于私人适配，不进入公共风格。

#### `bold-evidence-editorial-v1` 高彩证据编辑

适合产品证明、屏幕证据、诊断与解决、关键数字和前后对比。使用中性证据底面、一个主要高彩强调色、大号编辑字体、准确 ROI 标注、语义推近和稀疏声音重音。真实来源画面始终优先，不能重绘数值或凭缩略图猜框。

#### `color-block-explainer-v1` 彩色模块解释器

适合对比、清单、工具分类、优缺点、真假判断和问题解决结构。使用固定语义色块、模块卡片、几何图标和少量重复动效。真实证据本身已经非常密集或鲜艳，或者内容需要安静、严肃、写实气质时，不优先使用。

### 继续扩充风格库

只有能够移除私有身份和未授权源素材的风格，才能进入公共库。新条目至少要包含这些内容。

- 稳定编号和版本。
- 观众任务与内容适配规则。
- 明确信号与禁用场景。
- 配色角色、字号层级、构图与图标语法。
- B-roll、人物、动效和声音策略。
- 证据、版权、安全区与手机可读性边界。
- 说明它属于方法参考、已确认方法的去身份化版本，还是新写的公共契约。
- 不夸大单张静帧或单个项目能够证明的范围。

修改目录后，先运行 `node scripts/audit-curated-style-library.mjs` 和仓库测试，再把新条目用于真实项目。

某种风格来自一位创作者的作品时，公开前移除角色、Logo、签名动作、未发布素材、单片原文时间点、账号状态和私有素材编号。小熊明确授权共享的可缩放坐标、字幕、色值及排序优先级直接进入公共默认，不另留必需的私人风格包。
