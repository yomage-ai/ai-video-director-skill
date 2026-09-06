# Production Standard

## Content Lock

Before rough cutting a fresh video, obtain approval for:

- One primary claim.
- Supporting points appropriate to the duration and viewer task; one or two is a compact starting point, not a hard limit.
- The intended order.
- A real-evidence cold open when available.
- Material that must remain and material that may be removed.

Do not use abstract tool explanations as an opening when a result can be shown directly. Do not write spoken copy with avoidable meta narration or negative-contrast phrasing.

## Approval Memory And Change Isolation

- Classify feedback as one of three layers: a reusable public production rule, a private creator preference, or a project-only decision. Never turn one project's numeric value into a universal default, and never commit private identity, media, paths, or preferences to the public repository.
- Treat explicit approval such as "this is right" or "save this for later" as evidence for the complete accepted behavior, not only the last visible pixel. Record the approved component contract, the successful method, the rejected alternatives, and the failure mode that caused each correction.
- Before revising an approved timeline or reusable component, duplicate the timeline and create a new asset version. Preserve the last approved export and asset; do not overwrite either in place merely because the editor supports mutation.
- Write a change allowlist and an invariant list before editing. The allowlist names the exact tracks, items, asset references, time ranges, or parameters that may change. Captions, punctuation, audio, color, timing, B-roll, layout, outro, or any other approved layer not listed is invariant.
- After the revision, diff timeline structure, track and item counts, ranges, asset references, caption pages, audio identity or measured mix, and representative unaffected pixels. Any unexplained difference blocks export. A successful API response or playable render is not proof of change isolation.
- For a visual-only revision, a decoded-audio identity or measured-mix change fails the isolation gate. When timing and codec compatibility permit, remux the last approved audio stream instead of accepting an unexplained rerender drift; otherwise reopen the sound decision and obtain a new approval.

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

Use the full bilingual operating checklist in [dialogue-join-audit.md](dialogue-join-audit.md). The rules below are the production gate, not a substitute for that boundary-by-boundary review.

Classify silence by function before changing it:

- Preserve ordinary breaths and short thinking space that support a natural delivery.
- Compress clearly excessive dead air to a context-appropriate breath length.
- Remove hesitation, abandoned starts, and restart gaps together with the failed words they belong to.
- Remove swallow, lip-smack, mouth-reset, and other non-speech events when they sit inside a changed join. Do not relabel them as room tone or a natural breath merely to avoid moving the boundary.

Do not normalize every pause to one duration. A compact sentence-flow or retake join often lands near `0.20-0.40 s`, but this is only a candidate range for review, never an automatic target. Emphasis, topic changes, language, and delivery can require a different value. A pause edit is invalid when it clips a consonant or word release, hides the manuscript's first or last intended word, makes adjacent phrases collide, changes emphasis, retains a swallow or mouth reset, or creates a visibly abrupt posture jump.

For every changed boundary, write down the expected last token and expected first token before touching the edit. Listen to a rendered window at normal speed without scrubbing; confirm both tokens are fully audible, in the intended order, with no repeat, truncated onset, swallowed tail, click, conspicuous mouth noise, or stale dead air. Then inspect the frame immediately before, on, and after the cut. Audio correctness and manuscript intelligibility take priority; use B-roll or another motivated visual cover when the clean audio boundary produces an unavoidable jump cut.

Apply a strict acceptance order: intended manuscript word audibility first, natural pause and mouth-noise cleanup second, picture continuity third. When two repeated occurrences meet at a cut, preserve exactly one full onset from decoded source timing and waveform evidence; a transcript strike is not proof of which acoustic occurrence survived. Check whether the outgoing handle already contains the intended opening word before extending the incoming clip, then render and verify the exact word window before accepting the broader passage.

Treat audio crossfades as finishing protection, not boundary repair. Use an explicitly measured audio duration and source handles for each seam; do not derive a universal fade duration from video fps. A longer crossfade can smear consonants or create a doubled syllable, and no crossfade can rescue a boundary placed inside a word or before a swallow. Apply or restore intentional crossfades only after structural timing is stable, then audition the actual render again.

Before rough-cut approval, enumerate every real placed-item boundary, review every changed join, and scan the rendered cut for unexplained silent regions longer than about `0.60 s`. That scan produces candidates, not automatic deletions. Review the complete cut from start to finish after the last boundary change. If normal-speed audio playback is unavailable, mark the rough cut unverified instead of declaring it approved.

When creator feedback identifies a repeatable defect class, such as clipped word onsets, overlong joins, mouth resets, pace drift, premature evidence, or duplicated screen ranges, do not patch only the listed timestamps. Define the class, sweep the complete relevant timeline for every occurrence, record the results, and only then issue the next review version.

After any structural Script or transcript-linked timeline edit, re-read the active timeline before continuing. Confirm clip count, duration, source offsets, intended audio transitions, and downstream B-roll alignment. Some editors rebuild speech clips and can drop attached transitions even when clip ids or visible timing appear stable; restore only the transitions that were present by design, then recheck the edited audio window.

## Rough-Cut Source Color Normalization

