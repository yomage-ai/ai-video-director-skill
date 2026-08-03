# AI Video Director Repository Rules

This repository contains the reusable Skill, deterministic scripts, templates, governance records, and anonymous tests. It is not a video-project workspace.

Before changing the workflow or a tool decision:

1. Read `PROJECT_STATE.json`.
2. Read `skill/ai-video-director/SKILL.md`.
3. Read the relevant file in `skill/ai-video-director/references/`.
4. Run `npm run doctor` and `npm test` after implementation.
5. Run `npm run privacy-scan` before every commit.

Hard rules:

- Never commit personal footage, faces, voices, transcripts, unpublished renders, credentials, account identifiers, cookies, API keys, model caches, or absolute user media paths.
- Keep personal preferences and feedback outside Git under `AI_VIDEO_DIRECTOR_DATA_DIR`.
- Keep every video project outside this repository and initialize it with the provided project command.
- Require a governance record before adopting or upgrading a tool, model, runtime, service, Skill, or asset source.
- Separate software, model-weight, dependency, source-asset, portrait, voice, trademark, cost, privacy, and publication-labeling questions.
- Do not describe one test clip as universal proof or an untested route as supported.
- Do not use `ai-auto-editing-director` for new work.
- Do not use SadTalker. Digital-human/avatar generation is paused until the user explicitly reopens it.
- Keep Qwen3-TTS seed 42 limited to the approved reference and short-sample scope until broader tests pass.
- Use ChatCut for visual rough-cut review, canonical EDL as the locked time source, and FFmpeg for deterministic final media execution.
- Use HyperFrames and Remotion by shot responsibility; never render the same shot twice merely to compare whole products.
- Keep BGM off by default and use only item-level rights-cleared media.
- Do not perform a full render before targeted audio, transition, layout, color, and keyframe checks pass.
- Deliver the editable project and decision/QA records with the final video.
