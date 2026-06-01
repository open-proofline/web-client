# Codex Prompt: Security Review

Review frontend security posture.

Do **not** add features. Do **not** include sensitive vulnerability details in
public docs or issue drafts.

## Review Focus

- XSS risk and unsafe rendering
- browser token handling and local storage
- session clearing on logout
- API error handling that avoids leaking secrets
- dependency and build-tool risk
- CSP and security-header deployment expectations
- route assumptions that might expose private `/v1` or admin routes
- public UI wording around emergency reliance
- no logging of raw tokens, Authorization headers, request bodies, plaintext,
  raw keys, wrapped-key ciphertext, private deployment details, or user safety
  data
- no browser decryption, key unwrapping, key escrow, recording, playable export,
  or emergency dispatch added incidentally
- Catalyst licensing and redistribution boundaries

## Sensitive Finding Handling

If a likely vulnerability should not be public, do not write exploit details in
public issue drafts. Recommend following `SECURITY.md`.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run `npm run test:e2e` when browser flows changed.
