# Dialogue Join Audit / 对白衔接检查

Use this reference for every speech-led rough cut, especially after retake selection, transcript-linked edits, or user feedback about long pauses, swallowed words, or obvious jump cuts.

每条口播粗剪都要使用本检查，尤其是在选择重录片段、做完文本联动剪辑，或收到“停顿太长、字没说清、剪接明显”等反馈之后。

## Acceptance Contract / 验收约定

- Every intended sentence opening and closing word is fully audible. Transcript text is evidence for orientation, not proof of the sound.
- 每句应保留文案的开头和结尾都必须完整可听；转写只能用于定位，不能代替听审。
- Every changed join preserves the expected last token before the boundary and expected first token after it, in the correct order and without duplication.
- 每个改动过的衔接点都要记录并听清“前一句最后一个词”和“后一句第一个词”，顺序正确且不能重复。
- A swallow, lip smack, mouth reset, conspicuous inhale, or abandoned gaze reset is an unwanted event when it sits inside a new join. It is not protected as a natural breath.
- 吞咽、咂嘴、口腔复位、突出的吸气和废弃录制中的眼神复位，如果落在新衔接里，就属于应去除内容，不能当作“自然气口”保留。
- Audio correctness wins when a clean word boundary conflicts with a perfect facial pose. Cover an unavoidable picture jump with motivated B-roll rather than damaging speech.
- 当清楚的语音边界和完美表情无法同时满足时，优先保证文案可听；必要时用有内容动机的 B-roll 覆盖画面跳切。

The decision order is strict: `intended word intelligibility -> natural pause and mouth-noise cleanup -> picture continuity`. A join that sounds smooth but deletes or obscures one manuscript character fails at the first gate.

判断顺序必须固定为：`文案字词完整可听 -> 气口自然且无吞咽杂音 -> 画面连续`。衔接即使听起来顺，只要切掉或模糊了文案中的一个字，也应在第一道门退回返修。

## Boundary Method / 边界方法

Audit speech **inside every retained source interval**, not just the joins between placed items. ASR can collapse a restart into one clean sentence and assign the hidden repetition to an unusually long word. A clean transcript is not evidence that speech occurs only once. Overlapping short transcriptions and timing anomalies can locate candidates; compare against the source sound before deciding. Once repetition is reported, enumerate retained and removed occurrences across the whole source and verify the rendered occurrence count. Unresolved source/render transcription disagreements remain blocking issues, not notes handed to the creator as finished cleanup.

检查对象包括**每个保留区间内部的发音**，不只有时间线片段之间的剪点。转写可能把重说合并成一句，再把重复时长塞进一个异常长的词；文稿干净不能证明只说了一次。短窗口重叠转写与时长异常只用于定位，取舍必须回到原声。收到重复反馈后，Agent 全片枚举保留和删除的发音次数，并核对成片；源转写与成片转写的分歧未解决时必须阻断，不能带着备注当作已清理完成。

For blinking, eye/gaze resets and expression continuity, inspect the motion around the cut, including the outgoing tail and incoming lead-in; three adjacent stills alone miss events a few frames away. Move the cut only while preserving the entire word. Do not remove every natural blink, stretch a freeze, or cover a defect with B-roll before determining whether the original A-roll can be joined cleanly.

快眨眼、眼神复位与表情衔接要看剪点前后的连续变化，包括出点尾部和入点预留，不能只看相邻三帧。调整剪点必须保住完整字词；不批量删除自然眨眼，不靠定格延长或先盖 B-roll 回避 A-roll 本身可修的衔接。

