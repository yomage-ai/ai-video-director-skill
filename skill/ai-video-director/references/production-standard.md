# Production Standard

## Content Lock

Before rough cutting a fresh video, obtain approval for:

- One primary claim.
- At most two supporting points.
- The intended order.
- A real-evidence cold open when available.
- Material that must remain and material that may be removed.

Do not use abstract tool explanations as an opening when a result can be shown directly. Do not write spoken copy with avoidable meta narration or negative-contrast phrasing.

## Rough Cut Boundary

Rough cut is complete only when all of the following are true:

- Mistakes, repeated takes, unusable pauses, false starts, and irrelevant sections are removed.
- Every join sounds and looks natural in context.
- Dialogue order and meaning match the approved content lock.
- Transcript text is correct, with timing accurate enough for downstream captions.
- The original talking-head color is normalized or explicitly left unchanged at source, track, or global scope, with a natural-skin review and any failed correction rolled back.
- The complete locked A-roll has been watched and listened to, not spot-checked.
- The canonical EDL is versioned and accepted.
- Resolution, orientation, frame cadence, color, and audio have no unexplained degradation.

Zooms, B-roll, caption styling, motion graphics, transitions, music, and semantic sound effects are fine edit. Transcript correction and original A-roll color normalization are rough cut; how the captions look is fine edit.

## Repeated Take Selection

Never keep the last occurrence merely because it was recorded later. ASR and transcript similarity identify repeated-take candidates; they do not decide which take survives.

Compare every candidate against the original audio and video, then select in this order:

1. Semantic correctness, completeness, and fit with the approved content role.
2. Delivery quality: fluency, confidence, emotion, pacing, gaze, expression, and gesture.
3. Technical usability: clean speech, usable picture, no clipped onset, distortion, or distracting interruption.
4. Natural connection to the preceding and following material.
5. If the candidates remain materially equal, prefer the later occurrence as a tie-breaker because it is often the speaker's correction.

Do not remove intentional repetition when the occurrences serve different content roles. Preserve enough breath, consonant onset, room tone, and visual handle for a natural join; determine the handle from the waveform and full-speed listening rather than a universal millisecond value.

Record the selected range, rejected range, and reason in the edit decision record. Listen to the resulting join and then review the complete rough cut before locking the canonical EDL.

Example: if the first greeting is complete and natural while the later greeting is only a restart, keep the first. If the first is a false start and the later version is complete and better delivered, keep the later version.

Treat a retake cluster as one editorial decision, even when the best result uses words from more than one occurrence. A hybrid splice is allowed only when it preserves the intended sentence and both new boundaries pass full-speed audio and picture review. After a word-level splice, listen to the word, the complete sentence, and the surrounding passage; reopen the cut if it creates a repeated syllable, clipped consonant, robotic stress, or visible reset.

Audit repeated tokens across transcript-segment and clip boundaries, not only inside one sentence or segment. Compare the last audible token before every changed boundary with the first audible token after it. A caption display override can hide text, but it does not remove the spoken word; remove an audible duplicate through the speech-linked edit path, then export or render that exact audio window and confirm the intended occurrence count.

Do not approve a rough cut from transcript inspection or isolated seam checks alone. After the last retake or pause change, play the complete cut from start to finish and record that review in `rough-cut-review.json`.

## Pause And Join Treatment

Classify silence by function before changing it:

- Preserve ordinary breaths and short thinking space that support a natural delivery.
- Compress clearly excessive dead air to a context-appropriate breath length.
- Remove hesitation, abandoned starts, and restart gaps together with the failed words they belong to.

Do not normalize every pause to one duration. A pause edit is invalid when it clips a consonant or breath onset, makes adjacent phrases collide, changes emphasis, or creates a visibly abrupt posture jump. Review each changed boundary at normal speed with the preceding and following sentence, then include the full cut in the approval preview.

After any structural Script or transcript-linked timeline edit, re-read the active timeline before continuing. Confirm clip count, duration, source offsets, intended audio transitions, and downstream B-roll alignment. Some editors rebuild speech clips and can drop attached transitions even when clip ids or visible timing appear stable; restore only the transitions that were present by design, then recheck the edited audio window.

## Rough-Cut Source Color Normalization

