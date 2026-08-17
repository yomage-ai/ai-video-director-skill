# Platform Release And Publish Package

Use this reference when a video will be published, when the user requests a specific delivery resolution, or when captions, cover copy, tags, AI disclosure, and a platform upload are part of delivery.

## Contents

1. Two-phase contract
2. Release-master gate
3. Current-rule verification
4. Publish-copy variants
5. AI disclosure
6. Claim, CTA, and hashtag safety
7. Required artifacts
8. 简体中文

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

## Required Artifacts

Use `assets/templates/publish-package.template.json` and run `scripts/audit-publish-package.mjs` before delivery. Keep the following together:

- exact release-master path and probe/QA record;
- dated official-rule sources;
- chosen and alternate copy variants;
- AI declaration decision;
- rights/privacy/sponsorship notes;
- unresolved risks and the final human selection.

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