1. Mark semantic boundaries first. Do not place a cut inside a word, consonant release, or meaningful emphasis merely because the transcript row ends there.
2. Before editing, write the expected last and first tokens for the join. Include particles or short function words when the manuscript requires them.
3. On the outgoing side, keep the full final word and its natural release, then stop before swallow, lip smack, mouth reset, or stale dead air.
4. On the incoming side, preserve the complete first consonant and word onset. Use only the minimal clean pre-roll needed to avoid a clipped attack.
5. Inspect the outgoing and incoming picture near the candidate boundary. Prefer open eyes, stable gaze, and a settled mouth when audio permits it.
6. Render the actual edit. A timeline marker, waveform, transcript, or transition property is not final proof.
7. For a repeated word at a segment edge, never assume that striking the first written occurrence preserves the second spoken onset. Inspect source word timing and the actual waveform, then verify which occurrence the rendered media retained. When the two occurrences are contiguous, a transcript strike may map to the wrong acoustic event; keep or trim by the decoded source boundary, render a short comparison window, and accept only one clearly audible occurrence.

1. 先按语义找边界，不能因为转写分段刚好结束，就把剪点放在词中、辅音收尾或重音内部。
2. 动剪之前先写清这个衔接应听见的前后两个词；文案需要的语气词和短词也要算。
3. 前一段保留完整句尾和自然收音，然后在吞咽、咂嘴、口腔复位或拖长空白之前结束。
4. 后一段保留完整起音，只留下避免爆头或截辅音所需的最短干净预留。
5. 在语音允许时，优先选择睁眼、眼神稳定、嘴型落稳的画面边界。
6. 必须检查真实渲染结果；时间线标记、波形、转写和转场属性都不是最终证明。
7. 遇到片段边界上的叠字，不能认为“划掉转写中的第一个字”就必然保住第二个字。应同时检查原声字级时序和真实波形，再从渲染结果确认究竟保留了哪一次起音。两次发音紧挨时，文本划线可能映射到错误的声学事件；应按解码后的源边界保留或修剪，渲染短对照片段，最终只接受一次清楚可听的目标字。

## Pause Classification / 气口分类

- Phrase-internal breath: normally preserve when it supports phrasing; shorten only when it is clearly disruptive.
- Sentence-flow or retake join: `0.20-0.40 s` is a useful review candidate for compact social speech, not a universal value.
- Topic or emphasis pause: often longer; preserve the rhetorical function before optimizing pace.
- Restart gap or failed take: remove with the abandoned words and mouth-reset material.

- 句内呼吸：通常保留；只有明确拖慢表达时才收短。
- 句间流动或换 take 衔接：短视频口播可先以 `0.20-0.40 秒`作为试听候选，但绝不是统一标准。
- 转题或强调停顿：可能更长，先保住表达功能，再优化节奏。
- 重启录制或说错后的空白：与废弃词、吞咽和口腔复位一起去除。

Scan the render for unexplained silent regions longer than about `0.60 s`, but treat the result as a review queue, not an auto-cut list. Room noise can hide a pause from silence detection, while a deliberate rhetorical pause can be valid.

可扫描成片中约 `0.60 秒`以上的异常静段，但扫描结果只是复核清单，不能自动剪掉。底噪可能让检测漏掉停顿，而有表达作用的停顿也可能完全合理。

## Expressive Moments / 表演性时刻

Laughter, smiles, reaction holds, expressive silence, and freeze frames have no universal treatment. Review the complete audiovisual beat and choose the treatment that best serves meaning and pacing: preserve natural motion, shorten, cut away, hold, use a motivated freeze, or another deliberate option. Never freeze automatically because laughter exists, and never remove a long hold automatically when its emotional or comic function works. Record the chosen treatment and reason for every material moment; an intentional freeze or conspicuous hold must pass normal-speed audiovisual review.

笑声、微笑、反应停留、表达性留白和定格都没有统一处理。必须听看完整段落，再根据含义、表演质量、情绪或笑点节奏、全片速度和画面连续性，在保留自然运动、缩短、切走、停留、有动机的定格或其他方案中选择最合适的一种。不能因为出现笑声就自动定格，也不能因为停留较长就自动删除。重要时刻要记录最终处理和理由；有意定格或明显停留必须通过正常速度视听检查。

## Crossfade Rules / 交叉淡化规则

