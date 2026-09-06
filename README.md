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

Inspect the material first. In my language, explain the main point, what to keep or remove, and the rough-cut plan.
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

This Skill turns recorded talking-head footage into edited videos. It can remove mistakes and retakes, add captions, adjust sound and picture, and add suitable motion graphics, music, and sound effects. Request a rough cut only or continue to a full fine edit.

The built-in Xiaoxiong style covers captions, dialogue loudness, natural-bright color treatment, palettes, and screen layout. You can provide your own reference or let the Agent recommend a direction based on the content. Xiaoxiong character art and signature outros require the separate `xiaoxiong-ip` Skill and permission to use that identity; editing your own videos does not require it.

On first use, the Agent checks and prepares the tools it needs. If a login, system permission, or payment requires your action, it explains the specific steps. Newly installed plugins may require a new task before they become available.

Large recordings are checked locally first. The Skill includes an upload compatibility script that the Agent prepares and runs automatically, preserving the existing edit during recovery. You do not need a separate troubleshooting document or manual parameter changes. Login or system authorization is requested only when needed. See [large files and upload recovery](skill/ai-video-director/references/chatcut-media-recovery.md).

## What You Provide

- Recorded talking-head footage, including a screen recording with a baked-in webcam. A manuscript helps but does not replace source footage.
- Target platform, aspect ratio, and intended use.
- Required points, sections, source material, or references.
- Any style preference or visual reference you already have (optional).
- The source footage and editable project when continuing an existing video.

## What You Receive

- **Rough-cut plan:** confirm the main point, content choices, and sequence before editing begins.
- **Audiovisual sample:** after approving the rough cut, review a 6–12 second fine-edit sample with real dialogue, captions, and sound design before the full video is produced.
- **Video and project:** the finished video, editable project, and check records. A rough-cut-only request delivers the rough video, editable timeline, and captions.
- **Publication copy:** when requested, several cover-title, caption, hashtag, and AI-disclosure options to choose from.

The Agent handles media inspection, transcription, tool setup, style recommendations, rendering, and delivery checks. You provide the footage and goal, then review the content choices and audiovisual sample.

## License

Original code, documentation, scripts, and templates in this repository are available under the [Apache License 2.0](LICENSE). Third-party tools, models, fonts, services, and user-provided media keep their own licenses and rights.
