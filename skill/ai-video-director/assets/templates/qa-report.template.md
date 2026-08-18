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
- Exact requested-resolution release candidate, not only a lower-resolution review proxy, was the file probed, fully reviewed, and approved for publication:

## Approved-Version Change Isolation

- Last approved timeline, reusable assets, and export were preserved; the revision used a duplicated timeline and new asset version rather than an in-place overwrite:
- Declared change allowlist (tracks/items/assets/ranges/parameters allowed to change):
- Declared invariants (caption pages and punctuation, audio, color, timing, B-roll, layout, outro, and other approved layers that must not change):
- Post-edit diff of timeline structure, track/item counts, ranges, asset references, captions, audio identity or measured mix, and representative unaffected pixels:
- Every observed difference is explained by the allowlist; otherwise result is `fail`:

## Dialogue And Captions

- Full dialogue listened:
- Every join reviewed:
- Repeated tokens scanned across transcript/clip boundaries and exact audible windows verified:
- Structural Script edits rechecked for clip/source timing, intentional transitions, and downstream B-roll alignment:
- Quality-first retake decisions and any hybrid splices audited:
- Ordinary breaths preserved and excessive dead air handled contextually:
- Transcript/caption correctness:
- Caption break profile and audit report; raw fixed-width code-point splitting is absent:
- Raw pages reconstruct the manuscript, protected terms remain atomic, and no card starts with detached punctuation or an orphaned function particle:
- Under a comma-and-sentence short-card profile, every comma/period/semicolon/colon/question/exclamation boundary creates a new card; long enumeration-comma lists are split semantically:
- Caption scale, reflow, box height, safe area, and longest two-line page:
- Approved caption visual style was preserved unless an explicit caption redesign was requested; progress-label requests did not alter the caption track:
- Final viewer-facing pagination was locked before punctuation styling, and the punctuation audit was repeated after every reflow, forced break, merge, scale change, or Script edit:
- Every manuscript punctuation mark inside a caption page is preserved; detachable commas, periods, semicolons, colons, and enumeration commas are omitted only when they are the page's final character:
- Page-final question and exclamation marks are always preserved; paired structural closers and punctuation embedded in numbers, units, names, or terms are not stripped:
- Any `hidePunctuation` setting was verified to be page-aware, removing only detachable page-final punctuation while preserving internal, question/exclamation, and paired-structure exceptions; a renderer that strips all punctuation was not used:
- No semantic punctuation was invented or replaced with a different visible symbol; any renderer limitation was handled by exact-glyph rendering, an authored caption/card, or meaning-based page separation:

## Information And Privacy

- Every must-keep point mapped to spoken/on-screen/both and present:
- Institution-, location-, and time-specific claims scoped accurately:
- Only locally redacted screenshot derivatives used:
- Opaque-mask and mobile-scale redaction inspection:
- Screenshot focus cues point to the exact evidence without covering or overstating it:
- Exact evidence state path (page, tab, subtab, view, filter/date, expansion, scroll) is recorded; plausible but wrong adjacent states are named and absent:
- Every critical ROI was derived from DOM/accessibility text bounds, design geometry, or user-confirmed pixels rather than guessed from a thumbnail:
- ROI manifest records claim, source state, viewport, requested bounds, actual output dimensions, proof labels, module allowlist, forbidden-string scan, and pixel review:
- Stable-state evidence uses a still; screen recording is used only when interaction or change over time is part of the proof:
- Evidence keeps source aspect ratio, remains readable at phone scale, and appears on the matching spoken phrase instead of as an all-at-once information dump:
- Every authored fact, number, interface state, mode label, and example enters no earlier than its first permitting spoken token and remains through its final required token:
- Any same-voice before/after audition was either indispensably evidentiary and clearly signposted, or replaced by a silent authored illustration that is not represented as original proof:

## Visuals

