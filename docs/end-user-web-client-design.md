# End-User Web Client Design

This document defines how the Proofline web client should evolve from a
technical prototype into an end-user-friendly application. It is design
guidance only. It does not implement runtime UI changes, routes, backend
behavior, recording, browser decryption, notification delivery, billing,
admin/operator features, or product features.

The current backend source of truth remains `open-proofline/server`. Future
behavior described here must stay future-tense until the server, client,
deployment, and security docs confirm it as implemented.

## Purpose

The web client should feel like a real Proofline product surface for normal
users, not a raw metadata explorer. It should translate account access,
incident review, trusted contacts, viewer links, evidence state, upload state,
and safety boundaries into language that people can act on.

The default experience should answer human questions:

- What happened?
- Is this still active?
- What has uploaded?
- When was the last update?
- Who can access this?
- What can I safely share?
- What is still pending?
- What should I do next?

Technical concepts may still exist in advanced, debug, developer, API, or
security contexts. They should not be the primary way ordinary users navigate
the app.

## Product Role

The web client is the account and review surface for Proofline. It should
support:

1. Account access and registration.
2. Incident review.
3. Trusted-contact management.
4. Viewer-link owner controls.
5. Future no-account viewer experience.
6. Future browser-based capture as a supported fallback and secondary capture
   method.
7. Future non-emergency interaction records and evidence notes.
8. Developer and local testing flows only when explicitly labelled as such.

It should not be framed as:

- an admin dashboard;
- a raw metadata explorer;
- a backend diagnostics UI;
- an emergency dispatch system;
- guaranteed emergency infrastructure;
- the only or primary long-term mobile capture client.

Native mobile clients remain the expected direction for primary mobile capture
and stronger lifecycle reliability. Browser capture may become useful as a
fallback, desktop capture surface, non-emergency interaction record tool,
testing path, or secondary capture method.

## Current Maturity

The product design must keep current, prototype, backend-supported, planned,
and not-implemented behavior separate.

| Category                                      | Current design truth                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implemented in this web client today          | Login/logout, registration form, email verification route, account overview, account profile/password change, incident list/detail metadata review, contact public-key metadata management, sharing-grant metadata management, wrapped-key metadata review and revocation, deletion request UI, mock mode, bearer and cookie auth client modes.                                                                         |
| Implemented in prototype/mock mode            | Sample account and incident records for local testing. Mock mode does not create accounts, send email, verify real tokens, model billing, or prove backend behavior.                                                                                                                                                                                                                                                    |
| Live backend supported by current server docs | Local account sessions, configurable registration, email verification, browser-cookie auth and CSRF when enabled, account second-factor setup and per-session verification routes, owner-scoped incident list/detail routes, contact public-key metadata, owner-scoped sharing grants, wrapped-key metadata, viewer-token create/revoke routes, token-scoped server-rendered viewer routes, encrypted bundle downloads. |
| Planned or design-only                        | End-user language overhaul, account second-factor setup UX, invite/accept trusted-contact flows, automatic client-managed contact key creation, web-client no-account viewer, map/location presentation, browser capture fallback, durable viewer-link management, payment-backed account lifecycle, notification delivery, trusted-contact account access.                                                             |
| Not implemented and not implied               | Emergency dispatch, guaranteed emergency response, production safety infrastructure, backend decryption, browser decryption, trusted-contact decryption, key escrow, raw server-held media keys, break-glass access, playable export, public admin dashboard, OAuth, JWT, push/SMS/Messenger notifications, production billing.                                                                                         |

## Audiences

### Account Owner

An account owner creates or reviews their own records. They should see clear
states, plain action labels, trusted-contact access state, upload status,
latest update time, and safety boundaries.

They should not need to understand raw incident IDs, stream IDs, chunk indexes,
wrapped-key rows, sharing-grant objects, backend routes, or cryptographic
algorithm names to complete normal tasks.

### Person Adding Trusted Contacts

A person adding trusted contacts should see people, invites, acceptance state,
and access state. They should be able to invite a contact, see whether the
contact is ready, share access, and stop sharing.

