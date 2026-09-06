# Content-Driven Fine Edit / 内容驱动的精剪

Read this reference after rough-cut timing is locked and before building a full fine edit.

粗剪时间线锁定后、制作完整精剪前读取本参考。

## English

### Design from the viewer's job

For every semantic beat, write the viewer's job first: see the speaker, inspect proof, understand a process, compare states, feel a turn, or pause on a conclusion. Choose the layout, motion, presenter role, color emphasis, music, and sound effect from that job. Then use the selection order below. A curated style is a content-matched design system, not a preset pasted onto the footage.

Map every major hook, proof reveal, number, turn, punchline, and conclusion to an explicit emphasis decision: `none`, `visual`, `audio`, or `both`, with a reason. `None` is valid when the delivery already carries the beat. The gate exists to prevent a strong conclusion or unresolved question from being left flat merely because earlier cues received all of the design attention.

### Style-source selection

Read [curated-style-library.md](curated-style-library.md) and its JSON registry before choosing a direction.

1. Reuse an exact approved reference when the creator names one and its complete contract can be resolved.
2. Translate an explicit user style or supplied reference to the current content.
3. When neither exists, compare at least two plausible active curated styles and recommend the strongest fit. Do not ask the creator to invent a style merely because the request omitted one.
4. Use `dynamic-adaptation` only after recording why at least two curated candidates fail as complete solutions, or which compatible roles will be borrowed into a new dominant system. `content-derived` remains a legacy alias for older project records.

The selected public style supplies a palette role system, type hierarchy, icon family, B-roll grammar, motion character, sound candidates, and quality floor. The bundled Xiaoxiong profile also provides exact scalable subtitle and layout tokens. It does not lock sample copy, unscaled one-project geometry, presenter placement regardless of evidence, or a private creator asset. Adapt those values to the current transcript, evidence, aspect ratio, caption lane, and platform controls, then prove the result in the audiovisual sample.

Record the library version, considered style ids, selected id, selection reason, and adaptation summary in `fine-edit-direction.json`. When two candidates remain materially close, show distinct directions. When one clearly wins, show one complete recommended sample instead of three shallow variants.

### Beat-level asset plan

The curated library is a reference set, not an asset whitelist. Even when a style matches, choose or author the actual assets from the current semantic beats. For every major beat, record the viewer job, semantic role, selected asset form, reference style ids when relevant, source or generation plan, renderer, expected visible result, style adaptation, and rights/evidence/privacy boundary.

The asset form may be real footage, a screen recording, still image, document, generated raster, code motion, typography, icons, licensed media, a hybrid, or explicitly `none`. Every major content beat needs a decision, including the decision that the performance already carries it and no additional asset should compete.

When no curated entry fits, read [dynamic-style-adaptation.md](dynamic-style-adaptation.md). Define one dominant palette, type hierarchy, composition, imagery/icon rule, motion and transition grammar, music role, and SFX vocabulary. Library entries may still be cited as references for compatible roles, but the new direction is not limited to their assets or combinations.

### Screen evidence

- Default to one primary evidence plane at a time.
- Establish the whole interface briefly, then push, pan, or cut to the exact region named by the narration.
- A temporary magnifier or synchronized detail crop may clarify a small value or tooltip, but it must have a declared focal job and short exit time.
- Do not persistently duplicate one synchronized screen recording into two equal regions. Use split screen only for a genuine simultaneous comparison, such as before/after, two products, or cause/result that must stay visible together.
- Choose a still, recording, or hybrid from the viewer's job, legibility, credibility, rhythm, and attention cost. When usable screen footage is supplied, inspect it first and compare it with representative stills or extracted frames. Prefer motion when temporal action materially improves understanding or energy; prefer a still when the state is clearer without motion. Neither format is mandatory by category alone.
- Allocate source ranges across the complete story before authoring the full fine edit. Give each evidence run a narrative role such as cold open, overview, detail, diagnosis, or resolution; record its source-range id and what new information it contributes. A cold open may establish the page, but a later detailed explanation should normally reveal a different or more complete range. Reusing the exact same range is allowed only when the repetition has a declared recall, comparison, or orientation job.

### Presenter and composition

