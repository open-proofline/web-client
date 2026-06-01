# Proofline Web Client

> This is an experimental Proofline web client prototype. It does not implement recording, browser decryption, trusted-contact decryption, key escrow, playable media export, emergency dispatch, or production safety workflows.
>
> Users or trusted contacts remain responsible for contacting emergency services.

Proofline Web Client is the experimental React account and incident-review client
for the planned `open-proofline/web-client` repository. It is a frontend-only
prototype for authenticated account/session state, owned incident metadata,
incident detail review, stream/chunk metadata, contact public-key metadata,
sharing-grant metadata, and wrapped-key metadata.

The current backend source of truth remains
[`open-proofline/server`](https://github.com/open-proofline/server). This repo
must not make independent claims about backend behavior when the server docs
disagree or have moved.

## Stack

- Vite, React, and TypeScript
- TanStack Router
- TanStack Query
- Zod
- Tailwind CSS with the Vite Tailwind plugin
- Tailwind Catalyst component sources used inside this app
- Vitest, Testing Library, MSW, and Playwright

## Setup

```bash
npm install
cp .env.example .env
```

By default the app runs in prototype mock mode:

```text
VITE_PROOFLINE_API_MODE=mock
```

Use live mode only against a reviewed local backend:

```text
VITE_PROOFLINE_API_MODE=live
VITE_PROOFLINE_API_BASE_URL=http://127.0.0.1:8080
```

## Development

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Formatting:

```bash
npm run format
npm run format:check
```

## Current Scope

This bootstrap includes:

- login/logout prototype flow
- authenticated app shell
- conservative session state with memory-first token storage
- incident list UI backed by mock data until the backend list route is confirmed
- incident detail metadata UI
- contact public-key, sharing-grant, and wrapped-key metadata views
- safe loading, empty, and error states
- frontend CI for typecheck, lint, unit tests, build, and Playwright smoke test

## Non-Goals

This repository must not implement recording, browser decryption, backend
decryption, trusted-contact decryption, key escrow, break-glass key access, raw
server-held media keys, playable media export, emergency dispatch, push/SMS/
Messenger notifications, OAuth, JWT, public admin dashboards, mobile client
code, protocol repository behavior, or production safety workflows.

## API Boundary

The server currently confirms bearer session auth, `POST /v1/auth/login`,
`POST /v1/auth/logout`, `GET /v1/account`, incident read-by-ID, contact
public-key routes, sharing-grant routes, and wrapped-key routes. The frontend
API client keeps a typed shape for owned incident listing, but current server
docs do not confirm `GET /v1/incidents`; live mode marks that route as needing
confirmation.

The client must not log session tokens, Authorization headers, request bodies,
uploaded bytes, plaintext, raw keys, raw media keys, contact private keys,
wrapped-key ciphertext, object keys, stored paths, private deployment details,
or user safety data.

## Session Storage

Session tokens are kept in memory by default. A local-storage adapter exists for
developer convenience only behind `VITE_PROOFLINE_SESSION_STORAGE=localStorage`.
Browser token persistence must be reviewed before any production use.

## Catalyst And Tailwind

Catalyst-derived component source files are used as part of this application,
not redistributed as a standalone UI kit, template, starter, package, or design
asset set. The copied Catalyst files remain governed by the Tailwind Plus
License preserved in `src/components/catalyst/LICENSE.md`.

## Security Status

This repo is not production-ready. It has no production account portal, no
public API hardening, no browser decryption design, no recording client, and no
emergency-services integration. Treat the server docs and security model as the
source of truth for current backend behavior.