- Opening and real evidence:
- Color-cast correction compared on representative frames; skin texture and highlights preserved:
- Presenter insert starts on a normal open-eye frame and remains time-aligned:
- Picture-in-picture crop intent, aspect/shape/radius, headroom, and source-crop review:
- Picture-in-picture size and position were chosen from each card or coverage run rather than a fixed global geometry, then held stable inside the run:
- Intended visible crop box, not only stored item dimensions, passed native and phone-scale composed-frame review:
- For every `B-base-A-cutout` run, the derivative came from clean locked A-roll without baked captions, cards, logos, or overlays; canonical dialogue remained on its separate approved track and the cutout layer was muted:
- HyperFrames version, model SHA-256, device/provider, quality, output format, source/output duration, frame rate, frame count, first/last frame, and cut-boundary alignment:
- Moving matte proof over bright, dark, and busy backgrounds covered early/middle/late and every cut boundary; hair, glasses, hands/fingers, motion blur, foreground props, leakage, holes, halos, and temporal edge flicker passed:
- Any presenter outline was derived from the same alpha, held stable with the cutout, and used for styling rather than to conceal a broken matte:
- Every presenter run records `foreground`, `supporting`, or `background` priority independently from its layout and anchor; bounded PiP was not treated as disposable background:
- Cutout silhouette, complete motion envelope, intentional bottom bleed, scale, anchor, side, and declared priority passed native, phone, evidence, progress, and platform-UI collision checks. Any intentional caption/platform-copy overlap on a background cutout affects only nonessential body area and preserves face, required gesture, critical evidence, and identity marks:
- Per-card content-occupancy map and chosen negative-space position; no primary evidence is covered:
- Platform UI exclusion zones and caption/information-card collision:
- Keyframes and animation seek stability:
- Continuous B-roll runs retain full interior coverage; before/on/after seam frames show no accidental A-roll flash:
- Coverage-boundary manifest and `audit-coverage-boundaries.mjs` report; source cuts, aggregate mode runs, continuous card spans, presenter spans, and token-demo exceptions are complete:
- A layout intended to enter or exit on a new take shares the exact program frame with that source cut; no nearby unsnapped A-only/B-roll boundary creates three visible states inside one second:
- Every snapped boundary records canonical integer `startFrame`/`endFrame`; authored seconds were derived from `frame / fps`, and the audit confirms those decimals resolve to the same runtime frames rather than slipping by one frame:
- Every intentional A-only reset holds at least two seconds unless a token-synchronized comparison/mode demo explicitly records matching first and last spoken-token boundaries:
- Entry motion is pre-rolled behind the hidden clip so the first active frame is fully covered; every changed seam passed two-before, one-before, on, one-after, and two-after rendered-frame review:
- Adjacent B-roll beats were merged into aggregate coverage runs and each run was first classified as `A-only`, `B-only`, or `AB-live`; every `AB-live` run separately records `B-base-A-PiP`, `A-base-B-overlay`, `B-base-A-cutout`, or `AB-split`:
- Transition grammar distinguishes continuous-card direct cuts from motivated presentation-mode changes; B-roll and its live presenter layer entrances/exits are synchronized:
- Ordinary A-roll/B-roll modes were selected from content and director intent without requiring the narration to name them; each visible semantic state agrees with the claim currently being spoken and neither anticipates nor contradictorily outlives it:
- When, and only when, the video explicitly introduces, compares, or teaches A-roll/B-roll layouts, each demonstrated mode switches inside its exact named-phrase permission window:
- Transitions/layout/overlap:
- Caption pages separate completed thoughts from the next thought after final pagination readback:
- Native and thumbnail-scale inspection:

## Portrait Multi-Device Safety

- Portrait layout preset and any recorded project-specific deviations:
- Delivery aspect ratio and pixel dimensions; a same-aspect resolution change was not treated as a crop fix:
- For every target player, record viewport dimensions, fit behavior, height or cover scale, visible source width, crop or pillarbox per side, and desired visible margin:
- Effective semantic safe region is the intersection of the visible source region and the band-specific platform-UI-free region, including top, right, and bottom exclusion masks:
- Crop-tolerant backgrounds and contrast surfaces remain full bleed; caption glyphs, progress semantics, information copy, proof cues, B-roll critical regions, bounded picture-in-picture boxes, required presenter regions, logos, and identity marks remain inside the effective semantic safe region. A declared background cutout may extend behind caption/platform-copy zones only under its recorded collision policy:
- Every screenshot, diagram, and evidence B-roll declares its critical region of interest; unsafe regions were padded, recomposed, cropped to a readable detail, or split rather than blindly shrinking every shot:
- Actual rendered caption glyphs and stroke, not only the caption item box, remain visible on the narrow-phone simulation and published screenshot:
- The approved caption lane was preserved when the top progress band was introduced; nearby headings, cards, picture-in-picture, and presenter cutouts were reflowed instead:
- The current approved series caption baseline was evaluated from `left=120`, `top=2748`, `width=1920`, `height=500` on the 2160x3840 reference canvas, with any project override documented:
- Any signature-outro underline remains visibly below the rendered caption ink and was moved or shortened before any approved-caption relocation:
- Narrow tall phone, reference 9:16 viewport, and wide tablet checks passed at native and phone scale; real published screenshots replaced simulation when available:

## Semantic Chapter Progress

