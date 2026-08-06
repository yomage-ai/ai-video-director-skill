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
- Rough-cut source-color decision and source/output comparison; fine edit inherited the approved A-roll color without a second treatment:
- Continuous-recording color scope is source/track/global unless real lighting changes are documented; early/middle/late and cut-boundary frames remain perceptually consistent:
- Any gray/red/inconsistent correction was rolled back to the last stable source and the rough-cut stage update was sent:
- Audio channels/loudness/sync; actual rendered-timeline before/after integrated LUFS, true peak, LRA, applied uniform gain, accepted clean references, and rejected clipped outliers:
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
- Approved caption visual style was preserved unless an explicit caption redesign was requested; progress-label requests did not alter the caption track:
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
- Chapter labels, order, and one-sentence scopes were shown in the director plan and approved before style lock; every label maps to a contiguous transcript or narrative range without invented or exaggerated meaning:
- Segment labels and duration-proportional boundaries:
- Fallback is one unsegmented bar when no meaningful multi-section structure exists:
- Filled progress and playhead use actual timeline time; early, middle, late, and every chapter boundary were rendered and checked:
- Progress labels were audited separately from subtitles; no progress-label request silently restyled the caption track:
- A narrow full-width translucent neutral strip occupies a platform-validated edge band, uses light labels with a restrained dark shadow or stroke, and separates sections with divider ticks rather than boxed cards:
- RMCU variant and canvas orientation were recorded; landscape uses a compact top rail, while portrait uses separate noncritical track/playhead and semantic-label lanes:
- Past and future overflowing labels use a static ellipsis. Only the active overflowing label loops inside its unchanged segment; hold, motion, wrap, chapter reset, and seek/re-render frames were checked:
- The generic component uses a neutral playhead and has no required creator identity asset; any private marker adapter is documented separately:
- Current, past, and future hierarchy uses weight, opacity, fill, and playhead rather than scene-by-scene color inversion:
- Progress-label readability passed representative A-roll, bright B-roll, dark B-roll, chapter-boundary, native-size, and phone-size review:
- Published target-device screenshots prove that platform descriptions, controls, and action rails do not cover semantic progress labels; when the top fallback is used, headings, evidence, and picture-in-picture were reflowed below or around it while the approved caption lane remained intact:
- Rendered strip is visual orientation only; native player scrubbing or separate platform chapter metadata provides actual seeking:

## Signature Outro

- Recurring sign-off detected and treated as a named component rather than an ordinary final subtitle:
- First reusable version received still and motion-preview approval; private-profile promotion is recorded:
- Owned or explicitly approved identity art is used; generic third-party sticker is not the default:
- Identity and encouragement cues, motion, hold, optional sound, and final speech synchronization:
- Approved identity variant and contextual accessories stayed fixed; any wink/blink passed open-before, closed-peak, open-after, and phone-size review without reading as a glitch:
- Motion envelope includes scale, translation, rotation, transform origin, internal marks, and overshoot; a static outer natural box and padded inner animated stage contain every visible extreme without relying only on overflow; first-visible, entrance, overshoot, settle, encouragement, micro-expression, reopen, and final-visible frames show the complete silhouette at native or phone scale:
- Face, final caption, semantic progress strip, and platform UI remain unobstructed at native and phone scale:

## Finishing Design Audit

Record a decision and reason for every category. `Off`/`none` is valid; `unreviewed` is not.

- Background music decision/reason, speech-intelligibility impact, track/rights/mix when enabled:
- Sound effects decision/reason and exact motivated cue list when enabled:
- Entry/exit animation decision/reason and treated boundaries:
- Transition decision/reason and relationship conveyed at each treated boundary:
- Decorative effects decision/reason; functional focus cues distinguished from ornament:

## Font Governance

- Every Motion Graphic font uses the renderer catalog's canonical family name; no production `-apple-system`, `BlinkMacSystemFont`, `PingFang SC`, or other local system stack remains:
- Every font has a verified open-license or documented user commercial-license basis; "free download" was not treated as permission:
- Unsupported-font export preflight is clear after replacement; early, middle, late, longest-label, and densest-layout frames preserve width, wrapping, weight, and collision safety:

## Rights And Delivery

- Rights manifest complete:
- Editable project opens:
- Canonical EDL and captions included:
- Known limitations:

## Decision

State the exact approved artifact and any remaining restrictions.