Select `A-only`, `B-only`, or `AB-live` for each run. When presenter and evidence coexist, declare whether the presenter is foreground, supporting, or background. For portrait `B-base-A-cutout`, start with the lower-left and lower-right as the public recommended zones, then choose the clearer side from evidence occupancy, gaze, gesture, captions, and platform controls. Start with the outline `on`. These recommendations are overridable rather than mandatory: an exact approved reference or documented content conflict may use another zone or turn the outline off. When an outline is selected, derive it from the same alpha and choose its color and width only after analyzing hair or headwear, clothing, skin-edge separation, all recurring underlying backgrounds, the content/brand palette, approved creator tendencies, and phone-scale contrast. Preserve the face and required gesture, but never cover the active evidence region merely to keep the presenter visible.

### Portrait captions

For portrait short-form, start with one semantic line per caption card as the public recommendation. Split long thoughts into consecutive one-line cards before wrapping. Use two lines when the one-line treatment would force tiny type, over-fast card changes, or harmful semantic fragmentation; record the override and verify it at phone scale. An exact approved reference may also override the recommendation. Neither line count permits fixed-width or mid-word splitting.

### Music and sound

- Rough cut remains dialogue-first and may stay music-free.
- Fine edit must explicitly audition the audio design. `BGM off` is a valid result, not a default inherited from intake.
- When no audio style is locked, compare a rights-cleared or generated music treatment against dialogue-only inside the audiovisual style sample.
- BGM must support the content's energy and leave speech clear through level, EQ/carve, and automation.
- SFX mark motivated turns, interface actions, numbers, reveals, or punchlines. Avoid constant decorative sounds and repeated emphasis on every caption.
- Record rights and the exact cue list before full render.
- Tell the creator what each enabled audio layer actually is: AI-generated for this project, licensed library audio, creator-provided, commissioned original, or another cleared source. Record the provider or library, rights-manifest item, and generation job or asset id when applicable. Project-specific AI generation is not the same as verified exclusive authorship, and licensed library SFX must never be called original merely because the edit timing and mix are custom.

### Audiovisual approval sample

A style sample should normally last about `6-12 seconds`, long enough to judge one complete beat rather than a rapid montage. It must use actual or timing-faithful dialogue, final-like captions, the selected evidence treatment, presenter treatment when applicable, and the proposed BGM/SFX state. The evidence treatment may be still, recording, or hybrid. If the final recommendation is dialogue-only, show that intentionally and state why.

## 简体中文

### 先确定观众此刻要完成什么

每个内容段先写清观众任务，例如看人物表达、检查证据、理解流程、比较状态、感受反转或停在结论。再从这个任务决定版式、运动、人物层级、颜色强调、音乐和音效，随后按下面的顺序选择风格来源。公共策展风格是经过内容匹配的设计系统，不能当成一个直接盖到素材上的预设。

对主要 Hook、证据揭示、数字、转折、笑点和结论逐项登记强调决定：`none`、`visual`、`audio` 或 `both`，并写清理由。口播表演本身已经足够时可以选择 `none`。这道门禁的作用，是防止前面已经用了动画和音效以后，真正重要的结论或悬念反而没有任何起伏。

### 选择风格来源

选择精剪方向前，读取 [curated-style-library.md](curated-style-library.md) 和对应 JSON 目录。

1. 用户点名已确认参考，并且能够锁定完整契约时，优先继承该参考。
2. 用户明确提出风格或提供新参考时，把它翻译到当前内容。
3. 两者都没有时，至少比较两个合理的公共策展风格，由 Agent 推荐适配最好的一项。不能因为用户没写参考，就让用户自己发明风格。
4. 只有写清至少两个公共候选为什么不能作为完整方案，或者哪些角色会被借入新的主系统后，才能使用 `dynamic-adaptation`。`content-derived` 只作为旧项目记录的兼容别名。

公共风格提供配色角色、字号层级、图标家族、B-roll 语法、动效性格、声音候选和验收下限。小熊风格的准确色值、字幕和可缩放版式参数已经内置；它不锁定示例文案、忽略内容占位的人物位置或私人创作者资产。具体数值要根据本片口播、证据、画幅、字幕区和平台控件重新调整，再通过视听样片证明效果。

在 `fine-edit-direction.json` 中记录风格库版本、比较过的风格编号、选中的编号、选择理由和本片改编摘要。两个候选确实接近时再展示不同方向；一个候选明显更好时，交付一个完整推荐样片，不要做三个浅层变体。

### 按内容节点安排素材

公共风格库是一组参考，不是素材白名单。即使某个风格匹配，本片真正使用的素材仍然根据当前语义节点重新选择或制作。每个主要节点都要记录观众任务、素材角色、选择形式、相关参考风格编号、来源或生成计划、渲染器、预期画面、风格改编，以及版权、证据和隐私边界。

