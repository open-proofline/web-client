# Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Validation:

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
VITE_PROOFLINE_SESSION_STORAGE=memory
```

Use `VITE_PROOFLINE_API_MODE=live` only when a local backend is running and the
route assumptions have been checked against `open-proofline/server/docs/api.md`.
