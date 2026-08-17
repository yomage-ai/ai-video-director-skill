# Research And Test Evidence

## Eight-Case Union

The workflow was built from the confirmed union of eight public demonstrations, not by assuming every creator used every stage.

| Public case | Confirmed contribution absorbed into this workflow |
|---|---|
| Doubao automatic editing | Script/digital presentation, captions, motion, reference style, and result review as possible branches |
| GLM + Fish + HeyGen + HyperFrames | Script-to-voice/avatar-to-programmatic-visual layering; avatar branch is now paused |
| Codex + ChatCut “unexpected result” | Talking-head packaging, captions/effects, visual timeline, and the need for human visual acceptance rules |
| Codex + video-use + HyperFrames/Remotion | Transcript/semantic cuts, EDL, packaging plan, code visuals, FFmpeg, and reusable workflow documents |
| Codex + ChatCut | Plan, rough cut, trial cut, multitrack/waveform preview, manual correction, review, and learned aesthetic rules |
| Six-minute product/marketing workflow | Product/reference inputs, generated candidates, preview, and result inspection; paid generation is not in the current free core |
| Codex editing six-step method | Plan before production, keyframe/short-sample approval, targeted correction, and reproducible delivery evidence |
| Multi-agent talking-head workflow | Talking-head cleanup, task screenshots as real B-roll, historical style memory, and end-to-end progress awareness |

The resulting process is greater than the confirmed nodes of those examples: intake, content understanding, editable rough-cut review, one timeline, precise execution, cheap style approval, rights-aware assets, per-shot visuals, sound/captions, QA, editable delivery, and memory. Unclear claims from the videos are not treated as tested capabilities.

## Controlled Source Test

One `IMG_6859.mov` clip was used to compare components while keeping the source and edit intention fixed. This supports local decisions only.

### Rough Cut And Timeline

| Component | Measured result | Decision |
|---|---|---|
| FFmpeg `-c copy` | `0.11s` run, `20.151693s` output; carried about `0.84s` because of keyframes | fast preview only |
| FFmpeg precise manual EDL | about `4.49s`, `15.233333s` | exact execution baseline |
| video-use controlled EDL rules | about `6.32s`, `15.27002s` | boundary and join rules validated; native Scribe not validated |
| ChatCut to FCP XML to canonical EDL to FFmpeg | about `1.73s`, `461` frames, `15.366016s` | active timeline handoff |
| ChatCut cloud captions/motion export | editable multitrack behavior worked; intermittent incomplete text/motion pixels and non-monotonic DTS persisted | review sample only, not master |
| VideoCut 0.3.0 | runtime/Bun/Studio/FFmpeg doctor passed | full test blocked by Volcengine transcription key |

For this source, ChatCut retained roughly `130ms` before the second phrase to avoid swallowing a repeated acoustic onset. That is a clip-specific safety handle, not a universal constant.

### HyperFrames And Remotion

Both rendered the same three 6-second, 720x1280, 30fps cases with the same copy, data, layout, colors, and animation timing.

- HyperFrames 0.7.90 batch wall time: `16.64s`.
- Remotion 4.0.504 batch wall time: `8.44s`.
- Remotion was about `1.97x` faster in this one setup.
- Full-video SSIM: `0.929864`; stable frames were visually close but not pixel-identical.
- HyperFrames passed lint/check and `31/31` contrast checks.
- Remotion bundled and rendered all three outputs with complete decoding.

Decision: HyperFrames remains first for real assets/fixed/simple-variable shots; Remotion is first for nested data, dynamic rows, conditions, or React reuse. Speed from this sample is not a universal ranking.

### HyperFrames Presenter-Cutout Smoke Test

HyperFrames `0.7.109` background removal was smoke-tested locally on an Apple M3 Max with 36 GB unified memory. The one-second input was 720x960 at 30fps and deliberately already contained a presenter, graphics, and baked captions, so this test validates execution and alpha delivery rather than raw-footage matte quality.

- `--device auto` selected CoreML and processed all `30` frames.
- The CLI reported `3.77s` processing time and `125.7ms` per frame; total process wall time including startup was `15.25s`.
- Maximum resident set size was about `1.45 GB`.
- The 1.0-second output decoded through `libvpx-vp9` as `yuva420p`, retained `30` frames and `alpha_mode=1`, and was `368051` bytes with `--quality best`.
- Foreground text touching the presenter entered the matte, confirming that production input must be clean locked A-roll without baked captions, cards, or logos.

Decision: the local toolchain is active as the default engine for `B-base-A-cutout`, but each real shot remains fail-closed on moving matte quality. This test does not prove hair, hand, prop, motion-blur, or temporal-edge quality for a different source. See `governance-hyperframes-background-removal.json`.

## Why Early Outputs Looked Gray

The original source was 2160x3840, about 59.77fps, HEVC Main10 with Dolby Vision Profile 8 and HLG/BT.2020 metadata. The shared review proxy was labeled BT.709 without proper HDR-to-SDR tone mapping. Both FFmpeg and ChatCut-derived comparisons inherited that bad proxy, producing low saturation and an almost black-and-white look.

This was an input color-pipeline defect, not a HyperFrames/Remotion aesthetic decision and not a rough-cut semantic error. The 540x960 and 720x1280 outputs were also deliberate low-cost test proxies, not master quality.

The production rule is now to detect HDR before rendering, build and approve a color-managed proxy, and return to original-quality media for the final master. The bundled precise renderer refuses implicit HDR-to-8-bit-SDR conversion.

## Evidence Discipline

- Separate first-time installation from repeat-run time.
- State missing credentials, paid-plan blocks, and untested native paths.
- Compare components that do the same job, not unrelated finished products.
- Keep source, data, layout, timing, and target settings fixed for A/B tests.
- Never generalize a single source clip into a universal winner.
