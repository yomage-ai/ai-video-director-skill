# Measured pause ledger / 实测气口清单

`prepare-rough-review.mjs` sets `pauseContractVersion: 1`. Before rough handoff, Agent binds `agentPreparation.pauseLedger` to a JSON artifact using `{path, sha256}`. `audit-rough-cut-review.mjs` checks the ledger against the exact render and EDL. Never mark the review clear by copying generic observations. / Agent 在粗剪交付前填入有哈希的 JSON 清单，审查器核对真实成片和时间线。不能用批量复制的“无异常”代替实际测量。

Required JSON fields / 必填字段：

- `schemaVersion: 1`, `programSha256`, `edlSha256`.
- `speechBoundaryMethod`, `noiseAwareMethod`, `wordTimingAnomalyMethod`: actual methods and limits, not checkbox claims. / 真实测量方法和局限。
- `evidence: {path, sha256}`: measurement/source-context evidence, including scan scope and methods. / 测量和源语境记录。
- `joins`: every canonical join, in order: `boundaryId`, `timelineFrame`, measured `gapSeconds`, `status` (`clear`, `repaired`, `intentional`), contextual `reason`. Count the outgoing quiet tail plus incoming lead-in, not empty timeline space. / 前一段尾部与后一段头部一起测。
- `intervals`: every retained interval, in order: `segmentId`, `startFrame`, `endFrame`, `status`, actual `observation`, `candidates`. Each candidate has output `startSeconds`, `endSeconds`, `status`, `reason`; an empty list means the documented scan found none. / 逐段检查内部留白和异常词时长，不能只查剪点。
- `unresolved`: must be empty before creator handoff. Preserve reported defects and their dispositions in the evidence. / 已知问题逐项修复后才能交付。

Thresholds produce review candidates, never automatic acceptances or cuts. Calibrate them to the speaker, adjacent natural phrases and the creator's feedback; preserve meaningful emphasis and complete word releases. After changes, rerender and remeasure the delivered version, then realign captions and screen coverage. / 阈值只生成复核候选；结合说话者、自然片段和创作者反馈判断，保留字词和有作用的停顿。改动后重渲染、复测并对齐字幕和录屏。

The gate proves completeness, numeric fields and version consistency. It does not prove subjective naturalness, independent listening or zero future defects. Creator feedback remains creator acceptance. / 门禁只能证明覆盖、数值与版本一致，不能证明主观听感或保证永不出错；创作者审片仍保留。