- Normalize the recorded talking-head source during rough cut, after the intended A-roll structure is stable enough to judge and before rough-cut approval. Fine edit should inherit this approved color rather than reopening it by default.
- Treat one continuously recorded A-roll under unchanged lighting as one color source. Prefer one source-, track-, or global-level correction; applying the same settings as separate per-clip effects does not prove perceptual consistency.
- Correct exposure and white balance conservatively, reduce an unwanted cast, preserve skin texture, white clothing, and highlights, and aim for believable natural skin rather than conspicuous whitening, smoothing, or a creative LUT.
- Inspect decoded early, middle, late, and cut-boundary frames through the same color-managed path. Nonlinear hue, saturation, midtone, or skin masks may react differently as the face, exposure, and background change even when every clip receives identical parameters.
- If the result drifts gray, red, clipped, or otherwise inconsistent, remove the correction and keep the last stable source state. Send a stage update that states what was attempted, what failed, what was rolled back, and whether a new decision is still needed.
- Use per-clip color only when the recorded lighting or camera state actually differs. Document that reason and verify both sides of every affected transition.
- Reopen color during fine edit only for a new explicit user request or a documented source-condition mismatch. A normal fine-edit pass verifies inherited continuity; it does not add another A-roll color treatment.
- When a creator explicitly approves a color treatment, store its exact deterministic parameters, color-space assumptions, representative-frame measurements, and reference render only in the private profile. Recover the parameters from the command, project, or paired before/after pixels; never substitute a remembered, rounded, or visually estimated variant. Reuse the exact chain for comparable camera, lighting, exposure, white balance, input render state, and filter order. Prove the reproduction against decoded reference frames with representative Y/U/V or equivalent measurements plus visual inspection before calling it the same baseline. For materially different conditions it is a starting candidate, not an automatic look; revalidate natural skin, whites, and highlights before approval.

## Playback Speed Selection

- Choose playback rate from the content and actual performance, not from a reusable house number. Begin at `1.00x`; test a conservative speed-up only when normal-speed delivery demonstrably drags.
- Dense explanatory social speech may justify a candidate around `1.02x-1.06x`, but this is a test range, not a default. Keep more time for emotional delivery, demonstrations, quotations, difficult terminology, or deliberate emphasis.
- Use one stable rate across a continuous same-session passage by default. A rate change needs a documented content, performance, or source-state reason.
- Review a representative rendered passage for comprehension, fatigue, consonant clarity, breath, and emphasis. Re-run every join and caption timing check after selecting the rate, then record the chosen value, rejected candidates, and rationale.

## Information Coverage And Claim Framing

Before rough-cut lock, map every `mustKeep` point to `spoken`, `on-screen`, or `both` in the coverage audit. Shortening speech may move a practical detail to screen, but it may not silently remove the detail. Screen-only facts must be complete, readable at mobile size, and held long enough to scan.

Separate verified general rules from personal experience, a single institution's answer, and time- or location-sensitive guidance. Keep the strongest wording supported by the evidence: do not turn one successful binding, payment, rejection, consultation, branch schedule, or material list into a universal platform or industry policy. When the spoken recording is too absolute and no pickup is planned, cut the unsupported wording and restore the accurate scope in explicit on-screen copy.

## Fine Edit Standard

- Start from a visual beat sheet: what must the viewer see, understand, or believe at each beat?
- Prefer real frames, screenshots, waveforms, timelines, documents, products, and actual outputs over decorative geometry or a simulated interface.
- Do not fake a tool interface when a real project artifact exists.
- One shot gets one primary rendering engine. Use A/B output only when the comparison itself is approved and recorded.
- Keep transitions restrained and motivated by structure.
- Rough-cut review is dialogue-first and may remain music-free. Fine edit must audition and record a reasoned BGM-on or BGM-off decision; dialogue intelligibility has priority over music and effects.
- Bind every authored fact, number, mode label, interface state, and example to a word-level permission window. Claim-bearing evidence and named interface states may enter on or just after their permitting spoken token, never before; it stays through the last token needed to understand the claim. A separately declared result-first preview, establishing shot or non-claim illustration may lead speech when it cannot misrepresent the current state. Do not preload a large empty card while the speaker is still introducing the topic, and do not show the next mode while the current mode is still being named.
- When replaying the creator's own voice as a before/after example would sound like a glitch, restart, or accidental repetition, omit the audible demo unless its acoustic evidence is indispensable and clearly signposted. Prefer a silent authored process visualization such as state cards, waveform compression, or a cut-point audit, and label it as an illustration rather than original proof.
- Approve three representative keyframes and one short motion sample before rendering the full visual layer.

## Exact UI Evidence And Semantic ROI

- Before capture, state the exact claim the UI must prove and lock the full navigation state: page or document, primary tab, subtab, view/report type, date or filter, expanded modules, scroll position, demo-data state, and privacy state. Record adjacent states that are plausible but wrong; a nearby report or tab is not acceptable evidence merely because it looks related.
- Derive each critical region from source semantics: DOM/accessibility text and control bounds first, design-layer geometry second, user-confirmed reference pixels third. Manual pixel selection is allowed only after the exact proof labels and controls are identified. Never guess a rectangle from a thumbnail, a full-page screenshot, or visual resemblance.
- Produce a manifest for every evidence crop with the claim, state path, rejected adjacent states, source viewport, requested bounds, actual output dimensions, proof labels, visible-module allowlist, forbidden-string scan, and pixel-review result. Keep requested and actual output dimensions separate because viewport clipping can change the final crop.
- Use the smallest complete proof region and preserve its aspect ratio. Enlarge or recompose it for phone readability; do not stretch it into a decorative box. Reveal each proof on the matching spoken phrase rather than displaying a static information dump. Add at most one precise cue when needed, anchored to inspected source coordinates.
- Build a token-frame state map before authoring a multi-state evidence sequence. For every visual state, record the first spoken token that permits its reveal and the last spoken token it must remain visible through. Do not estimate these windows from paragraph timing or from a neighboring caption Card. A state may enter on its first permitted token or a few frames later for readability, but never earlier; it may overlap the next state during a short internal crossfade, but it must not disappear before its own final spoken token. Verify the beginning, middle, and end of every state plus the exact frames immediately before, on, and after each internal reveal.
- Choose screenshot, recording, or hybrid from the viewer's job, phone-scale legibility, temporal value, credibility, rhythm, and attention cost. When a usable recording is supplied, inspect it first and compare it with representative stills or extracted frames; temporal action is a preference only when it materially improves the beat, never an automatic requirement. A user-confirmed exact-state asset takes priority over a prettier neighboring view in summaries and evidence stacks.
- Keep the proof above the caption lane and outside progress, picture-in-picture, and platform controls. If the evidence cannot remain readable, split or recompose the shot instead of covering it. Follow the complete bilingual gate in [evidence-state-roi-audit.md](evidence-state-roi-audit.md).