They should not need to paste public keys, choose wrapping algorithms, compare
fingerprints as the default flow, or understand grant and wrapped-key records.

### Trusted Contact Accepting An Invite

A trusted contact should see who invited them, what accepting means, what they
may be able to view later, and what Proofline does not do. Accepting should be
a normal account flow with automatic client-managed key creation where the
backend/client design supports it.

They should not need to manage private keys manually, inspect key material, or
interpret token mechanics. They also should not be told that accepting an invite
means Proofline will contact emergency services.

### No-Account Viewer

A no-account viewer opens a viewer link and sees read-only information that the
server intentionally exposes to that link. They should see a simple responsive
view with incident status, latest update, latest shared location when present,
and clear next actions.

They should not need an account, and they should not see owner-only controls,
technical metadata tables, raw token mechanics, account APIs, key material, or
write actions.

### Contributor Or Local Tester

A contributor or local tester may need mock mode, sample records, route names,
IDs, API state, and technical metadata. Those concepts should be clearly marked
as local development, prototype, debug, or advanced details.

They should not confuse mock behavior with live backend support or production
readiness.

### Security Reviewer

A security reviewer may need precise terms for auth mode, CSRF behavior, token
storage, key custody, viewer-link secrets, encryption envelopes, and metadata
boundaries. Those details belong in security docs, API docs, threat models, or
advanced panels.

They should not need the main product UI to expose secrets, request bodies,
stored paths, object keys, raw keys, raw tokens, wrapped-key ciphertext, or
private deployment details.

## Core Journeys

### Sign In And Account Access

Use direct account language: `Sign in`, `Create account`, `Verify email`,
`Account`, `Password`, and `Sign out`.

Registration should say when email verification is required. Paid registration
must remain unavailable until the backend implements reviewed billing and
account-entitlement routes.

### Review An Incident

Incident review should lead with human context:

- status;
- latest update;
- what was captured or uploaded;
- what is protected;
- who can access it;
- what is pending;
- available next actions.

Raw incident IDs can remain available in advanced details, copyable references,
or technical views, but they should not be the main page title for normal
users.

### Add A Trusted Contact

The primary journey should be:

1. Owner chooses `Add trusted contact`.
2. Owner enters a simple identifier, such as username or email, if supported by
   the backend design.
3. Contact receives or sees an invite.
4. Contact accepts or declines.
5. The client creates required key material automatically.
6. The client publishes required public key material automatically.
7. Owner sees a simple trusted-contact state.

Manual public-key entry must not be the primary trusted-contact UX. It may
remain only in advanced technical setup, security review, migration, or local
testing contexts.

### Share Access

Sharing should be framed around what the recipient can do:

- `Share access`;
- `Stop sharing`;
- `Can view status`;
- `Can view encrypted evidence`;
- `Access expires`;
- `No longer shared`.

Do not present `sharing grant`, `data class`, `wrapped key`, or `recipient type`
as the default language for the action. Those terms can appear in advanced
details when needed.

Sharing access must not imply notification delivery, emergency dispatch,
decryption, or guaranteed response.

### Manage Viewer Links

Owners should understand viewer links as one-time-shown bearer secrets:

- `Create viewer link`;
- `Copy viewer link`;
- `Clear link`;
- `Revoke viewer link`;
- `Expires`;
- `Valid until revoked`.

The UI should explain that the link can be opened by anyone who has it and that
Proofline will not show the raw link again after the user clears it. Raw viewer
links must not be stored in browser storage, logs, analytics, issue text, PR
text, screenshots, or persistent query caches.

Durable viewer-link management needs a backend route that returns non-secret
viewer-link metadata. Until that exists, the UI should not promise a complete
post-reload management table.

### No-Account Viewer

Moving the viewer experience into the React web client should enable a better
end-user no-account viewer while preserving current viewer-token semantics.

The future web-client viewer should support:

