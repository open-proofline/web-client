# Proofline Web Client

<p align="center">
  <a href="https://github.com/open-proofline/web-client/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/open-proofline/web-client/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="LICENSE"><img alt="License: AGPL-3.0-only" src="https://img.shields.io/badge/license-AGPL--3.0--only-blue.svg" /></a>
  <a href="#current-status"><img alt="Status: Experimental" src="https://img.shields.io/badge/status-experimental-orange.svg" /></a>
  <a href="SECURITY.md"><img alt="Security policy" src="https://img.shields.io/badge/security-policy-blue.svg" /></a>
  <a href="https://proofline.live/support/"><img alt="Support Proofline" src="https://img.shields.io/badge/support-%E2%99%A5%20Proofline-d946ef.svg" /></a>
</p>

Proofline is experimental public-interest open-source privacy and evidence
infrastructure. This repository contains the React web client and account portal
prototype for authenticated account flows, incident metadata review, contact and
sharing metadata, wrapped-key metadata review, and conservative browser session
handling.

Proofline is not an emergency service, emergency dispatch system,
emergency-services integration, staffed response center, or guaranteed
real-time response system. Users and trusted contacts remain responsible for
contacting emergency services.

## Current Status

This repository is experimental and maintainer-led. It is not production-ready
emergency infrastructure, a production account portal, or production public API
deployment approval.

Current web-client status:

- Vite, React, and TypeScript
- TanStack Router route definitions under `src/routes/`
- TanStack Query for server state
- Zod schemas near the API client under `src/api/`
- auth/session code under `src/auth/`
- app-specific components under `src/components/proofline/`
- Tailwind CSS with Catalyst component source used inside this app
- prototype mock mode by default
- live mode for reviewed local backend testing
- explicit bearer-token and browser-cookie auth client modes
- frontend CI for dependency audit, typecheck, lint, unit tests, build, and
  Playwright smoke tests

## What This Repository Is

`open-proofline/web-client` is the frontend account and incident-review
prototype for Proofline.

It currently includes:

- login/logout prototype flow
- public registration form flow against the current server registration
  contract
- browser email-verification route that reads a URL fragment token and clears it
  from the address bar
- authenticated app shell
- account profile and password-change UI
- memory-first bearer session state, with optional local-storage persistence
  for local development only
- explicit browser-cookie auth mode with in-memory CSRF token handling
- incident list UI backed by prototype mock data in mock mode and authenticated
  owner-scoped `GET /v1/incidents` responses in live mode
- incident detail, stream, chunk, contact public-key, sharing-grant, and
  wrapped-key metadata review
- owner incident deletion status and request UI
- wrapped-key delivery revocation UI for account-owned records
- safe loading, empty, and error states
- visible experimental and emergency-reliance warnings

Current screens still expose some technical metadata. Future user-facing work
should follow [End-User Web Client Design](docs/end-user-web-client-design.md):
lead with human status, next actions, access state, and safety boundaries, and
move technical details behind advanced or developer-focused disclosure.

## What This Repository Is Not

This repository is not:

- the Go backend
- the static public website
- an iOS or Android app
- a protocol implementation
- a production recording client
- an emergency service, emergency dispatch system, or staffed response center
- a notification delivery system
- a decryption service
- key escrow
- a hosted-account billing system
- a public admin/operator surface
- production public `/v1` deployment approval
- a standalone Catalyst, Tailwind, or UI component kit

Do not add backend behavior, API behavior changes, recording/capture,
notification delivery, hosted-account billing, payment-gated access, browser or
backend decryption, trusted-contact decryption, raw key storage, key escrow,
playable export, public admin/operator surfaces, mobile-client behavior, or
protocol behavior here unless the maintainer explicitly changes the repository
strategy.

## Source-Of-Truth Map

Use the right source for the claim:

