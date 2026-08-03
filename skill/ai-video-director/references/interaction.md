# User Interaction

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

## Do Not Ask Twice

- Do not ask the user to install dependencies, run doctor commands, initialize folders, convert timelines, or invoke render scripts. Those are Agent-owned operations.
- Ask for user action only when login, system permission, payment, identity consent, or media rights genuinely require it.
- Do not reconfirm information already explicit in the user input.
- Ask only when the choice changes meaning, rights, cost, identity, or substantial compute.
- For nonblocking details, select the safest default and record the assumption.
- When the user approves a durable preference, record it in project feedback; ask separately before making it a global default.

## Progress

Report the current stage, produced artifact, next gate, and blockers. Keep tool names visually distinct from stage names in diagrams and documents. A stage is an action; a tool is the means; an artifact is the result.