## B-Roll Continuity

- Before choosing a layout for individual cutaways, merge adjacent or near-adjacent B-roll beats into the viewer-visible coverage runs they form. Measure and classify the aggregate run, not each card in isolation. First choose the presence mode: `A-only`, `B-only`, or `AB-live`.
- Treat `AB-live` as a presence mode, not a synonym for picture-in-picture. When both A-roll and B-roll remain visible, separately choose `B-base-A-PiP`, `A-base-B-overlay`, `B-base-A-cutout`, or `AB-split`. The legacy label `AB-live-PiP` means `AB-live` plus `B-base-A-PiP`; follow the complete bilingual taxonomy in [presenter-coverage-modes.md](presenter-coverage-modes.md).
- A short proof cutaway may be `B-only`. For a long continuous coverage run, use `AB-live` when both evidence and presenter continuity genuinely help, then select its layout from content occupancy, style, target-device safety, and any required matte proof. Keep the run `B-only` when presenter presence would reduce evidence readability. Any return to `A-only` must last long enough to read as an intentional reset.
- Treat adjacent cutaways that explain one continuous passage as one coverage run. Keep the first entry fade and final exit fade when useful, but do not independently fade both sides of an interior B-roll boundary when that exposes the A-roll underneath.
- For a short gap between cutaways, make an explicit choice: extend or abut the B-roll, or hold A-roll long enough to read as an intentional return. Never allow a one-frame or few-frame presenter flash merely because two overlays have separate fades or leave a tiny uncovered gap.
- Different information cards may cut directly to each other while the narration continues. Keep the selected time-aligned presenter layer stable across a long `AB-live` run, whether it is a bounded PiP or an alpha cutout. Size or reposition it at a semantic or layout boundary rather than covering evidence, captions, or platform controls.
- Choose `A-only`, `B-only`, `B-base-A-PiP`, `A-base-B-overlay`, `B-base-A-cutout`, or another layout from the content, evidence density, presenter value, available space, target device, and approved direction. Ordinary narration does not need to name a layout before the director may use it. The invariant is semantic-state synchronization: the visible interface, evidence, comparison state, or example must agree with the claim currently being spoken and may neither anticipate a later claim nor linger into a contradictory one.
- Only when the video explicitly names, compares, or teaches layout modes does the displayed mode itself become evidence. In that special case, switch to each named mode on its exact permitting phrase and keep it only through that phrase's evidence window. / 普通视频的画面形式由内容和导演决策决定，不要求口播先说出版式名称；通用硬规则是画面语义状态必须与当前口播一致，不能提前展示后文，也不能拖到已经相互矛盾的下一段。只有当视频正在介绍、比较或教学某种画面形式时，版式本身才是证据，此时才需要按对应口播词点精确切换。
- Verify every changed B-roll seam in composed frames immediately before, on, and immediately after the boundary. Metadata, duration, or a successful render job is not visual proof of continuous coverage.

## Semantic Path And Process Graphics

- When the narration contrasts a repetitive process with an efficient one, encode the contrast in motion topology rather than labels alone. A trial-and-error route must visibly advance, encounter a rejected state, reverse along a prior segment or return to a decision point, try another branch, and repeat when the script says it repeats. A static forward-only route with words such as "返回" or "再试" does not prove backtracking.
- An expert route should show early evaluation before movement commits: reveal the rejected branch, mark why it fails, then proceed along a cleaner route. Align the rejected branch with the spoken warning and the clean route with the spoken decision; do not reveal the answer before the narration earns it.
- Position the character on the actual route curve at every frame. Use different role-appropriate personal-IP poses for trying and judging when the contrast depends on those roles. Verify representative forward motion, the reversal peak, the second attempt, the phase transition, the rejected expert branch, and the final direct path.

## Presenter Inserts And Platform Safe Areas

