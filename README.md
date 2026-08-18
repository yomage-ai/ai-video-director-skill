# AI Video Director Skill

**[简体中文快速开始](README.zh-CN.md)** | English

An open-source, bilingual workflow for turning talking-head footage and a script into an edited, reviewable, platform-ready video. Search the exact repository name `yomage-ai/ai-video-director-skill` when sharing it with someone else.

Attach the video, script, and reference material to a Codex or other coding-agent task, then paste the prompt below.

## Use It Directly

```text
Read and use the AI Video Director Skill from this repository:
https://github.com/yomage-ai/ai-video-director-skill

My material: the video, script, and reference files attached to this task.
Target platform and aspect ratio: [for example: TikTok, 9:16]
The main point of this video: [write one sentence, or help me refine it if uncertain]
Style request or reference: [optional]

Handle the preparation and execution required by the Skill yourself. Inspect the material first, ask only for inputs that genuinely require me, then show me:
1. A content-lock card;
2. A director plan;
3. Any essential missing information.

Continue production only after I approve. Ask for separate approval before any payment, account login, system permission, identity or voice cloning, or use of rights-sensitive media.
Deliver the final video, editable project, necessary verification records, and a dated publication package when publishing is in scope.
```

## Important Behavior

The Skill chooses ordinary visual layouts from the content, director plan, evidence density, presenter value, duration, and target-device safety. The narration does not need to name a layout before it can be used. The invariant is semantic sync: the visible state, evidence, and example must match the spoken claim at that moment. A named layout switches on the spoken anchor only when the video is explicitly teaching or comparing layout modes.

The Agent handles installation, dependency checks, project setup, rendering, and tests. The user only needs to provide the task inputs and approve the gates that genuinely require a human decision.

Use a coding agent that can read local files and run tools, such as Codex or Claude Code. A chat-only interface without filesystem or shell access can discuss the plan, but it cannot directly inspect, edit, render, or deliver local video files.

If the Skill already appears in Codex, the short form is enough:

```text
Use $ai-video-director to process the attached talking-head video. Inspect the material first, then show me the content-lock card and director plan. Continue only after I approve.
```

## What You Receive

- A content-lock card and director plan before production.
- A reviewed rough cut plus an editable fine-edit project when the toolchain supports it.
- Captions, visual coverage, rights/privacy checks, export QA, and absolute local delivery paths.
- Multiple publication-copy and AI-disclosure options when publishing is part of the request.

The public repository contains reusable rules, scripts, templates, and documentation only. Creator footage, face or voice assets, private preferences, credentials, and project media stay outside Git.

<details>
<summary><strong>Optional prompt modifiers</strong></summary>

These are optional. Do not paste them unless the current video actually needs that behavior.

For a platform-ready release, state the real target rather than accepting a default proxy:

```text
Target Douyin, 9:16, true 2160x3840 release. Lock the release specification before editing. Let me review proxies during iteration, but render, probe, and show me the exact 4K release candidate before final approval. After it passes QA, verify the current official rules and give me at least three accurate cover-title, post-caption, hashtag, and AI-disclosure choices.
```

For a dialogue recut, the Skill also audits every real clip boundary against the manuscript: complete first/last words, natural pause length, no retained swallow or mouth noise, and rendered normal-speed proof before rough-cut approval.

For short-card captions, you can add:

```text
Use the comma-and-sentence short-card caption profile. Start a new card after every comma, period, semicolon, colon, question mark, and exclamation mark. Keep enumeration commas only in short lists and split long lists by meaning. Never use a fixed character count to cut a Chinese word, English term, or product name, and never start a card with detached punctuation.
```

For app or dashboard evidence, the Skill locks the exact page/tab/subtab state, derives each crop from source semantics instead of guessing from a screenshot thumbnail, records an ROI manifest, and blocks export when an adjacent view or approximate callout is shown. An approved signature outro also keeps its full motion contract, including any tilt and blink/wink, unless a new version is explicitly approved.

For the reusable semantic-progress component, you can add:

```text
Use the generic RMCU semantic progress component. Choose its landscape or portrait variant from the target canvas, keep the same clean two-lane style in both orientations, ellipsize inactive long chapter labels, and loop only the active label when it overflows.
```

For a multi-device 9:16 talking-head layout, you can add:

```text
Use the approved portrait talking-head safe layout. Keep crop-tolerant backgrounds full bleed, but keep captions, progress semantics, important B-roll regions, bounded picture-in-picture, and every required presenter region such as the face, gesture, or identity mark visible on both narrow phones and wide tablets. Validate the real published player instead of treating the encoded canvas edge as safe.
```

For the outlined live-presenter cutout style, you can add:

```text
Use B-roll as the base and keep the time-aligned presenter visible as an outlined transparent cutout when the actual moving matte passes. Declare the presenter as foreground, supporting, or background, then independently choose a container-bottom or canvas-bottom anchor. Keep foreground people and bounded PiP clear of other UI; a deliberately low-salience background cutout may sit behind captions or platform copy when the face, required gesture, critical evidence, and identity marks remain readable. Use HyperFrames background removal locally on the clean locked A-roll, keep dialogue on the canonical audio track, and fall back to a designed PiP or full-screen evidence instead of keeping broken edges.
```

To prevent source cuts and B-roll layouts from flashing as separate states, you can add:

```text
Conform source cuts and layout boundaries. When a new take should already be inside a B-roll/PiP layout, make both changes on the same program frame. Use integer frame indices as the canonical timing source and derive seconds from frame/fps without six-decimal rounding. Keep one presenter layer across a continuous information run, forbid brief A-roll bridges, and require an intentional A-roll reset to hold at least two seconds. Allow shorter layouts only for a declared token-synchronized mode demo, then audit the boundary frames before export.
```

For reusable code-authored motion graphics, you can add:

```text
Use the code motion component system. Audit existing components as general mechanisms, private creator adapters, topic templates, archives, or error samples. Keep general behavior separate from private assets and this video's copy, timing, and media. Reuse or promote a component only after content-fit, seek-safe motion, layout, rights, and real-export checks pass.
```

</details>

## What The User Provides

- Recorded talking-head footage or a script to turn into video, at least one of these.
- Target platform, aspect ratio, and intended use.
- Any claims, sections, or source material that must remain.
- Optional reference videos, brand assets, and style preferences.
- Explicit approval for payment, account access, identity/voice use, and media rights when applicable.

The Agent handles all other preparation and execution according to the Skill's internal rules.

## License And Privacy Boundary

The original code, documentation, scripts, and templates in this repository are available under the [Apache License 2.0](LICENSE). Third-party tools, models, fonts, services, and user-provided media keep their own licenses and rights; this repository's license does not relicense them.

This public repository intentionally contains no creator footage, face or voice files, private project paths, account credentials, unpublished renders, or personal style profile. Keep those artifacts in the external project and private data directories created by the Skill, never in Git.
