# Proofline Web Client Docs

These docs describe the current experimental web-client prototype. The backend
source of truth remains `open-proofline/server`.

- [Architecture](architecture.md)
- [API client](api-client.md): current route contracts and bearer/cookie auth
  client modes.
- [Security model](security-model.md): implemented controls, non-controls, and
  browser auth review areas.
- [Viewer token UI design](viewer-token-ui-design.md): owner create/revoke
  design and the planned no-account read-only viewer boundary.
- [Browser security headers](browser-security-headers.md): static-host header
  guidance and credentialed CORS review notes.
- [Supply chain review](supply-chain.md)
- [Threat model](threat-model.md)
- [Theme tokens](theme.md)
- [Development](development.md)

The prototype does not implement recording, browser decryption, key escrow,
playable media export, emergency dispatch, or production safety workflows.
