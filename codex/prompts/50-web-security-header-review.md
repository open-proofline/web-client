# Codex Prompt: Web Security Header Review

Review browser-facing security header posture for the frontend deployment.

Do **not** add browser decryption, recording, OAuth, JWT, emergency dispatch, or
unrelated features.

## Review Focus

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`
- clickjacking protection
- cache behavior for authenticated pages
- whether headers belong in the app host, CDN, or reverse proxy

## Guidance

For production HTTPS, prefer a strict CSP, `nosniff`, no referrer leakage, no
camera/microphone/geolocation permission grants by default, and no-store for
authenticated pages. Do not enable HSTS for localhost/dev HTTP.

This Vite app does not currently set production response headers by itself.
Document deployment expectations rather than claiming production hardening.

## Validation

Run frontend validation if config or browser behavior changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```
