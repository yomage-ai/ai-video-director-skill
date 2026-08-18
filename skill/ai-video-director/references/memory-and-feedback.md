# Memory And Feedback

## Three Layers

1. Repository defaults are generic production rules suitable for every user. They are versioned in Git.
2. The private base profile stores durable personal preferences. It lives under `AI_VIDEO_DIRECTOR_DATA_DIR`, outside Git.
3. Project overrides store choices for one video only. They live in that video's external project folder.

This separation lets a user say, for example, “this video should feel quieter” without permanently changing every future video.

## Feedback Lifecycle

1. Record the exact feedback, project, category, and scope.
2. Apply it to the current video immediately when requested.
3. Keep it project-only by default.
4. Suggest promotion when the same preference repeats or the user explicitly says it should become the default.
5. Promote only with explicit approval, including a reason and timestamp.
6. Keep a reversible history. A later preference can supersede, not erase, earlier evidence.

Never store raw media, full transcripts, face/voice files, credentials, or sensitive personal facts in the preference profile.

## Per-Project Learning Scope Ledger

At delivery, create `analysis/learning-scope-ledger.json` from `assets/templates/learning-scope-ledger.template.json`. This ledger explains what changed instead of presenting every rule as newly invented in the current project.

For each lesson, record two independent classifications:

- `changeType`: `pre-existing-confirmed`, `pre-existing-hardened`, `corrected-overgeneralization`, `new-general-rule`, `new-private-preference`, or `project-only-decision`;
- `promotionLayer`: `public-repository`, `private-profile`, or `project-only`.

Also record the previous contract, observed failure, generalized invariant, project-specific instance, implementation location, evidence, and privacy reason. A pre-existing rule that gained a template field, automated audit, clearer exception, or stronger QA is `pre-existing-hardened`, not “new.” A project-specific number or visual choice may reveal a general method without making that number or choice a repository default.

### 简体中文

交付时必须生成 `analysis/learning-scope-ledger.json`，逐条说明本片经验到底属于“原规则再次确认、原规则加固、纠正过度泛化、新增通用规则、新增私人偏好，还是仅本片决定”，并另行标明它进入公共仓库、私人画像还是单片工程。

每条都要写清修改前的规则、这次暴露的问题、抽象后的通用不变量、本片的具体实例、真正落地的文件、验证证据和隐私边界。以前已经存在但这次增加模板字段、自动审计、例外条件或更严格 QA 的规则，要标成“加固”，不能说成这次才第一次拥有。

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
