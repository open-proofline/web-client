# Security Model

This web client is experimental and not production-ready.

## Implemented Controls

- Session tokens are kept in memory by default.
- Optional local-storage session persistence is behind
  `VITE_PROOFLINE_SESSION_STORAGE=localStorage` for local development only.
- Expired or malformed loaded sessions are cleared before authenticating the UI.
- API responses are parsed with Zod before use where route shapes are known.
- UI states avoid showing raw tokens, Authorization headers, request bodies,
  plaintext, raw keys, wrapped-key ciphertext, stored paths, or object keys.
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
session persistence, CSRF assumptions, public API deployment posture, and
whether any credential should be stored in browser storage.

Recommended static-host browser headers are documented in
[Browser Security Headers](browser-security-headers.md). That guidance does not
make the app production-ready and does not approve public backend `/v1`
exposure.

Dependency and workflow review expectations are documented in
[Supply Chain Review](supply-chain.md).
