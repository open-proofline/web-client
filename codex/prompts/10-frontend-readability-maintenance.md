# Codex Prompt: Frontend Readability Maintenance

Improve frontend readability without changing product scope.

## Focus

- simple React component structure
- clear TanStack route definitions
- clear API client boundaries
- Zod schemas close to API response shapes
- stable TanStack Query key naming
- accessible form labels, validation, and disabled states
- explicit loading, error, and empty states
- no clever abstractions before they are needed
- no secret logging, including raw tokens, browser session cookies, CSRF tokens,
  Authorization headers, request bodies, verification credentials, paths,
  object keys, plaintext, raw keys, wrapped-key ciphertext, private deployment
  details, or user safety data
- no browser decryption, key unwrapping, or key-handling changes
- no production-readiness claims

## Constraints

Do not add recording, browser decryption, backend decryption, key escrow,
break-glass access, playable export, emergency dispatch, OAuth, JWT, push/SMS/
Messenger notifications, public admin dashboards, mobile client code, or
protocol behavior.

Preserve Catalyst licensing notes and do not turn Catalyst components into a
standalone UI kit.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

Run Playwright only when route/browser flows change:

```bash
npm run test:e2e
```
