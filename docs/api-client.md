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
- `POST /v1/incidents`
- `GET /v1/incidents`
- `GET /v1/incidents/{incident_id}`
- `GET /v1/contact-public-keys`
- `GET /v1/contact-public-keys/{public_key_id}`
- `GET /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/sharing-grants/{grant_id}`
- `GET /v1/incidents/{incident_id}/wrapped-keys`
- `GET /v1/wrapped-keys/{wrapped_key_id}`

## Live Owned Incident List Client Gap

Current `open-proofline/server` documents and registers authenticated
`GET /v1/incidents` for owner-scoped public-safe incident metadata.

The current web client still does not call `GET /v1/incidents` in live mode.
That is now a client implementation gap, not a backend route limitation. Mock
mode still returns typed prototype incident records for browser smoke tests and
UI review, but those records are not backend truth. Enabling live
owned-incident listing should update the API client, Zod parsing, route tests,
and browser smoke expectations together.

## Frontend Metadata Boundary

Incident detail parsing keeps browser state focused on public-safe metadata.
If backend chunk responses include private `stored_path` values for upload or
storage internals, the frontend schema does not retain those fields.

Wrapped-key parsing does not retain `wrapped_key_ciphertext` in frontend state.
The current server may return ciphertext on authenticated wrapped-key routes,
but this metadata-review prototype keeps only wrapped-key identifiers, grant and
contact bindings, wrapping metadata, and state until a separate trusted-contact
delivery flow is designed and reviewed.

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

## Browser Cookie Auth And CSRF Planning Boundary

The current frontend implementation uses bearer-session auth in live mode:
`POST /v1/auth/login` returns a bearer token, authenticated requests attach
`Authorization: Bearer ...`, and session storage is memory-first with optional
local-storage persistence for local development only.

`open-proofline/server` also documents browser-cookie auth routes for a future
web-client mode:

- `POST /v1/auth/web/login`
- `POST /v1/auth/web/logout`
- `GET /v1/auth/web/csrf`

That mode is not implemented in this client yet. When it is implemented, the
API client must choose one credential mode per live client instance:

- bearer mode: call the existing bearer login/logout routes and never send
  `credentials: "include"` for session cookies;
- cookie mode: call the web login/logout/CSRF routes, send
  `credentials: "include"` to the reviewed API origin, and never attach an
  `Authorization` header.

The modes must not be mixed for the same request. Current server behavior
rejects requests that include both bearer credentials and a browser session
cookie with `400 ambiguous_credentials`; tests for a cookie-mode implementation
should assert that authenticated requests cannot add both.

Cookie-mode CSRF handling should be explicit in the client contract:

- fetch the CSRF token from `GET /v1/auth/web/csrf` after a successful cookie
  login and before the first unsafe cookie-authenticated request;
- cache the token in memory only, scoped to the active browser session;
- attach the returned header name, defaulting to `X-CSRF-Token` per current
  server docs, to unsafe methods such as `POST` and `PATCH`;
- refresh the token after login, after a `403 csrf_required`, and after any
  auth/session reset;
- clear the cached token on logout and when account/session state is cleared.

Credentialed CORS is a deployment boundary, not a frontend-only switch. A
cookie-mode client must be used only with exact reviewed origins configured in
`open-proofline/server`; wildcard origins are not acceptable for credentialed
requests. Browser tests should cover web login, CSRF fetch, unsafe request
header attachment, logout cleanup, and failure behavior when the CSRF token is
missing or rejected.

## Logging Boundary

The client must not log session tokens, Authorization headers, request bodies,
uploaded bytes, plaintext, raw keys, raw media keys, contact private keys,
wrapped-key ciphertext, verification credentials, object keys, stored paths,
private deployment details, or user safety data.
