# Authorized Voice Clone

## Approved Scope

The current optional capability is local Qwen3-TTS 0.6B Base through MLX-Audio on Apple Silicon, pinned to the governance record and default `seed 42`.

It is approved only for:

- A voice owned by the user or explicitly authorized in writing.
- A short Chinese sample comparable to the tested scope.
- Local generation with the pinned model/runtime.
- Output that receives exact-text ASR comparison and complete human listening.

It is not approved as an unattended long-form narrator, an emotional-performance guarantee, or an impersonation route. A new speaker, model, runtime, long script, or public/commercial policy change reopens the decision.

## Run

Use `uv` so the pinned script dependencies remain isolated:

```bash
uv run --script scripts/qwen3-voice-clone.py \
  --reference /private/reference.wav \
  --reference-text-file /private/reference.txt \
  --text-file /private/target.txt \
  --output /private/output.wav \
  --metrics /private/output.metrics.json \
  --confirm-authorized-reference
```

The first run downloads model weights. Reference audio, text, output, and metrics stay outside this Git repository.

## Acceptance

- ASR must match the target text exactly after punctuation normalization, or the difference must be reviewed and approved.
- Listen for substitutions, repeated syllable onsets, swallowed words, timing oddities, timbre drift, clipping, and unnatural emotion.
- Record seed, revision, runtime, source authorization, duration, generation time, hash, and reviewer decision.
- Never describe deterministic seed reproduction as proof of linguistic or expressive correctness.
