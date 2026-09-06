# Memory And Feedback

## Runtime And Knowledge Layers

1. Repository defaults are universal production rules suitable for every user. They are versioned in Git and prevent correctness, evidence, rights, safety, and delivery failures.
2. The public curated style library stores shareable aesthetic recipes with content-fit rules, B-roll grammar, motion, sound candidates, and a quality floor. These entries are public candidates, not universal mandates.
3. The private base profile stores durable personal preferences, creator-specific ranking biases, identity treatments, and private references. It lives under `AI_VIDEO_DIRECTOR_DATA_DIR`, outside Git.
4. Project overrides store choices, copy, timing, assets, and geometry for one video only. They live in that video's external project folder.
5. An external personal knowledge base, when the user has one, stores provenance, status, conflicts, and practice history. It is not an automatic runtime default unless an approved public style, private-profile value, or explicit current decision points to it.

This separation lets a user say, for example, “this video should feel quieter” without permanently changing every future video.

Use this placement test:

| Question | Universal rule | Public curated style | Private profile | Project only | External knowledge base |
|---|---|---|---|---|---|
| Does it prevent a correctness, evidence, rights, safety, or delivery failure for every creator? | yes | no | no | concrete instance only | method history |
| Is it a shareable visual/editing recipe that can be expressed without private identity or unlicensed source assets? | supporting mechanisms only | yes, with content-fit and avoid rules | optional creator ranking bias | current adaptation | provenance and validation history |
| Does it encode a creator character, logo, face/voice asset, signature motion, private reference, rejected option, or recurring personal exception? | no | no | yes after explicit approval | yes before promotion | yes with sensitivity and lifecycle status |
| Is it exact copy, timing, clip choice, asset id, coordinate, source range, or a one-video fix? | no | no | only when it truly becomes a durable private adapter | yes | task evidence, not a runtime default |
| Did one feedback item reveal a method, a reusable public look, and a personal preference? | split out the invariant | create a versioned style recipe | create a separate linked preference only when useful | keep the concrete instance | link all records; do not merge their status |

One feedback item may therefore live in more than one layer, but not as one mixed payload. Split it into linked records. Example: `choose still/recording/hybrid from content` is a universal rule; a shareable proof-led editorial treatment belongs in the curated style library; `this creator ranks that treatment first for technical explainers` belongs in the private profile; exact runs and timecodes stay project-only; the knowledge base records how the distinctions were learned and whether they passed later practice.

Universal rules must describe decision factors and exceptions. Curated public styles may be opinionated and concrete, but every entry needs content-fit signals, avoid conditions, adaptation boundaries, provenance, and a validation level. A successful treatment becomes a public style candidate only after private identity, project copy, exact coordinates, and unlicensed source assets are removed. It never becomes a mandatory format for every video.

Private preferences may change candidate order or attach a creator-specific adapter, but they still cannot override intelligibility, evidence accuracy, rights, privacy, or an explicit current-project request. A creator may curate a public style and also keep a private preference that ranks it first; those are separate records.

The same applies to presenter design. For portrait `B-base-A-cutout`, the public repository recommends lower-left and lower-right as the first placement candidates and outline `on` as the starting state. For portrait short-form captions, it recommends one semantic line per card. These are overridable defaults, not universal locks: content conflicts or an exact approved reference may select another zone, turn the outline off, or use two caption lines when one line would create tiny type, over-fast cards, or harmful semantic fragmentation. A private profile may remove a creator's rejected anchor and store recurring side bias, outline strength, hair/clothing color facts, or caption exceptions. Exact side, color, width, coordinates, and creator-specific styling remain private or project decisions.

## Feedback Lifecycle

1. Record the exact feedback, project, category, and scope.
2. Apply it to the current video immediately when requested.
3. Keep it project-only by default.
4. Suggest promotion when the same preference repeats or the user explicitly says it should become the default.
5. Promote only with explicit approval, including a reason and timestamp.
6. Keep a reversible history. A later preference can supersede, not erase, earlier evidence.

Never store raw media, full transcripts, face/voice files, credentials, or sensitive personal facts in the preference profile.

## Public Style Curation Lifecycle

1. Capture the useful visual and editorial decisions from a reference or completed project.
2. Separate the reusable style recipe from the creator's identity, private assets, project copy, timing, and coordinates.
3. Record viewer jobs, strong fit signals, avoid conditions, palette roles, type hierarchy, icon grammar, B-roll forms, motion character, sound candidates, evidence boundaries, safe areas, and QA.
4. Record provenance honestly. `method-only` means the source asset is not distributed or copied. A single still can approve a visual contract but cannot prove exact motion. A single project can prove that instance but not every content context.
5. Add the genericized entry to `references/curated-style-library.json` and the human guide. Keep personal IP and private reference files outside Git.
6. Compare at least two active entries when no user style was provided. Treat liked, used, approved, and marked entries as retrieval references, not a closed asset list. A new or hybrid dynamic direction is allowed when the existing candidates are assessed with rejection or borrowing reasons and the project records a coherent audiovisual system plus beat-level asset plan.
7. Preserve versions. A later revision supersedes rather than silently rewriting an approved historical contract.

## Per-Project Learning Scope Ledger

At delivery, create `analysis/learning-scope-ledger.json` from `assets/templates/learning-scope-ledger.template.json`. This ledger explains what changed instead of presenting every rule as newly invented in the current project.

For each lesson, record two independent classifications:

- `changeType`: `pre-existing-confirmed`, `pre-existing-hardened`, `public-curated-style-hardened`, `corrected-overgeneralization`, `new-general-rule`, `new-public-curated-style`, `new-private-preference`, or `project-only-decision`;
- `promotionLayer`: `public-repository`, `public-curated-style-library`, `private-profile`, or `project-only`.

