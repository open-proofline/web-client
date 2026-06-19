# AGENTS.md

## Project Rules

- This repository is `open-proofline/web-client`.
- This is the Proofline web client only. The current backend source of truth is
  `open-proofline/server`.
- The project-level public governance, political alignment, public voice, and
  reusable README baseline source of truth is `open-proofline/website`.
- Do not implement backend features here.
- Do not add browser decryption unless explicitly scoped and threat-modeled.
- Do not add recording or capture behavior here.
- Do not add key escrow, raw key storage, backend decryption, browser
  decryption, break-glass access, or playable export incidentally.
- Do not add OAuth, JWT, push notifications, SMS, Messenger notifications,
  emergency dispatch, public admin dashboards, mobile client code, or protocol
  repository behavior unless explicitly requested.
- Do not log raw tokens, browser session cookies, CSRF tokens, Authorization
  headers, request bodies, uploaded bytes, plaintext, raw keys, raw media keys,
  contact private keys, wrapped-key ciphertext, verification credentials,
  stored paths, object keys, private deployment details, or user safety data.
- Keep public UI wording clear that the app is experimental and not for
  emergency reliance.
- Users or trusted contacts remain responsible for contacting emergency
  services.
- Use small, scoped, reviewable PRs.
- Preserve Tailwind Catalyst licensing boundaries. Catalyst-derived components
  may be used inside this app, but must not be turned into a standalone UI kit,
  starter, package, or redistributed design asset set.

## Current Shape

- Vite React TypeScript app.
- TanStack Router owns route definitions under `src/routes/`.
- TanStack Query owns server state.
- Zod schemas live near the API client under `src/api/`.
- Auth/session code lives under `src/auth/`.
- App-specific components live under `src/components/proofline/`.
- Catalyst component source files live under `src/components/catalyst/`.

## Commands

For documentation or reusable-prompt-only changes:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

For frontend source, route, browser-flow, auth, API-client, or behavior changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

Run Playwright when route or browser flows change. Do not claim validation
passed unless the command actually ran.

## Review Expectations

Check that changes remain frontend-only, do not overpromise production status,
do not introduce browser decryption or key unwrapping, keep token persistence
explicit and reviewable, preserve accessible loading/error/empty states, and
keep server facts tied back to `open-proofline/server`.

When changes touch README structure, public voice, governance,
cooperative/public-good framing, political alignment, funding posture, or
source-of-truth mapping, check the current `open-proofline/website` README,
`docs/governance-and-political-alignment.md`, and
`docs/repository-readme-baseline.md` instead of rewriting those project-level
claims here.
