# Platform Release And Publish Package

Use this reference when a video will be published, when the user requests a specific delivery resolution, or when captions, cover copy, tags, AI disclosure, and a platform upload are part of delivery.

## Contents

1. Two-phase contract
2. Release-master gate
3. Current-rule verification
4. Publish-copy variants
5. AI disclosure
6. Claim, CTA, and hashtag safety
7. Claim-evidence ledger
8. Post-publish verification
9. Required artifacts
10. 简体中文

## Two-Phase Contract

Publishing work begins early and finishes late.

### Phase A: lock constraints before editing

At intake and director-plan time, record:

- target platform, account/content type, jurisdiction, aspect ratio, required pixel dimensions, frame cadence, SDR/HDR intent, codec/container, duration or file-size limits, and whether a cover must survive platform crop;
- whether real human recording, AI-assisted editing, generated graphics, synthetic voice, face replacement, or other generated/synthesized content appears;
- likely platform disclosure, rights, privacy, claim, and campaign-eligibility constraints;
- cover, caption, progress, evidence, and platform-UI safe regions that affect composition.

This early lock prevents a visually approved edit from becoming unusable at export. It does not freeze final marketing copy before the finished video exists.

### Phase B: package the exact approved release candidate

After fine-edit and release-master QA, generate cover-title, post-caption, hashtag, disclosure, and upload-setting variants from the actual final video. Never publish copy written for an abandoned cut or claim that the finished video does not make.

## Release-Master Gate

- Classify every render as `review-proxy`, `platform-release`, or `source-quality-master`.
- Lower-resolution proxies may accelerate review, but the user must approve the exact file intended for publication when the requested release dimensions differ.
- Conform the locked timeline to the highest-quality approved source. Do not upscale a review proxy and call it a source-quality master.
- Render graphics at the requested output resolution. Record any lower-resolution derivative, such as a transparent cutout, as a limitation and inspect it at final pixels.
- Probe the exact candidate for pixel dimensions, aspect ratio, frame count, duration, cadence, codec, color metadata, audio layout, integrated loudness, true peak, sync, blank/frozen frames, and source lineage.
- Final approval occurs after this probe and visual/audio QA. Do not obtain approval on a 1080 proxy and silently create a different 4K render afterward.

## Current-Rule Verification

Platform rules, upload controls, campaign requirements, and AI-label interfaces change. On the publication date:

1. Check the platform's current user agreement, community rules, creator guidance, and upload UI from official sources.
2. Check applicable law or regulator guidance from primary government sources when AI disclosure, advertising, privacy, finance, health, or another regulated topic is involved.
3. Record `checkedAt`, jurisdiction, direct official URLs, the exact rule or control relied on, and unresolved ambiguity.
4. Never promise that copy is “guaranteed compliant,” “will not be limited,” or “cannot be flagged.” State that it was reviewed against the dated sources and still requires the platform's live checks.

Search snippets, reposts, creator folklore, and old screenshots are not sufficient authority when a current official source is available.

## Publish-Copy Variants

Create at least three materially different, accurate choices unless the user asks for one:

- **Direct result:** the literal subject or outcome, without sensational inflation.
- **Question or tension:** a real question answered by the video, without concealing the topic.
- **Tutorial or process:** what the viewer will learn and the concrete steps covered.

Each variant contains:

- one short cover title that remains legible after platform crop;
- one post caption with a clear opening, accurate scope, and proportionate CTA;
- two to eight directly relevant hashtags, with campaign tags included only after eligibility is verified;
- the AI disclosure copy or platform declaration plan when applicable;
- a short rationale and any claim that needs evidence or narrowing.

The cover and caption may use different wording, but they must describe the same finished video. Do not claim that a workflow is public, open source, free, fully automatic, or independently proven unless that state is true at posting time.

## AI Disclosure

Distinguish the production facts instead of using one vague “AI video” label:

- real person and real voice recorded by the creator;
- AI-assisted transcript, edit decisions, captions, cleanup, or layout;
- AI-generated or synthesized images, animation, voice, face, or footage;
- no face replacement or synthetic voice when that distinction is material and true.

When current law or platform policy requires a declaration, plan both the platform-native switch/label and concise viewer-facing copy. Never remove, hide, alter, or obscure a required explicit or embedded label.

## Claim, CTA, And Hashtag Safety

- Keep titles consistent with the content. Reject exaggerated certainty, fabricated proof, unrelated trends, impersonation, rumor, and claims that an AI system “did everything” when human judgment remained part of the workflow.
- Scope personal experience as personal experience. Do not convert it into a universal performance, income, platform-distribution, or compliance guarantee.
- Avoid raw contact details, off-platform diversion, prize-like comment incentives, repetitive solicitation, or “DM me for access” language unless the current platform rules and the user's legitimate business flow explicitly permit it.
- A simple request to comment, discuss, or share an experience may be used when it is proportionate and not deceptive engagement bait.
- Use only tags that describe the actual topic, method, audience, or verified campaign. Do not add generic “trending” tags as camouflage.
- Rights, privacy, advertisements, endorsements, and sponsored relationships require their own truthful disclosures.

## Claim-Evidence Ledger

Do not leave measurable claims as free-form notes. For every number, quantity, percentage, duration, file size, cost, performance result, or causal statement used in a cover or post caption, record:

- the exact claim and final publication wording;
- whether it is exact, rounded, bounded, personal experience, or only a question;
- the subject, scope, time window, unit, and evidence source;
- whether the claim was verified, narrowed, or removed;
- every publication variant that uses it.