- Normalize the recorded talking-head source during rough cut, after the intended A-roll structure is stable enough to judge and before rough-cut approval. Fine edit should inherit this approved color rather than reopening it by default.
- Treat one continuously recorded A-roll under unchanged lighting as one color source. Prefer one source-, track-, or global-level correction; applying the same settings as separate per-clip effects does not prove perceptual consistency.
- Correct exposure and white balance conservatively, reduce an unwanted cast, preserve skin texture, white clothing, and highlights, and aim for believable natural skin rather than conspicuous whitening, smoothing, or a creative LUT.
- Inspect decoded early, middle, late, and cut-boundary frames through the same color-managed path. Nonlinear hue, saturation, midtone, or skin masks may react differently as the face, exposure, and background change even when every clip receives identical parameters.
- If the result drifts gray, red, clipped, or otherwise inconsistent, remove the correction and keep the last stable source state. Send a stage update that states what was attempted, what failed, what was rolled back, and whether a new decision is still needed.
- Use per-clip color only when the recorded lighting or camera state actually differs. Document that reason and verify both sides of every affected transition.
- Reopen color during fine edit only for a new explicit user request or a documented source-condition mismatch. A normal fine-edit pass verifies inherited continuity; it does not add another A-roll color treatment.

## Information Coverage And Claim Framing

Before rough-cut lock, map every `mustKeep` point to `spoken`, `on-screen`, or `both` in the coverage audit. Shortening speech may move a practical detail to screen, but it may not silently remove the detail. Screen-only facts must be complete, readable at mobile size, and held long enough to scan.

Separate verified general rules from personal experience, a single institution's answer, and time- or location-sensitive guidance. Keep the strongest wording supported by the evidence: do not turn one successful binding, payment, rejection, consultation, branch schedule, or material list into a universal platform or industry policy. When the spoken recording is too absolute and no pickup is planned, cut the unsupported wording and restore the accurate scope in explicit on-screen copy.

## Fine Edit Standard

- Start from a visual beat sheet: what must the viewer see, understand, or believe at each beat?
- Prefer real frames, screenshots, waveforms, timelines, documents, products, and actual outputs over decorative geometry or a simulated interface.
- Do not fake a tool interface when a real project artifact exists.
- One shot gets one primary rendering engine. Use A/B output only when the comparison itself is approved and recorded.
- Keep transitions restrained and motivated by structure.
- BGM is off by default. Dialogue intelligibility has priority over music and effects.
- Approve three representative keyframes and one short motion sample before rendering the full visual layer.

## B-Roll Continuity

- Before choosing a layout for individual cutaways, merge adjacent or near-adjacent B-roll beats into the viewer-visible coverage runs they form. Measure and classify the aggregate run, not each card in isolation: `A-only`, `B-only`, or `AB-live-PiP`.
- A short proof cutaway may be `B-only`. A long continuous coverage run that would otherwise remove the speaker for an extended explanation defaults to `AB-live-PiP`, unless a deliberate evidence-first layout or platform collision makes presenter presence harmful. Any return to `A-only` must last long enough to read as an intentional reset.
- Treat adjacent cutaways that explain one continuous passage as one coverage run. Keep the first entry fade and final exit fade when useful, but do not independently fade both sides of an interior B-roll boundary when that exposes the A-roll underneath.
- For a short gap between cutaways, make an explicit choice: extend or abut the B-roll, or hold A-roll long enough to read as an intentional return. Never allow a one-frame or few-frame presenter flash merely because two overlays have separate fades or leave a tiny uncovered gap.
- Different information cards may cut directly to each other while the narration continues. Keep a stable, time-aligned presenter picture-in-picture across a long run, and size or reposition it rather than covering evidence, captions, or platform controls.
- Verify every changed B-roll seam in composed frames immediately before, on, and immediately after the boundary. Metadata, duration, or a successful render job is not visual proof of continuous coverage.

## Presenter Inserts And Platform Safe Areas

