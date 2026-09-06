# AI Video Director Repository Rules

This repository contains the reusable Skill, deterministic scripts, templates, governance records, and anonymous tests. It is not a video-project workspace.

Before changing the workflow or a tool decision:

1. Read `PROJECT_STATE.json`.
2. Read `skill/ai-video-director/SKILL.md`.
3. Read the relevant file in `skill/ai-video-director/references/`.
4. Run `npm run doctor` and `npm test` after implementation.
5. Run `npm run privacy-scan` before every commit.

Hard rules:

- Treat `origin/main` as the shared versioned source of truth. After a user-approved reusable rule
  or workflow change, run the required validation, commit, push, and verify that local `HEAD` and
  `origin/main` are identical in the same task. Never leave a completed Skill iteration local-only.
- Exception: when the user explicitly requires one more real-project trial before remote promotion,
  keep the working tree as a named local candidate, record the required trial in `PROJECT_STATE.json`,
  and do not commit or push. After that trial passes and the user approves promotion, validate,
  commit, push, and verify `HEAD == origin/main` in the same task. If the user explicitly changes
  this condition and authorizes an earlier source submission, record that decision and preserve
  the still-pending real-project validation; do not report the trial as completed.
- Never commit personal footage, faces, voices, transcripts, unpublished renders, credentials, account identifiers, cookies, API keys, model caches, or absolute user media paths.
- Bundle the creator-approved, publicly shared editing style in `references/xiaoxiong-public-style.json`: exact scalable subtitle tokens, loudness, natural-color processing, palettes, composition defaults and content-fit priorities. Fresh installs must work without a private profile or old reference media. Keep only optional per-user overrides, feedback history and host-local state under `AI_VIDEO_DIRECTOR_DATA_DIR`; identity art and exact Xiaoxiong signoff/motion live in the separate `xiaoxiong-ip` Skill.
- Keep shareable, de-identified fine-edit style recipes in the public curated style library when they have content-fit, avoid, adaptation, provenance, and QA contracts. Do not misclassify every creator-curated aesthetic as a private preference; identity assets, unlicensed/private source media, exact single-project data and sensitive material stay outside Git. The approved Xiaoxiong style priorities and scalable layout coordinates are intentionally public defaults, not private ranking biases.
- Treat liked, used, approved, and marked public styles as an open reference set, not a closed asset picker. When no entry fits fully, require dynamic adaptation with one dominant audiovisual system and beat-level asset decisions for evidence, generated or code-authored material, typography, icons, footage, music, and sound effects.
- Keep every video project outside this repository and initialize it with the provided project command.
- Require a governance record before adopting or upgrading a tool, model, runtime, service, Skill, or asset source.
- Separate software, model-weight, dependency, source-asset, portrait, voice, trademark, cost, privacy, and publication-labeling questions.
- Do not describe one test clip as universal proof or an untested route as supported.
- Do not use `ai-auto-editing-director` for new work.
- Do not use SadTalker. Digital-human/avatar generation is paused until the user explicitly reopens it.
- Keep Qwen3-TTS seed 42 limited to the approved reference and short-sample scope until broader tests pass.
- Use ChatCut for visual rough-cut review, canonical EDL as the locked time source, and FFmpeg for deterministic final media execution.
- Use HyperFrames and Remotion by shot responsibility; never render the same shot twice merely to compare whole products.
- Keep the rough cut dialogue-only by default. During fine edit, audition an explicit BGM-on or
  BGM-off direction in the audiovisual style sample; treat `off` as a reasoned result rather than
  a hidden default, and use only item-level rights-cleared media.
- Do not perform a full render before targeted audio, transition, layout, color, and keyframe checks pass.
- Deliver the editable project and decision/QA records with the final video.