- When a presenter remains visible as a still, thumbnail, picture-in-picture, or alpha-cutout insert, choose an entry frame with a normal expression and open eyes. Reject blink, half-blink, mouth-transition, motion-blur, and visibly reset frames unless the motion itself makes the moment natural.
- A short proof cutaway may omit the presenter and let the evidence fill the screen. For a longer explanation, keep presenter presence only when it helps continuity; prefer a time-aligned `AB-live` layout over freezing an arbitrary portrait.
- Place the presenter insert outside the evidence, captions, and platform controls. Prefer a live, time-aligned segment; if its entrance lands on a poor expression, delay the insert to the next clean frame rather than shifting the visible speech out of sync.
- Treat picture-in-picture as a designed portrait, not a uniformly scaled copy of the source frame. Define the crop intent, visible aspect ratio, shape, corner radius, size, and subject headroom. For an informational talking-head insert, a head, neck, and upper-shoulder crop is usually clearer than a full-body miniature.
- Build a content-occupancy map for every underlying card before placing the insert. A preferred corner is only a default: choose actual negative space, never cover the primary evidence, and allow the position to change at a semantic card or coverage-run boundary when needed. Keep it stable within one run so it does not jitter from card to card.
- Do not use one global picture-in-picture size merely because every insert comes from the same source. Choose the visible size from card occupancy, available negative space, presenter importance, run duration, caption and platform exclusion zones, and phone-scale legibility. Declare one size-and-position geometry for each continuous coverage run; keep it stable inside the run and change it only at a semantic or layout-family boundary.
- Judge the visible crop rectangle, not only the stored media frame. A cropped item may retain hidden top or bottom margins, so a width-only aspect-locked resize can change the visible shape even when the metadata looks proportional. Define the intended visible box, use a crop-to-box or equivalent fit operation, then inspect the composed pixels at native and phone size.
- Inspect both the source crop and the composed frame. Judge normal expression at the entrance and other deliberate still moments; do not reject a time-aligned live insert merely because an ordinary blink occurs later during continuous motion.
- Treat `B-base-A-cutout` as a separate layout family, not a borderless PiP. Generate it from the clean locked A-roll after canonical timing lock, without baked captions, logos, or cards, and keep its media layer muted while canonical dialogue remains on the approved audio track. HyperFrames `remove-background` is the default local engine in its governed version and tested scope.
- Select the cutout only after moving-video matte proof passes on bright, dark, and busy backgrounds. Inspect hair, glasses, hands, separated fingers, motion blur, foreground props, background leakage, holes, halos, temporal edge flicker, alpha timing, every source cut boundary, and native/phone-scale collisions. One attractive still is not proof; a failed matte falls back to a designed PiP, A-base overlay, or `B-only` according to the presenter's role and evidence density.
- Build any silhouette outline from the same alpha as the presenter, using `outlineAlpha = dilate(alpha, radius) - alpha`, and place it behind the subject. For portrait talking-head cutouts without a locked reference, recommend `outline on` as the starting treatment, but allow `off` with a documented separation or style reason. Select color and width only after analyzing hair or headwear, clothing, skin-edge separation, recurring underlying backgrounds, evidence/content palette, approved creator or brand tendencies, and phone-scale contrast. A width near `0.007-0.009` of canvas width is a candidate, not a universal constant. An outline may soften small edge noise but may not disguise a broken matte.
- For portrait `B-base-A-cutout`, map the complete visible silhouette and motion envelope rather than a rectangular item frame. Start with lower-left and lower-right as public recommended zones and choose the clearer side from content occupancy, gaze, gesture, captions, and platform controls. Start with outline `on`. These defaults are overridable by an exact approved reference or a documented content conflict; another zone or outline `off` requires a reason. A private profile may remove a creator's explicitly rejected old anchor. Keep scale, anchor, placement, and outline state stable inside one coverage run and move them only at a semantic or layout boundary.
- Treat a personal-IP pose as semantic casting, not a generic sticker. Separate signature invitation or encouragement poses from neutral explaining, listening, trying, deciding, pointing, and celebrating poses. Select the pose from the character library by the role and action at that beat, and do not reuse one signature pose for unrelated explanatory characters merely because it is already available.
- Define platform UI exclusion zones before final layout. Keep critical copy above the bottom description area and away from right-side action controls, then reserve a separate caption band so subtitles never cover information cards, proof labels, or the presenter's face.
- Verify safe areas with representative frames at native size and phone-thumbnail size. Check the longest caption and densest information card together, not in isolation.

## Portrait Multi-Device Safe Composition

- Keep one 9:16 delivery master unless the target platform explicitly requires another ratio. A same-ratio resize such as `2160x3840` to `1080x1920` changes sampling resolution but cannot change the percentage cropped by a player.
- Model the actual player rather than the device screen alone. A height-constrained player that preserves aspect ratio clips the left and right of a 9:16 source on a narrower viewport and pillarboxes it on a wider viewport. Compute `heightScale = playerHeight / canvasHeight`, `sourceVisibleWidth = min(canvasWidth, playerWidth / heightScale)`, and `sourceHorizontalCropPerSide = max(0, (canvasWidth - sourceVisibleWidth) / 2)`.
- Separate a crop-tolerant full-bleed visual layer from a semantic foreground layer. Background color or texture, noncritical image edges, and a contrast surface may bleed; caption glyphs, progress rails and labels, information copy, proof cues, declared B-roll critical regions, picture-in-picture visible boxes, presenter-cutout silhouettes and motion envelopes, logos, and identity marks may not.
- Define the effective semantic safe region as the intersection of the visible source region and the platform-UI-free region for each vertical band. Do not use one symmetric rectangle as a substitute for top search chrome, right action rails, and bottom description or control zones.
- Do not shrink every B-roll shot by default. Declare the critical region of interest for screenshots, diagrams, and evidence. If it falls outside the effective safe region, contain it with padding, recompose it around the region, crop to a readable detail, or split dense evidence across shots.
- Use `layout.portrait-talking-head.safe-v1` as an approved reference baseline when its design matches the project. On a `2160x3840` canvas its latest reviewed one-line/two-line caption container is `left=120`, `top=2748`, `width=1920`, `height=500`, with `Noto Sans SC` at `120px`, and the portrait progress band starts at `left=0`, `top=220`, `width=2160`, `height=180`. Scale from normalized values on another 9:16 canvas and verify actual rendered glyph bounds; the values are a reviewed series baseline, not permission to ignore a new platform UI or collision.
- In that reference, the progress contrast surface is full bleed while its semantic rails use a validated `243px` inset per side. This is evidence from one published narrow-phone viewport, not a universal constant; recompute the inset from every target player and add a deliberate visible margin.
- Place the semantic progress rail below the actual status/notch obstruction proven by target-device screenshots. Do not reason from the encoded frame alone: if a marker's head is hidden while its body and rail remain visible, lower the whole progress system and reflow headings, cards, PiP, and cutouts together rather than moving only the marker.
- Preserve the approved caption lane when introducing the top band. Reflow headings, information cards, picture-in-picture, and presenter cutouts around it. Keep a signature-outro underline visibly below the rendered caption ink, and move or shorten the decoration before relocating approved captions.
- Anchor a signature character to the actual caption card, not an unrelated fixed screen coordinate. In the approved series treatment, keep the character's lowest visible opaque pixel a small, explicit gap above the current caption card top; derive its position again when caption pagination or lane geometry changes. Keep one complete character state fully opaque beneath any brief wink/blink replacement so expression changes never flash translucent.
- Simulate at least a narrow tall phone, a reference 9:16 viewport, and a wide tablet. Inspect the longest two-line caption, densest card, B-roll critical regions, picture-in-picture and presenter-cutout motion extremes, every chapter boundary, and the signature outro at native and phone scale. Replace simulation with real published-device screenshots when available.

