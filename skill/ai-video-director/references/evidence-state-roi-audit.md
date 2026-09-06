# Evidence State And ROI Audit / 证据页面状态与 ROI 审计

Use this audit whenever an app, dashboard, document, or product UI is evidence in a video. The goal is not merely a clean screenshot. The pixels must show the exact state and exact region that support the spoken claim.

只要 App、工作台、文档或产品界面承担视频证据，就必须执行本审计。目标不只是截图好看，而是让画面准确展示能支持口播的页面状态与语义区域。

## 1. Lock The Evidence Claim / 锁定证据命题

Write one sentence for what the viewer must learn from the shot. Map it to the spoken beat and mark the evidence as `state`, `interaction`, or `change-over-time`. This classification describes the content, not an automatic media-format rule.

- Consider `still`, `recording`, and `hybrid` as candidates. Choose from phone-scale legibility, temporal value, credibility, rhythm, and attention cost.
- When the user supplies a usable recording, inspect it first and compare it with representative stills or extracted frames. Prefer the recording only when its temporal action materially improves the beat.
- A stable state may still benefit from a short recording for presence or context, while a process may be clearer as selected stills. Record the chosen format and reason; never infer it mechanically from the evidence class.
- Do not substitute a semantically related screen. An adjacent tab can be visually plausible and still be false evidence.

先写一句“观众必须从这个镜头看懂什么”，并标记为静态状态、交互过程或随时间变化。这个分类只描述内容，不直接决定必须用截图还是录屏。截图、录屏和混合形式都应进入候选，根据手机可读性、时间变化的价值、可信度、节奏和注意力成本选择。用户提供了可用录屏时先检查录屏，再与代表性静帧或截图比较；录屏的时间变化确实让这一段更好时才优先采用。稳定状态也可能因短录屏更自然，操作过程也可能因精选静帧更清楚，因此必须记录最终形式和理由，不能机械写死。不得用语义相近的相邻页面替代准确页面。

## 2. Lock The Exact State Path / 锁定准确页面路径

Record all state selectors that can change the visible meaning:

- route or document;
- primary tab and subtab;
- view mode or report type;
- selected date, range, filter, or account;
- expanded/collapsed modules;
- scroll position;
- demo-data and privacy state.

Name one or more rejected adjacent states when confusion is possible. Example: `Review -> Journal -> Monthly Book Page`, rejected state `Monthly Report`.

记录路由、主页签、子页签、视图、日期、筛选、展开状态、滚动位置、演示数据和隐私状态。容易混淆时必须明确写出被排除的相邻状态，例如“回顾 -> 手账 -> 月度书页”，排除“月报”。

## 3. Derive Semantic ROI / 从源语义确定 ROI

Use the strongest source available, in this order:

1. DOM, accessibility tree, visible text, labels, roles, and control bounds;
2. design-layer or source-layout geometry;
3. user-confirmed reference pixels;
4. manual pixel selection only after the intended labels and controls have been identified.

Do not infer a feature region from an editor thumbnail, full-page screenshot, or visual resemblance. Do not place a rectangle first and rationalize it afterward. The final crop must contain the exact label/control/value that proves the claim, exclude unrelated modules, and remain readable at delivery scale.

优先使用 DOM、无障碍树、可见文本与控件边界，其次使用设计图层，再其次使用用户确认的参考图。只有先识别准确标签和控件后才可人工选像素。禁止从编辑器缩略图、全页截图或视觉相似度猜框，也禁止先画框再倒推解释。

## 4. Record The ROI Manifest / 记录 ROI 清单

For every evidence asset, record:

```json
{
  "claim": "",
  "source": "",
  "statePath": [],
  "rejectedAdjacentStates": [],
  "viewport": {"width": 0, "height": 0},
  "requestedBounds": {"x": 0, "y": 0, "width": 0, "height": 0},
  "outputBounds": {"width": 0, "height": 0},
  "proofLabels": [],
  "visibleModuleAllowlist": [],
  "forbiddenStringsChecked": [],
  "pixelReviewPassed": false
}
```

Keep requested and output bounds separate because viewport clipping or page edges can reduce the actual image. / 请求截图范围与实际输出尺寸必须分开记录，因为视口边缘或页面裁切可能改变最终像素尺寸。

## 5. Compose Without Falsifying / 编排但不篡改证据

- Prefer the smallest complete proof region, enlarged to phone readability.
- Preserve the source aspect ratio. Do not stretch a crop to fill a decorative container.
- Reveal evidence on the matching spoken phrase instead of dumping every card at once.
- Use a precise focus cue only when the proof is not obvious. Anchor it to inspected source coordinates; never guess.
- Keep critical evidence above the caption lane and outside platform controls. Recompose or split the shot rather than hiding evidence behind subtitles.
- Use the exact approved page image in overview stacks; do not replace it with a prettier neighboring view.

使用最小但完整的证据区域并按原比例放大；跟随口播逐项出现，不要一次堆满；只有证据不明显时才添加精确指示；关键信息必须避开字幕和平台控件。合集画面也必须使用已经确认的准确页面，不得换成更好看但错误的相邻视图。

## 6. Fail-Closed Verification / 默认不通过的验证

Export remains blocked until all checks pass:

- exact state path visible or independently proven;
- proof label/control/value present;
- rejected adjacent state absent;
- ROI manifest matches actual pixels and dimensions;
- no private or forbidden module appears in stills, transitions, thumbnails, or exports;
- crop remains legible at native and phone scale;
- caption, picture-in-picture, progress, and platform UI do not cover the proof;
- before/on/after frames of every state or image transition contain no blank frame, leaked underlay, or label/image mismatch.

以下任一项不满足即阻断导出：状态路径准确、证据控件存在、错误相邻状态不存在、清单与实际像素一致、隐私安全、手机尺寸可读、无遮挡、完整过渡窗无空白帧/底层漏出/标签画面错配。

## 7. Cleanup / 清理

After capture, remove temporary demo data through the product's supported data path and verify the normal profile is restored. Keep only the approved derivative and its manifest in the video project; never commit personal screenshots or project paths to the public Skill repository.

截图完成后，通过产品支持的数据路径清除临时演示数据并确认正常账号状态已恢复。视频工程只保留合格素材和清单；不得把个人截图或项目绝对路径提交到公共 Skill 仓库。