| Topic                                                                                           | Read                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web-client behavior, prototype limits, local development, and validation                        | This repository: `README.md`, `AGENTS.md`, `SECURITY.md`, and [docs/](docs/README.md)                                                                                        |
| End-user web-client product direction                                                           | [docs/end-user-web-client-design.md](docs/end-user-web-client-design.md)                                                                                                     |
| API client behavior and route assumptions                                                       | [docs/api-client.md](docs/api-client.md), then verify backend facts against `open-proofline/server`                                                                          |
| Backend behavior, deployment, API, auth, registration, billing placeholders, and security facts | [`open-proofline/server`](https://github.com/open-proofline/server)                                                                                                          |
| Public web-client deployment boundary                                                           | [`open-proofline/server/docs/public-web-client-deployment-boundary.md`](https://github.com/open-proofline/server/blob/develop/docs/public-web-client-deployment-boundary.md) |
| Project public website and public framing                                                       | [`open-proofline/website`](https://github.com/open-proofline/website)                                                                                                        |
| Governance, political alignment, and public-good posture                                        | [`open-proofline/website/docs/governance-and-political-alignment.md`](https://github.com/open-proofline/website/blob/main/docs/governance-and-political-alignment.md)        |
| Reusable Proofline README structure and public voice                                            | [`open-proofline/website/docs/repository-readme-baseline.md`](https://github.com/open-proofline/website/blob/main/docs/repository-readme-baseline.md)                        |
| Organization-level overview                                                                     | [`open-proofline/.github`](https://github.com/open-proofline/.github)                                                                                                        |

Keep repository-specific facts in the repository that owns them. Keep
project-wide governance posture in the website repository.

## Current, Prototype, Planned, And Not Implemented

| Category                         | Web-client boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current in this repo             | Login/logout, registration form, email verification route, account overview, account password change, incident list/detail metadata review, contact public-key metadata management, sharing-grant metadata management, wrapped-key metadata review and revocation, owner deletion request UI, mock mode, bearer and cookie auth client modes.                                                                                                                                    |
| Prototype/mock only              | Sample account and incident records for local testing. Mock mode does not create accounts, send email, verify real tokens, model billing, prove server behavior, or approve public deployment.                                                                                                                                                                                                                                                                                   |
| Server-supported facts to verify | Current `open-proofline/server` docs cover local account sessions, configurable registration, email verification, browser-cookie auth and CSRF when enabled, account second-factor setup and per-session verification routes, owner-scoped incident list/detail routes, contact public-key metadata, owner-scoped sharing grants, wrapped-key metadata, viewer-token create/revoke routes, encrypted bundle downloads, and public deployment review boundaries.                  |
| Planned or design-only           | End-user language cleanup, account second-factor setup UX, invite/accept trusted-contact flows, automatic client-managed contact key creation, durable viewer-link management, web-client no-account viewer, browser capture fallback, payment-backed hosted account lifecycle, notification delivery, and trusted-contact account access.                                                                                                                                       |
| Not implemented and not implied  | Production readiness, emergency dispatch, emergency-services integration, guaranteed response, staffed response center, production browser recording, production mobile capture, trusted-contact notifications, live context sharing, backend decryption, browser decryption, trusted-contact decryption, raw server-held media keys, key escrow, hosted-account billing as live behavior, public production admin/operator surfaces, legal admissibility, or legal reliability. |

## API And Session Boundary

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

Bearer session tokens are kept in memory by default. The optional
`VITE_PROOFLINE_SESSION_STORAGE=localStorage` adapter is for local development
only and must not be treated as production browser credential storage.

Cookie-mode sessions do not store bearer tokens in the web client; the browser
session cookie is HttpOnly and managed by the server. Cookie mode sends
`credentials: "include"` only for cookie-authenticated requests and attaches the
server-provided CSRF header to unsafe requests. Bearer and cookie credentials
must not be mixed.

Public registration is controlled by `open-proofline/server`, not this
frontend. `disabled` and `admin_only` reject public registration, `open` creates
a pending email-verification account, and `paid` remains a fail-closed
placeholder that does not create checkout sessions, subscriptions, active
accounts, or billing webhooks.

Email verification links carry a raw verification token in the URL fragment.
The web client submits that token in the verification request body and clears
the fragment. Raw verification tokens must not be logged, persisted,
screenshotted, copied into issue drafts, or sent to analytics.

## Public Deployment Boundary

A static web client is not production-ready just because it can be hosted.
Public deployment requires reviewed backend and infrastructure work, including
route exposure, credentialed CORS, CSRF, cookie settings, cache policy, TLS,
edge abuse controls, logging redaction, and private-admin route exclusion.

The current public web-client deployment boundary is documented in
[`open-proofline/server/docs/public-web-client-deployment-boundary.md`](https://github.com/open-proofline/server/blob/develop/docs/public-web-client-deployment-boundary.md).
Static-host browser header guidance in
[Browser Security Headers](docs/browser-security-headers.md) is a
deployment-review starting point, not production approval or broad public `/v1`
approval.

## Catalyst And Tailwind

Catalyst-derived component source files are used as part of this application.
They must not be extracted, packaged, published, or redistributed as a
standalone UI kit, template, starter, package, or design asset set.

The copied Catalyst files remain governed by the Tailwind Plus License preserved
in `src/components/catalyst/LICENSE.md`.

## Security Reporting

Do not report security vulnerabilities through public GitHub issues. Use GitHub
private vulnerability reporting where available, and follow
[SECURITY.md](SECURITY.md).

Do not publish real secrets, raw session tokens, browser session cookies, CSRF
tokens, raw viewer tokens, token-bearing viewer links, Authorization headers,
request bodies, uploaded bytes, plaintext, raw keys, raw media keys, contact
private keys, wrapped-key ciphertext, verification credentials, stored paths,
object keys, private deployment details, exploit details, or user safety data.

Backend security issues may belong in
[`open-proofline/server`](https://github.com/open-proofline/server). Public
website framing or governance issues may belong in
[`open-proofline/website`](https://github.com/open-proofline/website).

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run the full frontend validation stack:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

For documentation and reusable-prompt-only changes, use the lighter validation
from the Codex docs workflows:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

Run Playwright when route, browser flow, auth, UI behavior, or visible page
copy changes. Do not claim validation passed unless the command actually ran.

## Governance And Public-Good Posture

Proofline is intended to grow as public-good open-source infrastructure. The
planned long-term direction is a non-distributing cooperative or similar
mission-locked structure aligned with cooperative and libertarian socialist
principles. Pay should be for defined labour, not ownership extraction.

Read the canonical project posture in
[`open-proofline/website/docs/governance-and-political-alignment.md`](https://github.com/open-proofline/website/blob/main/docs/governance-and-political-alignment.md).

The reusable Proofline README baseline and public voice guidance live in
[`open-proofline/website/docs/repository-readme-baseline.md`](https://github.com/open-proofline/website/blob/main/docs/repository-readme-baseline.md).

Donations and contributions do not create accounts, unlock features, provide
support priority, or provide emergency assistance.

## License

Proofline Web Client is licensed under the
[GNU Affero General Public License v3.0 only](LICENSE).