## Transition Grammar

- Define transitions by editorial relationship instead of applying one preset everywhere. A transition should explain a presentation-mode change, not decorate every clip boundary.
- Use direct cuts between cards inside one continuous explanation unless the content itself motivates another movement. Reserve a short restrained dissolve for changes such as `A-only` to full-card coverage, full-card coverage back to `A-only`, or a deliberately softened chapter change.
- Synchronize the B-roll and its live presenter layer entrance or exit as one event. Keep only the run-level entrance and exit treatment; do not add paired fades at interior card boundaries.
- Prefer a clean cut over an unmotivated push, zoom, slide, or scale animation. Verify before/on/after boundary frames and listen through the adjacent dialogue before accepting the grammar.

## Finishing Design Audit

- Before final render, explicitly assess and record five categories: background music, sound effects, entry/exit animation, transitions, and decorative effects. `Off` or `none` is a valid editorial decision only when its reason is recorded; an unreviewed category is not the same as an intentional omission.
- Base each decision on the content, tone, rhythm, speech intelligibility, attention cost, platform context, and applicable rights. Do not add a treatment merely because the category exists.
- For background music, state whether it improves or competes with the spoken information. When enabled, document the track, rights, mix target, and sections where dialogue must remain dominant.
- For sound effects, identify exact motivated cues before adding them. Repeated clicks, whooshes, or impact sounds without a semantic job make practical explainers feel templated and should remain off.
- Treat short spoken expressions and CTAs as token-locked micro-cues. A `Nice`/success beat may receive one brief pop or rays animation and a low-level rights-cleared accent; a comment invitation may wiggle or tap once on the exact invitation word. The cue must not appear early, loop continuously, outlive its phrase, or compete with dialogue.
- For entry/exit animation and transitions, define the relationship being communicated at each treated boundary. Reuse a small grammar consistently, and prefer a direct cut when motion would add no meaning.
- For decorative effects, distinguish functional focus cues from ornament. Circles, underlines, or arrows may clarify evidence; particles, glow, beauty effects, and gratuitous camera motion need a specific approved purpose.

## Renderer-Safe Font Governance

- Use the target renderer's font catalog before authoring Motion Graphic text, and copy the canonical family name verbatim. Do not ship CSS system aliases or platform-local stacks such as `-apple-system`, `BlinkMacSystemFont`, or `PingFang SC` as the production font declaration; a local preview is not proof that the cloud renderer can load them.
- Every selected font needs an explicit rights basis: a renderer-catalog font with a verified open license, or a project-bundled custom font covered by the user's documented ownership or commercial license. "Free download" is not a license. For neutral Simplified Chinese utility text, prefer `Noto Sans SC` when it is present in the renderer catalog and fits the approved design; it is a default, not a forced brand choice.
- Treat an unsupported-font export warning as a blocker, not permission to accept silent fallback. Replace the family, reopen export preflight, and verify that the warning is gone. Then inspect representative early, middle, late, longest-label, and densest-layout frames because a font change can alter width, wrapping, weight, and collision behavior.

## Semantic Chapter Progress