- Fix the boundary first. A crossfade cannot repair a cut inside a word or conceal a swallow.
- Only after the boundary is structurally correct and source handles are available, choose a short dialogue crossfade from the actual waveform and listening evidence. Record its duration in seconds or audio samples; video frame rate must not select it automatically. The precise EDL renderer supports explicit fades, not overlapping crossfades; a true overlap requires a reviewed audio derivative and its source mapping.
- Reject a crossfade that doubles a syllable, blurs an onset, changes stress, or makes the join sound phasey.
- If the intended opening word already begins in the outgoing handle, do not also start the incoming clip before that same word; choose one acoustic occurrence before adding any crossfade.
- Transcript-linked rebuilds may remove transitions. Re-read the rebuilt timeline, restore only intentional transitions, and audition again.

- 先把剪点放对；交叉淡化不能修复词中剪切，也不能掩盖吞咽。
- 结构正确且素材预留足够后，才按实际波形与听感选择短对白交叉淡化，以秒数或音频采样数记录，不由视频帧率自动决定。EDL 渲染器支持显式淡入淡出，不自动实现两段重叠交叉淡化；需要真正重叠时，先生成并审听音频衍生源，保留源映射。
- 出现叠字、起音模糊、重音改变或相位感时，必须撤回或调整。
- 如果目标句首字已经落在前一段的尾部预留里，后一段就不能再从同一个字之前起切；先确定唯一保留的声学发音，再考虑交叉淡化。
- 文本联动重建可能清掉转场；重读时间线，只恢复原本有意设计的转场，再次试听。

## Required Review / 必做复核

For each real placed-item boundary, listen to a rendered window with two or three seconds of context on both sides at normal speed, without scrubbing through the cut. Record:

- expected and audible last token;
- expected and audible first token;
- measured pause length;
- swallow, lip-smack, click, inhale, or duplicate status;
- visual state immediately before, on, and after the boundary;
- pass, repair, or intentional exception.

每个真实素材片段边界都要渲染前后各两到三秒，并以正常速度连续播放，不能只靠拖动播放头判断。记录：

- 预期与实际听到的句尾词；
- 预期与实际听到的句首词；
- 气口时长；
- 吞咽、咂嘴、爆点、吸气或重复情况；
- 剪点前一帧、剪点帧和后一帧的画面状态；
- 通过、返修或有理由保留的例外。

After the last change, verify the manuscript opening and closing, review every changed boundary again, and play the complete cut from start to finish. If normal-speed listening is unavailable, keep the rough cut status as unverified.

最后一次改动后，还要复核全文开头、结尾、所有改动过的衔接点，并从头到尾完整播放。无法正常速度听审时，粗剪必须标记为“未验证”，不能宣布锁定。

Every real join between placed media items must have one boundary record. A short list of "important joins" is not a complete audit. Before presenting the rough cut, run `node scripts/audit-rough-cut-review.mjs <rough-cut-review.json> [report.json]`. The audit must fail when the item count, join count, and verified-boundary count disagree, when any word or mouth-noise review is pending, or when automated ASR/silence detection is the only proof.

每个真实素材拼接点都必须有一条边界记录。只列几处“重点听审”不能代替全量检查。提交粗剪前运行 `node scripts/audit-rough-cut-review.mjs <rough-cut-review.json> [report.json]`。素材数、衔接数和已验证边界数不一致，任何字头字尾或口腔杂音仍待处理，或者只用 ASR、静音扫描等自动结果代替听审时，都必须阻断交付。

## Feedback-Class Sweep / 同类问题全片扫描

When the creator reports several instances of the same defect, treat the feedback as a defect class rather than a timestamp list. Name the class, define the detection method, sweep the complete relevant timeline, record every hit and disposition, then render the next review version. Examples include clipped word onsets, long joins, mouth resets, pace drift, premature evidence, and duplicated screen ranges. A version that fixes only the listed examples while leaving the same class elsewhere is not ready for review.