- simple responsive layout;
- read-only incident status;
- latest check-in or last update time;
- latest shared location when provided by the server viewer payload;
- interactive map display;
- location freshness and staleness indicators;
- accessible coordinate fallback if maps fail;
- `Open in Apple Maps` and `Open in Google Maps` actions;
- clear warning that location may be stale, delayed, approximate,
  unavailable, or not emergency-tracked.

Prefer `Latest shared location`, `Last reported location`, and `Last updated`.
Avoid `Live tracking` and `Real-time emergency location` unless a future
reviewed implementation truly supports that behavior and the safety wording is
updated.

External map actions should be explicit. Opening a map provider may disclose
coordinates to that provider. Viewer tokens must not be included in map links.

### Future Browser Capture

Browser capture is future-facing only in this document. It should be framed as
a supported fallback and secondary capture method, not the primary native
mobile capture client.

Browser capture may be useful when:

- the native Proofline app is unavailable;
- the user is on a laptop;
- the user is recording a non-emergency interaction;
- the user is testing a backend/client flow;
- the user needs a secondary capture method.

Use normal product terms:

- `Start recording`;
- `Stop recording`;
- `Uploading`;
- `Last uploaded`;
- `Waiting for connection`;
- `Location updated`;
- `Location unavailable`.

Required warnings:

- keep the page open while recording;
- browser capture may pause or stop if the device locks, the tab closes,
  permissions are revoked, the browser is backgrounded, or the network is
  unavailable;
- Proofline is not emergency dispatch;
- call local emergency services directly when immediate help is needed.

Capture UI should not read like an API state table. It should show recording
state, upload progress, last successful upload, connection state, location
state, and next action.

### Interaction Records And Evidence Notes

The web client should support future non-emergency interaction records and
evidence notes without implying emergency escalation. These modes are useful for
meetings, calls, service interactions, legal or workplace records, notes,
attachments, and other evidence that may not be safety-critical.

Mode labels must not silently change access, retention, notifications, key
custody, emergency behavior, or public viewer behavior. Those changes require
explicit backend and threat-model updates.

## Language Rules

Use normal user-facing terms for primary labels:

| Prefer             | Use for                                                               |
| ------------------ | --------------------------------------------------------------------- |
| Trusted contact    | A person the account owner trusts for review or future recovery help. |
| Invite             | Asking a contact to join or accept access.                            |
| Accept invite      | Contact confirms they want the role.                                  |
| Share access       | Owner allows a contact or viewer link to see selected information.    |
| Stop sharing       | Owner revokes future access.                                          |
| Viewer link        | No-account read-only link.                                            |
| Latest location    | Most recent location value shared by the server payload.              |
| Last update        | Most recent relevant status or check-in time.                         |
| Recording          | User-facing capture action.                                           |
| Upload status      | Whether evidence is uploaded, uploading, pending, or failed.          |
| Evidence           | User-facing record content or encrypted bundle.                       |
| Interaction record | Non-emergency record of an interaction.                               |
| Safety check       | Timed check-in pattern.                                               |
| Encrypted evidence | Evidence that is protected but not decrypted in this app.             |

Avoid these as primary end-user labels:

| Avoid as primary label         | Better default                                           |
| ------------------------------ | -------------------------------------------------------- |
| Public key                     | Trusted contact setup, contact protection details.       |
| Wrapped key                    | Key delivery, access protection, encrypted access state. |
| Sharing grant                  | Shared access.                                           |
| Incident token or viewer token | Viewer link.                                             |
| Chunk                          | Upload item, evidence part, advanced detail.             |
| Stream                         | Recording, upload, evidence section, advanced detail.    |
| Ciphertext                     | Encrypted evidence.                                      |
| Manifest                       | Evidence details, download details, advanced detail.     |
| Encryption envelope            | Protection details, technical details.                   |
| ML-KEM, HKDF, AES-GCM          | Technical encryption details.                            |
| Route                          | Page, action, or backend endpoint in developer docs.     |
| Payload                        | Response or details in developer docs.                   |
| Metadata record                | Details, status, or advanced detail.                     |

Technical terms may appear in:

- developer docs;
- API docs;
- security docs;
- threat models;
- advanced details panels;
- debug and local testing modes;
- explicit `Technical details` sections.