- After spoken structure and final timing are locked, decide whether a time-driven progress strip has a real navigation or series-identity job. Add one when the video has defensible sections or an approved recurring format; otherwise omit it rather than inventing structure for decoration. Derive its sections from the approved semantic structure rather than equal time slices, B-roll item count, or an arbitrary template.
- Use two to seven sections when the video has defensible content blocks. Keep labels short enough to read at phone size and make segment widths proportional to their real durations. When no meaningful multi-section structure exists, use one unsegmented progress bar instead of inventing chapters.
- Propose the label, order, and one-sentence scope of every section in the director plan before style preview. Director-plan approval is the normal semantic-label lock; exact time boundaries follow rough-cut approval because they depend on final spoken timing. Require a separate clarification only when a label is ambiguous, high-stakes, or changes the user's meaning.
- Map every approved label to a contiguous transcript or narrative range. Labels summarize the user's supplied content; they must not introduce a claim, exaggerate certainty, or use a more sensational tone than the underlying section. A structural timing edit invalidates the affected boundaries and requires recomputation, while a wording-only label correction does not require a recut.
- Drive the filled portion and playhead from the actual local timeline frame over the final duration. Recompute every boundary after a structural speech edit, ripple, conform, duration change, or replacement of the canonical timing source.
- Treat chapter labels and progress-bar copy as a separate semantic layer from captions. A request about progress-label readability, background, or position must not silently restyle the subtitle track.
- Default to one narrow, full-width translucent neutral strip that spans the composition in a platform-validated edge band. Use light labels with a restrained dark shadow or stroke so the same treatment remains readable over A-roll, bright B-roll, and dark B-roll. Put one uninterrupted progress track above one semantic label row; keep dividers only between adjacent label segments. The contrast surface may bleed to both composition edges, but the track, playhead, duration-proportional label rail, and dividers must share a horizontal safe inset derived from the actual player fit and crop. For a `cover` player, compute `coverScale = max(playerWidth / canvasWidth, playerHeight / canvasHeight)`, `visibleCompositionWidth = playerWidth / coverScale`, and `horizontalCropPerSide = max(0, (canvasWidth - visibleCompositionWidth) / 2)`; use at least `horizontalCropPerSide + desiredVisibleMargin / coverScale`. Permit zero semantic inset only after published-player proof. Clamp the marker body inside that semantic-safe rail. Do not add chapter ticks to the track, leading label dashes, chapter numbers, active-segment panels, boxed sections, duplicate separators, or decorative gaps unless an approved design system specifically requires them.
- Use the repository-owned `rmcu.semantic-progress.v1` contract when a reusable component is appropriate. Landscape and portrait share the same two-lane visual grammar and overflow behavior; only placement, safe-area geometry, and scale may differ. Both variants keep stable duration-proportional segment boxes.
- Keep past and future labels static. If either overflows its own segment, show a single-line ellipsis. Only the active label may move, and only when it overflows: hold briefly, loop at constant speed inside the same clipped segment, leave a readable repeat gap, and reset the local motion clock at the next chapter boundary. Never scroll a label that fits or let marquee motion resize the layout.
- Use a neutral playhead by default. Walking characters, logos, and personal-IP markers are optional private adapters, not dependencies of the generic component.
- When a private adapter uses a multi-frame personal-IP action, reuse the approved sequence and manifest order exactly. Drive marker position, rail fill, and optional percentage from one normalized progress value, but drive the action-frame index from an independent seek-safe local clock at the approved motion cadence. Never stretch one action loop across the whole program merely because the marker travels for the whole program. Do not substitute an unapproved action cycle or mirror, interpolate, reverse, or reorder approved frames. Clamp the complete marker body inside the same measured semantic-safe rail as the generic playhead.
- Treat a branded marker as a semantic and attention-level choice, not an automatic upgrade. Preview a neutral marker first unless a creator profile or the current content clearly supports the character, logo, pen, arrow, flower, or other adapter. Before replacing an approved marker with a newly drawn asset, show a still and short motion sample for approval. At actual playback speed, verify frame-hold cadence, loop closure, continuous travel, seek-safe rerendering, and the start and completed endpoints; metadata and isolated stills cannot prove motion fluency.
- Choose the marker role from the content, creator identity, and attention budget rather than the available asset list. Writing, planning, knowledge-work, or structured thinking may support a pen or nib; direct software interaction may support a restrained pointer or cursor; lifestyle, diary, emotion, and celebration may support a botanical or character adapter. These are candidates, not mechanical genre rules: reject any marker that competes with the spoken argument or implies the wrong mood.
- A marker with a semantic contact point must declare its anchor. For a pen or nib, the visible tip must coincide with the filled rail endpoint within one composition pixel on every representative frame. Compute travel with continuous floating-point progress, clamp the complete marker body to the safe rail, keep chapter changes from resetting or jumping its position, and drive any tiny writing wobble from a separate deterministic seek-safe clock.
- Replacing only a marker does not authorize a redesign of the approved track, background, labels, chapter boundaries, safe inset, captions, or nearby layout. Create a new marker component or adapter, preserve the previous approved asset, and prove the declared change allowlist with a structural and pixel diff.
- Bottom placement below captions is the first candidate only after the target platform's exclusion zones pass visual proof. Do not move the strip merely to solve background contrast; the neutral surface should solve contrast. Move it when platform UI or primary content makes the candidate band unreadable. A reserved top-safe band is the preferred fallback when bottom descriptions or controls obscure the strip; reflow headings, picture-in-picture, and information cards below or around that band instead of overlaying them. Preserve the approved caption lane unless the user separately requests a caption change or a documented hard collision requires it.
- Semantic chapter labels are viewer-facing information, not disposable auxiliary decoration. Do not accept platform descriptions, controls, or action rails covering them. Validate against screenshots from the actual published phone, tablet, and player surfaces, not only an editor canvas or generic safe-area guide. If an exclusion-zone conflict appears, relocate the strip and recheck every neighboring layout family.
- A rendered progress strip is visual orientation, not an interactive seek target inside an exported video. Actual dragging remains the platform player's native scrubber; when a delivery platform supports chapter metadata, supply that separately from the burned-in graphic.
- Verify early, middle, late, and every chapter boundary in composed frames. Include representative A-roll, bright B-roll, and dark B-roll frames; confirm duration-proportional widths, the correct active label, a monotonically advancing playhead, seek/re-render stability, native- and phone-scale readability, full-bleed surface alignment, the measured semantic-rail inset, the chosen platform-safe edge placement, and no collision with primary content. Simulate the target player's `contain` or `cover` viewport before publication, then recheck real target-device screenshots after publication or platform preview whenever they are available. Landscape commonly uses `contain` and may avoid portrait left/right crop, but any `cover`, zoom, or embedded player still requires the same calculation rather than an orientation assumption.
- Keep the generic RMCU behavior, parameter schema, and verification rules in the repository. A named private style profile may lock only creator-specific token overrides or an optional identity-marker adapter. Adapt section count, label text, durations, and fallback behavior from the approved content; change private overrides only after an explicit request or a documented accessibility failure and a new preview.

## Recurring Signature Outro

