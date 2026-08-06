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

For the reusable semantic-progress component, you can add:

```text
Use the generic RMCU semantic progress component. Choose its landscape or portrait variant from the target canvas, keep inactive long chapter labels ellipsized, and loop only the active label when it overflows.
```

## What The User Provides

- Recorded talking-head footage or a script to turn into video, at least one of these.
- Target platform, aspect ratio, and intended use.
- Any claims, sections, or source material that must remain.
- Optional reference videos, brand assets, and style preferences.
- Explicit approval for payment, account access, identity/voice use, and media rights when applicable.

The Agent handles all other preparation and execution according to the Skill's internal rules.

This repository is currently for private testing and does not grant a public-use or commercial license. Do not commit private footage, faces, voices, account credentials, or unpublished renders to this Git repository.