- When a presenter remains visible as a still, thumbnail, or picture-in-picture insert, choose an entry frame with a normal expression and open eyes. Reject blink, half-blink, mouth-transition, motion-blur, and visibly reset frames unless the motion itself makes the moment natural.
- A short proof cutaway may omit the presenter and let the evidence fill the screen. For a longer full-screen explanation, keep presenter presence only when it helps continuity; a small live picture-in-picture is usually better than freezing an arbitrary portrait.
- Place the presenter insert outside the evidence, captions, and platform controls. Prefer a live, time-aligned segment; if its entrance lands on a poor expression, delay the insert to the next clean frame rather than shifting the visible speech out of sync.
- Treat picture-in-picture as a designed portrait, not a uniformly scaled copy of the source frame. Define the crop intent, visible aspect ratio, shape, corner radius, size, and subject headroom. For an informational talking-head insert, a head, neck, and upper-shoulder crop is usually clearer than a full-body miniature.
- Build a content-occupancy map for every underlying card before placing the insert. A preferred corner is only a default: choose actual negative space, never cover the primary evidence, and allow the position to change at a semantic card or coverage-run boundary when needed. Keep it stable within one run so it does not jitter from card to card.
- Do not use one global picture-in-picture size merely because every insert comes from the same source. Choose the visible size from card occupancy, available negative space, presenter importance, run duration, caption and platform exclusion zones, and phone-scale legibility. Declare one size-and-position geometry for each continuous coverage run; keep it stable inside the run and change it only at a semantic or layout-family boundary.
- Judge the visible crop rectangle, not only the stored media frame. A cropped item may retain hidden top or bottom margins, so a width-only aspect-locked resize can change the visible shape even when the metadata looks proportional. Define the intended visible box, use a crop-to-box or equivalent fit operation, then inspect the composed pixels at native and phone size.
- Inspect both the source crop and the composed frame. Judge normal expression at the entrance and other deliberate still moments; do not reject a time-aligned live insert merely because an ordinary blink occurs later during continuous motion.
- Define platform UI exclusion zones before final layout. Keep critical copy above the bottom description area and away from right-side action controls, then reserve a separate caption band so subtitles never cover information cards, proof labels, or the presenter's face.
- Verify safe areas with representative frames at native size and phone-thumbnail size. Check the longest caption and densest information card together, not in isolation.

## Transition Grammar

- Define transitions by editorial relationship instead of applying one preset everywhere. A transition should explain a presentation-mode change, not decorate every clip boundary.
- Use direct cuts between cards inside one continuous explanation unless the content itself motivates another movement. Reserve a short restrained dissolve for changes such as `A-only` to full-card coverage, full-card coverage back to `A-only`, or a deliberately softened chapter change.
- Synchronize the B-roll and picture-in-picture entrance or exit as one event. Keep only the run-level entrance and exit treatment; do not add paired fades at interior card boundaries.
- Prefer a clean cut over an unmotivated push, zoom, slide, or scale animation. Verify before/on/after boundary frames and listen through the adjacent dialogue before accepting the grammar.

## Finishing Design Audit

- Before final render, explicitly assess and record five categories: background music, sound effects, entry/exit animation, transitions, and decorative effects. `Off` or `none` is a valid editorial decision only when its reason is recorded; an unreviewed category is not the same as an intentional omission.
- Base each decision on the content, tone, rhythm, speech intelligibility, attention cost, platform context, and applicable rights. Do not add a treatment merely because the category exists.
- For background music, state whether it improves or competes with the spoken information. When enabled, document the track, rights, mix target, and sections where dialogue must remain dominant.
- For sound effects, identify exact motivated cues before adding them. Repeated clicks, whooshes, or impact sounds without a semantic job make practical explainers feel templated and should remain off.
- For entry/exit animation and transitions, define the relationship being communicated at each treated boundary. Reuse a small grammar consistently, and prefer a direct cut when motion would add no meaning.
- For decorative effects, distinguish functional focus cues from ornament. Circles, underlines, or arrows may clarify evidence; particles, glow, beauty effects, and gratuitous camera motion need a specific approved purpose.

## Semantic Chapter Progress

