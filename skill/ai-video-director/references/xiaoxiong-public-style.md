# Xiaoxiong's Built-In Editing Style / 内置小熊剪辑风格

Read this at intake and whenever exact audio, caption, palette, layout or reference defaults are needed. The executable source is [xiaoxiong-public-style.json](xiaoxiong-public-style.json), returned by `memory.mjs show` even on a fresh machine with no local profile. This is the creator's intentionally shared editing style, not a neutral toolkit that requires a second private style package.

开始剪辑及需要具体参数时读取本页。字幕、声音处理、自然提亮、配色、画面与风格优先级以同目录 JSON 为准。新电脑没有旧画像也能直接读取这些默认值，不再要求迁移单独的私人风格包。

## Use The Defaults / 使用默认值

- Preserve the recorded speaker's natural timbre. Target dialogue around **−16.5 LUFS**, acceptable **−17 to −15.5 LUFS**; true peak at most **−1 dBTP**, preferably about **−1.3 dBTP**. Measure the actual edited timeline and final mix; do not normalize each cut independently or mistake peak matching for loudness matching. Typical LRA 1.5–3.5 LU is a reference, not a reason to flatten expressive delivery. / 保留说话者本来的音色，声音自然清楚；响度看整条成片，不用每段各自拉满，也不把本人声纹当公共素材。
- Captions use **Noto Sans SC**, complete semantic cards and restrained motion. The evidence style starts with warm-white text, dark outline, transparent surface and selective yellow emphasis. The notebook style uses warm-white text on a soft dark translucent card. Start with one line; use two when readability or complete meaning requires it. Preserve manuscript punctuation during segmentation and the approved display-punctuation rules. / 字幕整句按语义出现，不做默认逐字蹦跳；保留单行优先与必要时双行的余地。
- The exact caption size, weight, stroke and scalable placement are in `talkingHead.captionLayout.presets`; exact colors are in `talkingHead.paletteTokens`. Start from these values, then check evidence collisions, phone readability and actual platform UI. / 字号、描边、字幕位置及色值都是公开默认，不再留在旧电脑；画布比例与平台变化时由 Agent 调整。
- The natural-bright treatment preserves the approved curves → color balance → saturation order. Apply the `filterStages` once to a suitable source-quality derivative and record lineage; the current canonical renderer's EQ-only path cannot express curves/color balance. The historical semicolon-separated stage notation is converted to a comma-separated FFmpeg simple filter chain without changing values. Do not apply it twice to an already treated source. SDR/source conditions must match; different exposure, lighting, skin rendering or HDR needs a new local comparison. / 自然提亮参数完整保留；先确认原片有没有调过色，避免重复叠加。
- For proof, screen demos and diagnosis, prefer **bold evidence editorial**: yellow/cobalt accents, neutral evidence surfaces, one primary screen plane, large semantic ROI, restrained callouts and a stable lower-corner cutout when useful. Avoid persistent synchronized duplicate screens and evidence-aligned cutout anchors. / 证据编辑先用黄蓝和中性底色，录屏保留一个主画面，人物位置让关键证据可读。
- For journeys and experiments, prefer **warm notebook**; for abstract processes and relationships, prioritize **handdrawn knowledge map**. Keep warm paper, graphite card surfaces, green path accents and restrained yellow/coral highlights. Dark forest/ink green is rejected as the dominant information-card surface, not as every green accent. / 手账与知识图解按内容选；信息卡不恢复被否定的大面积墨绿底。
- Music is a light technology bed with dialogue carve/ducking when it helps; effects are sparse and tied to actual semantic events. A dense explanation can remain voice-only. Choose and audition licensed music per video; no soundtrack or creator voice is silently reused. / 配乐与音效延续轻、少、让人声的原则，开或关都按内容决定。
- Progress uses a neutral marker, including the bundled original notebook nib. Keep its tip on the fill endpoint; drive travel from video progress and micro-motion from a separate deterministic clock. An actual Xiaoxiong character, signoff, wink or twirl belongs to the optional identity Skill. / 公共进度条含中性笔尖；小熊人物与片尾动作由 IP Skill 提供。

## Portable Reference Assets / 可迁移参考

Agent runs `node scripts/prepare-style-assets.mjs --out <external-project>/assets/xiaoxiong-style`. It downloads the exact approved font by pinned source revision and SHA-256, keeps its OFL license, and copies the original neutral [reference board](../assets/style/reference-board.html), [CSS](../assets/style/xiaoxiong-style.css) and [nib SVG](../assets/style/notebook-nib.svg). It never needs an old project path, screenshot, exported video or private feedback log. Open the materialized board to inspect actual fonts; do not label a fallback font as an exact match. Dependency setup is the Agent's work.

Agent 自动准备字体和随 Skill 提供的版式示例。字体缺失或下载校验失败时明确处理，不悄悄换字体。示例只说明样式，不冒充已完成的视听样片；真正剪辑仍检查语义、时序、画面和声音。

See [style-publication-map.json](style-publication-map.json) for the complete disposition of the former profile's 15 preference groups. Original reference media is provenance only. Hardware settings are detected on each machine; feedback history is optional archival data. Neither is a missing style package.

## Optional Identity / 可选个人形象

For another creator, `ai-video-director` alone supplies the style and uses that creator's footage. For Xiaoxiong's own identity treatment, load `$xiaoxiong-ip` and its `references/video-adapter.json`; resolve the actual installed directory and pass it to `memory.mjs show --identity-skill <directory>`. This verifies the registered open/wink assets and adds the exact approved signoff/motion contract. Do not automatically insert Xiaoxiong's character or spoken name merely because the public editing Skill was installed. No voice cloning is enabled by selecting an image identity adapter.

别人剪自己的视频只需公共剪辑 Skill；小熊自己的形象出镜再加 `xiaoxiong-ip`。已有视频续剪始终需要它的原片和工程，这属于每条视频本身，不是另一个个人风格包。
