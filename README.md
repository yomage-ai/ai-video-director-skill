# AI Video Director Skill

**[简体中文快速开始](README.zh-CN.md)** | English

Copy this request to Codex or another coding agent. Attach your recording or provide its local path; a manuscript and style reference are optional:

```text
Use my installed local $ai-video-director Skill first. If it is not installed, read and use it from:
https://github.com/yomage-ai/ai-video-director-skill

My material: [attached recording or local path; manuscript and references if available]
Target platform and aspect ratio: [for example: Douyin, 9:16]
Style request or reference: [optional; use the built-in Xiaoxiong style by default]
```

This Skill turns recorded talking-head footage into edited videos. It can remove mistakes and retakes, add captions, adjust sound and picture, and add suitable motion graphics, music, and sound effects. Request a rough cut only or continue to a full fine edit.

The Xiaoxiong style is built in. Provide your own reference or let the Agent recommend a direction based on the content.

On first use, the Agent checks and prepares the tools it needs. If a login, system permission, or payment requires your action, it explains the specific steps. Newly installed plugins may require a new task before they become available.

Complete rough-cut review also requires a host that can provide real auditory analysis; this Skill does not include a listening model. The Agent tests that capability first. If sound cannot reach a reviewer, it explains the limitation and does not present an unheard video as completed editing.

Already edited a version yourself? Say: “Keep my chosen clips, order, speed and audio; only improve the named visual elements.” Agent preserves that master, adds missing visuals, captions and top progress, and checks the changed regions. Audio or structural edits use the normal review route. Existing valid approvals are reused.

## What You Provide

- Recorded talking-head footage, including a screen recording with a baked-in webcam. A manuscript helps but does not replace source footage.
- Target platform, aspect ratio, and intended use.
- Required points, sections, source material, or references.
- Any style preference or visual reference you already have (optional).
- For an existing edit, provide that version; source footage and an editable project help when available. Agent first checks what the supplied flattened video can safely support.

## What You Receive

- **Rough-cut plan:** confirm the main point, content choices, and sequence before editing begins.
- **Audiovisual sample:** after approving the rough cut, review a 6–12 second fine-edit sample with real dialogue, captions, and sound design before the full video is produced.
- **Video and project:** the finished video, editable project, and check records. A rough-cut-only request delivers the rough video, editable timeline, and captions.
- **Publication copy:** when requested, several cover-title, caption, hashtag, and AI-disclosure options to choose from.

The Agent handles media inspection, transcription, tool setup, style recommendations, rendering, and delivery checks. You provide the footage and goal, then review the content choices and audiovisual sample.

## License

Original code, documentation, scripts, and templates in this repository are available under the [Apache License 2.0](LICENSE). Third-party tools, models, fonts, services, and user-provided media keep their own licenses and rights.