Also record the previous contract, observed failure, generalized invariant, project-specific instance, implementation location, evidence, and privacy reason. A pre-existing rule that gained a template field, automated audit, clearer exception, or stronger QA is `pre-existing-hardened`, not “new.” A project-specific number or visual choice may reveal a general method without making that number or choice a repository default.

When one feedback item is split across layers, use separate ledger entries and connect them with `linkedEntryIds`. `implementation.externalKnowledgeRecords` may name an external knowledge record when one exists, but it does not replace the actual public/private/project implementation field.

### 简体中文

公共 Skill 同时保存两种东西。第一种是陌生创作者都要遵守的通用判断、流程、模板和审计。第二种是可以公开分享的策展风格库，每个风格都有适用内容、禁用场景、视觉与剪辑语法和验收下限，但不强迫所有视频使用。私人画像保存用户明确批准的个人排序偏好、身份资产、私有参考和例外；单片工程保存文案、时间点、素材、坐标和本片修复；个人知识库保存来源、状态、冲突和实践历史，不自动等于运行时默认。

同一条反馈可以同时产生通用规则、公共风格、私人偏好和单片记录，但必须拆开，不能混成一个包。例如“截图、录屏或混合形式按内容选择”属于通用规则；一套去除个人 IP 后仍可复用的高彩证据编辑方法进入公共风格库；“这位创作者做技术口播时优先选它”进入私人画像；具体四段录屏和时间点只留在本片；知识库记录这些区分怎样形成、是否经过后续真实剪辑验证。

通用规则必须写决策因素和例外。公共风格可以有明确审美，但必须同时写清内容适配、避用条件、改编边界、来源关系与验证等级。一次成功处理可以沉淀成公共候选风格，不能因此升级为所有视频强制使用的万能模板。私人偏好可以改变候选顺序，但不能覆盖清晰度、证据准确性、版权、隐私和当前项目的明确要求。

人物设计也按同样方式拆分：竖屏 `B-base-A-cutout` 的公共推荐起点是先比较左下和右下，描边先开；竖屏短视频字幕则先按“一张字幕卡一行完整语义”排版。它们都可以覆盖，不是不可变的统一模板：当内容占位或精确已确认参考冲突时可以换位置或关闭描边；单行会造成字号太小、切换过快或语义破碎时可以改为两行，但都要记录原因并做手机尺度复核。私人画像保存创作者明确否定的旧锚点、长期侧向偏好、描边强度、常见发色衣着和字幕例外；具体侧边、颜色、宽度与坐标仍属于私人或单片决定。

交付时必须生成 `analysis/learning-scope-ledger.json`，逐条说明本片经验到底属于“原规则再次确认、原规则加固、公共策展风格加固、纠正过度泛化、新增通用规则、新增公共策展风格、新增私人偏好，还是仅本片决定”，并另行标明它进入通用公共仓库、公共策展风格库、私人画像还是单片工程。

每条都要写清修改前的规则、这次暴露的问题、抽象后的通用不变量、本片的具体实例、真正落地的文件、验证证据和隐私边界。以前已经存在但这次增加模板字段、自动审计、例外条件或更严格 QA 的规则，要标成“加固”，不能说成这次才第一次拥有。

### 公共风格沉淀流程

1. 从参考图或已完成项目里提取真正有用的视觉与剪辑判断。
2. 把可复用风格与创作者身份、私有素材、本片文案、时间和坐标拆开。
3. 写清观众任务、适配信号、避用条件、配色角色、字号层级、图标、B-roll、动效、声音、证据边界、安全区和验收方法。
4. 如实记录来源关系。`method-only` 表示只提炼方法，不分发或复制源素材。单张静帧可以支持视觉契约，不能证明准确动效；单个项目可以证明这一实例，不能证明所有题材。
5. 去身份后的条目进入 `references/curated-style-library.json` 和对应说明；个人 IP 与私有参考文件继续留在 Git 之外。
6. 用户没有给风格时，至少比较两个公共候选。喜欢过、使用过、确认过和标记过的条目负责提供检索参考，不能变成封闭素材列表。写清候选的拒绝或借用理由，并记录完整视听系统和逐节点素材计划后，可以重新设计动态方案或混合方案。
7. 风格按版本演进。新版本替代旧版本时保留历史，不静默改写已经确认的契约。

## Commands

```bash
node scripts/memory.mjs init
node scripts/memory.mjs show
node scripts/memory.mjs record --project my-video --category captions --feedback "字幕少用逐字跳动"
node scripts/memory.mjs promote --id <feedback-id> --key captions.motion --value-json '"restrained"' --reason "用户明确要求设为默认" --confirm-user-approved
```

Set a custom private location with:

```bash
export AI_VIDEO_DIRECTOR_DATA_DIR="$HOME/Private/ai-video-director"
```

## Runtime Slices / 运行时切片

`memory.mjs show` defaults to current intake preferences without history. Use `--stage rough|fine|release`, `--key <prefix>`, `--style <id>` and `--include-candidates` only as needed. `--history` is explicit archival inspection. Project override records contain `key`, `value`, `reason`, `source`; they overlay the current view without modifying the private profile. The output lists provenance and overwritten values. Candidate feedback is shown separately and is never applied automatically; explicit superseding feedback hides the superseded candidate.

默认只读当前阶段有效偏好；历史需明确请求。项目覆盖写明键、值、理由、来源，只影响当前视图。输出保留出处与覆盖情况。待试反馈独立展示，不自动生效；新纠正替代的旧候选不再作为当前候选。
