# Measured pause ledger / 实测气口清单

## What can pass / 验收分层

Do not equate timeline continuity, ASR timestamps or an arithmetic-consistent gap with a natural edit. The earlier schema 2 gate checked numbers and coverage only; it did **not** independently locate speech. New preparations use `pauseContractVersion: 3`, retaining legacy reads without claiming old work passed the new checks.

时间线没有洞、ASR 时间戳正常、两个时间相减正确，都不能证明接得自然。旧 schema 2 只核对覆盖和算术，没有独立找到字头字尾。新准备使用合同 3，旧记录仍可读，但不追认其通过新检查。

1. **Locate in the original source.** Agent reads the last/first intended word against the source waveform and spectrogram, using aligned transcript only as a search aid. Preserve weak consonants, vowel release, reverberation belonging to speech, and meaningful breath. Record the whole protected word span and an **uncertainty range** for its end/start, not an unsupported exact timestamp. Document the method, noise condition and ambiguity. Energy/VAD identifies candidates; low energy may be a soft consonant, high energy may be noise. If the boundary is ambiguous, retain the entire uncertain range. If a necessary precise cut still cannot be established, keep the edit pending; do not invent a pass or install a listening model.
2. **Protect before editing.** Both the cut and any audio fade must stay outside the whole labelled word, including uncertainty. Use the actual playback rate to map source edges to output time. A contextual pause decision may shorten quiet handles but cannot move word labels to accommodate a desired short gap.
3. **Check actual output.** Agent prepares source-left/source-right and rendered-join WAV + spectrogram evidence with the command below. The auditor redecodes the actual media to verify each WAV, checks all source/EDL/render hashes, word containment and fade safety, and verifies the mapped gap range. Inspect source/output words and transient/click/noise continuity; rerender and regenerate evidence after any cut, speed or fade change. Changed captions cannot fix truncated audio.
4. **Judge pacing separately.** Compare the join in its complete sentence at the delivered playback speed, including the neighboring phrase/paragraph or meaningful reaction. A shorter gap is not automatically better. Record why the pause serves continuation, sentence ending, topic change, emphasis or reaction. The creator's normal rough-cut review confirms naturalness on that exact version. Agent signal analysis is **not** independent listening. Without that review, report “technical preparation complete; naturalness awaiting creator review,” never “naturalness verified.” Reuse an unchanged valid approval.

中文操作：Agent 先在原片定位完整末字/首字，结合转写、波形和频谱，给轻声尾音或噪声边界留下不确定区间 → 剪点和淡入淡出不得侵入完整保留词 → 按倍速映射后测总留白 → 抽出原片两侧及成片接缝，核对真实 WAV 与源文件并检查字头字尾、波形突变 → 在完整上下文正常速度审片确认节奏。定位不清先保留，不把不确定写成“无异常”。信号检查与创作者听感验收分栏，Agent 负责准备与修复，不把测量任务交给用户。

## Source evidence / 来源证据

Agent writes a project-local source annotation JSON (schema 1): `programSha256`, `edlSha256`, and all ordered `joins`, each containing `boundaryId`, `outgoing`, `incoming`. Each side contains:

- `sourceId`, `token`: match the canonical source and the intended last/first word.
- `protectedRange: [start, end]`: original-source seconds for the complete retained word, including edge uncertainty.
- `edgeRange: [earliest, latest]`: original-source seconds. Outgoing latest equals protected end; incoming earliest equals protected start. Use a point only if evidence supports that precision.
- `basis`: `waveform-and-word-context`, `spectrogram-and-word-context`, or `creator-confirmed-source`; `locationMethod` and `uncertaintyReason` explain actual inspection. Selecting a label is not proof that inspection occurred.

```text
node scripts/prepare-speech-boundaries.mjs render.json source-annotations.json new-source-evidence.json
```

The helper fails if cuts/fades intrude into protected words, generates source and final WAV/spectrogram windows, and returns mapped uncertainty ranges. It does **not** automatically identify phonemes. Agent inspects the generated evidence before binding it as `sourceBoundaryEvidence: {path, sha256}` in the pause ledger. Original source context remains visible even when it was cut out of the render. An external derived source must use matching coordinates from that exact source, not its ancestor.

Example: the source tail maps to output 5.70–5.73 s, and the next onset maps to 6.00–6.02 s. The resulting pause is **0.27–0.32 s**. This is a measurement interval, not an acceptance band. If a proposed cut lands at 5.71 s, it intersects the uncertain tail up to 5.73 s and fails protection. A different video's intentional 0.9 s reaction may be correct; this example does not set a global target.

程序只能证明“已标注的完整词没有被剪点或淡化侵入”及证据文件对应真实媒体，不能凭空证明标注绝对准确。频谱和波形也不能单独区分所有呼吸、擦音与底噪；不确定保留、源/成片对照及正常审片是必要的剩余判断。将标注改小来让剪点通过属于无效修复。

## Ledger / 清单

Bind `agentPreparation.pauseLedger` to a project JSON artifact. Required fields:

- `schemaVersion: 3`, `programSha256`, `edlSha256`, `sourceBoundaryEvidence` from the helper.
- `speechBoundaryMethod`, `noiseAwareMethod`, `wordTimingAnomalyMethod`: actual methods and limits.
- `evidence: {path, sha256}`: whole-program measurement/source-context record, including retained-interior scan and reported defects.
- All ordered `joins`: `boundaryId`, `timelineFrame`, `outgoingSpeechEndSeconds`, `incomingSpeechStartSeconds`, measured `gapSeconds`, mapped `gapRangeSeconds: [minimum, maximum]`, contextual `reason`, `status: clear|repaired|intentional`. Nominal edges must lie within mapped source uncertainty; gap equals the two nominal edges' difference within one frame. The frame tolerance is arithmetic only; protection permits no frame of word truncation.
- All retained `intervals`: `segmentId`, `startFrame`, `endFrame`, `status`, actual `observation`, `candidates`. Each interior candidate has output `startSeconds/endSeconds`, `status`, `reason`. Inspect the entire interval for long holds, false/abnormally long ASR tokens, restarts and semantic repetitions; an empty candidate list means an actual documented scan found none.
- `unresolved`: empty before technical handoff. `clear` means resolved technical preparation, not independently certified naturalness.

## Regression and real-video acceptance / 回归与实片验收

Anonymous regressions cover: clipping a word onset/tail, cutting within the uncertain portion even when nominal timing looks safe, a fade attenuating protected speech, wrong source/version, missing joins, wrong rate mapping, fabricated small gap, and an audio window substituted from another interval. Positive cases preserve the entire range and allow contextually long pauses. These test **mechanical protection**, not speech perception.

On the next real video, Agent records all joins and interiors, original words/edge evidence, before/after gap ranges, unresolved ambiguities and creator-reported defects. Acceptance requires: no missing entry, no cut/fade into labelled words, actual output evidence passes, known defects resolved, and exact-version creator confirmation for naturalness. Feedback about one join triggers a whole-video sweep of that defect class. Do not report synthetic tests as zero-defect speech recognition or successful real-video validation.