当创作者连续指出同一种问题时，要把反馈理解成“缺陷类型”，不能只理解成几个时间点。先给问题命名、写明检查方法，再扫描完整相关时间线，记录每个命中点及处理结果，最后才渲染下一版。常见类型包括字头被切、衔接拖长、口腔复位、语速漂移、素材抢跑和录屏源区间重复。只修用户举例、同类问题仍散落在其他位置的版本，不能再次送审。

## Playback Speed / 语速

- Do not inherit a fixed speed-up from another video. Start at `1.00x`, then compare the uncut performance and one or two conservative candidates only when the delivery drags.
- A modest candidate such as `1.02x-1.06x` may suit a dense explanatory social video, but it is not a default. Keep `1.00x` or slower when emotion, demonstration, quotation, technical precision, or deliberate emphasis needs space.
- Speed changes affect consonant clarity, breath length, cut timing, captions, music, and motion sync. Apply one stable rate across a continuous same-session passage unless a documented semantic or source-performance change justifies a new rate.
- Approve speed from a representative rendered passage and then re-run the manuscript-boundary audit. Record the selected rate and reason.
- Compare at least one representative early, middle, and late passage. Measure active speech rate separately from pauses, then listen at normal playback. A difference of roughly `12%` is a useful review trigger, not an automatic defect threshold.
- Choose the anchor pace from the platform, content density, intelligibility, and the speaker's best natural delivery. For a dense short-form explainer, a clearly articulated energetic passage is usually a better anchor than a visibly hesitant slow passage; emotion, quotation, demonstration, and deliberate emphasis may justify intentional variation.
- Correct a drifting passage with one stable pitch-preserving rate over a contiguous semantic range. Do not chase every sentence with a different speed or change rate at a non-semantic boundary.
- Retiming speech does not necessarily retime an authored gap, still hold, transition, or independently placed clip. After every rate change, rebuild or rebase the affected timeline, remeasure pauses, and explicitly recheck every present downstream layer: joins and breaths, timeline boundaries, captions, B-roll, presenter or cutout, SFX, music and ducking, layout and motion, progress, transitions, and outro. Mark absent layers as `not-present`; do not silently skip them.

- 不得沿用上一条视频的固定提速。先从 `1.00x` 开始，只有原始表达明显拖沓时，才比较一到两个克制候选。
- `1.02x-1.06x` 这类轻提速可能适合信息密集的解释型短视频，但不是默认值。情绪表达、操作演示、引用、技术精度或刻意强调需要空间时，应保留 `1.00x`，必要时更慢。
- 变速会同时影响辅音清晰度、气口、剪点、字幕、音乐和动画同步。同一次连续录制默认使用一个稳定速率，只有明确的语义或表演变化才分段调整。
- 先用代表性渲染片段确认语速，再重新执行文案边界检查，并记录最终倍率和原因。
- 至少比较开头、中段和后段各一个代表片段。有效说话速度与停顿密度要分开测量，再以正常速度连续听审。约 `12%` 的差异可以作为复核触发点，不能机械当成自动缺陷线。
- 基准语速由平台、信息密度、清晰度和说话者最自然的一段共同决定。信息密集的短视频解释通常应以清楚、有精神、不过赶的自然表达为锚点，不能为了统一而向明显拖沓的一段看齐；情绪、引用、演示和刻意强调可以保留有理由的变化。
- 需要修复时，在连续语义区间内使用一个稳定、保留音高的倍率。禁止逐句追速度，也不能在没有语义边界的位置突然变速。
- 口播变速不一定会自动缩短独立气口、定格、转场或另放的片段。每次变速后必须重建或重算受影响时间线，重新测量气口，并逐项复核所有实际存在的下游层：剪点与气口、总时长和边界、字幕、B-roll、人物小窗或抠像、音效、背景音乐与 ducking、版式与动画、章节进度、转场和片尾。不存在的层要明确标记为 `not-present`，不能静默跳过。
