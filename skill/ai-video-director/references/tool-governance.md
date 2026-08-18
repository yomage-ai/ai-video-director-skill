# Tool Governance

No tool is “free and safe to commercialize” merely because its page is accessible without payment. Evaluate software, model weights, hosted service terms, generated output, input rights, fonts, music, effects, privacy, and redistribution separately.

## Required Card

Copy `assets/templates/tool-governance-card.template.json` before adopting or upgrading a dependency. Record:

- Exact identity, version/revision, official source, and workflow role.
- Software and model licenses, commercial-use conditions, and redistribution obligations.
- API, credits, storage, compute, maintenance, and account cost.
- Network, key, region, organization-size, and hardware requirements.
- Whether user media or biometric data leaves the device; retention and consent.
- Reproducibility, maturity, known failures, vendor lock-in, and tested scope.
- Evidence artifacts and a precise allowed/blocked role.
- Recheck triggers such as version, license, pricing, policy, or platform changes.

## Decision Labels

- `P1`: active default or approved optional path in its tested scope.
- `P2`: useful experiment, blocked by access, missing validation, or unclear terms.
- `P3`: paused research, not part of production.
- `excluded`: explicitly prohibited.

Never turn one clip's benchmark into a universal winner. State the tested hardware, source, versions, and component being compared.

## Asset Rights

- Owned material is preferred, but record identity/consent when it contains another person.
- Pinterest is discovery and mood reference only. A pin is not a commercial license.
- For stock, fonts, music, sound effects, or code animation libraries, save the item URL, author, license/terms URL, retrieval date, required attribution, and permitted use.
- Do not treat “trending” audio from an editing app as reusable outside that app or for commercial publication without checking the exact item terms.
- Keep proof with the project rights manifest. Recheck terms before public/commercial export.

The repository-authored Skill code, documentation, scripts, and templates are licensed under Apache-2.0. That license does not relicense any third-party runtime, model, font, hosted service, or user media. Do not bundle or redistribute those dependencies until their exact license and notice obligations are reviewed and satisfied.