- When the same spoken sign-off recurs across a creator's videos, treat it as a named signature-outro component rather than a generic decorative sticker. Preserve the creator's live face, voice, and natural delivery; the animation should support the identity phrase and encouragement beat rather than replace the person.
- Prefer owned or explicitly approved identity artwork over a generic third-party sticker. This improves recognition, rights portability, and consistent reuse across editors and platforms.
- Before the first reusable lock, show one still plus one short motion sample. Define the exact speech cue, entrance, gesture, emphasis, hold, exit, optional sound, platform-safe placement, and interaction with captions and the semantic progress strip.
- Keep the motion short, warm, and repeatable. Enter on the identity phrase, place the main action on the encouragement phrase, then hold long enough to read without extending the spoken ending artificially. Do not cover the face, the final subtitle, or the progress strip.
- Lock the approved identity variant together with its contextual accessories and any micro-expression; do not let later generation silently swap earrings, earbuds, outfit, or expression. A blink or wink is optional, must remain legible at phone size, and should occur once on a motivated semantic beat rather than during entrance. Verify an open-eye frame before it, the closed-eye peak, and an open-eye frame after it so the gesture cannot read as a frozen eye, render glitch, or repeated flicker.
- Implement a blink or wink with a complete approved expression frame, a coherent layered character rig, or a whole-character alternate frame. Never simulate it by placing a skin-colored patch, eye line, or other facial fragment over a flattened character image. If a coherent alternate expression does not exist, create and approve the complete alternate asset before reuse; do not hide the missing asset with a local overlay.
- Keep at least one complete character state fully opaque throughout every stable signature beat. Whole-character expression frames must share aligned dimensions, placement, and a coherent alpha silhouette; do not cross-dissolve two flattened transparent characters when that creates a density dip, ghosted outline, or partial disappearance. Prefer an aligned rig or discrete whole-frame expression changes for a fast blink. Inspect every transition frame for internal alpha loss, silhouette drift, double outlines, and the final visible hold, then repeat the check on the exported pixels.
- Once a signature outro is approved, its tilt, blink/wink, timing, scale envelope, placement, and collision behavior are part of the reusable component contract. Reuse the exact approved component whenever possible. A simplified reconstruction that keeps the artwork but drops a motion beat is a regression and blocks export until the original motion is restored or a redesign is explicitly approved.
- Validate the component's full motion envelope, not only its settled pose. Compute or conservatively bound every transformed extreme from scale, translation, rotation, transform origin, internal accents, and overshoot. A topmost timeline layer can still clip its own children when the component root, item host, or natural box masks overflow. Prefer a static outer natural box with a padded inner animated stage whose transformed children remain inside that box at every visible frame. Use visible overflow only as secondary protection, not as the sole guarantee; preview and export hosts may still clip at the item boundary. Hidden overflow is allowed only for an intentional approved mask.
- Render and inspect the entrance extreme, overshoot, settled pose, encouragement peak, micro-expression peak, and exit at native and phone scale. Check the complete silhouette, not just the face; hair, hands, feet, energy marks, and shadows must remain inside the composition and free of self-clipping.
- Store an approved signature outro in the private base profile. Reuse it for later videos that select the same style profile; adapt only timing to the actual speech, aspect-ratio-safe placement, and documented collision handling. A new visual concept requires another preview and approval.

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

## Dialogue Loudness Calibration

- Measure the actual rendered timeline after speech cuts, denoise, fades, crossfades, gain, and any mix processing. Raw-source loudness, a UI slider, or one isolated clip is not proof of the delivered program level.
- When the creator has established published references, measure integrated loudness, true peak, and loudness range for several representative finished videos. Exclude or separately flag clipped and intentionally atypical outliers; do not average a clean reference together with a version whose true peak exceeds 0 dBTP and call the result a house standard.
- Prefer the most recent clean reference that matches the same content format and delivery platform. If references disagree materially, record the conflict and use a conservative speech-led social-video starting band of about `-18` to `-15 LUFS` with true peak at or below `-1 dBTP` until the user approves a private profile target. This is a starting band, not a universal platform law.
- For one continuous recording session, apply one uniform gain at source, track, or all derived A-roll clips. Do not normalize each cut independently; that creates audible level pumping and turns editorial boundaries into mix changes. Use per-section automation only for a documented source-level change.
- Re-export the complete mix after adjustment and measure it again. Record before/after integrated LUFS, true peak, loudness range, the applied gain, the accepted reference set, and any rejected clipped outliers. Store creator-specific targets and reference paths only in the private profile, never in the public Skill repository.
- Match the current render to recent clean format-matched creator references by integrated LUFS first, with loudness range and true peak as constraints. A UI slider value, waveform height, or peak-only match does not establish equal perceived loudness. Record the exact reference file/version and before/after measurements.
- Inherit the rough-cut-approved A-roll color. Verify continuity at representative returns from B-roll, but do not add a second color treatment unless the documented fine-edit exception applies.
- Preserve the approved caption visual language. Do not change subtitle background, color, stroke, shadow, or position because a request about chapter labels or progress-bar copy was misclassified. Only redesign captions after an explicit request; only relocate or reflow them for a documented collision, and verify any changed caption layout at native and phone scale.
- When caption size changes, treat it as a layout change: recalculate line capacity and box height, then inspect the longest two-line page together with picture-in-picture, evidence cards, and platform UI exclusion zones.
- Pagination follows meaning as well as width. A completed thought and the next thought should not share one card merely because both fit; split at the first word of the new thought. Re-read pagination after structural speech edits because the engine may resolve the boundary automatically, and use a forced page break only when the viewer-facing pages still combine them.
- Treat the supplied manuscript as the punctuation source of truth, and decide display punctuation only after viewer-facing pagination is locked. Preserve every manuscript punctuation mark that remains inside one caption page. If a detachable separator or terminator is the page's final character, omit it by caption style; this includes commas, periods, semicolons, colons, and enumeration commas in either Chinese or ASCII form.
- Always preserve a question or exclamation mark even when it is page-final because removing it changes sentence force. Preserve paired structural closers such as quotation marks, brackets, parentheses, and title marks at page end so the displayed pair is never broken. Punctuation embedded in numbers, units, names, or terms is not a detachable page-final mark.
- Pagination changes invalidate the punctuation decision. After any reflow, forced break, merge, scale change, or Script edit, re-read the final pages and repeat the punctuation audit. Do not use a renderer switch that strips every punctuation mark when internal, question/exclamation, or paired-structure exceptions must remain. A setting named `hidePunctuation` is acceptable only when its verified contract is page-aware: it removes detachable page-final punctuation while retaining those exceptions; verify the complete Card list and composed pixels.
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

