# Proofline Web Client Docs

These docs describe the current experimental web-client prototype. The backend
source of truth remains `open-proofline/server`. Project-wide public
governance, political alignment, public voice, and reusable README baseline
guidance live in `open-proofline/website`.

Use the right source for the claim:

- web-client behavior and prototype limits: this repository and these docs
- backend API, auth, deployment, billing-placeholder, and security facts:
  `open-proofline/server`
- public governance, cooperative/public-good posture, public voice, and README
  structure: `open-proofline/website`

- [Architecture](architecture.md)
- [End-user web-client design](end-user-web-client-design.md): product
  language, user journeys, trusted-contact direction, future viewer and capture
  framing, and product-design backlog seeds.
- [API client](api-client.md): current route contracts and bearer/cookie auth
  client modes.
- [Security model](security-model.md): implemented controls, non-controls, and
  browser auth review areas.
- [Viewer token UI design](viewer-token-ui-design.md): owner create/revoke
  design and the planned no-account read-only viewer boundary.
- [Browser security headers](browser-security-headers.md): static-host header
  guidance and credentialed CORS review notes.
- [Static host headers template](static-host-headers-template.md): adaptable
  static-host header example with placeholder origins only.
- [Supply chain review](supply-chain.md)
- [Threat model](threat-model.md)
- [Theme tokens](theme.md)
- [Development](development.md)

The prototype does not implement recording, browser decryption, key escrow,
playable media export, emergency dispatch, hosted billing, notification
delivery, public admin/operator surfaces, or production safety workflows.
