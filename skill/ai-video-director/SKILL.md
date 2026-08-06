---
name: ai-video-director
description: Governed bilingual workflow for AI video creation and talking-head editing. Use when a user wants to turn a script or recorded talking-head video into a reviewed rough cut, visual fine edit, captions, sound, master, editable project, or reusable personal style memory. 适用于真人口播自动剪辑、脚本生成视频、内容锁定、ChatCut 粗剪审核、统一 EDL、FFmpeg 精确剪辑、HyperFrames/Remotion 视觉精剪、字幕音频、质量验收和反馈沉淀。
---

# AI Video Director

## Operating Contract

Reply in the user's language. Keep routine updates concise, but make every approval gate understandable in plain language.

This Skill is the director and decision system. It does not pretend that one model performs deterministic media work. Route each operation to the proper tool, preserve one canonical timeline, and record what was approved.

Own the technical setup. Do not ask the user to run installation, doctor, dependency, project-initialization, or render commands. Execute them yourself. Ask the user only when an account login, operating-system permission, paid action, identity consent, or media-rights decision cannot be completed safely without them.

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
5. ChatCut visual rough-cut review; edit on a multitrack timeline and listen through every join. For repeated takes, select quality-first rather than keeping the last occurrence by default; use a later occurrence only as a tie-breaker when the candidates are materially equal. Audit repeated words across segment boundaries against audible playback because caption-only hiding does not remove speech. Classify pauses by function, audit every must-keep point as spoken/on-screen/both, and record the result with `assets/templates/rough-cut-review.template.json`. Before rough-cut approval, normalize the original talking-head color once at source, track, or global scope: target natural exposure and skin rather than a beauty look, inspect early/middle/late and cut-boundary frames, and roll back with a stage update if the result drifts gray, red, or otherwise inconsistent. After a structural Script edit, re-read transitions and downstream B-roll timing. Follow [production-standard.md](references/production-standard.md).
6. Export Final Cut Pro XML and convert it to the sole canonical EDL.
7. Render exact A-roll from original-quality media with FFmpeg. After the last edit, watch and listen from start to finish, approve the source-level color decision, then lock the rough cut. Fine edit inherits this approved A-roll color and does not reprocess it unless the user makes a new explicit request or the source lighting/camera state genuinely changes.
8. Produce three style keyframes and one short motion sample; ask the user to choose or adjust them.
9. Resolve assets and rights. Prefer owned real evidence; Pinterest is reference-only.
10. Route each visual shot independently to HyperFrames, Remotion, real footage, screenshots, or a simple FFmpeg operation.
11. Add caption styling, a content-driven transition grammar, restrained sound effects, and deliberately designed presenter inserts. Preserve the approved caption visual language instead of silently redesigning it; only relocate or reflow captions for an explicit user request or a documented hard collision, then recheck the changed layout at native and phone scale. Treat progress-bar text, chapter labels, and bottom navigation copy as the semantic progress layer, never as the caption track. Give progress labels one stable cross-background baseline: a narrow full-width translucent neutral strip, light text with a restrained dark shadow or stroke, no per-chapter boxes, and placement in a platform-validated edge band. Test bottom placement below captions first, but reject it when actual platform descriptions or controls obscure the semantic labels; use a reserved top-safe band or another proven band and reflow nearby headings, picture-in-picture, and information cards. Express current, past, and future state through weight, opacity, fill, and playhead rather than scene-by-scene color inversion. Propose each chapter label, order, and one-sentence scope in the director plan before style preview; director-plan approval locks the semantic labels, while exact duration-proportional boundaries are computed after rough-cut timing lock and shown in the motion sample. Prove progress-label readability on A-roll, bright B-roll, dark B-roll, and chapter boundaries at native and phone scale, then confirm it on available published target-device screenshots. Use the repository-owned `rmcu.semantic-progress.v1` contract for generic landscape and portrait overflow behavior; inactive long labels use ellipsis, while only the active overflowing label loops inside its stable segment. When a creator has a recurring spoken sign-off, treat it as a named signature-outro component: prefer owned identity artwork over generic third-party stickers, preserve the live performance, and show one still plus one short motion sample before its first reusable lock. Validate the component's complete motion envelope so scale, rotation, translation, internal marks, and overshoot cannot clip inside its own box even when it is already on the top track. Prefer a static outer natural box with a padded inner animated stage that contains every visible extreme; visible overflow alone is not cross-renderer proof. Keep generic progress behavior in this repository; store only creator-specific progress tokens, optional identity-marker adapters, and signature-outro choices in the private style profile after explicit approval. Run and record an explicit finishing-design audit for background music, sound effects, entry/exit animation, transitions, and decorative effects; `off` or `none` must be a reasoned decision, not an unreviewed default. BGM stays off unless the user enables it and every item has a rights record. When isolating speech on a recut, process each clip's actual source range; never reuse a short derived-audio asset across clips with different source offsets. Inside a continuous B-roll run, preserve full visual coverage instead of letting paired fades or tiny gaps expose one-frame A-roll flashes. Never shrink the uncropped A-roll into one fixed corner by default; define the picture-in-picture crop, shape, size, and content-safe position from the actual card. Choose both size and position for the composed card or coverage run, keep that geometry stable inside the run, and change it only at a semantic or layout boundary. After structural timing is locked, add a time-driven semantic chapter progress strip by default: use short labels and duration-proportional segments only when real content blocks exist, otherwise use one unsegmented progress bar. Its default visual grammar is one edge-to-edge platform-safe strip with simple divider ticks rather than boxed chapter cards. The rendered strip is visual navigation; actual seeking remains the platform player's control.
12. Run targeted audio, transition, layout, keyframe, inherited-color-continuity, and resolution checks before a full render. Measure dialogue loudness from the actual rendered timeline after cuts, denoise, fades, and gain; compare it with clean non-clipping references from the selected private profile when available, apply one consistent gain across a continuous same-session recording, and re-render to prove integrated loudness and true-peak headroom. After enlarging captions, reflow them and recheck the longest two-line card against presenter inserts, information cards, and platform safe areas. Lock semantic pagination before styling punctuation. Preserve every manuscript punctuation mark inside a caption page; omit detachable separators or terminators such as commas, periods, semicolons, colons, and enumeration commas only when they are the page's final character. Always preserve page-final question and exclamation marks, and never strip a paired structural closer such as a quotation mark or bracket. Re-run this audit after any pagination change, keep global punctuation hiding off when exceptions exist, and verify the composed pixels. Do not invent or substitute visible symbols; if an exact glyph is stripped, change renderer/style, use an authored caption/card, or separate pages by meaning. Inspect changed B-roll seams on the boundary frames and separate a completed thought from the next thought in viewer-facing caption pages.
13. Render the master, listen to the complete dialogue, inspect representative frames, and verify rights.
14. Deliver the final video together with the editable project, canonical EDL, captions, decision record, rights manifest, and QA report.
15. Record feedback privately. Promote it to the base profile only after explicit user approval or repeated confirmation.

