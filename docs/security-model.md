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
- The app includes visible prototype warnings.

## Explicit Non-Controls

- No browser decryption.
- No key unwrapping.
- No recording or capture behavior.
- No emergency dispatch.
- No playable export.
- No OAuth or JWT.
- No public admin dashboard.

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
