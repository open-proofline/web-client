# Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Validation for documentation or reusable-prompt-only changes:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

Validation for frontend source, route, browser-flow, auth, API-client, or
behavior changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

Playwright uses the built Vite preview server and mock mode by default, so it
does not require a live backend for the bootstrap smoke test.

## Environment

```text
VITE_PROOFLINE_API_BASE_URL=http://127.0.0.1:8080
VITE_PROOFLINE_API_MODE=mock
VITE_PROOFLINE_AUTH_MODE=bearer
VITE_PROOFLINE_SESSION_STORAGE=memory
```

Use `VITE_PROOFLINE_API_MODE=live` only when a local backend is running and the
route assumptions have been checked against `open-proofline/server/docs/api.md`.
The default live auth mode is bearer-token auth. For local browser-cookie auth
testing, use `VITE_PROOFLINE_AUTH_MODE=cookie` only with a backend configured
for reviewed local origins, for example `SAFE_WEB_AUTH_ENABLED=true`,
`SAFE_WEB_ALLOWED_ORIGINS=http://127.0.0.1:5173`, a non-`__Host-` local cookie
name, and `SAFE_WEB_SESSION_COOKIE_SECURE=false`. Production cookie mode still
requires HTTPS, exact allowed origins, secure cookies, CSRF review, and public
API deployment review in `open-proofline/server`.
