# Viewer Token UI Design

This note scopes the planned browser UI for owner-created viewer tokens and
the future web-client read-only viewer. The backend source of truth remains
`open-proofline/server`.

For broader product-language and no-account viewer direction, see
[End-user web-client design](end-user-web-client-design.md). This document uses
`viewer token` for the backend/security mechanism and `viewer link` for normal
user-facing copy.

## Goals

- Let an authenticated incident owner create a read-only viewer token for one
  incident.
- Show the raw viewer token or token-bearing viewer link exactly once, with
  explicit copy and clear controls.
- Let the owner revoke a known viewer token by server-issued token ID.
- Keep no-account viewer access separate from the account-based trusted-contact
  system.
- Keep the web-client viewer limited to read-only unencrypted incident data,
  such as safe incident status, latest check-in, current location, or device
  state when those fields are present in the server viewer contract.
- Use `viewer link` as the default product label and reserve token mechanics
  for security, API, and technical details.

## Current Server Contract

Current `open-proofline/server` docs and route registration confirm:

- `POST /v1/incidents/{incident_id}/incident-tokens`
- `POST /v1/incident-tokens/{token_id}/revoke`

The create route is owner-scoped, returns the raw token only in the creation
response, stores only a SHA-256 token hash in the configured metadata backend,
and sends `Cache-Control: no-store`. `expires_at` is optional. If omitted, the
server applies its configured default token lifetime, currently 24 hours unless
the deployment changes `SAFE_DEFAULT_INCIDENT_TOKEN_TTL`. Sending `null`
requests a token that remains valid until revoked.

The revoke route disables a token by token ID. There is currently no documented
incident-token list or read route for long-term browser management UI. Until
that route exists, the web client should not promise a durable token table or
post-reload revoke workflow for tokens created elsewhere.

The server still provides the current token-scoped `/i/{token}` incident
viewer. The intended product direction is for the web-client viewer to replace
that surface while preserving the same viewer-token authority model.

## Access Models

Viewer-token access is the no-account contact path. A contact may receive an
email, SMS, Messenger, Signal, or other notification that leads to read-only
incident viewer access. Notification delivery is not part of this design note.
The token grants read-only access to the server-defined viewer payload and must
not imply account access, trusted-contact status, emergency dispatch, or
encrypted evidence decryption.

Trusted contacts are a separate account-based system. That future flow requires
a Proofline account, an accept or decline step after the owner adds a contact by
email or username, client-side private key creation, public key storage, and
client support for viewing or downloading encrypted evidence. That flow is not
implemented by viewer-token UI and needs its own design, backend contract, and
key-custody threat model.

## Owner Create UI

The authenticated incident detail view should expose a "Viewer access" section
only after the user is signed in and the incident detail is loaded.

The create form should include:

- a short label for the intended recipient or purpose;
- an expiry control with the server default as the recommended path;
- an explicit option for no expiry until revoked, with warning copy;
- a submit button that names the action without implying notifications are sent.

The form must not accept raw token input. It should not mention or reveal server
storage paths, object keys, private deployment details, contact private keys,
wrapped-key ciphertext, raw media keys, plaintext, or request bodies.

Recommended create copy:

- Button: "Create viewer link"
- Default expiry helper: "Uses the server default expiry unless changed."
- No-expiry warning: "This link remains valid until revoked. Use this only for
  a reviewed contact path."
- Success heading: "Viewer link created"
- One-time warning: "Copy it now. Proofline will not show this link again after
  you clear it."

## One-Time Token Handling

The raw viewer token is a bearer secret. The browser may hold it only in
component memory for the active success state.

Required handling:

- do not store the raw token in `localStorage`, `sessionStorage`, IndexedDB, URL
  query parameters, persisted TanStack Query cache, service-worker cache, logs,
  analytics, telemetry, screenshots, issue drafts, or error messages;
- do not send the raw token to any route other than the intended viewer route;
- do not include raw token values in test fixtures, public docs, issue bodies,
  PR text, or changelog entries;
- clear the raw token when the user dismisses the success state, navigates away,
  logs out, changes auth mode, or resets session state;
- copy only from a user gesture and report generic copy failures;
- prefer copying a token-bearing viewer link over showing the bare token, while
  still treating the full link as the same secret.

The success panel should use an accessible status region, keep warning text next
to the copy action, and provide an explicit "Clear link" control. After clear,
the UI may keep non-secret creation metadata such as label, token ID, created
time, and expiry in volatile browser state, but must not reconstruct or reveal
the raw token again.

## Revoke UI

Revocation should be available only for token IDs the browser knows. With the
current server contract, that means tokens created during the current browser
flow. A durable management table requires a future list/read backend route that
returns non-secret token metadata.

The revoke action should:

- require explicit confirmation for active tokens;
- identify tokens by label, created time, and expiry rather than raw token;
- call `POST /v1/incident-tokens/{token_id}/revoke`;
- remove or mark the local row revoked after success;
- keep failures generic, for example "Viewer access could not be revoked.";
- treat missing, already revoked, unauthorized, and ownership-boundary failures
  as non-revealing UI errors.

Revoke copy must not claim clawback. A recipient who already copied data or kept
an open page may have seen read-only incident data before revocation.

## Web-Client Viewer Target

The replacement web-client viewer should consume the same viewer-token system
but remain separate from authenticated owner UI.

Viewer route behavior should be designed before implementation:

- accept a token-bearing route without storing the token in browser storage;
- request only the server-defined read-only viewer payload;
- show unencrypted incident status data that the server intentionally exposes to
  token holders;
- present latest shared location, last update time, location freshness, and map
  actions only when those fields are part of the reviewed server viewer
  payload;
- avoid encrypted evidence decryption, key unwrapping, playable export,
  account login, trusted-contact private-key handling, and emergency response
  claims;
- use no-store cache behavior and conservative browser headers at deployment;
- collapse invalid, expired, missing, and revoked token states into generic
  errors that do not reveal token validity.

If the replacement viewer needs a different route shape or link origin from the
current server `/i/{token}` path, that must be resolved with server and
deployment docs before runtime implementation.

## Error And Empty States

Create errors should be short and generic:

- incident not found or not owned: "Viewer access could not be created.";
- invalid expiry: "Enter a valid expiry time or use the default.";
- auth expired: "Sign in again to create viewer access.";
- network/server failure: "Viewer access could not be created.";

Revoke errors should also stay generic:

- unknown, already revoked, or not owned: "Viewer access could not be revoked.";
- auth expired: "Sign in again to revoke viewer access.";
- network/server failure: "Viewer access could not be revoked.";

The UI should include `role="status"` for success and loading states and
`role="alert"` for blocking errors. Buttons should have stable disabled states
while requests are pending.

## Follow-Up Implementation Questions

Before runtime implementation, decide:

- the exact web-client viewer route and configured public viewer origin;
- whether owner create UI may create a server `/i/{token}` link during the
  transition or must wait for the web-client viewer route;
- whether the server should add a non-secret incident-token list/read route for
  long-term revocation management;
- which viewer payload fields are intended for no-account notification contacts,
  especially current location and device state;
- whether notification delivery channels are server, client, or separate
  service responsibilities;
- how deployment will keep token-bearing paths out of access logs, referrers,
  analytics, and public issue text.
