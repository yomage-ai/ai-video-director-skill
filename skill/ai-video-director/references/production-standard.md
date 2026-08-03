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
- The complete locked A-roll has been watched and listened to, not spot-checked.
- The canonical EDL is versioned and accepted.
- Resolution, orientation, frame cadence, color, and audio have no unexplained degradation.

Zooms, B-roll, caption styling, motion graphics, transitions, music, and semantic sound effects are fine edit. Transcript correction is rough cut; how the captions look is fine edit.

## Fine Edit Standard

- Start from a visual beat sheet: what must the viewer see, understand, or believe at each beat?
- Prefer real frames, screenshots, waveforms, timelines, documents, products, and actual outputs over decorative geometry or a simulated interface.
- Do not fake a tool interface when a real project artifact exists.
- One shot gets one primary rendering engine. Use A/B output only when the comparison itself is approved and recorded.
- Keep transitions restrained and motivated by structure.
- BGM is off by default. Dialogue intelligibility has priority over music and effects.
- Approve three representative keyframes and one short motion sample before rendering the full visual layer.

## Media Integrity

- Probe the source before conversion. Preserve rotation, aspect ratio, frame rate intent, color primaries, transfer, matrix, range, and audio layout unless an explicit conversion is planned.
- Do not label HDR as SDR merely by changing metadata. Tone-map deliberately or keep a valid HDR pipeline.
- Do not diagnose color or resolution from an unverified browser proxy alone. Compare decoded source and output frames using the same color-managed path.
- `-c copy` cuts at available keyframes and may start earlier/later than the requested boundary. It is for approximate preview only.
- Locked A-roll and final output use exact decoding and re-encoding, with dimensions, duration, sync, and representative pixels verified afterward.

## Targeted Checks Before Full Render

Run the smallest useful test for each risk:

- Dialogue join and loudness sample.
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
- Keep baseline and final-version metrics separate.
- Describe sampled defects as examples, not an exhaustive list.
- Record untested or uncertain behavior plainly.

## Delivery

Never deliver only an MP4. Include the editable project, canonical EDL, timing/captions, director and edit decisions, asset/rights manifest, QA report, and any reproducible build instructions. Media and private artifacts remain outside the Skill repository.
