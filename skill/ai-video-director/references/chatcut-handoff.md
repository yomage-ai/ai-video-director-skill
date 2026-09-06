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

## Explicit Processing And Tested Boundary / 显式处理与能力边界

New conversion produces canonical EDL v2 with stable XML file IDs, integer output boundaries, explicit source intervals, constant playback rates and typed video/audio processing. Names are labels; two sources with the same basename must be mapped by `sourceId`. Conflicting audio timing/source identity and XML effects, transitions, nesting and disabled tracks are rejected rather than dropped.

For constant retiming, export neutral timing and use `--processing processing-plan.json`. Bind `inputXmlSha256`; key `segments` by XML clip ID. Each entry may contain `playbackRate` (0.25–4), `video` (`brightness`, `contrast`, `saturation`, `gamma`) and `audio` (`gainDb`, `fadeInSeconds`, `fadeOutSeconds`). The rate must match source/output duration. Unknown fields and unused segment IDs fail. No gain or fade is implicit; fade duration is in seconds, independent of video fps. Video EQ is an explicit FFmpeg operation, not a promise to reproduce arbitrary editor color controls.

```json
{
  "schemaVersion": 1,
  "inputXmlSha256": "<hash of the neutral timing XML>",
  "segments": {
    "clipitem-1": {
      "playbackRate": 1.04,
      "video": {"brightness": 0.02, "saturation": 1.03},
      "audio": {"gainDb": -1.5}
    }
  }
}
```

These numbers illustrate the format, not preferred editorial settings. Never remove an effect from the approved timeline in place just to pass conversion. Duplicate the timing export; translate supported processing into the explicit plan and compare the resulting rendered color, loudness, pace and every changed boundary with the approved preview. Rate changes require source/output timing updates, not a second competing clock.

For unsupported processing, render a reviewed source-quality derivative with effects baked in, then cut that derivative on a neutral timeline. A source-map entry may be `{ "path": "processed.mov", "sha256": "...", "lineage": { "original": {"path":"original.mov","sha256":"..."}, "derivation": {"path":"derivation.json","sha256":"..."} } }`. The derivation record preserves original/derivative intervals, exact processing command or editor project, cadence, color, audio and approval evidence. Never map a proxy or processed source into original offsets without this conform. The renderer binds these lineage files into its receipt; the Agent must still inspect source-quality and perceptual equivalence.

The renderer supports source-aligned audio, constant pitch-preserving tempo, typed EQ/gain and explicit non-overlapping fades. Speed ramps, reverse motion, independent external audio, arbitrary filters, overlapping dialogue crossfades and HDR conversion remain explicit derivative routes. The raw renderer creates an unapproved review candidate plus a full-decode receipt; use the stage runner for production gates.

新版 EDL v2 明确保存素材 ID、整数帧边界、源区间、恒定调速和视频/音频处理。同名文件按 ID 映射。不支持的 XML 效果、独立音轨剪辑和嵌套必须拒绝，不能悄悄丢弃。

Agent 用绑定 XML 哈希的 processing plan 显式记录调速、基础色彩与音频参数；不暗加增益或淡化，淡化秒数不跟视频帧率变化。批准工程保留，新建中性时间导出，处理前后核对实际颜色、响度、语速和剪点。复杂效果走带原始区间、处理命令与批准依据的源质量衍生素材路线；HDR、变速曲线、反向、独立外录音轨和重叠交叉淡化不宣称已原生支持。
