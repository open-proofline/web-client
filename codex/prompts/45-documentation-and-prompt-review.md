# Codex Prompt: Documentation And Prompt Review

Use very-high reasoning.

Review Proofline Web Client documentation and reusable Codex prompts for
accuracy, consistency, safety, readability, and maintainability. Default mode
is review-only: inspect files and produce a report without editing files.

Use edit mode only when the maintainer explicitly requests it. In edit mode,
make small, scoped documentation or prompt edits after producing or following
review findings. Do not rewrite large sections without need. Do not perform
unrelated implementation work, add features, or create public GitHub issues.
Backlog findings should become local draft Markdown only if a backlog
prompt/workflow is explicitly requested.

## Source Files To Inspect

Start with current source-of-truth files:

- `README.md`
- `AGENTS.md`
- `SECURITY.md`
- `CHANGELOG.md`, if present
- `docs/`, if present
- `codex/README.md`
- `codex/prompts/`
- package, config, workflow, environment, and test documentation:
  - `package.json`
  - `package-lock.json`
  - `.env.example`
  - `.github/workflows/`
  - `eslint.config.js`
  - `vite.config.ts`
  - `playwright.config.ts`
  - `tsconfig*.json`
- public metadata and static-asset declarations:
  - `index.html`
  - `public/site.webmanifest`
  - SVG source assets under `public/`
- Catalyst/Tailwind Plus license and provenance files:
  - `src/components/catalyst/README.md`
  - `src/components/catalyst/LICENSE.md`

Use source and test files to verify UI, API-client, route, auth/session, and
documentation claims:

- `src/`
- `src/routes/`
- `src/api/`
- `src/auth/`
- `src/components/`
- relevant tests

Binary static assets under `public/` should be inventoried by filename, type,
and dimensions when practical; do not rewrite or regenerate them during a
documentation/prompt review unless the maintainer explicitly scopes asset work.

For backend behavior, routes, deployment, and server security claims, inspect
the current `open-proofline/server` source documents instead of relying on
web-client assumptions.

Do not rely on stale assumptions from this prompt when current docs or source
code disagree.

## Review Scope

Review:

- all documentation
- all README, AGENTS, and SECURITY files
- available docs directories, if present
- all reusable Codex prompt files
- all public-facing project claims
- source-of-truth alignment
- technical accuracy
- linguistic coherence
- readability and approachability
- missing, stale, or contradictory documentation
- overbroad or stale Codex prompt instructions
- validation instructions and safety/security wording

## Web-Client Boundaries

Preserve these web-client-specific boundaries:

- This repo is the experimental React web client/account portal prototype.
- Do not implement backend features here.
- Do not add recording/capture behavior.
- Do not add browser decryption unless explicitly scoped and threat-modeled.
- Do not add backend decryption, trusted-contact decryption, key escrow, raw
  key storage, break-glass access, playable export, OAuth/JWT, push/SMS/
  Messenger notifications, emergency dispatch, public admin dashboards, mobile
  client behavior, or protocol repository behavior unless explicitly requested.
- Keep public UI wording clear that the app is experimental and not for
  emergency reliance.
- Users and trusted contacts remain responsible for contacting emergency
  services.
- Preserve Tailwind Catalyst/Tailwind Plus licensing boundaries.
  Catalyst-derived components may be app code only and must not become a
  standalone UI kit, template, starter, package, or redistributed design asset
  set.
- Keep implemented behavior, partial/experimental behavior, and planned future
  behavior clearly separated.

## Review Checks

Check source-of-truth consistency:

- Do docs agree with current `README.md`, `AGENTS.md`, `SECURITY.md`, and
  source docs?
- Do backend claims match the current `open-proofline/server` docs?
- Do Codex prompts agree with current repo rules?
- Are public claims supported by implementation or source docs?

Check technical accuracy:

- Are UI, route, API-client, auth/session, storage, security, deployment, and
  validation claims accurate?
