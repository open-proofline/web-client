# Codex Prompt: Code Review

Review current changes for correctness, maintainability, security, and scope.

Do **not** add features unless needed to fix a bug.

## Review Focus

- route behavior and redirects
- TanStack Query keys and cache boundaries
- API client route assumptions against `open-proofline/server`
- Zod schema correctness
- auth/session token handling
- local-storage use and warnings
- accessible forms and states
- no raw token, browser session cookie, CSRF token, Authorization header,
  request body, uploaded byte, plaintext, raw key, raw media key, contact
  private key, wrapped-key ciphertext, verification credential, stored path,
  object key, private deployment detail, or user safety data logging
- no browser decryption or key unwrapping
- no recording/capture behavior
- no production-readiness claims
- Catalyst files remain app-internal and license notes remain present
- tests cover changed behavior

## Output

List findings first, ordered by severity, with file/line references when
possible. Then include open questions, a short summary, and validation gaps.

If fixing issues, keep changes minimal and run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```