素材形式可以是真实镜头、录屏、静态图、文档、生成图片、代码动画、排版、图标、授权素材、混合形式，也可以明确选择 `none`。每个主要内容节点都必须有决定，包括“人物表演已经足够，不增加素材以免抢注意力”。

没有公共条目足够适合时，读取 [dynamic-style-adaptation.md](dynamic-style-adaptation.md)。定义一套主导配色、字号层级、构图、图片或图标规则、动效与转场、音乐角色和音效词汇。仍然可以把公共条目作为某些兼容角色的参考，但新方案不受现有素材和组合限制。

### 录屏证据

- 默认每个时刻只有一个主证据画面。
- 先短暂交代页面全貌，再按照口播推近、平移或切到正在讲的区域。
- 小数字或 tooltip 可以使用临时放大窗或同步细节裁切，但必须写清焦点作用和退出时间。
- 禁止把同一份同步录屏长期复制成上下或左右两个同等画面。只有修改前后、两个产品，或者必须同时观察的因果两端才使用分屏。
- 截图、录屏或混合形式要根据观众任务、可读性、可信度、节奏和注意力成本选择。已经提供可用录屏时，先检查录屏，再与代表性静帧或截图对比；时间变化确实让内容更容易理解、更有操作感时优先录屏，静态画面更清楚时就用静态图。不能按内容类别机械写死任何一种形式。
- 完整精剪前先把录屏源区间分配到整条叙事。每段登记冷开场、全貌、细节、诊断、解决等叙事角色、源区间编号，以及相比前文新增了什么信息。开头可以先建立页面和异常，但后面专门讲解时通常要展示不同或更完整的区间。重复同一源区间不是绝对禁止，只有明确承担回忆、对照或重新定位时才保留并写明理由。

### 人物与构图

每段先选择 `A-only`、`B-only` 或 `AB-live`。人物和证据同时出现时，再声明人物是前景、辅助还是背景。竖屏采用 `B-base-A-cutout` 人物抠像时，公共推荐先看左下和右下，再根据证据占位、视线、手势、字幕和平台控件选择更清楚的一侧；描边推荐默认开启。推荐起点可以覆盖，不是硬锁：精确已确认参考或有记录的内容冲突，可以改用其他位置或关闭描边。最终使用描边时，必须由同一 Alpha 生成，颜色和宽度综合头发或头饰、衣服、肤色边缘、整段背景素材、内容或品牌配色、创作者已确认倾向及手机尺度对比度决定。脸和必要手势需要保留，但不能为了持续露出人物而遮挡当前证据。

### 竖屏字幕

竖屏短视频字幕以“一张字幕卡一行完整语义”作为公共推荐起点。长句先拆成连续单行卡；只有单行会导致字号过小、字幕切换过快或语义被破坏时，才改用两行并记录覆盖理由，再做手机尺度复核。精确已确认参考也可以覆盖推荐。无论一行还是两行，都禁止固定字符数硬切或从词中间截断。

### 背景音乐和音效

- 粗剪以人声为主，可以暂时没有音乐。
- 精剪必须真正试听声音设计。`关闭 BGM` 可以是判断结果，不能从项目初始化一路继承成默认答案。
- 没有锁定声音风格时，在视听样片中比较一版权利清楚的音乐方案和纯人声方案。
- BGM 根据内容能量选择，并通过音量、均衡或动态让位保证人声清楚。
- 音效只服务转折、操作、数字、揭示和笑点，不给每张字幕都加装饰声。
- 完整渲染前记录音乐权利和准确音效点位。
- 对每一层启用的声音都要向创作者说明真实来源：本片 AI 生成、授权音效库、创作者提供、委托原创或其他已清权来源，并记录模型或素材库、权利清单条目，以及适用时的生成任务或素材编号。“为本片生成”不自动等于已验证的独家原创；素材库音效也不能因为点位和混音由 Agent 定制就称作原创。

### 视听样片

样片通常使用 `6 至 12 秒` 的完整内容段，让用户能判断真实观看感，不能只做快速状态拼盘。样片必须包含真实或时间准确的口播、接近最终的字幕、已经选定的证据呈现、需要时的人物形式，以及计划采用的 BGM 和音效状态。证据呈现可以是截图、录屏或混合形式。推荐纯人声时也要明确展示，并说明理由。
