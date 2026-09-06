# User Interaction

For a new content lock or director plan, also read [first-approval-and-style-gates.md](first-approval-and-style-gates.md).

## Keep Gates Small

At a decision point, present one compact card rather than a long essay:

- `Current stage`: where the project is.
- `What I understood`: the proposed result.
- `Recommended`: the default and one-sentence reason.
- `Alternatives`: no more than two, each with a concrete tradeoff.
- `Cost/rights`: free/local/account/credits/license uncertainty.
- `After approval`: what will be produced next.
- `Return point`: what must be rebuilt if this changes later.

Use visual choices for style: three representative stills plus one motion sample. Label them by meaningful differences such as evidence-led, editorial, or structured-data, not vague A/B/C names alone.

The first director response is a human approval card, not the machine record. Never paste `director-plan.json` or other raw JSON by default. Match the user's language; a Chinese request receives Chinese headings, explanations, choices, and next steps.

Do not lock an unreferenced fine-edit style inside the first director plan. Lock content, rough-cut intent, evidence needs, and risks first. After rough-cut timing is approved, validate the style with an audiovisual sample that includes dialogue, captions, the selected evidence treatment, presenter treatment when used, and the proposed BGM/SFX state. Evidence treatment may be still, recording, or hybrid. A silent three-second montage may illustrate motion mechanics, but it cannot approve the finished audiovisual direction.

## Chapter Progress Approval

- Include the proposed chapter label, order, and one-sentence semantic scope in the director plan before style preview. Approval of that plan is the normal semantic-label gate; do not create a second blocking question unless a label is ambiguous, high-stakes, or materially changes the user's meaning.
- Compute exact duration-proportional boundaries only after rough-cut timing is approved. Show the locked labels and representative early/middle/late states in the progress-strip motion sample before full fine edit.
- A wording-only label change is cheap and should not force a recut. A structural speech edit invalidates the affected boundaries and requires recomputation plus boundary-frame proof.
- When a private style profile already locks a progress component, reuse its visual treatment exactly and ask only about new semantic labels or an explicit style change.

## Signature Outro Approval

- Detect a recurring spoken sign-off during content lock and name it as a signature-outro candidate rather than treating it as an ordinary last subtitle.
- Before the first reusable lock, show one representative still and one short motion sample using owned identity assets when available. State the entrance cue, gesture or motion, text treatment, hold, sound decision, collision-safe placement, and reuse scope.
- Promotion to the private base profile requires explicit approval. After approval, reuse the same component for videos using that style profile; adapt only speech synchronization, aspect-ratio-safe placement, and documented collision handling.

## Do Not Ask Twice

- Do not ask the user to install dependencies, run doctor commands, initialize folders, convert timelines, or invoke render scripts. Those are Agent-owned operations.
- Ask for user action only when login, system permission, payment, identity consent, or media rights genuinely require it.
- Do not reconfirm information already explicit in the user input.
- Ask only when the choice changes meaning, rights, cost, identity, or substantial compute.
- For nonblocking details, select the safest default and record the assumption.
- When the user explicitly approves durable scope, record and apply that scope; ask about broader scope only when it was not already approved.

## Progress

Report the current stage, produced artifact, next gate, and blockers. Keep tool names visually distinct from stage names in diagrams and documents. A stage is an action; a tool is the means; an artifact is the result.

## Four Normal Decisions / 四个常规确认

Use content, rough cut, complete audiovisual style, and exact final master as the four normal user gates. Approve captions, BGM/SFX, presenter and progress together in the style sample; ask separately only for a new material decision outside that approval. Existing explicit authorization persists. Reusable preference approval does not need a second identical confirmation.

常规只确认内容、粗剪、整体视听样片、精确成片。字幕、音乐、人物和进度条随样片一起确认，只有超出原批准的新实质决定才单独询问；明确要求长期采用的偏好不再重复确认同一决定。
