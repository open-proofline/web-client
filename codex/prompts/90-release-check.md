# Codex Prompt: Release Check

Review the repo before tagging or publishing a release.

Do **not** add features or broad refactors.

## Inputs

Target release/version: `<TARGET_RELEASE_OR_VERSION>`

Target final base branch: `<TARGET_FINAL_BASE_BRANCH>`

## Checks

- working tree status and branch
- README, AGENTS, SECURITY, CHANGELOG, LICENSE
- docs accuracy and links
- API route assumptions against `open-proofline/server`
- no production-readiness claims
- no recording, browser decryption, key escrow, playable export, emergency
  dispatch, OAuth, JWT, public admin dashboard, mobile code, or protocol
  behavior added accidentally
- no raw secrets/tokens, `.env`, ZIPs, Playwright reports, `dist`, or
  `node_modules` committed
- Catalyst license notes retained
- CI workflow is current

## Validation

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```
