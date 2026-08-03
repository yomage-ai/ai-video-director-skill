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
