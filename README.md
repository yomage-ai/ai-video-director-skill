# AI Video Director Skill

[中文说明](README.zh-CN.md)

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
Deliver the final video, editable project, and necessary verification records.
```

If the Skill already appears in Codex, the short form is enough:

```text
Use $ai-video-director to process the attached talking-head video. Inspect the material first, then show me the content-lock card and director plan. Continue only after I approve.
```

For a dialogue recut, the Skill also audits every real clip boundary against the manuscript: complete first/last words, natural pause length, no retained swallow or mouth noise, and rendered normal-speed proof before rough-cut approval.

For app or dashboard evidence, the Skill locks the exact page/tab/subtab state, derives each crop from source semantics instead of guessing from a screenshot thumbnail, records an ROI manifest, and blocks export when an adjacent view or approximate callout is shown. An approved signature outro also keeps its full motion contract, including any tilt and blink/wink, unless a new version is explicitly approved.

For the reusable semantic-progress component, you can add:

```text
Use the generic RMCU semantic progress component. Choose its landscape or portrait variant from the target canvas, keep the same clean two-lane style in both orientations, ellipsize inactive long chapter labels, and loop only the active label when it overflows.
```

For a multi-device 9:16 talking-head layout, you can add:

```text
Use the approved portrait talking-head safe layout. Keep crop-tolerant backgrounds full bleed, but keep captions, progress semantics, important B-roll regions, picture-in-picture or presenter cutouts, and identity marks visible on both narrow phones and wide tablets. Validate the real published player instead of treating the encoded canvas edge as safe.
```

For the outlined live-presenter cutout style, you can add:

```text
Use B-roll as the base and keep the time-aligned presenter visible as an outlined transparent cutout when the actual moving matte passes. Use HyperFrames background removal locally on the clean locked A-roll, keep dialogue on the canonical audio track, and fall back to a designed PiP or full-screen evidence instead of keeping broken edges.
```

For reusable code-authored motion graphics, you can add:

```text
Use the code motion component system. Audit existing components as general mechanisms, private creator adapters, topic templates, archives, or error samples. Keep general behavior separate from private assets and this video's copy, timing, and media. Reuse or promote a component only after content-fit, seek-safe motion, layout, rights, and real-export checks pass.
```

## What The User Provides

- Recorded talking-head footage or a script to turn into video, at least one of these.
- Target platform, aspect ratio, and intended use.
- Any claims, sections, or source material that must remain.
- Optional reference videos, brand assets, and style preferences.
- Explicit approval for payment, account access, identity/voice use, and media rights when applicable.

The Agent handles all other preparation and execution according to the Skill's internal rules.

This repository is currently for private testing and does not grant a public-use or commercial license. Do not commit private footage, faces, voices, account credentials, or unpublished renders to this Git repository.
