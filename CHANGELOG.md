# Changelog

## Unreleased

- Added incident-scoped sharing-grant management for active contact keys,
  optional stream scope, optional expiry, and revocation.
- Added account-level contact public-key management for create, update, and
  revoke flows.
- Added owner incident deletion status and request UI for the authenticated
  incident detail route.
- Added an authenticated account profile route with safe account metadata and
  password-change handling.
- Implemented an explicit browser-cookie auth client mode with in-memory CSRF
  handling.
- Enabled live owned-incident listing against authenticated
  `GET /v1/incidents` responses.
- Added the reusable documentation and prompt review workflow and refreshed
  docs to distinguish current server support for owner-scoped incident listing
  from earlier web-client live-list implementation work.
- Improved public-facing web-client UX copy, warning treatment, and responsive
  incident metadata layouts.
- Documented browser cookie auth and CSRF client-mode planning.
- Documented the registration and email-verification boundary.
- Added a public registration form flow.
- Added a pending email-verification login state.
- Added a browser email-verification route that clears verification URL fragments.
- Added typed public registration and email-verification API client contracts.
- Replaced render-time login redirect navigation with a declarative redirect.
- Dropped wrapped-key ciphertext from retained frontend wrapped-key schemas.
- Added dependency audit CI and supply-chain review expectations.
- Documented the browser security header posture for static web-client deployment.
- Expanded authenticated route coverage for mock dashboard and incident review flows.
- Added accessible dependent metadata error states on the incident detail route.
- Previously documented the live owned incident list route as disabled pending
  API-client support and tests.
- Applied the midnight violet theme tokens to the prototype UI surfaces.
- Used router-aware links for internal web-client navigation.
- Cleared expired or malformed loaded sessions before authenticating the UI.
- Avoided prefilled prototype credentials on the login screen in live API mode.
- Parsed live account responses through the Zod account schema.
- Removed private chunk storage paths from frontend incident detail schemas.
- Enabled strict TypeScript compiler checks for the web client.
- Bootstrapped the experimental Proofline web-client prototype.
