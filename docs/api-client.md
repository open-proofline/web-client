# API Client

The API client supports a configurable base URL through
`VITE_PROOFLINE_API_BASE_URL`.

Default local backend:

```text
http://127.0.0.1:8080
```

## Modes

`VITE_PROOFLINE_API_MODE=mock` is the default bootstrap mode. It uses typed
prototype data so browser smoke tests do not require a live backend.

`VITE_PROOFLINE_API_MODE=live` calls the current server API.

Live mode supports two explicit auth modes:

- `VITE_PROOFLINE_AUTH_MODE=bearer` uses bearer-session login/logout and omits
  browser credentials from API requests.
- `VITE_PROOFLINE_AUTH_MODE=cookie` uses the browser-cookie auth routes,
  includes browser credentials only for cookie-authenticated requests, and
  never attaches an `Authorization` header.

## Confirmed Backend Routes

From current `open-proofline/server` docs and route registration:

- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/email/verify`
- `POST /v1/auth/logout`
- `POST /v1/auth/web/login`
- `POST /v1/auth/web/logout`
- `GET /v1/auth/web/csrf`
- `GET /v1/account`
- `POST /v1/account/password`
- `POST /v1/incidents`
- `GET /v1/incidents`
- `GET /v1/incidents/{incident_id}`
- `POST /v1/incidents/{incident_id}/incident-tokens`
- `POST /v1/incident-tokens/{token_id}/revoke`
- `POST /v1/incidents/{incident_id}/deletion`
- `GET /v1/incidents/{incident_id}/deletion`
- `POST /v1/contact-public-keys`
- `GET /v1/contact-public-keys`
- `GET /v1/contact-public-keys/{public_key_id}`
- `PATCH /v1/contact-public-keys/{public_key_id}`
- `POST /v1/contact-public-keys/{public_key_id}/revoke`
- `POST /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/sharing-grants/{grant_id}`
- `POST /v1/sharing-grants/{grant_id}/revoke`
- `GET /v1/incidents/{incident_id}/wrapped-keys`
- `GET /v1/wrapped-keys/{wrapped_key_id}`
- `POST /v1/wrapped-keys/{wrapped_key_id}/revoke`

## Live Owned Incident List Client

Current `open-proofline/server` documents and registers authenticated
`GET /v1/incidents` for owner-scoped public-safe incident metadata.

The web client calls `GET /v1/incidents` in live mode and parses the
`{ "incidents": [...] }` response with Zod before rendering records. Mock mode
still returns typed prototype incident records for browser smoke tests and UI
review, but those records are not backend truth.

## Account Profile And Password Change

The account profile route reads safe account metadata from `GET /v1/account`.
Password changes call authenticated `POST /v1/account/password` with
`current_password` and `new_password`, parse the returned `{ "account": ... }`
body, and keep the current browser session active. Current server behavior
revokes other sessions for the account after a successful password change.

The UI maps password-change failures to fixed safe messages and does not log or
persist passwords, request bodies, session tokens, Authorization headers,
browser session cookies, or CSRF token values.

## Viewer Token UI Boundary

Current `open-proofline/server` documents authenticated owner-scoped
viewer-token creation and revocation:

- `POST /v1/incidents/{incident_id}/incident-tokens`
- `POST /v1/incident-tokens/{token_id}/revoke`

The create route returns the raw viewer token only once and stores only a token
hash on the server. The web-client design for this flow is documented in
[Viewer Token UI Design](viewer-token-ui-design.md). Runtime client methods are
not implemented in this repository yet.

The current server also serves a token-scoped read-only incident viewer. The
intended web-client direction is to replace that surface while using the same
viewer-token authority model for no-account notification contacts. That viewer
path is distinct from the future trusted-contact account system and must not
imply browser decryption, key unwrapping, playable export, notification
delivery, emergency dispatch, or public production readiness.

No incident-token list or read route is currently documented for long-term
management UI. Until such a backend contract exists, the web client should not
promise a durable token table or post-reload revocation workflow for tokens
created outside the current browser flow.

## Frontend Metadata Boundary

Incident detail parsing keeps browser state focused on public-safe metadata.
If backend chunk responses include private `stored_path` values for upload or
storage internals, the frontend schema does not retain those fields.

Owner-scoped incident deletion uses the server's authenticated deletion routes:

- `GET /v1/incidents/{incident_id}/deletion`
- `POST /v1/incidents/{incident_id}/deletion`

The client treats `404 incident_deletion_not_found` from the status route as
"no deletion request" and keeps other ownership, missing-incident, and backend
errors generic in the UI. Deletion requests use a fixed non-sensitive
`account_delete` reason code. Open incidents require explicit user confirmation
before the client sends `allow_open: true`.

Deletion status parsing keeps only the server's non-sensitive status fields:
decision and incident identifiers, source, reason code, `allow_open`, state,
item count, optional safe error code, and timestamps. It does not retain
deletion item paths, object keys, request bodies, plaintext, raw keys,
wrapped-key ciphertext, token hashes, private deployment details, or user safety
narrative.

Wrapped-key parsing does not retain `wrapped_key_ciphertext` in frontend state.
The current server may return ciphertext on authenticated wrapped-key routes,
but this metadata-review prototype keeps only wrapped-key identifiers, grant and
contact bindings, reviewed public wrapping profile metadata, state, and safe
timestamps until a separate trusted-contact delivery flow is designed and
reviewed.

Wrapped-key delivery revocation uses the server's authenticated owner-scoped
route:

- `POST /v1/wrapped-keys/{wrapped_key_id}/revoke`

Revocation marks one wrapped-key record revoked and stops future delivery of
that record. It cannot claw back material an authorized actor may already have
received. The UI keeps revoke errors generic and does not expose owner-boundary
account IDs, wrapped-key ciphertext, raw media keys, contact private keys,
plaintext, request bodies, stored paths, object keys, or private deployment
details.

Contact public-key management uses the server's authenticated account-scoped
routes:

- `POST /v1/contact-public-keys`
- `GET /v1/contact-public-keys`
- `GET /v1/contact-public-keys/{public_key_id}`
- `PATCH /v1/contact-public-keys/{public_key_id}`
- `POST /v1/contact-public-keys/{public_key_id}/revoke`

The client sends tightly shaped request bodies for display label, wrapping
algorithm, public key, fingerprint, optional `contact_id`, and reviewed
`key_state`. It does not send or retain contact private keys, raw media keys,
plaintext, wrapped-key ciphertext, browser fragment secrets, request bodies,
stored paths, object keys, or private deployment details.

Contact-key states are `pending_verification`, `active`, `replaced`, `revoked`,
and `lost`. Only `active` keys are eligible for new sharing grants. The UI keeps
revoked keys visibly ineligible and does not offer reactivation controls for
revoked records; the server also rejects revoked-key reactivation with
`409 invalid_contact_key_state`.

Sharing-grant management uses the server's authenticated owner-scoped routes:

- `POST /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/sharing-grants/{grant_id}`
- `POST /v1/sharing-grants/{grant_id}/revoke`

The client creates grants only from active contact public keys already returned
for the active session. It sends tightly shaped request bodies for `contact_id`,
optional `contact_public_key_id`, optional `stream_id`, `data_class`, and
optional future `expires_at`. Missing incident, stream, or active contact-key
dependencies stay generic in the UI as `sharing_grant_dependency_not_found`.

Sharing grants authorize metadata and/or encrypted evidence access. They do not
decrypt media, create trusted-contact sessions, notify emergency services, or
guarantee emergency response. The UI marks expired or revoked grants as inactive
delivery paths and does not retain wrapped-key ciphertext, raw media keys,
contact private keys, plaintext, request bodies, stored paths, object keys, or
private deployment details from grant responses.

## Public Registration Contracts

The API client includes typed public calls for `POST /v1/auth/register` and
`POST /v1/auth/email/verify`. Registration returns the server's generic
verification-required response and does not create a browser session. Email
verification returns a verified status and also does not create a session.

Public registration availability is controlled by `open-proofline/server`
configuration, not this frontend:

- `disabled` and `admin_only` reject public registration with
  `registration_disabled`.
- `open` accepts username, email, and password, creates a
  `pending_email_verification` account, sends a verification email, and returns
  a generic `202 verification_required` response. Duplicate username or email
  submissions keep the same generic response shape.
- `paid` returns `registration_payment_unavailable` as a fail-closed
  placeholder. It does not create checkout sessions, subscriptions, active
  accounts, or billing webhooks.

Verification links use the public web origin and place the raw verification
token in the URL fragment. The browser route reads the fragment, submits the
token to `POST /v1/auth/email/verify` in the JSON body, and clears the fragment
from the address bar. The raw token is a secret-bearing credential and must not
be logged, persisted, screenshotted, copied into issue drafts, or sent to
analytics.

Mock mode returns explicit prototype-only responses for these methods; it does
not create accounts, send email, verify real tokens, or model payment/billing
state.

## Browser Cookie Auth And CSRF

Bearer mode remains the default live mode. `POST /v1/auth/login` returns a
bearer token, authenticated bearer-mode requests attach
`Authorization: Bearer ...`, and bearer session storage is memory-first with
optional local-storage persistence for local development only. Bearer-mode
fetches use `credentials: "omit"` so browser session cookies are not relied on.

Cookie mode is selected explicitly with `VITE_PROOFLINE_AUTH_MODE=cookie` and
uses the server browser-cookie auth routes:

- `POST /v1/auth/web/login`
- `POST /v1/auth/web/logout`
- `GET /v1/auth/web/csrf`

The API client chooses one credential mode per live client instance:

- bearer mode: call the existing bearer login/logout routes and never send
  `credentials: "include"` for session cookies;
- cookie mode: call the web login/logout/CSRF routes, send
  `credentials: "include"` to the reviewed API origin, and never attach an
  `Authorization` header.

The modes must not be mixed for the same request. Current server behavior
rejects requests that include both bearer credentials and a browser session
cookie with `400 ambiguous_credentials`; the client treats that as a local
invariant and refuses to send bearer tokens from cookie-mode authenticated
requests.

Cookie-mode CSRF handling is explicit in the client contract:

- fetch the CSRF token from `GET /v1/auth/web/csrf` after a successful cookie
  login and before the first unsafe cookie-authenticated request;
- cache the token in memory only, scoped to the active browser session;
- attach the returned header name, defaulting to `X-CSRF-Token` per current
  server docs, to unsafe methods such as `POST` and `PATCH`;
- refresh the token after login, after a `403 csrf_required`, and before unsafe
  cookie-authenticated requests when no in-memory CSRF token is available;
- clear the cached token on logout and when account/session state is cleared.

Credentialed CORS is a deployment boundary, not a frontend-only switch. A
cookie-mode client must be used only with exact reviewed origins configured in
`open-proofline/server`; wildcard origins are not acceptable for credentialed
requests. Browser tests cover web login, CSRF fetch, unsafe request header
attachment, logout cleanup, and rejected CSRF refresh behavior.

## Logging Boundary

The client must not log session tokens, Authorization headers, request bodies,
uploaded bytes, plaintext, raw keys, raw media keys, contact private keys,
wrapped-key ciphertext, verification credentials, object keys, stored paths,
private deployment details, or user safety data.
