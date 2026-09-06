# First Approval And Style Gates / 首次确认与样式确认

Use this reference when a new video asks for a content lock, director plan, or style direction. It keeps the first decision fast and separates editorial intent from fine-edit styling.

新视频需要内容锁定卡、导演方案或样式方向时读取本参考。目标是让第一次确认足够快，并把内容与粗剪决定和精剪样式决定分开。

## English

### First approval is a content and rough-cut gate

The first user-facing response answers only these questions:

1. What is the video's primary claim and evidence order?
2. What spoken material will be retained, removed, or compared as retakes?
3. What rough-cut risks need special listening, including clipped words, long joins, pace drift, or source limitations?
4. Which evidence assets will probably be needed later?
5. Which fine-edit decisions are inherited, explicitly referenced, or deferred?

Do not make an unreferenced visual style feel approved at this stage. When there is no exact approved reference or explicit style reference, write `fine-edit style: deferred until rough-cut timing is approved`. You may name one or two likely entries from the public curated style library as unapproved starting candidates when the content already supports them. A palette, card system, progress component, presenter treatment, BGM, or sound-effect grammar is not locked merely because it appears in the early director brief.

The early director plan should still recommend useful starting treatments instead of returning an empty style section. Label each one `recommended starting point`, name the content evidence behind it, and name what remains deferred. For portrait `B-base-A-cutout`, recommend lower-left and lower-right as the first placement candidates and outline `on`; defer the exact side, color, width, and any justified override until the audiovisual sample unless an exact approved treatment exists. For portrait short-form captions, recommend one semantic line per card and permit two lines only when one line would cause tiny type, over-fast cards, harmful semantic fragmentation, or conflict with an exact approved reference. A recommendation must remain overridable; it is neither a hidden house lock nor an approval claim.

### Fast path

When a reliable user-supplied manuscript exists, use it for the first content gate together with local media metadata and a quick source-orientation check. Full word timing, every-take comparison, and complete normal-speed listening remain mandatory before rough-cut review, but they do not need to delay the first content decision.

Before the first approval, do not:

- upload multi-gigabyte media to a cloud editor unless local inspection cannot answer the gate;
- retry a failed cloud upload merely to produce the content card;
- render a rough cut, background removal, motion graphic, style sample, or release master;
- perform publication research when publication is not requested and no composition constraint depends on it;
- analyze a visual reference that has not yet been supplied or selected.

Run independent local probes and manuscript inspection in parallel. Reuse a doctor result within the same task unless the environment changed. Record deferred work instead of performing it speculatively.

With a reliable manuscript and locally readable media, target the first human-facing card within about `15 minutes`. This is an operating target, not a quality guarantee. If a true blocker would exceed it, report the blocker and deliver the best clearly labeled provisional content card from available evidence instead of silently starting heavy work.

### Human-facing output

The machine JSON is an internal project record. Never paste raw JSON, schema keys, clip ids, or English-only machine values as the approval card unless the user explicitly asks for them.

Reply in the user's language with compact Markdown and these plain-language sections:

- Content lock
- Director judgment
- Rough-cut plan
- Evidence plan
- Deferred fine-edit decisions
- Exact approval question and what happens next

For a Chinese user, headings and explanations must be Chinese. Save the human-readable Markdown beside the machine JSON when the project keeps audit artifacts.

Start from `assets/templates/director-brief.<language>.template.md` and run `node scripts/audit-director-brief.mjs <brief.md> --language <zh-CN|en>` before showing it. The audit blocks missing approval sections, a language mismatch, and leaked JSON/schema fields.

### Style gate after rough-cut lock

- With an exact approved creator reference, reuse its locked contract and show one delta sample for the decisions that genuinely change.
- With an explicit new reference, translate its grammar into the current content and show the translated result.
- Without either, read the public curated style library, compare at least two plausible entries, and recommend the strongest content fit. When no entry is a complete match, start dynamic adaptation and record the fit gap, any borrowed reference roles, the new asset plan, and the coherent audiovisual system.
- A valid approval sample includes actual dialogue, captions, the selected B-roll or evidence treatment, presenter treatment when used, and the proposed BGM/SFX state. The evidence treatment may be still, recording, or hybrid. Silent stills cannot approve an audiovisual style.