- After spoken structure and final timing are locked, add a time-driven progress strip by default. Derive its sections from the approved semantic structure rather than equal time slices, B-roll item count, or an arbitrary template.
- Use two to seven sections when the video has defensible content blocks. Keep labels short enough to read at phone size and make segment widths proportional to their real durations. When no meaningful multi-section structure exists, use one unsegmented progress bar instead of inventing chapters.
- Drive the filled portion and playhead from the actual local timeline frame over the final duration. Recompute every boundary after a structural speech edit, ripple, conform, duration change, or replacement of the canonical timing source.
- Treat chapter labels and progress-bar copy as a separate semantic layer from captions. A request about progress-label readability, background, or position must not silently restyle the subtitle track.
- Default to one narrow, full-width translucent neutral strip that spans the composition, sits below the subtitle band, and stays close to the bottom edge with only a small inset. Use light labels with a restrained dark shadow or stroke so the same treatment remains readable over A-roll, bright B-roll, and dark B-roll. Separate semantic sections with proportional divider ticks and short labels; do not wrap every section in a card or leave decorative gaps unless an approved design system specifically requires them.
- Keep the progress strip at the bottom by default because it is low-priority navigation, not primary dialogue. Do not move it to the top merely to solve background contrast; the neutral strip should provide that contrast. Use weight, opacity, fill, and playhead to distinguish current, past, and future sections rather than inverting label colors for each scene.
- Treat the burned-in strip as low-priority orientation. It may sit inside an area later covered by platform descriptions or controls rather than pushing captions, evidence, or the presenter upward. Verify that the strip itself never covers primary content; accept platform occlusion only as an explicit auxiliary-overlay decision.
- A rendered progress strip is visual orientation, not an interactive seek target inside an exported video. Actual dragging remains the platform player's native scrubber; when a delivery platform supports chapter metadata, supply that separately from the burned-in graphic.
- Verify early, middle, late, and every chapter boundary in composed frames. Include representative A-roll, bright B-roll, and dark B-roll frames; confirm duration-proportional widths, the correct active label, a monotonically advancing playhead, seek/re-render stability, native- and phone-scale readability, full-width alignment, below-caption placement, and no collision with primary content.

## Sensitive Screenshot Evidence

- Work from a local derivative. Crop away browser chrome, tabs, bookmarks, full URLs, account controls, and unrelated page areas before redaction.
- Use irreversible opaque masks for names, legal entities, addresses, phone numbers, email, account/team identifiers, and other sensitive fields. Blur or mosaic alone is not sufficient for critical identifiers.
- Preserve the smallest real interface region that proves the claim, then enlarge and reframe it for mobile readability. Do not upload the unredacted source to a cloud editor.
- When a small screenshot's proof is not immediately obvious, add one precise focus cue such as a circle, underline, or short arrow at the exact value the viewer should inspect. Prefer one primary cue over decorating every field, and never cover the evidence or imply a relationship the screenshot does not prove.
- Inspect the redacted derivative at native size and after final timeline scaling. Verify that no sensitive text remains readable in still frames, transitions, thumbnails, or exports.

## Media Integrity

- Probe the source before conversion. Preserve rotation, aspect ratio, frame rate intent, color primaries, transfer, matrix, range, and audio layout unless an explicit conversion is planned.
- Do not label HDR as SDR merely by changing metadata. Tone-map deliberately or keep a valid HDR pipeline.
- Do not diagnose color or resolution from an unverified browser proxy alone. Compare decoded source and output frames using the same color-managed path.
- `-c copy` cuts at available keyframes and may start earlier/later than the requested boundary. It is for approximate preview only.
- Locked A-roll and final output use exact decoding and re-encoding, with dimensions, duration, sync, and representative pixels verified afterward.

## Finishing Pass

