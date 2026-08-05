# QA Report

- Project:
- Version:
- Date:
- Reviewer:
- Result: `pending|pass|fail`

## Media

- Duration/dimensions/frame rate/codecs:
- Timeline/EDL timebases declared and shared boundaries converted by time:
- First/last boundary, item count/order, pairwise contiguity, and expected duration preserved:
- Color path/source-output comparison:
- Continuous-recording color scope is source/track/global unless real lighting changes are documented; early/middle/late and cut-boundary frames remain perceptually consistent:
- Audio channels/loudness/sync:
- Speech isolation strength, per-source-range routing, and early/late audible samples:
- Blank/frozen/corrupt frame checks:

## Dialogue And Captions

- Full dialogue listened:
- Every join reviewed:
- Repeated tokens scanned across transcript/clip boundaries and exact audible windows verified:
- Structural Script edits rechecked for clip/source timing, intentional transitions, and downstream B-roll alignment:
- Quality-first retake decisions and any hybrid splices audited:
- Ordinary breaths preserved and excessive dead air handled contextually:
- Transcript/caption correctness:
- Caption scale, reflow, box height, safe area, and longest two-line page:
- Final viewer-facing pagination was locked before punctuation styling, and the punctuation audit was repeated after every reflow, forced break, merge, scale change, or Script edit:
- Every manuscript punctuation mark inside a caption page is preserved; detachable commas, periods, semicolons, colons, and enumeration commas are omitted only when they are the page's final character:
- Page-final question and exclamation marks are always preserved; paired structural closers and punctuation embedded in numbers, units, names, or terms are not stripped:
- Global punctuation hiding remains off whenever an internal, question/exclamation, or paired-structure exception exists:
- No semantic punctuation was invented or replaced with a different visible symbol; any renderer limitation was handled by exact-glyph rendering, an authored caption/card, or meaning-based page separation:

## Information And Privacy

- Every must-keep point mapped to spoken/on-screen/both and present:
- Institution-, location-, and time-specific claims scoped accurately:
- Only locally redacted screenshot derivatives used:
- Opaque-mask and mobile-scale redaction inspection:
- Screenshot focus cues point to the exact evidence without covering or overstating it:

## Visuals

- Opening and real evidence:
- Color-cast correction compared on representative frames; skin texture and highlights preserved:
- Presenter insert starts on a normal open-eye frame and remains time-aligned:
- Picture-in-picture crop intent, aspect/shape/radius, headroom, and source-crop review:
- Picture-in-picture size and position were chosen from each card or coverage run rather than a fixed global geometry, then held stable inside the run:
- Intended visible crop box, not only stored item dimensions, passed native and phone-scale composed-frame review:
- Per-card content-occupancy map and chosen negative-space position; no primary evidence is covered:
- Platform UI exclusion zones and caption/information-card collision:
- Keyframes and animation seek stability:
- Continuous B-roll runs retain full interior coverage; before/on/after seam frames show no accidental A-roll flash:
- Adjacent B-roll beats were merged into aggregate coverage runs and each run was classified as A-only, B-only, or AB-live-PiP:
- Transition grammar distinguishes continuous-card direct cuts from motivated presentation-mode changes; B-roll and PiP entrances/exits are synchronized:
- Transitions/layout/overlap:
- Caption pages separate completed thoughts from the next thought after final pagination readback:
- Native and thumbnail-scale inspection:

## Semantic Chapter Progress

- Progress source is the approved semantic structure after final timing lock; no arbitrary or fabricated chapters:
- Segment labels and duration-proportional boundaries:
- Fallback is one unsegmented bar when no meaningful multi-section structure exists:
- Filled progress and playhead use actual timeline time; early, middle, late, and every chapter boundary were rendered and checked:
- Transparent edge-to-edge line sits below captions near the bottom edge; sections use divider ticks rather than boxed cards:
- Primary captions, evidence, and picture-in-picture remain clear; any platform-UI occlusion is an intentional auxiliary-overlay tradeoff:
- Rendered strip is visual orientation only; native player scrubbing or separate platform chapter metadata provides actual seeking:

## Finishing Design Audit

Record a decision and reason for every category. `Off`/`none` is valid; `unreviewed` is not.

- Background music decision/reason, speech-intelligibility impact, track/rights/mix when enabled:
- Sound effects decision/reason and exact motivated cue list when enabled:
- Entry/exit animation decision/reason and treated boundaries:
- Transition decision/reason and relationship conveyed at each treated boundary:
- Decorative effects decision/reason; functional focus cues distinguished from ornament:

## Rights And Delivery

- Rights manifest complete:
- Editable project opens:
- Canonical EDL and captions included:
- Known limitations:

## Decision

State the exact approved artifact and any remaining restrictions.
