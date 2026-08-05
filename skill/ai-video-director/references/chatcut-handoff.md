# ChatCut To Canonical EDL

## Why Two Timelines Become One

ChatCut's timeline is the comfortable place to see tracks, preview edits, drag cut points, and fix them by hand. A local timing map or EDL is the machine-readable list of exact source intervals that FFmpeg and visual tools can reproduce.

If both continue changing independently, a cut moved in ChatCut may not move in FFmpeg, subtitles, B-roll, or sound. The video then has two conflicting clocks.

The rule is:

1. Review and adjust in ChatCut.
2. Export Final Cut Pro XML.
3. Convert once to `canonical-edl.json`.
4. Lock that version.
5. Make all downstream captions, visuals, sound, and rendering consume that EDL.
6. If cut points change, return to ChatCut and regenerate the EDL; do not hand-patch downstream copies.

## Frame-Rate Conform

Frame numbers are not portable between timebases. A boundary at frame 120 on a 60 fps canonical EDL is two seconds; placing frame 120 unchanged on a 30 fps ChatCut timeline moves it to four seconds.

Before duplicating or rebuilding a timeline:

1. Record the canonical/source frame rate, target timeline frame rate, source duration, expected target duration, and item count.
2. Convert each shared boundary once with `targetFrame = round(sourceFrame * targetFps / sourceFps)`.
3. Build every clip from adjacent converted endpoints so `duration = nextBoundary - currentBoundary` and neighboring clips remain contiguous.
4. Re-read the target timeline and verify its first boundary, last boundary, duration in seconds, clip order, item count, and pairwise contiguity.
5. Inspect at least the opening, one middle join, and the ending in composed timeline frames before adding fine-edit layers.

Never change the locked canonical EDL to compensate for an incorrectly configured fine-edit timeline. Repair or recreate the working duplicate instead.

## Commands

```bash
node scripts/chatcut-xml-to-canonical-edl.mjs chatcut-export.xml canonical-edl.json
node scripts/render-canonical-edl.mjs canonical-edl.json source.mov a-roll-master.mp4
```

Use `--source-map` with the renderer when the EDL contains multiple source names.

## Tested Boundary

The bridge is tested for straight cuts in a single primary video track. It reads clip output frames and source in/out frames, validates duration consistency, and preserves source file identity where the XML provides it.

Do not claim the bridge currently preserves:

- ChatCut captions or motion graphics.
- Speed ramps or retiming.
- Nested sequences, compound clips, or multicam edits.
- Transitions, transforms, filters, or audio automation.
- Arbitrary multi-angle overlap.

Those features require explicit schema and regression tests before adoption. Until then, use ChatCut for rough-cut decisions and rebuild fine-edit layers from the canonical EDL.
