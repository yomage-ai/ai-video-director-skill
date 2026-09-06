# Defaults, Identity And Feedback / 默认风格、个人形象与反馈

## Runtime Ownership / 运行时归属

1. **Public editing Skill:** production rules plus Xiaoxiong's explicitly shared editing style. `xiaoxiong-public-style.json` owns the approved loudness, natural-color chain, exact scalable subtitle tokens, palettes, screen/presenter defaults, music/effect tendencies and content-fit priorities. It loads on a fresh install without old local files. The curated library supplies compatible style recipes and dynamic adaptation routes.
2. **Optional identity Skill:** `xiaoxiong-ip` owns Xiaoxiong character images, approved poses, wink/signoff treatment and the twirl sequence. It is selected only for that identity use. Another creator does not need it to use the public editing style.
3. **Video project:** the current footage, transcript, timecodes, EDL, chosen music/assets, approvals, target-specific layout and QA. Continuing an existing video requires this project regardless of which computer is used.
4. **Optional local data:** another user's overrides, feedback history, credentials stored by their tool, and host-specific operational state. `AI_VIDEO_DIRECTOR_DATA_DIR` is not a required private Xiaoxiong style package. New hardware is probed rather than copying another machine's performance preset.
5. **External knowledge base:** provenance, decisions, status and practice history. It is not required for the bundled style to run and does not replace the source Skill, identity library or video project.

公共 Skill 是小熊剪辑风格的沉淀，不只是一套中性的剪辑工具。已授权共享的字幕、音量、配色、自然提亮、画面取舍与风格优先级直接随仓库发布。个人形象和片尾动作归 `xiaoxiong-ip`。单条视频的素材与决定随工程保存；其他人的覆盖偏好、反馈历史和本机性能状态可留在本地，但换电脑复现小熊风格不依赖它们。

A scalable reference coordinate, exact color or loudness target can be an approved public style token. Do not automatically classify it as private merely because one creator selected it. Conversely, publicizing a style does not require copying original face/voice media, account screenshots, private chats or unlicensed assets. The shipped neutral examples and full numeric/behavioral contracts replace those runtime dependencies. See [xiaoxiong-public-style.md](xiaoxiong-public-style.md) and [style-publication-map.json](style-publication-map.json).

可缩放坐标、具体色号、响度目标可以公开成为风格默认；不能再因为它是个人审美就排除。公开的是完整可执行风格，原始人脸、声纹、账号画面、聊天和未获许可的参考图片仍不是公共附件。

## Effective Defaults / 有效默认值

Precedence, from low to high:

1. Bundled Xiaoxiong public style.
2. Explicitly approved local user overrides, if present.
3. Explicitly selected identity adapter, for identity fields only.
4. Current-project overrides with `key`, `value`, `reason`, and `source`.

Project approval and actual evidence/readability constraints always take precedence over an aesthetic default. No override authorizes impersonation, new voice cloning, paid generation or use of uncleared media. Pending feedback is not an effective default. Updating the public Skill must not silently overwrite another user's approved local choices.

优先顺序：内置风格 → 已确认的用户覆盖 → 已选择的身份适配 → 当前项目决定。用户当前要求与真实可读性优先，待试反馈不自动变成默认。发布公共风格也不能悄悄覆盖别人的已确认选择。

`memory.mjs show` reads the effective current-stage view without writing a profile. `--stage intake|rough|fine|release|all` and `--key` narrow it. `--defaults-only` ignores optional local data, useful for checking a new installation. `--identity-skill <resolved-directory>` loads the selected identity contract and verifies asset hashes; omitting it inserts no Xiaoxiong identity. `--history` is explicit archival inspection. Project overrides change only the returned view. Provenance reports the contributing public, local, identity and project layers.

默认只读有效配置，不为读默认风格创建私人画像；历史按需读取。身份适配不因“电脑上恰好装了”而自动加入别人的视频。

## Feedback And Publication / 反馈与发布

1. Record the actual feedback and its project/source. Apply a requested correction to that video.
2. Keep a one-video choice in its project. Suggest a reusable default only when the user requests it or repeated evidence justifies a proposal.
3. When the owner explicitly approves a shared style/default, update the public profile and applicable guide/assets, validate fresh-install behavior and publish within existing authorization. No second private copy is required for the same default.
4. Store an approved character/identity change in its identity Skill. A new image merely being liked is not a canonical identity update.
5. Store an unshared user override locally only after its explicit approval; preserve reversible history. Do not copy history into the public Skill.
6. Maintain `analysis/learning-scope-ledger.json`. Keep its established `changeType` and `promotionLayer` fields: use `public-curated-style-hardened` or `new-public-curated-style` with `public-curated-style-library` for the bundled creator-style contract; the implementation field points to `references/xiaoxiong-public-style.json`. General mechanisms, optional local preferences and project decisions retain their own classifications. A source submission does not prove a pending independent real-video trial passed.

用户明确说“把这个风格放进公共 Skill”时，直接维护公共默认并在已授权范围内提交；不额外造一份同内容的私人风格包。其他用户自己的覆盖偏好仍可留本地。学习清单继续区分公共规则、公共风格、身份、私人覆盖与单片决定，不把一次参数复用说成所有场景都验证过。

## Agent Commands

```bash
node scripts/memory.mjs show --stage fine
node scripts/memory.mjs show --defaults-only --stage all
node scripts/memory.mjs show --stage fine --identity-skill <installed-xiaoxiong-ip-directory>
node scripts/memory.mjs show --stage fine --overrides <project-overrides.json>
node scripts/memory.mjs record --project my-video --category captions --feedback "Use quieter caption motion for this video"
node scripts/memory.mjs promote --id <feedback-id> --key captions.motion --value-json '"restrained"' --reason "Explicitly approved local override" --confirm-user-approved
```

`init`, `record` and `promote` create local data only when needed. The current owner's former profile has been split by explicit approval: reusable style into this repository, identity treatment into `xiaoxiong-ip`, host settings retained locally, original history retained as provenance. Future installs need no migration of that old profile to obtain the style.

One feedback item may expose a general mechanism, a shared style and a concrete project choice. Split it into linked records using `linkedEntryIds`; do not duplicate the full mixed payload. 例如“截图、录屏或混合形式按内容选择”是通用判断，小熊黄蓝色值是公共风格，具体哪段录屏用于哪句话仍是单片决定。个人知识库保存来源、状态、冲突和实践历史，不代替实际实现。
