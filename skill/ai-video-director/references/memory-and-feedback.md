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
