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
VITE_PROOFLINE_AUTH_MODE=bearer
VITE_PROOFLINE_API_BASE_URL=http://127.0.0.1:8080
```

For reviewed local browser-cookie auth testing, also set:

```text
VITE_PROOFLINE_AUTH_MODE=cookie
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

## Product Scope

Proofline Web Client is the experimental React account portal and incident-review client for Proofline.

The intended product model is a publicly hosted Proofline service where users
can create paid accounts once the backend, deployment, billing, abuse controls,
and operational hardening are ready. The server now documents public
self-registration modes, but registration is backend-configured and disabled by
default. Open self-registration requires reviewed server configuration and email
verification before login; paid registration remains a fail-closed placeholder,
not billing.

The web client is responsible for the user-facing account portal, authenticated incident review, and future trusted-contact access flows. It is not the recording client, mobile app, backend, or protocol repository.

## Current Scope

The current bootstrap includes:

- login/logout prototype flow
- public registration form flow against the server registration contract
- browser email-verification route that clears verification URL fragments
- authenticated app shell
- conservative session state with memory-first token storage
- optional local-storage session persistence for local development only
- explicit bearer-token and browser-cookie auth client modes
- incident list UI backed by mock data in prototype mode and authenticated
  owner-scoped `GET /v1/incidents` responses in live mode
- incident detail metadata UI
- stream and chunk metadata review
- contact public-key metadata views
- sharing-grant metadata views
- wrapped-key metadata views
- safe loading, empty, and error states
- visible prototype and emergency-reliance warnings
- frontend CI for typecheck, lint, unit tests, build, and Playwright smoke tests

## Planned Account Portal Scope

Planned account portal work includes:

- public landing and pricing/account-entry pages
- payment-gated account creation
- login/logout
- account profile page
- password change flow
- session status and session revocation flows
- account billing status display
- subscription/payment status handling
- clear account-disabled, payment-required, expired-session, unauthorized, and forbidden states
- browser-safe API error handling
- browser token-storage review and hardening
- deployment review for browser-cookie auth, credentialed CORS, and exact
  reviewed origins

Payment-gated registration must be implemented as a backend-supported account
lifecycle, not just a frontend form. The current server paid-registration mode
returns a fail-closed placeholder error and does not create checkout sessions,
subscriptions, active accounts, or billing webhooks. The web client may present
billing UI only after the backend provides reviewed routes and state transitions
for payment confirmation, subscription status, and disabled/unpaid account
behavior.

## Planned Incident Review Scope

Planned authenticated incident-review work includes:

- live owned-incident listing in the client against the current server route
- incident detail review
- stream and chunk metadata review
- viewer-token creation and revocation UI
- encrypted bundle download affordances with clear warnings
- deletion request/status UI for account-owned incidents, if backend support is available
- mode, capture-profile, escalation-policy, sharing-state, deletion-state, and retention metadata display
- safe empty/error/loading states for all incident views

The web client must not expose private admin/operator behavior or route `/v1/admin/...` functionality from a public edge.

## Planned Sharing And Contact Scope

Planned sharing/contact work includes:

- contact public-key registration and management
- contact public-key state display
- sharing-grant creation and revocation
- incident-scoped and stream-scoped grant management
- wrapped-key metadata review and delivery status
- clear warnings that wrapped-key metadata is access-enabling metadata
- trusted-contact access design, once separately scoped and threat-modeled

Sharing metadata support does not imply browser decryption, trusted-contact decryption, raw key access, key escrow, or playable export.

## Future Trusted-Contact Scope

Future trusted-contact work may include:

- trusted-contact account access
- trusted-contact incident access views
- grant-aware incident metadata review
- wrapped-key metadata delivery to authorized trusted contacts
- careful UX for emergency and non-emergency access states

Trusted-contact flows must be designed and reviewed before implementation. They must not imply emergency-services integration or guaranteed emergency response.

## Future Browser Recording Scope

This repository does not currently implement recording or capture behavior.

A future browser-based recording prototype may be added as a separately scoped feature for desktop/browser use cases. Possible capture modes may include:

- microphone-only recording
- camera and microphone recording
- screen, window, or tab recording
- screen capture with microphone audio

