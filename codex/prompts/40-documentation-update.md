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
- `docs/architecture.md`
- `docs/api-client.md`
- `docs/security-model.md`
- `docs/threat-model.md`
- `docs/development.md`
- `codex/README.md`
- `codex/prompts/*.md`

## Constraints

- Keep `open-proofline/server` as backend source of truth.
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
git diff --stat
git diff -- README.md AGENTS.md SECURITY.md CHANGELOG.md docs codex
```

Run frontend validation only if code changed.
