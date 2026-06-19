# Security Model

This web client is experimental and not production-ready.

## Implemented Controls

- Session tokens are kept in memory by default.
- Optional local-storage session persistence is behind
  `VITE_PROOFLINE_SESSION_STORAGE=localStorage` for local development only.
- Browser-cookie auth mode stores session state in an HttpOnly server cookie
  and keeps CSRF tokens in API-client memory only.
- Expired or malformed loaded sessions are cleared before authenticating the UI.
- Loaded sessions are cleared when the configured API mode or auth mode no
  longer matches the stored session metadata.
- Password changes use the authenticated account route, keep the active session
  usable after success, and rely on the server to revoke other account sessions.
- API responses are parsed with Zod before use where route shapes are known.
- UI states avoid showing raw tokens, Authorization headers, request bodies,
  plaintext, raw keys, wrapped-key ciphertext, stored paths, or object keys.
- Contact public-key management sends only reviewed public-key metadata fields
  and keeps revoked keys visibly ineligible for new sharing grants.
- Sharing-grant management uses active contact public keys only, keeps expired
  or revoked grants out of active delivery paths, and does not add decryption,
  notification, or emergency-response behavior.
- Wrapped-key delivery revocation stops future wrapped-key delivery for
  account-owned records, does not recover material already received, and does
  not expose wrapped-key ciphertext, owner-boundary account IDs, raw keys,
  plaintext, stored paths, or object keys.
- Registration responses use the server's generic verification-required success
  message and do not create a browser session.
- The email-verification route reads the token from the URL fragment, submits
  it in the verification request body, and clears the fragment from the address
  bar.
- The app includes visible prototype warnings.

## Registration And Verification Boundary

Public registration is controlled by `open-proofline/server`, not this
frontend. Server registration is disabled by default. In `admin_only` mode,
public registration is still rejected while admin-only account creation remains
a server/admin concern. In `open` mode, registration creates a
`pending_email_verification` account and email verification is required before
login. In `paid` mode, registration fails closed with
`registration_payment_unavailable`; no billing or active account is created.

Verification tokens are secret-bearing credentials. They must not be logged,
persisted in browser storage, screenshotted, copied into public issue drafts,
included in analytics, or exposed in UI beyond the transient browser URL
fragment needed to complete verification.

## Account Second-Factor Boundary

Current `open-proofline/server` docs describe account second-factor setup and
per-session verification routes for email challenge, TOTP, and WebAuthn. This
web client does not yet implement second-factor setup, challenge, verification,
or recovery UI, and it does not retain server second-factor setup metadata in
frontend account state.

Future second-factor UI needs its own account-security design before exposing
challenge codes, TOTP seeds, WebAuthn ceremony material, or recovery states in
the browser. Those values must not be logged, persisted outside the intended
browser ceremony, copied into public issues, sent to analytics, or mixed with
unrelated account metadata displays.

## Viewer Token Boundary

Viewer tokens are bearer secrets for no-account, read-only incident access.
The planned web-client viewer should replace the current server-rendered viewer
while preserving the same server token semantics. It may show only unencrypted
incident data that the backend intentionally exposes to token holders, such as
safe status, check-in, current-location, or device-state fields when those
fields are part of the viewer payload.

Viewer-token UI must not persist raw tokens, viewer links, or token-bearing
paths in browser storage. It must not send raw token values to analytics, logs,
public issues, PR text, or error messages. Invalid, expired, missing, and
revoked token states should collapse into generic viewer errors.

Viewer-token access is separate from the future trusted-contact account system.
Trusted contacts require their own accept/decline flow, account identity,
client-side private-key creation, public-key storage, encrypted evidence access
design, and key-custody threat model.

## Browser Cookie Auth And CSRF

The implemented live client supports bearer-token auth and explicit
browser-cookie auth mode. Cookie auth is a separate client mode, not an
additive flag on top of bearer auth. In that mode, authenticated requests use
`credentials: "include"` with the reviewed API origin and do not attach an
`Authorization` header. Bearer mode uses `credentials: "omit"` and must not
rely on browser session cookies.

Current `open-proofline/server` behavior rejects mixed bearer and browser-cookie
credentials with `400 ambiguous_credentials`. The frontend must treat that as a
security invariant: a request builder should make the credential mode
unambiguous before the request is sent, and tests should verify that both
credential types cannot be attached together.

Cookie-authenticated unsafe requests require a session-bound CSRF header. The
client fetches the token from `GET /v1/auth/web/csrf`, stores it in memory only,
attaches the returned header name to unsafe methods, refreshes after
`403 csrf_required`, and clears it on logout or session reset. Missing or
rejected CSRF tokens produce controlled request failures or token refreshes, not
a fallback to bearer credentials.

Credentialed CORS and cookie attributes are deployment-sensitive server
configuration. The web client documentation may describe the required
frontend behavior, but approval to expose public `/v1` routes, exact allowed
origins, cookie security flags, and CSRF header names remains in
`open-proofline/server` and deployment review.

## Explicit Non-Controls

- No browser decryption.
- No key unwrapping.
- No recording or capture behavior.
- No emergency dispatch.
- No playable export.
- No OAuth or JWT.
- No public admin dashboard.
- No payment processing or billing portal.
- No public-production account portal claim.

## Browser Review Areas

Before production use, review CSP, XSS exposure, dependency supply chain,
session persistence, bearer-versus-cookie credential mode, CSRF assumptions,
credentialed CORS posture, public API deployment posture, and whether any
credential should be stored in browser storage.

Recommended static-host browser headers are documented in
[Browser Security Headers](browser-security-headers.md). That guidance does not
make the app production-ready and does not approve public backend `/v1`
exposure.

Dependency and workflow review expectations are documented in
[Supply Chain Review](supply-chain.md).
