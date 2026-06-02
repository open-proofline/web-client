# Threat Model

This document tracks prototype frontend risks. The backend threat model remains
in `open-proofline/server`.

## Assets

- Opaque bearer session tokens returned by the server.
- Raw email-verification tokens carried in verification URL fragments.
- Account metadata visible to the authenticated user.
- Incident, stream, chunk, contact public-key, sharing-grant, and wrapped-key
  metadata.
- Developer environment configuration.

## Trust Boundaries

- Browser JavaScript is not trusted with raw media keys in this prototype.
- The backend remains authoritative for authorization.
- Registration availability and account activation are backend decisions.
- Catalyst components are app-internal UI source, not a redistributed kit.
- Mock data is not backend truth.

## Main Risks

- XSS could expose bearer tokens if token persistence is expanded.
- Browser local storage can retain credentials after a session should be gone.
- Verification URL fragments can be exposed by screenshots, browser extensions,
  debugging tools, copied issue text, or analytics if handled carelessly.
- Registration UI wording could expose account-existence state if it diverges
  from the server's generic verification-required response.
- UI wording could imply emergency dispatch, decryption, or production safety
  features that do not exist.
- Dependency changes can introduce browser-side supply-chain risk.
- Live API route assumptions can drift from `open-proofline/server`.

## Out Of Scope

Recording, decryption, key escrow, break-glass access, trusted-contact
decryption, payment processing, public-production account portal claims,
emergency notifications, and playable media export are out of scope until
explicitly designed and reviewed.