They should not be the primary labels for normal product actions.

## UI Hierarchy

Default pages should prioritize:

1. Human outcome.
2. Status.
3. Next action.
4. Safety boundary.
5. Supporting details.
6. Advanced technical metadata.

For incident review, the first screen should not start with stream/chunk tables
or wrapped-key rows. It should start with a summary such as:

- status: active, closed, deleting, unavailable;
- last update;
- upload state;
- shared access state;
- latest shared location when available;
- evidence protection state;
- recommended next action.

Use progressive disclosure for technical detail:

- `Advanced details`;
- `Technical metadata`;
- `Encryption details`;
- `Developer details`.

Advanced details may show IDs, timestamps, route-derived metadata, encryption
or key state, chunk and stream details, and raw-ish technical fields only when
they are public-safe and useful.

Advanced details must never expose secrets, raw keys, raw tokens, wrapped-key
ciphertext, plaintext, request bodies, stored paths, object keys, private
deployment details, or user safety data not intended for the viewer.

## Trusted-Contact UX Requirements

Trusted-contact flows should be invite/accept based and should not require
manual key handling by users.

Required direction:

- owner invites a trusted contact by a simple identifier, such as username or
  email, if supported by backend design;
- contact receives or sees an invite;
- contact accepts or declines;
- client automatically creates required key material;
- client automatically publishes required public key material;
- owner sees a clear trusted-contact state;
- owner can share or stop sharing access;
- users are not asked to paste public keys or choose cryptographic algorithms
  in the normal flow.

If technical key state must be shown, use simple state labels:

- `Ready`;
- `Pending`;
- `Needs review`;
- `Revoked`;
- `Lost device`;
- `Replaced`.

Do not show raw key material as the normal representation of a trusted contact.
Manual public-key entry can exist only as an advanced, reviewed, technical path.

## Visual And Interaction Direction

Preserve the existing Proofline visual family:

- dark purple palette;
- card-based layout;
- compact icon language;
- calm safety-focused tone;
- responsive mobile-first hierarchy.

Use the Figma mobile concepts as direction, not as screens to clone. The
concepts show useful product-language patterns: `Home`, `Record`, `People`,
`Safety check`, `Trusted contacts`, `Evidence`, status cards, contact rows,
capture actions, map/location hierarchy, and plain-language warnings.

The web client can adapt those ideas to desktop and authenticated account
review:

- primary navigation should prefer product areas over implementation areas;
- repeated records should look like user records, not database rows;
- status badges should be paired with readable text;
- buttons should name the action the user is taking;
- warnings should be short, visible, and concrete;
- mobile layouts should make the next action and current state easy to scan.

## Safety And Security Boundaries

These boundaries must remain visible in product design:

- The web client is experimental unless a later release explicitly changes that.
- Proofline is not emergency dispatch.
- Proofline is not emergency-services integration.
- Proofline is not a guaranteed real-time safety system.
- Users and contacts remain responsible for contacting emergency services.
- Browser capture is not guaranteed background recording.
- Viewer links are bearer secrets.
- Trusted-contact access must not imply decryption until the backend, client,
  and key design support it.
- Sharing access must not imply notifications or emergency response.
- Payment or billing UI must not imply active paid account creation until
  reviewed backend billing and entitlement routes exist.
- Public deployment needs separate backend, deployment, abuse-control,
  credential-storage, CSRF/CORS, logging, backup, deletion, monitoring, and
  incident-response review.

This design task does not add browser decryption, trusted-contact decryption,
key escrow, raw key handling, playable export, recording/capture
implementation, notification delivery, billing, admin/operator UI, or backend
behavior.

## Sensitive-Data Boundaries

The product UI, docs, issue drafts, logs, analytics, screenshots, and support
artifacts must not include:

- raw tokens;
- raw viewer links or viewer tokens;
- session tokens;
- browser session cookies;
- CSRF token values;
- Authorization headers;
- request bodies;
- uploaded bytes;
- plaintext;
- raw keys;
- raw media keys;
- contact private keys;
- ML-KEM private or decapsulation keys;
- wrapped-key ciphertext;
- exploit payloads;
- object-store credentials;
- stored paths;
- object keys;
- private deployment details;
- user safety data not intentionally shown to the current viewer.