Before a rough cut is shown as ready for approval, run `scripts/audit-rough-cut-review.mjs`. The record must enumerate every real join, preserve and audibly verify both boundary tokens, resolve the rendered-program pause scan, compare early/middle/late pace, and document an Agent normal-speed full listen. When retiming was applied, the audit must also prove that joins and breaths, timeline boundaries, captions, B-roll, presenter or cutout, SFX, music and ducking, layout and motion, progress, transitions, and outro were rebased and reviewed, or explicitly marked `not-present`. ASR, waveform markers, silence detection, contact sheets, and transcript text are assists; none may be the sole proof of speech quality.

Treat laughter, smiles, reaction holds, expressive silence, and an optional freeze frame as editorial moments, not fixed cleanup rules. For each material moment, choose among preserving natural motion, shortening, cutting away, holding, freezing, or another motivated treatment from meaning, performance quality, comedic or emotional timing, pace, and visual continuity. Never auto-freeze because laughter exists and never auto-remove a hold merely because it is long. Any deliberate freeze or conspicuous hold needs a recorded reason and normal-speed audiovisual review.

After rough-cut lock and before a full fine edit, read `references/fine-edit-direction.md`, `references/curated-style-library.md`, and `references/dynamic-style-adaptation.md` when no entry is a complete match or new assets are required. Complete `assets/templates/fine-edit-direction.template.json` and run `scripts/audit-fine-edit-direction.mjs`. Exact approved references and explicit user references take precedence. Without either, compare at least two plausible active public styles and select the strongest content fit. The library preserves liked, used, approved, and marked references but is not a closed asset whitelist. When no entry fits fully, use `dynamic-adaptation`, record the fit gap and any borrowed roles, then define one coherent palette, typography, composition, imagery/icon, motion, transition, BGM, and SFX system. Every major semantic beat needs an explicit asset decision with its role, selected form, source or generation plan, renderer, expected result, style adaptation, and rights/evidence/privacy boundary; `none` is valid when the performance already carries the beat. The style sample must be audiovisual and content-representative. For portrait short-form, start with one semantic line per caption card; split long thoughts into consecutive one-line cards first, and use two lines only when one line would cause tiny type, over-fast cards, or harmful semantic fragmentation. Record any override and verify it at phone scale. Use one primary screen-evidence plane, a content-selected still/recording/hybrid treatment, an all-story source-range allocation that prevents accidental cold-open reuse in later detail sections, a per-major-beat emphasis decision, and explicit BGM/SFX audition. A persistent synchronized duplicate of one recording is not a default layout, and `BGM off` is a reasoned result rather than an intake default.

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

- Classify each render as `review-proxy`, `platform-release`, or `source-quality-master`. Put the classification, source lineage, resolution, frame cadence, codec, and known limitations in the manifest and QA report.
- Platform compatibility and source-quality mastery are separate gates. Meeting a platform's current minimum dimensions, format, duration, or file-size rule does not prove that the render preserved the approved source detail.
- When the edit was reviewed from a lower-resolution proxy and original-quality media is materially better, conform the approved timing and rebuild the release/master from the original. Never upscale or rename the proxy to imply source-quality mastery.
- Preserve the approved timeline cadence. Do not convert a `30 fps` edit to `60 fps` through frame duplication solely to claim a higher specification; change cadence only through an intentional, verified conform.
- Probe the actual delivered file and verify dimensions, duration, frame count, codecs, color, channels, integrated loudness, true peak, sync, blank frames, and source lineage. Verify current platform requirements from an authoritative source before publication.
- When publication is in scope, lock platform and release constraints at intake, but create the final cover-title, caption, hashtag, campaign-tag, AI-disclosure, and upload-setting choices only after the exact release candidate passes QA. Follow [platform-release-and-publish-package.md](platform-release-and-publish-package.md), complete `assets/templates/publish-package.template.json`, and run `scripts/audit-publish-package.mjs`.
- Final publication approval belongs to the exact requested-resolution candidate. A 1080 review proxy cannot approve a separately rendered 4K file; render the 4K candidate from the best approved sources first, QA it, and show that file for approval.
- If an urgent platform-compatible proxy is accepted for publication, disclose the quality limitation and retain the source-quality master plan; do not silently call the proxy the final master.
- Never deliver only an MP4. Include the editable project, canonical EDL, timing/captions, director and edit decisions, asset/rights manifest, QA report, and any reproducible build instructions. Media and private artifacts remain outside the Skill repository.

## 执行范围补充

支撑点数量服从时长和内容，不硬限两个。逐词首次揭示约束关键主张和命名界面状态；已明确登记、不会误导的结果先行或建立场景可以先于对应口播。音频接缝按实际声音记录秒数或采样数，不随视频帧率机械变化。执行与证据的当前入口见 [execution-and-evidence.md](execution-and-evidence.md)。