- Use speech isolation only on clips that contain spoken human voice. Start conservatively, preserve natural consonants and room tone, and listen for metallic or pumping artifacts before increasing strength.
- A voice-isolated derivative is valid only for the source range that produced it. On a recut with different `sourceStart` values, process each audible clip range separately; never attach one short derivative to unrelated clips merely because they share the same source asset.
- Verify denoise routing with an exported or locally rendered audio sample from both an early and a late timeline section. A timeline property such as `denoiseStrength` is not proof that the later clips still contain audio.
- Inherit the rough-cut-approved A-roll color. Verify continuity at representative returns from B-roll, but do not add a second color treatment unless the documented fine-edit exception applies.
- Preserve the approved caption visual language. Do not change subtitle background, color, stroke, shadow, or position because a request about chapter labels or progress-bar copy was misclassified. Only redesign captions after an explicit request; only relocate or reflow them for a documented collision, and verify any changed caption layout at native and phone scale.
- When caption size changes, treat it as a layout change: recalculate line capacity and box height, then inspect the longest two-line page together with picture-in-picture, evidence cards, and platform UI exclusion zones.
- Pagination follows meaning as well as width. A completed thought and the next thought should not share one card merely because both fit; split at the first word of the new thought. Re-read pagination after structural speech edits because the engine may resolve the boundary automatically, and use a forced page break only when the viewer-facing pages still combine them.
- Treat the supplied manuscript as the punctuation source of truth, and decide display punctuation only after viewer-facing pagination is locked. Preserve every manuscript punctuation mark that remains inside one caption page. If a detachable separator or terminator is the page's final character, omit it by caption style; this includes commas, periods, semicolons, colons, and enumeration commas in either Chinese or ASCII form.
- Always preserve a question or exclamation mark even when it is page-final because removing it changes sentence force. Preserve paired structural closers such as quotation marks, brackets, parentheses, and title marks at page end so the displayed pair is never broken. Punctuation embedded in numbers, units, names, or terms is not a detachable page-final mark.
- Pagination changes invalidate the punctuation decision. After any reflow, forced break, merge, scale change, or Script edit, re-read the final pages and repeat the punctuation audit. Do not use a global punctuation-hide switch when any internal, question/exclamation, or paired-structure exception must remain.
- Do not invent title marks, replace enumeration commas with vertical bars, or substitute another visible glyph merely because the caption renderer behaves differently. The caption must preserve the manuscript's meaning and structural punctuation rather than creating a new notation system.
- Caption metadata is not visual proof. When a renderer strips an exact semantic glyph despite the stored setting, first use a renderer or style path that preserves the original glyph. If that is impossible, use an authored caption/card or a meaning-based page separation without fabricating a replacement symbol. Inspect the composed pixels and record the renderer limitation.

## Timeline Timebase Integrity

- Treat frame numbers as local to the frame rate that produced them. Never copy canonical EDL or source-timeline frame numbers directly into a target timeline with a different frame rate.
- Before duplicate, import, reconstruction, or conform, record `sourceFps`, `targetFps`, source duration, and expected target duration. Convert every boundary by time: `targetFrame = round(sourceFrame * targetFps / sourceFps)`.
- Convert shared endpoints first, then derive each item duration from adjacent converted endpoints. Do not independently round a start and duration, because accumulated rounding can create gaps or overlaps.
- Immediately after reconstruction, verify first frame, last frame, total seconds, item count, item order, and pairwise contiguity. A timeline whose duration changes only because its frame rate changed is invalid.
- Preserve the approved canonical EDL. If a fine-edit duplicate has the wrong timebase, repair or recreate only that working copy, then repeat structural and visual verification before adding downstream layers.

## Targeted Checks Before Full Render

Run the smallest useful test for each risk:

- Dialogue join and loudness sample.
- Early- and late-timeline speech-isolation samples with audible output and no metallic artifacts.
- Caption longest-line and safe-area sample.
- Transition in/out sample.
- First, middle, and last frame of every authored animation.
- Seek/re-render stability for programmatic animation.
- Source/output color frame comparison.
- Platform-sized sample at the actual delivery resolution.

Only after these pass may the full video render.

## Final QA

- Listen through every final dialogue line and join.
- Check every caption against speech and screen bounds.
- Inspect cover, opening, representative middle beats, transitions, and ending at native and thumbnail size.
- Verify duration, dimensions, frame rate, codecs, audio channels, loudness, sync, blank frames, and frozen frames.
- Verify every timeline/EDL handoff used the declared frame rates, converted shared boundaries by time, preserved contiguity, and retained the expected duration in seconds.
- Keep baseline and final-version metrics separate.
- Describe sampled defects as examples, not an exhaustive list.
- Record untested or uncertain behavior plainly.

## Delivery

Never deliver only an MP4. Include the editable project, canonical EDL, timing/captions, director and edit decisions, asset/rights manifest, QA report, and any reproducible build instructions. Media and private artifacts remain outside the Skill repository.
