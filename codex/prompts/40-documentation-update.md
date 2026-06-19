# Codex Prompt: Documentation Update

Update docs to match current code and project scope.

Do **not** change code unless explicitly requested. Do **not** overpromise
production readiness.

## Docs To Consider

- `README.md`
- `AGENTS.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `docs/README.md`
- `docs/end-user-web-client-design.md`
- `docs/browser-security-headers.md`
- `docs/viewer-token-ui-design.md`
- `docs/architecture.md`
- `docs/api-client.md`
- `docs/security-model.md`
- `docs/threat-model.md`
- `docs/development.md`
- `codex/README.md`
- `codex/prompts/*.md`
- current `open-proofline/website` README and source docs when public voice,
  governance, source-of-truth mapping, or README baseline is involved

## Constraints

- Keep `open-proofline/server` as backend source of truth.
- Keep `open-proofline/website` as the source for public governance,
  political alignment, cooperative/public-good posture, public voice, reusable
  README structure, and source-of-truth mapping.
- Do not describe unimplemented backend routes as confirmed.
- Do not imply recording, browser decryption, trusted-contact decryption, key
  escrow, playable export, emergency dispatch, OAuth, JWT, or production safety
  workflows exist.
- Preserve warnings about emergency reliance and emergency-services
  responsibility.
- Preserve Catalyst licensing boundaries.

## Validation

If only Markdown changed:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

Run frontend validation only if source, route, browser-flow, auth, API-client,
or behavior changed.
