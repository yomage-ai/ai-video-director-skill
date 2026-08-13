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

## Crossfade Rules / 交叉淡化规则

- Fix the boundary first. A crossfade cannot repair a cut inside a word or conceal a swallow.
- Use a short one- or two-frame dialogue crossfade only after the cut is structurally correct and source handles are available.
- Reject a crossfade that doubles a syllable, blurs an onset, changes stress, or makes the join sound phasey.
- If the intended opening word already begins in the outgoing handle, do not also start the incoming clip before that same word; choose one acoustic occurrence before adding any crossfade.
- Transcript-linked rebuilds may remove transitions. Re-read the rebuilt timeline, restore only intentional transitions, and audition again.

- 先把剪点放对；交叉淡化不能修复词中剪切，也不能掩盖吞咽。
- 结构正确且素材预留足够后，才使用一至两帧的短对白交叉淡化。
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

## Playback Speed / 语速

- Do not inherit a fixed speed-up from another video. Start at `1.00x`, then compare the uncut performance and one or two conservative candidates only when the delivery drags.
- A modest candidate such as `1.02x-1.06x` may suit a dense explanatory social video, but it is not a default. Keep `1.00x` or slower when emotion, demonstration, quotation, technical precision, or deliberate emphasis needs space.
- Speed changes affect consonant clarity, breath length, cut timing, captions, music, and motion sync. Apply one stable rate across a continuous same-session passage unless a documented semantic or source-performance change justifies a new rate.
- Approve speed from a representative rendered passage and then re-run the manuscript-boundary audit. Record the selected rate and reason.

- 不得沿用上一条视频的固定提速。先从 `1.00x` 开始，只有原始表达明显拖沓时，才比较一到两个克制候选。
- `1.02x-1.06x` 这类轻提速可能适合信息密集的解释型短视频，但不是默认值。情绪表达、操作演示、引用、技术精度或刻意强调需要空间时，应保留 `1.00x`，必要时更慢。
- 变速会同时影响辅音清晰度、气口、剪点、字幕、音乐和动画同步。同一次连续录制默认使用一个稳定速率，只有明确的语义或表演变化才分段调整。
- 先用代表性渲染片段确认语速，再重新执行文案边界检查，并记录最终倍率和原因。
