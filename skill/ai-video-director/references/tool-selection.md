# Current Tool Selection

Status date: 2026-08-03. “Active” means approved only for the stated role and tested scope. It is not a universal ranking.

## Production Route

| Stage | Current choice | Why | Boundary |
|---|---|---|---|
| Control and decisions | `ai-video-director` Skill | Keeps gates, artifacts, rights, restarts, and memory consistent | It coordinates; it does not transcode or render by itself |
| Transcript and rough-cut review | ChatCut | Real multitrack UI, waveform, transcript-linked cuts, preview, and easy human adjustment | Cloud account/service; AI actions may consume credits; do not use cloud MP4 as master until export regressions pass |
| One timing truth | ChatCut FCP XML to canonical EDL | Removes the conflict between a visual timeline and local timing map | Tested for straight cuts on a primary track; fine-edit layers are rebuilt downstream |
| Fast rough look | FFmpeg `-c copy` | Very fast and does not re-encode | Approximate keyframe boundaries only |
| Locked A-roll and master | FFmpeg precise re-encode | Deterministic cuts and inspectable media pipeline | Must preserve or intentionally convert color; installed build license depends on configuration |
| Real evidence and simpler programmatic shots | HyperFrames | Direct HTML/media composition, seekable animation, strong validation, editable files | Current repository license is Apache-2.0; renderer/runtime still needs installation |
| Complex structured visual shots | Remotion | React components, typed/nested data, conditional layout, reusable variants | Current one-person internal creator use is within the free tier; external automation products or team growth require a new license check |
| Optional code animation component | React Bits free components | Fast source starting point for abstract relationship/network motion | Use only the free MIT component; Pro assets require a paid developer license; never use decorative motion as evidence |
| Optional authorized short voice | Qwen3-TTS via MLX-Audio, seed 42 | Local, pinned, reproducible in the accepted test | New voice/long-form/runtime requires retest; human and ASR QA mandatory |
| BGM and effects | Off by default; owned audio first | Avoids rights and speech-intelligibility problems | When enabled, check and record the exact item license |

## HyperFrames Versus Remotion

They overlap in rendering programmatic visuals, but their best roles are not identical. Neither understands the script by itself; the same content lock, beat sheet, typography, assets, and animation direction drive quality.

Use HyperFrames when the shot is mainly:

- Real video, screenshot, image, document, or waveform composition.
- A fixed process, title card, comparison, or simple data display.
- A one-off authored scene or variants that replace text, numbers, colors, and media.
- Best served by its native inspect/lint/check/snapshot/render loop.

Use Remotion when the shot is mainly:

- Nested arrays, variable-length lists, or condition-dependent layout.
- A reusable React component family across many structured variants.
- Complex programmatic state that is already natural to express in React/TypeScript.

In the controlled component benchmark on one Mac and one shared dataset, HyperFrames 0.7.90 took `16.64s`; Remotion 4.0.504 took `8.44s`, about `1.97x` faster for that case, with visually close output. This result chooses a shot engine for similar cases only; it does not prove a universal speed or quality winner.

Current licenses:

- HyperFrames' official repository states Apache-2.0 with no per-render fee.
- Remotion's current pricing says creators who are individuals or companies up to three people can use the free license commercially. The separate “Remotion for Automators” terms apply when launching an application/system that automates video for others. Recheck before that boundary or team growth.

## ChatCut And `video-use`

ChatCut remains active because it supplies what the local scripts do not: a visual timeline, multitrack context, realtime preview, transcript interaction, and direct human adjustment.

`video-use` is not stacked as another director. Its tested contribution is now internal workflow logic: word-boundary handles, short fades, join checks, controlled EDL rules, and acceptance criteria. Its native Scribe path was not tested because the required ElevenLabs key was unavailable. Do not describe a compatible Whisper adapter as proof that native Scribe passed.

ChatCut's current service policy permits legitimate commercial creative output, but the service requires an account, uploads media, and AI creation uses credits. The tested cloud MP4 intermittently contained incomplete text/motion frames and non-monotonic video DTS. Therefore:

- Active: visual review, transcript editing, human cut adjustment, FCP XML export.
- Access only through ChatCut's intended UI and official Codex plugin; do not script private endpoints or bypass access controls.
- Not active as master: cloud-rendered final video.
- Recheck: account terms, privacy/retention, credits, plugin version, and export regression before public/commercial delivery.

## Optional, Paused, And Excluded

| Tool/path | Status | Decision |
|---|---|---|
| VideoCut 0.3.0 | P2 incomplete | Runtime, Bun, Studio, FFmpeg Doctor passed; full workflow lacks a Volcengine transcription key. Keep as a future component comparison, not core. |
| Seedance 2.0 | Excluded from free core | A real ChatCut submission was rejected before creation because the current plan was not Pro. Do not spend credits unless the user later approves a budget and a new governance card. |
| Digital human / avatar | P3 paused | Current branch is not production-ready. No avatar demo is part of this Skill. |
| MuseTalk | P3 paused | Requires a suitable NVIDIA CUDA environment for practical use and remains unvalidated here. |
| SadTalker | Excluded | User rejected its quality. Do not run or show its demo. |
| cut-motion | Excluded | Explicitly not used. |
| Generative Media Skills / Seedance prompt Skill | Excluded | No extra router layer and no prompt-only wrapper in the current path. |
| Legacy `ai-auto-editing-director` | Excluded | Historical direction was not accepted; do not invoke it. |
| Private/unpublished editing Skills | Excluded | Cannot form a stable auditable dependency. |

## Reference And Asset Sources

- Pinterest: use only to discover composition, palette, pacing, or visual references. A pin does not transfer rights to the underlying image.
- React Bits Magnet Lines: suitable for short abstract shots about connection, network, attraction, or relationships. It is not proof of a real operation. Confirm the installed component comes from the free MIT collection, not Pro.
- Pexels: photos/videos are generally free to use and modify under its license, with restrictions around endorsement, trademarks, identifiable people, and standalone redistribution.
- Pixabay: permits free use and adaptation subject to prohibited uses and possible third-party rights; check people, brands, and property.
- Mixkit: licenses vary by item type; use only items marked under the applicable Free License and save the exact item/terms record.
- Freesound: use CC0 by default or CC-BY with complete attribution. Do not use CC-BY-NC for a commercial video.

The asset manifest, not this list, decides whether a particular file can be used.

## Official Sources

- HyperFrames repository and license: https://github.com/heygen-com/hyperframes
- Remotion license/pricing: https://www.remotion.dev/license
- FFmpeg legal: https://ffmpeg.org/legal.html
- ChatCut Terms, Usage Policy, Credits: https://chatcut.io/terms/ , https://chatcut.io/docs/usage-policy , https://chatcut.io/docs/credits-policy
- React Bits free/Pro comparison: https://pro.reactbits.dev/compare/react-bits-pro-vs-free-react-bits
- Pexels: https://www.pexels.com/license/
- Pixabay: https://pixabay.com/service/license-summary/
- Mixkit: https://mixkit.co/license/
- Freesound: https://freesound.org/help/faq/
