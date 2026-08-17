# Caption Semantic Pagination / 字幕语义分页

Read this reference whenever captions are created, regenerated, or reflowed. Caption width is a layout constraint, never permission to cut raw code points.

创建、重建或重排字幕时必须读取本参考。字幕宽度只是版式约束，不能成为按固定字符数硬切文本的理由。

## 1. Choose And Lock A Break Profile / 选择并锁定断句配置

An approved reference or private creator profile wins. Record the selected profile before generating cards.

已通过参考或创作者私人画像优先。生成字幕卡前必须记录本次使用的断句配置。

### `semantic-card-v1`

- Split completed thoughts from the next thought.
- Prefer clause punctuation, then a natural grammatical constituent when a clause is too long.
- A comma may remain inside a card only when the approved reference permits it and the complete card stays short.

- 完整意思与下一个意思分卡。
- 优先按分句标点切分；单个分句仍过长时，再按自然语法成分切分。
- 只有已通过参考允许且整卡仍然简短时，逗号才可以保留在卡内。

### `comma-and-sentence-short-card-v1`

- Every comma, period, semicolon, colon, question mark, or exclamation mark ends the current card. This includes Chinese and ASCII forms.
- An enumeration comma may stay inside a short list. Split a long enumeration into semantic groups rather than filling the card.
- Keep cards short even when two lines could technically hold more text.

- 每个逗号、句号、分号、冒号、问号或叹号都结束当前字幕卡，中英文标点一视同仁。
- 短枚举可以保留顿号；枚举过长时按语义分组拆卡，不能为了填满画面一直塞字。
- 即使两行还能放下更多文字，也优先保持短卡。

## 2. Atomic Content / 不可拆内容

- Keep Latin words, product names, hyphenated terms, numbers with units, paired quotation/bracket marks, and creator-approved phrases intact.
- Never split `Remotion` into `Remotio` + `n`, put `，` or `、` at the start of a card, or strand a grammatical particle such as `的` because a character counter reached its limit.
- When a clause is still too long, author a semantic break manually. Do not use a fixed-width code-point fallback.

- 英文单词、产品名、带连字符术语、数字与单位、成对引号或括号，以及已确认短语必须保持完整。
- 禁止把 `Remotion` 切成 `Remotio` + `n`，禁止让 `，` 或 `、` 出现在卡首，也禁止因为字符计数到上限而把 `的` 等虚词孤立到下一卡。
- 单个分句仍过长时必须人工确定语义边界，禁止回退到固定字符数硬切。

## 3. Punctuation Rendering / 标点呈现

Author raw pages with manuscript punctuation attached to the preceding card. Only after pagination is locked may the display layer remove detachable page-final commas, periods, semicolons, colons, or enumeration commas. Preserve page-final question/exclamation marks and paired structural closers.

原始分页必须保留文稿标点，并把标点附着在前一张卡上。分页锁定后，呈现层才可以隐藏卡尾可拆逗号、句号、分号、冒号或顿号；卡尾问号、叹号和成对结构闭合符号必须保留。

## 4. Timing / 时序

- Prefer ASR word boundaries or manually verified spoken cues for card boundaries.
- Character-count proportional timing is only a draft fallback. It must be checked against the first and last spoken token of every changed card.
- Short interjections may use a short card; do not merge them across punctuation merely to satisfy a generic minimum duration.

- 优先使用 ASR 词级时间或人工确认的口播词点作为换卡边界。
- 按字数比例分配时间只能作为草稿回退；所有改动卡片都要核对首字和尾字的真实口播时间。
- 短感叹词可以使用短卡，不能为了满足通用最小时长而跨标点强行合并。

## 5. Fail-Closed Audit / 失败即阻断

Before render, run `node scripts/audit-caption-pages.mjs <manifest.json> [report.json]`. The audit must prove:

1. Raw pages reconstruct the manuscript exactly after whitespace normalization.
2. No page starts with detachable punctuation or an orphaned function particle.
3. The selected profile has no forbidden punctuation inside a page.
4. Protected terms remain wholly inside one page.
5. No Latin token is split across adjacent cards.
6. Every display page differs from its raw page only by the approved page-final punctuation rule.
7. Length and timing limits pass, followed by native-size and phone-size pixel review.

渲染前运行 `node scripts/audit-caption-pages.mjs <manifest.json> [report.json]`，并证明：原始卡片可完整重建文稿；卡首无游离标点或虚词；选定配置下卡内无禁止标点；受保护术语完整；英文词未跨卡切断；显示文本只按允许的卡尾标点规则变化；长度与时间检查通过，并完成原尺寸和手机尺寸像素审看。
