# Threat Model

This document tracks prototype frontend risks. The backend threat model remains
in `open-proofline/server`.

## Assets

- Opaque bearer session tokens returned by the server.
- Browser session cookies when cookie auth mode is enabled.
- CSRF tokens for cookie-authenticated unsafe requests.
- Raw email-verification tokens carried in verification URL fragments.
- Raw viewer tokens and token-bearing viewer links returned once after owner
  creation.
- Account metadata visible to the authenticated user.
- Incident, stream, chunk, contact public-key, sharing-grant, and wrapped-key
  metadata.
- Developer environment configuration.

## Trust Boundaries

- Browser JavaScript is not trusted with raw media keys in this prototype.
- The backend remains authoritative for authorization.
- Registration availability and account activation are backend decisions.
- Credentialed CORS, cookie attributes, and CSRF header names remain
  server/deployment decisions.
- Bearer-token auth and browser-cookie auth must remain mutually exclusive for
  a given authenticated request.
- Catalyst components are app-internal UI source, not a redistributed kit.
- Mock data is not backend truth.

## Main Risks

- XSS could expose bearer tokens if token persistence is expanded.
- Browser local storage can retain credentials after a session should be gone.
- Verification URL fragments can be exposed by screenshots, browser extensions,
  debugging tools, copied issue text, or analytics if handled carelessly.
- Viewer tokens or token-bearing links can be exposed through clipboard history,
  logs, analytics, referrers, screenshots, issue drafts, or persistent browser
  storage if the one-time success state is mishandled.
- Registration UI wording could expose account-existence state if it diverges
  from the server's generic verification-required response.
- Cookie-auth mode could accidentally mix bearer and cookie credentials,
  triggering server rejection and weakening client-side reasoning about which
  credential protects the request.
- Missing, stale, logged, or over-persisted CSRF tokens could break unsafe
  cookie-authenticated requests or expand the effect of XSS.
- Credentialed CORS configured with broad or unreviewed origins could expose
  browser-cookie auth beyond the intended static web-client origin.
- UI wording could imply emergency dispatch, decryption, or production safety
  features that do not exist.
- Dependency changes can introduce browser-side supply-chain risk.
- Live API route assumptions can drift from `open-proofline/server`.

## Out Of Scope

Recording, decryption, key escrow, break-glass access, trusted-contact
decryption, payment processing, public-production account portal claims,
emergency notifications, notification delivery channels, trusted-contact
account/key flows, and playable media export are out of scope until explicitly
designed and reviewed.