- Progress source is the approved semantic structure after final timing lock; no arbitrary or fabricated chapters:
- Chapter labels, order, and one-sentence scopes were shown in the director plan and approved before style lock; every label maps to a contiguous transcript or narrative range without invented or exaggerated meaning:
- Segment labels and duration-proportional boundaries:
- Fallback is one unsegmented bar when no meaningful multi-section structure exists:
- Filled progress and playhead use actual timeline time; early, middle, late, and every chapter boundary were rendered and checked:
- Progress labels were audited separately from subtitles; no progress-label request silently restyled the caption track:
- A narrow full-width translucent neutral strip occupies a platform-validated edge band and uses light labels with a restrained dark shadow or stroke:
- Landscape and portrait use the same two-lane grammar: one uninterrupted progress track without chapter ticks above one label row whose dividers appear only between adjacent chapters:
- The contrast surface is allowed to bleed to both composition edges, while the progress track, playhead, duration-proportional label rail, and dividers share one platform/player-validated horizontal safe inset:
- Player fit mode, player viewport, computed cover scale, visible composition width, crop per side, desired visible margin, and resulting semantic inset:
- A simulated target-player viewport passed before publication, and a real published target-device screenshot replaced or confirmed that assumption when available; zero semantic inset was used only with published-player proof:
- No leading label dashes, chapter numbers, active-segment panels, duplicate separators, or boxed chapter cards were added by default:
- Past and future overflowing labels use a static ellipsis. Only the active overflowing label loops inside its unchanged segment; hold, motion, wrap, chapter reset, and seek/re-render frames were checked:
- The generic component uses a neutral playhead and has no required creator identity asset; any private marker adapter is documented separately:
- Marker choice is justified by content meaning, creator fit, and attention budget rather than asset availability; alternatives that imply the wrong mood were rejected:
- Any pen/nib or other semantic-contact marker declares its anchor; the visible contact point matches the filled-rail endpoint within one composition pixel, uses continuous travel, does not reset at chapter boundaries, and keeps micro-motion on a separate seek-safe clock:
- A marker-only replacement preserved the approved track, background, labels, chapter boundaries, safe inset, captions, and nearby layout; the previous approved marker asset remains recoverable:
- Current, past, and future hierarchy uses weight, opacity, fill, and playhead rather than scene-by-scene color inversion:
- Progress-label readability passed representative A-roll, bright B-roll, dark B-roll, chapter-boundary, native-size, and phone-size review:
- Published target-device screenshots prove that platform descriptions, controls, and action rails do not cover semantic progress labels; when the top fallback is used, headings, evidence, and picture-in-picture were reflowed below or around it while the approved caption lane remained intact:
- The progress rail and required marker body are below the actual status/notch obstruction in target-device evidence; any move affected the whole progress system and triggered nearby-layout reflow:
- Rendered strip is visual orientation only; native player scrubbing or separate platform chapter metadata provides actual seeking:

## Signature Outro

- Recurring sign-off detected and treated as a named component rather than an ordinary final subtitle:
- First reusable version received still and motion-preview approval; private-profile promotion is recorded:
- Owned or explicitly approved identity art is used; generic third-party sticker is not the default:
- Identity and encouragement cues, motion, hold, optional sound, and final speech synchronization:
- Approved identity variant and contextual accessories stayed fixed; any wink/blink passed open-before, closed-peak, open-after, and phone-size review without reading as a glitch:
- The exact approved tilt, blink/wink, timing, scale envelope, placement, and collision behavior were inherited; no simplified rebuild silently removed a motion beat:
- Motion envelope includes scale, translation, rotation, transform origin, internal marks, and overshoot; a static outer natural box and padded inner animated stage contain every visible extreme without relying only on overflow; first-visible, entrance, overshoot, settle, encouragement, micro-expression, reopen, and final-visible frames show the complete silhouette at native or phone scale:
- Face, final caption, semantic progress strip, and platform UI remain unobstructed at native and phone scale:
- The lowest visible opaque character pixel is anchored a small explicit gap above the active caption card top, is recalculated after caption changes, and one complete character state remains opaque during every wink/blink swap:

## Finishing Design Audit

Record a decision and reason for every category. `Off`/`none` is valid; `unreviewed` is not.

- Background music decision/reason, speech-intelligibility impact, track/rights/mix when enabled:
- Sound effects decision/reason and exact motivated cue list when enabled:
- Token-locked micro-cues such as a success badge or comment invitation appear only on the matching word, animate once, remain brief, use rights-cleared low-level audio when enabled, and never compete with dialogue:
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
- Deliverable classification (`review-proxy|platform-release|source-quality-master`), source lineage, resolution, frame cadence, codec, and limitations:
- Platform compatibility was verified separately from source-quality mastery using current authoritative requirements:
- A lower-resolution review proxy was not upscaled or renamed as the master; any higher-quality original was conformed through the approved timing:
- Frame cadence is intentional and verified; no duplicated-frame `30 fps` to `60 fps` relabeling:
- The actual delivered file was probed for dimensions, duration, frame count, codecs, color, audio, loudness, true peak, sync, blank/frozen frames, and lineage:
- Known limitations:

## Publication Package

- `publish-package.json` was created only after the exact release candidate passed QA:
- Platform and applicable regulator rules were rechecked from direct official sources on the recorded publication date; no guaranteed-compliance or guaranteed-distribution claim is made:
- At least three accurate cover-title, post-caption, and directly relevant hashtag variants are present; cover and caption describe the same finished video:
- AI production facts distinguish real human recording/voice, AI-assisted editing, generated graphics/animation, synthetic voice, and face replacement; the platform-native declaration and any viewer-facing disclosure are planned under current rules:
- Public/open-source status, campaign eligibility, sponsorship, rights, privacy, and any performance claim are true at posting time and not inferred from an earlier plan:
- `scripts/audit-publish-package.mjs` result:

## Decision

State the exact approved artifact and any remaining restrictions.