Progress placement safety overrides the bottom-first candidate described above. A semantic chapter strip must remain readable on the actual delivery surface; platform UI exclusion zones are constraints, not acceptable occlusion. Validate published screenshots on the target phone, tablet, and player surfaces. If bottom descriptions or controls obscure the strip, relocate it to a reserved top-safe band or another proven safe band, then reflow headings, picture-in-picture, and information cards below or around it while preserving the approved caption lane. Never solve the move by laying progress labels over existing headings.

Read [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md) whenever implementing or reviewing the reusable landscape or portrait semantic-progress component family.

Do not begin full production until the user approves the content lock and director plan. Do not silently start credit-consuming or paid generation.

## Tool Routing

Read [tool-selection.md](references/tool-selection.md) before selecting engines.

- Use ChatCut for multitrack visual review, transcript-linked editing, preview, and human adjustment. When ChatCut is active, follow `$chatcut:chatcut-plugin-basics`, `$chatcut:talking-head-guide`, `$chatcut:transcription`, `$chatcut:verification`, and `$chatcut:export` as relevant. Before copying or rebuilding clip boundaries, compare the canonical and target timeline frame rates; never reuse raw frame numbers across different timebases.
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

## Internal Agent Commands

These are Agent operations, not a user setup checklist. Run them yourself and summarize only blockers that require user action.

Run from this Skill directory:

```bash
node scripts/director.mjs doctor
node scripts/director.mjs init-project --id my-video --root ~/Documents/ai-video-projects
node scripts/memory.mjs show
node scripts/chatcut-xml-to-canonical-edl.mjs review.xml canonical-edl.json
node scripts/render-canonical-edl.mjs canonical-edl.json source.mov a-roll-master.mp4
```

Keep the root README limited to bilingual natural-language invocation, inputs the user must provide, unavoidable approval points, and essential rights/privacy disclosures. Do not move internal workflow, tool selection, technical setup, or maintainer commands back into it.

## References

- [workflow.md](references/workflow.md): complete stage graph, artifacts, and restart rules.
- [production-standard.md](references/production-standard.md): rough/fine boundaries, media handling, QA, and delivery.
- [semantic-progress-rmcu.md](references/semantic-progress-rmcu.md): generic landscape and portrait RMCU behavior, parameters, and verification.
- [tool-selection.md](references/tool-selection.md): current priority, strengths, weaknesses, cost, and exclusions.
- [research-and-tests.md](references/research-and-tests.md): eight-case union and controlled component evidence.
- [chatcut-handoff.md](references/chatcut-handoff.md): visual timeline to canonical EDL handoff.
- [interaction.md](references/interaction.md): concise user choices and approval gates.
- [memory-and-feedback.md](references/memory-and-feedback.md): private evolving style memory.
- [tool-governance.md](references/tool-governance.md): license, cost, privacy, and evidence checks.
- [voice-clone.md](references/voice-clone.md): approved short-sample Qwen3-TTS boundary.
