---
name: ai-video-director
description: Governed bilingual workflow for AI video creation and talking-head editing. Use when a user wants to turn a script or recorded talking-head video into a reviewed rough cut, visual fine edit, captions, sound, master, editable project, or reusable personal style memory. 适用于真人口播自动剪辑、脚本生成视频、内容锁定、ChatCut 粗剪审核、统一 EDL、FFmpeg 精确剪辑、HyperFrames/Remotion 视觉精剪、字幕音频、质量验收和反馈沉淀。
---

# AI Video Director

## Operating Contract

Reply in the user's language. Keep routine updates concise, but make every approval gate understandable in plain language.

This Skill is the director and decision system. It does not pretend that one model performs deterministic media work. Route each operation to the proper tool, preserve one canonical timeline, and record what was approved.

For every new task:

1. Resolve this Skill directory and repository root from the current `SKILL.md` path.
2. Run `node scripts/director.mjs doctor` from this Skill directory. Report blockers before media work.
3. Run `node scripts/memory.mjs init`, then load the private base profile if it exists.
4. Create or load a project outside this repository. Never put personal media, face/voice references, secrets, unpublished renders, or private preferences in Git.
5. Inspect source media with `ffprobe` before transcoding. Record dimensions, rotation, frame rate, duration, codecs, audio, and color metadata.
6. Read only the references needed for the current stage. Always read [workflow.md](references/workflow.md) and [production-standard.md](references/production-standard.md) for a fresh project.

## Current Supported Path

The production path is recorded talking-head footage. An authorized Qwen3-TTS short voice sample is an optional, separately approved branch. Digital-human/avatar generation is paused. Never use SadTalker. Do not invoke the legacy `ai-auto-editing-director` Skill.

## Workflow

Use the stage order and return paths in [workflow.md](references/workflow.md):

1. Intake and technical preflight.
2. ASR with word timing, transcript correction, and full-source listening.
3. Compact content lock: one primary claim, at most two supporting points, order, and real-evidence cold open.
4. Director plan: retain/remove rules, rough-cut intent, visual beats, evidence needs, and risks.
5. ChatCut visual rough-cut review; edit on a multitrack timeline and listen through every join.
6. Export Final Cut Pro XML and convert it to the sole canonical EDL.
7. Render exact A-roll from original-quality media with FFmpeg, then approve and lock the rough cut.
8. Produce three style keyframes and one short motion sample; ask the user to choose or adjust them.
9. Resolve assets and rights. Prefer owned real evidence; Pinterest is reference-only.
10. Route each visual shot independently to HyperFrames, Remotion, real footage, screenshots, or a simple FFmpeg operation.
11. Add caption styling, restrained transitions and sound effects. BGM stays off unless the user enables it and every item has a rights record.
12. Run targeted audio, transition, layout, keyframe, color, and resolution checks before a full render.
13. Render the master, listen to the complete dialogue, inspect representative frames, and verify rights.
14. Deliver the final video together with the editable project, canonical EDL, captions, decision record, rights manifest, and QA report.
15. Record feedback privately. Promote it to the base profile only after explicit user approval or repeated confirmation.

Do not begin full production until the user approves the content lock and director plan. Do not silently start credit-consuming or paid generation.

## Tool Routing

Read [tool-selection.md](references/tool-selection.md) before selecting engines.

- Use ChatCut for multitrack visual review, transcript-linked editing, preview, and human adjustment. When ChatCut is active, follow `$chatcut:chatcut-plugin-basics`, `$chatcut:talking-head-guide`, `$chatcut:transcription`, `$chatcut:verification`, and `$chatcut:export` as relevant.
- Treat ChatCut's FCP XML as a reviewed edit source, not a second permanent timeline. Convert it with `scripts/chatcut-xml-to-canonical-edl.mjs`; all downstream timing must use the resulting canonical EDL. Read [chatcut-handoff.md](references/chatcut-handoff.md).
- Use FFmpeg `-c copy` only for a fast, approximate preview. Use precise re-encoding for locked A-roll and the master.
- Use HyperFrames for real-media composition, direct visual authorship, fixed structures, and simpler variables. Read `$hyperframes` first whenever selected.
- Use Remotion for nested data, conditional layouts, reusable React components, and many structured variants. Do not render the same shot in both engines unless running a declared A/B test.
- Treat video-use as boundary and acceptance logic already absorbed into this workflow, not as a second orchestrator layer.
- Use the Qwen3-TTS helper only for an authorized short sample under [voice-clone.md](references/voice-clone.md). ASR and human listening remain mandatory.

## Approval Gates

At each gate, show what is being decided, a recommended option first, two or three alternatives at most, cost/rights implications, and what becomes invalid if changed later. Follow [interaction.md](references/interaction.md).

Required gates:

- Content lock and director plan.
- Rough-cut preview and canonical EDL lock.
- Three keyframes and short motion sample.
- Asset rights and any paid/credit operation.
- Caption style and optional audio mix.
- Final master and feedback promotion.

## Memory

Follow [memory-and-feedback.md](references/memory-and-feedback.md). Keep three layers separate:

- Repository defaults: generic, non-personal, versioned here.
- Private base profile: reusable user preferences in `AI_VIDEO_DIRECTOR_DATA_DIR`.
- Project overrides: choices that apply only to one video.

Never infer a permanent preference from one isolated choice. Record the reason and evidence for every promotion.

## Governance And Delivery

Before adopting or upgrading a tool, model, service, font, music source, effect library, or asset library, complete a governance card using `assets/templates/tool-governance-card.template.json`. Follow [tool-governance.md](references/tool-governance.md).

Every delivery must include:

- Final master and platform variants.
- Editable project/source.
- Canonical EDL and timing map.
- Corrected transcript and captions.
- Director/edit decisions.
- Rights manifest.
- QA report and unresolved limitations.

Do not claim that copying this Skill alone makes the workflow portable. Report missing runtimes, accounts, plugins, models, fonts, and project media.

## Commands

Run from this Skill directory:

```bash
node scripts/director.mjs doctor
node scripts/director.mjs init-project --id my-video --root ~/Documents/ai-video-projects
node scripts/memory.mjs show
node scripts/chatcut-xml-to-canonical-edl.mjs review.xml canonical-edl.json
node scripts/render-canonical-edl.mjs canonical-edl.json source.mov a-roll-master.mp4
```

Repository setup and validation commands are documented in the root README.

## References

- [workflow.md](references/workflow.md): complete stage graph, artifacts, and restart rules.
- [production-standard.md](references/production-standard.md): rough/fine boundaries, media handling, QA, and delivery.
- [tool-selection.md](references/tool-selection.md): current priority, strengths, weaknesses, cost, and exclusions.
- [research-and-tests.md](references/research-and-tests.md): eight-case union and controlled component evidence.
- [chatcut-handoff.md](references/chatcut-handoff.md): visual timeline to canonical EDL handoff.
- [interaction.md](references/interaction.md): concise user choices and approval gates.
- [memory-and-feedback.md](references/memory-and-feedback.md): private evolving style memory.
- [tool-governance.md](references/tool-governance.md): license, cost, privacy, and evidence checks.
- [voice-clone.md](references/voice-clone.md): approved short-sample Qwen3-TTS boundary.