Use placeholders or abstract examples only.

## Backlog Seed: Product Design Issue Families

This section is only a seed for later backlog scans. It does not create backlog
drafts or GitHub issues.

| Issue family                                                                      | Likely reasoning | Affected areas                                                       | Dependencies                                                                         | Explicit non-goals                                                           | Validation expectations                                                             |
| --------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Replace technical incident metadata labels with end-user incident review language | High             | `src/routes/incidents/`, `src/routes/index.tsx`, docs                | Product copy review, current server field meanings                                   | No route/API changes, no new backend claims                                  | Typecheck, lint, unit tests, Playwright route smoke, copy review                    |
| Add advanced details disclosures for technical metadata                           | High             | Incident detail, contact/access sections, reusable layout components | Accessibility review for disclosure controls                                         | No secret exposure, no removal of useful reviewer data                       | Typecheck, lint, unit tests, Playwright, keyboard/a11y checks                       |
| Redesign trusted-contact flows around invite/accept states                        | Very high        | Future contact routes, account routes, docs                          | Backend trusted-contact lifecycle contract                                           | No manual key-first UX, no notifications, no decryption unless scoped        | Design review first, then full frontend validation if implemented                   |
| Remove manual public-key entry from primary trusted-contact UX                    | Very high        | Contact key route, future invite flow                                | Automatic client key-management design, backend public-key publish route             | Do not delete advanced technical path until replacement exists               | Design review, security review, full frontend validation if implemented             |
| Design browser capture fallback route and capture state machine                   | Very high        | Future capture route, browser permissions, upload UX, docs           | Separate browser capture threat model, upload/retry contract                         | No capture implementation in docs-only work, no emergency reliability claims | Threat-model update, Playwright for browser states, full frontend validation        |
| Design web-client viewer map/location experience                                  | Very high        | Future viewer route, map component, viewer payload docs              | Stable token-scoped viewer payload, map provider decision, deployment/logging review | No live tracking claim, no token in map links, no account owner controls     | Design review, accessibility review, Playwright, security-header review             |
| Add user-facing upload/location freshness states                                  | High             | Dashboard, incident detail, viewer, future capture route             | Server/client definitions for freshness and stale states                             | No guaranteed real-time claims, no hidden diagnostics                        | Unit tests for state mapping, Playwright visual states                              |
| Add accessibility review for capture, viewer, and contacts flows                  | High             | Future capture, viewer, contacts, shared components                  | Stable designs or prototypes for those flows                                         | No cosmetic-only review, no bypass of keyboard flows                         | Keyboard, screen-reader labels, focus order, Playwright/a11y checks where available |
| Align route/page labels with Figma-inspired product language                      | Medium           | Navigation, page headers, docs                                       | Product copy inventory, source-of-truth check                                        | Do not clone Figma screens exactly, no Catalyst redistribution               | Typecheck, lint, unit tests, Playwright route smoke                                 |
| Review all visible copy for admin/JSON/API-like wording                           | High             | All routes, errors, empty states, docs                               | Current route/source copy inventory                                                  | No backend behavior changes, no overpromising production status              | Copy review, unit tests where text assertions change, Playwright route smoke        |

## Design Review Checklist

Use this checklist before turning any issue family into implementation work:

- Does the default label use human product language?
- Is the technical term still available where reviewers need it?
- Does the flow avoid implying emergency dispatch or guaranteed response?
- Does the flow avoid implying decryption, key escrow, or playable export?
- Does the flow avoid exposing raw tokens, keys, ciphertext, paths, object keys,
  request bodies, or private deployment details?
- Does the flow separate viewer-link access from trusted-contact account access?
- Does the flow make mock, prototype, planned, and implemented behavior clear?
- Does the flow preserve loading, empty, error, disabled, and success states?
- Does the flow work on mobile and desktop?
- Does the flow remain accessible by keyboard and assistive technology?
