# Rough cut → creator feedback / 粗剪 → 创作者反馈

This is the default production workflow for every installation, including resumed projects. Agent prepares the best rough cut it can, delivers it, receives creator feedback, fixes the complete relevant defect class, and continues after approval. Do not propose, install, benchmark, configure or call Qwen audio understanding or GPT-Audio-1.5 for listening review. Do not introduce another listening model as a substitute or ask the creator to select a reviewer. Missing native audio input is not a dependency, billing request or production blocker.

所有安装与续接工程默认执行：Agent 按规范尽力剪好粗剪 → 交付 → 创作者反馈 → 修整 → 确认后继续精剪。不提议、安装、测试、配置或调用千问音频理解、GPT-Audio-1.5 或替代听审模型，不让用户选择听审服务。主模型不能接收音频，不构成依赖缺失、收费请求或暂停理由。

## Agent preparation / Agent 交付前职责

- Compare takes for meaning, expression and contextual fit; preserve ordinary breaths, complete words and original delivery. Do not choose the last take automatically or hard-trim at ASR token boundaries.
- Check every retained interval and join using transcript/source context, real timing, waveform/silence information and rendered picture inspection. Review restarts, repeated meaning, excessive pauses, mouth preparation and expression resets. Record the actual method and uncertainty; do not claim ASR/stills are listening.
- Check early/middle/late pacing, audio levels, natural color, gaps, decoding and source fidelity. Resolve known defects before handoff. Keep normal 1× delivery unless content justifies a reviewed change.
- Deliver a playable rough cut or editable ChatCut timeline for the creator's normal review. Do not ask for a second approval of the same unchanged version. Their approval is creator acceptance, never evidence that the Agent independently listened.

Agent 比较原意、表达和衔接，保留正常气口及完整字头字尾；逐段检查重起、重复信息和冗余，逐剪点核对时间、波形/静音及画面，比较前中后语速，测量音量并检查画面与解码。已知缺陷先修好，不把粗剪交付变成草率拼接。没有真实听觉输入就如实记录检查方式，不编造听过的证据。用户只需正常看粗剪、给反馈；同版已确认后直接继续。

## Executable contract / 程序合同

New projects and resumed work use schema 6, `reviewMode: "creator-feedback"`. `prepare-rough-review.mjs` enumerates the actual retained intervals and joins from the bound render receipt. Populate `agentPreparation` with actual methods, observations, evidence and measured levels. The auditor allows `ready-for-user-review` without a listening model or creator approval; `approved` additionally requires the creator's exact message and matching program hash. Fine/release gates still require their existing content/style/final approvals. Known technical defects, stale evidence and mismatched approvals still fail.

旧 schema 4/5 保留用于读取历史，不继续要求补旧的 Agent 听审字段。续接时从当前渲染回执生成新的 schema 6 检查表，迁移仍有效的实际检查与批准；Agent 完成尚缺的技术检查。移除旧 `source-listen` 依赖，把仅由取消的模型路线产生的阻塞记录为“该要求已撤销”，保留更正依据，不能写成模型测试通过。真实登录、权限、文件损坏或未修复剪辑问题仍按实际范围处理。

For ChatCut creator approval, save a fresh timeline snapshot with project/timeline IDs and source ranges before duplicating it. Bind the user's message to that snapshot; exported timing/render evidence can then be attached to the same version. Never ask the creator to repeat their approval merely because an internal report was generated later. Do not mark style or final-master approval from rough approval.

ChatCut 粗剪确认先绑定实时的工程、时间线和源区间快照，再复制为精剪版本。导出回执随后关联到同版；不能因内部报告生成较晚要求用户重复确认，也不能把粗剪确认扩大成风格或最终成片确认。

## Current preparation / 当前检查表

New schema 6 preparations set `preparationContractVersion: 2` and `pauseContractVersion: 3`. Shared `scripts/lib/review-policy.mjs` owns the check and defect lists. Each retained interval and join records every applicable defect class plus actual method, observation and evidence. Takes and color remain explicit checks. Old schema 4/5 fixtures are retained only for compatibility; the current template has no obsolete mandatory listening fields.

新检查表由同一类别表生成并校验：段内重起、口型准备、眨眼复位、逐字/同义重复、长停顿和异常字长；接点查字头字尾、留白、重起、重复与画面跳变。用户指出一种问题就检查全片同类，不能只修给出的时间点。每类处理状态配实际记录；数值或“clear”不能证明听感。

On resume, `migrate-creator-review.mjs` removes retired job capabilities but preserves ambiguous blockers. Agent inspects their original evidence and supplies `--classification file.json` only for a confirmed obsolete prerequisite. That file binds `pipelineSha256` and `blockers: [{id, scope: "obsolete-prerequisite-only", reason, evidence: {path, sha256}}]`. Do not classify actual known defects as missing listening capability. A changed pipeline invalidates the classification. This inspection belongs to the Agent; do not ask the user for an audio model.

迁移不能仅凭旧阻塞名称清除问题。Agent 先核对原证据，用上述版本绑定的分类记录仅撤销旧前置要求；真实缺陷、登录和费用继续保留。

Source-boundary protection and actual before/after WAV evidence use [pause-ledger.md](pause-ledger.md). Schema 3 checks labelled complete-word ranges and fade/cut safety; it does not automatically establish phonetic accuracy or naturalness. / 字头字尾保护与原片/成片真实音频对照见气口清单；程序保护已标注范围，不能把标注或波形当独立听审。