## 简体中文

### 第一次只确认内容和粗剪方向

第一次给用户看的内容只回答五个问题：

1. 这条视频的主旨、证据和叙事顺序是什么。
2. 哪些口播保留、删除，哪些重录需要比较。
3. 粗剪有哪些必须重点听审的风险，包括字头字尾、长衔接、语速漂移和素材限制。
4. 后续大概需要哪些真实证据素材。
5. 哪些精剪决定已有可靠参考，哪些要等粗剪锁定后再确认。

没有准确的已确认作品或用户明确给出的风格参考时，必须写明“精剪风格暂不锁定，粗剪确认后通过视听样片决定”。内容已经足以支持判断时，可以把公共策展风格库里一两个可能方向写成“尚未批准的推荐起点”。早期导演方案里出现的配色、卡片、进度条、人物形式、背景音乐或音效建议，不自动等于用户已经批准。

但早期导演方案也不能把样式部分全部留空。应当给出有依据的“推荐起点”，同时写清哪些细节仍待后续确认。竖屏 `B-base-A-cutout` 人物抠像先推荐左下和右下两个位置候选，并推荐描边开启；除非已有精确确认的处理，否则具体侧边、颜色、宽度和任何覆盖理由要等视听样片后确定。竖屏短视频字幕先推荐“一张字幕卡一行完整语义”；只有单行会导致字号太小、切换过快、语义破碎，或与精确已确认参考冲突时，才改用两行并记录原因。推荐项必须可以被内容或已确认参考覆盖，不能把推荐起点伪装成已经批准的风格锁。

### 快速首轮

用户已经提供可靠文稿时，第一次内容确认优先使用文稿、本地媒体参数和快速素材核对。逐词时间、全部重录比较和全片正常速度听审仍然是粗剪前的必做项，但不需要拖住第一次内容判断。

第一次确认前禁止做这些工作：

- 本地检查足够时，提前上传数 GB 素材到云端剪辑器。
- 为了生成内容卡，反复重试失败的云端上传。
- 提前渲染粗剪、抠像、动效、样式片或发布母版。
- 用户没有要求发布，且构图不受影响时，提前做发布规则研究。
- 用户尚未提供或选择参考时，凭空做完整风格分析。

互不依赖的本地探测和文稿阅读应并行执行。同一任务内环境没有变化时复用 Doctor 结果。暂时不需要的工作写入后续清单，不提前消耗时间。

可靠文稿和本地素材都可读时，第一次给人看的确认卡以约 `15 分钟` 为内部目标，但这不是质量保证。如果确实存在阻塞并会超时，应说明阻塞，并先用已有证据交付一份明确标注“待后续核验”的内容卡，不能悄悄转去做重型处理。

### 给人看的输出

机器 JSON 只用于项目内部记录。除非用户明确索要，不得把原始 JSON、字段名、片段编号或整页英文机器值直接当成导演方案发给用户。

用户使用中文时，必须用中文 Markdown 给出简洁的内容锁定卡和导演方案，至少包括：

- 内容锁定
- 导演判断
- 粗剪方案
- 证据计划
- 暂缓确认的精剪项
- 本轮确认问题与确认后会做什么

项目需要留档时，同时保存同语言的可读 Markdown 和内部 JSON。

从 `assets/templates/director-brief.<language>.template.md` 起草，展示前运行 `node scripts/audit-director-brief.mjs <brief.md> --language <zh-CN|en>`。缺少确认板块、语言不匹配或泄露 JSON/内部字段时，审计必须阻断。

### 粗剪锁定后的样式确认

- 已有准确的创作者确认参考时，继承其完整契约，只为真正变化的部分做差异样片。
- 用户给了新参考时，把参考的构图、节奏和声音角色翻译到当前内容，不能只抄表面元素。
- 两者都没有时，读取公共策展风格库，至少比较两个合理候选，再推荐内容适配最好的一项。没有条目能够完整匹配时，启动动态适配，记录适配缺口、借用的参考角色、新素材计划和完整视听系统。
- 合格样片必须包含真实口播、字幕、已经选定的 B-roll 或证据呈现、计划使用的人物形式，以及背景音乐和音效状态。证据呈现可以是截图、录屏或混合形式；静音静帧不能批准完整视听风格。
