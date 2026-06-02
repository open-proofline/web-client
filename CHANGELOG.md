# Changelog

## Unreleased

- Documented the future Stripe subscription UI boundary for cost-recovery hosted
  server access without implementing payment processing.
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
- Disabled the unconfirmed live owned incident list route and documented the backend limitation.
- Applied the midnight violet theme tokens to the prototype UI surfaces.
- Used router-aware links for internal web-client navigation.
- Cleared expired or malformed loaded sessions before authenticating the UI.
- Avoided prefilled prototype credentials on the login screen in live API mode.
- Parsed live account responses through the Zod account schema.
- Removed private chunk storage paths from frontend incident detail schemas.
- Enabled strict TypeScript compiler checks for the web client.
- Bootstrapped the experimental Proofline web-client prototype.
