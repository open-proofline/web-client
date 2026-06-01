# Threat Model

This document tracks prototype frontend risks. The backend threat model remains
in `open-proofline/server`.

## Assets

- Opaque bearer session tokens returned by the server.
- Account metadata visible to the authenticated user.
- Incident, stream, chunk, contact public-key, sharing-grant, and wrapped-key
  metadata.
- Developer environment configuration.

## Trust Boundaries

- Browser JavaScript is not trusted with raw media keys in this prototype.
- The backend remains authoritative for authorization.
- Catalyst components are app-internal UI source, not a redistributed kit.
- Mock data is not backend truth.

## Main Risks

- XSS could expose bearer tokens if token persistence is expanded.
- Browser local storage can retain credentials after a session should be gone.
- UI wording could imply emergency dispatch, decryption, or production safety
  features that do not exist.
- Dependency changes can introduce browser-side supply-chain risk.
- Live API route assumptions can drift from `open-proofline/server`.

## Out Of Scope

Recording, decryption, key escrow, break-glass access, trusted-contact
decryption, emergency notifications, and playable media export are out of scope
until explicitly designed and reviewed.