Use precision words such as “about,” “nearly,” “more than,” “single day,” or “cumulative” when the evidence supports only that scope. A measured value below a round threshold may be described as “nearly” that threshold, but not as the exact threshold. A rounded quantity must preserve the truthful direction, unit, scope, and context. The size of an input archive is not automatically evidence that a system learned its contents. Questions may preserve uncertainty, but a question mark does not excuse a false premise.

`claimsNeedingEvidenceOrNarrowing` may be used during drafting, but it must be empty before a variant passes the publication audit. Link every numeric or measured claim to a resolved `claimEvidence` item.

## Post-Publish Verification

When the Agent is responsible for publication follow-through, record the publish timestamp, selected visibility, item/share URL or id, current processing/review/public/restricted/removed state, direct-item visibility, a secondary-account check when appropriate, and any explicit platform notice.

Zero views after a few minutes and failure to find a title in search are diagnostic signals, not proof of a violation. Search can be delayed, ranked, personalized, or omit content that is still processing or under review. Check the direct item and explicit account/platform status first. Do not delete and repost before preserving the observed state and any stated reason; premature reposting destroys evidence and can restart processing or review.

Do not invent a fixed review SLA when the current official sources do not publish one for the relevant upload path. At a reasonable checkpoint, use the platform's live creator-support or appeal path and record the response. Treat a large-file processing delay as an inference unless the platform explicitly reports it.

## Required Artifacts

Use `assets/templates/publish-package.template.json` and run `scripts/audit-publish-package.mjs` before delivery. Keep the following together:

- exact release-master path and probe/QA record;
- dated official-rule sources;
- chosen and alternate copy variants;
- AI declaration decision;
- rights/privacy/sponsorship notes;
- unresolved risks and the final human selection.
- claim-evidence records and, when publication follow-through is in scope, the post-publish status record.

## 简体中文

发布不是精剪完成后才临时补一句文案，而是“前置锁约束、后置做发布包”的两阶段流程。

### 前置锁定

在素材预检和导演方案阶段，就记录目标平台、地区、账号与内容类型、画幅、像素尺寸、帧率、SDR/HDR、编码、时长/文件限制、封面裁切，以及真人实拍、AI 辅助剪辑、生成动画、合成声音、换脸等实际使用情况。同时把平台控件、字幕、进度条、证据和封面安全区纳入构图。

### 后置发布包

精剪完成后，先用最高质量源素材生成真正准备发布的候选片，再对这一个文件做完整 QA。审片可以使用低分辨率代理，但如果发布要求 4K，就必须让用户确认已经通过 QA 的 4K 候选片；不能先确认 1080，再悄悄另导一份未经审看的 4K，也不能把 1080 放大后称为源质量母版。

发布当天必须重新查目标平台的官方协议、社区规范、创作者说明与真实上传界面；涉及 AI 标识、广告、隐私、金融、医疗等问题时，还要查主管部门的一手规则。保存检查日期、地区、官方直链、采用的具体规则和未解决疑点。只能说明“按某日规则完成检查”，不能承诺绝不违规、绝不限流或一定通过审核。

默认提供至少三组真实不同的选择：直接结果版、问题张力版、教程流程版。每组包含短封面标题、发布文案、二到八个直接相关标签、AI 声明方案、选择理由与需要缩窄的主张。封面和文案可以措辞不同，但必须描述同一条最终成片；仓库尚未公开时不能写“已开源”，仍有人审片时不能写“全自动无人参与”。活动标签只有在资格已核实时才能加入。

AI 声明要写清真人实拍与真人原声、AI 辅助转写/剪辑/字幕/布局、AI 生成图像/动画/声音/换脸分别是否存在。法规或平台要求声明时，同时规划平台原生声明开关和必要的观众可见说明，不得删除、遮挡或规避规定标识。

避免夸大确定性、标题与内容不符、无关热点标签、谣言、冒充、泄露隐私、裸联系方式、诱导站外、奖品式评论诱导和重复营销。可以使用克制、真实的讨论型 CTA，但不能把互动写成虚假承诺或交换条件。

### 数字和主张证据

封面或发布文案里的每个数字、数量、比例、时长、文件大小、费用、效果和因果说法，都要进入 `claimEvidence`：记录原始主张、最终发布措辞、精确/约数/范围/个人经历/疑问句类型、主体、范围、时间窗口、单位、证据来源，以及它被核实、缩窄还是删除，并关联使用它的文案版本。

证据只支持约数或有限范围时，必须使用“约、近、超过、单日、累计”等精度词。低于某个整数门槛的实测值，可以在证据允许时写成“接近”该门槛，不能直接写成精确等于；数量取整时也要保持方向、单位、范围和语境真实。输入资料的体量不能自动证明系统已经学会其中内容。疑问句可以保留不确定性，但问号不能替虚假前提免责。草稿阶段可以暂存“仍需证据或缩窄”的主张，发布审计通过前必须全部解决。

### 发布后状态核验

Agent 负责发布跟进时，要记录发布时间、可见范围、作品或分享链接/编号、处理/审核/公开/受限/移除状态、直接作品可见性、必要时的其他账号检查，以及平台明确通知。

发布几分钟零播放、标题搜索不到，只能作为排查信号，不能单独证明违规。搜索可能有延迟、排序和个性化，仍在处理或审核的作品也可能不进入公开检索。先检查直接作品和账号内明确状态；删除重发前必须保存当前状态和平台原因，否则既丢失证据，也可能重新开始处理或审核。

当前官方资料没有给出对应上传路径的固定审核时长时，不得编造 SLA。到合理检查点后，使用平台当时可用的创作者客服或申诉入口并记录回复。只有平台明确提示时，才能把“大文件处理较慢”写成事实；否则只能标为推断。