Browser recording must be treated as experimental. It must not be presented as a replacement for native iOS or Android recording clients, and it must not be described as reliable emergency capture.

Before implementation, browser recording must be separately designed, documented, threat-modeled, and tested. The design must cover:

- browser permission prompts and explicit user consent
- browser and operating-system compatibility limits
- screen, camera, microphone, and system-audio support differences
- tab close, browser crash, sleep, permission loss, and background reliability limits
- local encrypted staging before upload
- chunking behavior
- upload retry and idempotency behavior
- user-visible recording state
- safe failure states
- privacy and safety wording
- browser token-storage and XSS implications

If implemented, browser recording must preserve these boundaries:

- no backend decryption
- no browser decryption unless separately scoped
- no raw server-held media keys
- no key escrow
- no break-glass access
- no playable media export unless separately scoped
- no emergency-services integration
- no claim of production readiness or emergency reliability

Browser recording is intended for possible desktop/browser interaction records, meetings, calls, evidence notes, or other non-mobile capture contexts. Native platform clients remain the intended direction for safety-critical mobile recording and stronger lifecycle reliability.

## Explicit Non-Goals

This repository must not implement:

- production mobile-client behavior
- browser decryption
- backend decryption
- trusted-contact decryption
- raw media-key handling
- raw server-held keys
- key escrow
- break-glass key access
- playable media export
- emergency dispatch
- push, SMS, or Messenger notifications
- OAuth or JWT unless explicitly scoped later
- public admin dashboards
- backend implementation
- protocol repository behavior
- production safety workflows

Users and trusted contacts remain responsible for contacting emergency services.

## Public Deployment Boundary

The web client may be designed for a future public Proofline service, but this repository must not claim production readiness.

Public deployment requires separate backend and infrastructure work, including:

- TLS and edge hardening
- public API exposure review
- admin/operator route exclusion from public edges
- payment-gated account creation
- abuse controls and rate limiting
- browser credential-storage review
- credentialed CORS and CSRF review for any browser-cookie auth mode
- CSP/XSS and browser security-header review
- logging and error-redaction review
- backup/restore and deletion/retention operational review
- monitoring and incident response planning

Until those requirements are implemented and reviewed, the web client remains an experimental prototype.

Static hosting header guidance is documented in
[Browser Security Headers](docs/browser-security-headers.md), but those headers
do not imply production readiness or public `/v1` API readiness.

## API Boundary

The server currently confirms bearer session auth, browser-cookie auth routes,
`POST /v1/auth/register`, `POST /v1/auth/email/verify`, `GET /v1/account`,
owner-scoped incident list/detail routes, contact public-key routes,
sharing-grant routes, and wrapped-key routes. Current `open-proofline/server`
documents authenticated
`GET /v1/incidents`, and this client parses that response shape in live mode.
Mock mode uses prototype incident records only and must not be treated as
backend truth.

Public registration is controlled by the server's
`SAFE_ACCOUNT_REGISTRATION_MODE`. `disabled` and `admin_only` reject public
registration with `registration_disabled`; `open` creates a
`pending_email_verification` account and sends a verification link before login
is allowed; `paid` returns `registration_payment_unavailable` and does not
perform billing or create an active account. Registration and email verification
do not create browser sessions.

Email verification links carry a raw verification token in the URL fragment.
The web client reads that secret-bearing fragment, submits the token in the
verification request body, and clears the fragment from the address bar. Raw
verification tokens must not be logged, persisted, screenshotted, copied into
issue drafts, or sent to analytics.

The client must not log session tokens, Authorization headers, request bodies,
uploaded bytes, plaintext, raw keys, raw media keys, contact private keys,
wrapped-key ciphertext, verification credentials, object keys, stored paths,
private deployment details, or user safety data.

## Session Storage

Bearer session tokens are kept in memory by default. A local-storage adapter
exists for developer convenience only behind
`VITE_PROOFLINE_SESSION_STORAGE=localStorage`. Browser token persistence must
be reviewed before any production use. Cookie-mode sessions do not store bearer
tokens; the browser session cookie is HttpOnly and managed by the server.

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
