# AI Video Director Skill

**[简体中文快速开始](README.zh-CN.md)** | English

Copy this request to Codex or another coding agent. Attach your recording or provide its local path; a manuscript and style reference are optional:

```text
Use my installed local $ai-video-director Skill first. If it is not installed, read and use it from:
https://github.com/yomage-ai/ai-video-director-skill

My material: [attached recording or local path; manuscript and references if available]
Target platform and aspect ratio: [for example: Douyin, 9:16]
Main point of the video: [one sentence, or help me refine it]
Style request or reference: [optional; use the built-in Xiaoxiong style by default]

Inspect the material locally first and show me a plain-language content-lock card and rough-cut plan in my language. Do not show internal JSON.
Wait for my approval before continuing production.
After the rough cut is locked, show me a 6-12 second audiovisual fine-edit sample before producing the full fine edit.
Then deliver the final video, editable project, and verification records.
When publishing is requested, also prepare several cover-title, caption, hashtag, and AI-disclosure options.
Reuse approvals already given for this task. Ask only when a new payment, login, system permission, identity/voice use, or media-rights authorization is actually needed.
```

For a rough cut only:

```text
Use $ai-video-director on this recording. Make a rough cut only: remove mistakes, retakes and unnecessary waits while keeping complete words and natural pacing. Show me the content and rough-cut plan first. After I approve the rough cut, deliver it with the editable timing project and captions, then stop.
```

The Skill includes Xiaoxiong's approved subtitle look, dialogue loudness, natural-bright color treatment, palettes, screen layout and style priorities. A fresh install needs no separate private style package or old reference videos. The Agent prepares the pinned font automatically. See [the built-in style and portable examples](skill/ai-video-director/references/xiaoxiong-public-style.md).

For Xiaoxiong character art, signature outro or the approved twirl, also install the owner-authorized `xiaoxiong-ip` Skill. Other creators can use this editing style without that identity Skill. Continuing an existing video still requires its source media and editable project.

On a new computer, the Agent reuses installed tools and prepares missing Node/npm, FFmpeg/ffprobe and script dependencies. Before rough editing it installs the official ChatCut plugin if missing and verifies sign-in and real tool access. Before fine editing it prepares the selected renderer, authoring Skills and browser. A copied Skill folder alone does not run an installer: first use performs this setup. You only complete unavoidable login or system permission steps; newly installed plugin tools may require a new session. Large optional models download only when selected. See [Agent-managed setup](skill/ai-video-director/references/dependency-setup.md).

## What You Provide

- Recorded talking-head footage, including a screen recording with a baked-in webcam. A manuscript helps but does not replace source footage.
- Target platform, aspect ratio, and intended use.
- Required points, sections, source material, or references.
- Any style preference or visual reference you already have. This is optional at the first gate.

## What You Receive

- A plain-language content-lock card and rough-cut plan before production, without internal JSON.
- A short audiovisual style sample after rough-cut approval, before the full fine edit.
- A content-matched direction from the built-in curated fine-edit style library when you do not provide a visual reference. The library preserves liked and proven references but is not a closed asset list; when no entry fits, the Agent designs a new coherent asset, motion, music, and sound direction from the content. You can still approve or adjust it before full production.
- A finished video and its editable project; a rough-only request ends with the approved rough cut, editable timing and captions.
- Verification records and clear delivery paths.
- Publication copy options when publishing is part of the request.

The Agent handles installation, dependency checks, local media inspection, transcription, timing audits, style recommendation, asset planning, rendering, and verification. A style reference is optional: when none is supplied, the Agent compares the public curated styles against the video's content and evidence needs instead of asking you to invent a direction. If the library has no strong match, it plans and produces suitable evidence, generated or code-authored graphics, typography, motion, BGM, and SFX under the normal approval and rights gates. Before the first approval it avoids unnecessary large uploads, cloud retries, full renders, and premature style production.

This version checks actual media, processing settings, approvals and versions. Unsupported editor effects stop the handoff until the Agent arranges a supported explicit conversion or a reviewed high-quality derivative. It never treats filled checkboxes or a successful render as proof of listening quality. Version `0.2.0-rc.3` has passed engineering regression checks and is shared as a release candidate. The next independent real-video trial still needs to validate listening quality, revision effort and full-length resource use. See [the recorded validation state](PROJECT_STATE.json).

## License

Original code, documentation, scripts, and templates in this repository are available under the [Apache License 2.0](LICENSE). Third-party tools, models, fonts, services, and user-provided media keep their own licenses and rights.