- Are planned/future features clearly separated from implemented behavior?
- Are deprecated or legacy names explained rather than silently mixed?
- Are mock/live API modes, cookie/session planning, CSRF/CORS wording, and
  incident/contact/sharing/wrapped-key metadata boundaries current?

Check documentation completeness:

- Are setup, development, validation, security, package, testing, and
  contribution workflows documented clearly enough?
- Are missing docs or stale sections identified?
- Are important UI states, API contract assumptions, and backend source-of-truth
  dependencies represented?

Check prompt quality:

- Are Codex prompts scoped?
- Do prompts tell Codex to inspect current source-of-truth files?
- Do prompts include allowed edit paths and non-goals where needed?
- Do prompts include current validation commands?
- Do prompts avoid stale assumptions?
- Do prompts avoid creating public issues or exposing sensitive material by
  default?
- Do prompts fit the naming and order conventions in `codex/README.md`?

Check readability and approachability:

- Are docs readable to a new contributor or reviewer?
- Are public-facing docs understandable without internal context?
- Are technical docs precise without being needlessly dense?
- Is wording direct, humane, and clear?
- Are acronyms and project-specific terms explained where needed?
- Are there sections that sound like internal notes, legal fog, or startup
  hype?

Check safety and security wording:

- Are emergency-service limitations clear?
- Are production-readiness limitations clear?
- Are reporting instructions safe?
- Are sensitive-data warnings present where needed?
- Are browser session, token persistence, decryption, key custody, recording,
  notification, and Catalyst licensing boundaries accurate?

Check validation and maintenance:

- Are validation commands current?
- Are CI, docs, and check instructions aligned with package reality?
- Are package, lockfile, workflow, and Playwright/Vite/TypeScript config claims
  aligned with the current files?
- Are recurring workflows represented by reusable prompts?
- Are one-off or historical prompts clearly separate from reusable prompts?

## Sensitive-Data Rules

Do not include raw sensitive material in public artifacts. Never include:

- raw tokens
- session tokens
- browser session cookies
- CSRF tokens
- incident/viewer tokens
- Authorization headers
- request bodies
- uploaded bytes
- plaintext
- raw keys
- raw media keys
- contact private keys
- unwrapped secrets
- wrapped-key ciphertext
- verification credentials
- private deployment details
- exploit payloads or proof-of-concept details
- object-store credentials
- stored paths
- object keys
- user safety data

If sensitive material is discovered, describe only the category and affected
file path, not the secret value.

## Review-Only Mode

Review-only mode is the default.

In review-only mode:

- do not modify files
- report findings with file paths and section names
- do not create issues, commits, branches, or pull requests
- do not run full application test suites unless the maintainer requests them
- recommend validation commands instead of claiming they passed

## Edit Mode

Use edit mode only when the maintainer explicitly requests edits.

In edit mode:

- keep edits limited to documentation and Codex prompts unless separately
  scoped
- do not rewrite large sections when targeted edits are enough
- do not perform unrelated implementation work
- do not add features
- preserve all web-client boundaries above
- update validation instructions when workflow reality changes
- summarize what changed after edits

For docs-only edits, run:

```bash
git diff --check
npm run format:check
```

Run `npm run format:check` only if it is available and applicable.

If code changed because the maintainer explicitly scoped that work, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

Do not claim validation passed unless commands actually ran.

## Required Report

Produce a structured report with:

1. Executive summary.
2. Source files inspected.
3. Documentation consistency findings.
4. Technical accuracy findings.
5. Readability and approachability findings.
6. Codex prompt findings.
7. Missing documentation/gaps.
8. Safety/security wording findings.
9. Recommended edits, grouped by priority:
   - High
   - Medium
   - Low
10. Suggested follow-up backlog draft titles, if any.
11. Validation commands recommended or run.
12. Clear statement whether files were changed.

Findings must include file paths and section names. If edit mode is used,
summarize what changed.
