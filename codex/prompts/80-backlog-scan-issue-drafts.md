# Codex Prompt: Backlog Scan And Issue Drafts

Scan the repository and create branch-scoped backlog issue drafts.

Do **not** change application code. Do **not** create GitHub issues directly.

## Output Directory

```text
.backlog-drafts/YYYY-MM-DD/<branch-slug>/
```

## Inspect

- `README.md`, `AGENTS.md`, `SECURITY.md`, `CHANGELOG.md`
- `docs/`
- `src/api`, `src/auth`, `src/routes`, `src/components`
- `tests/`
- `.github/workflows`
- `codex/prompts`
- open issues, PRs, and labels when `gh` is available

## Candidate Areas

Correctness, security hardening, accessibility, frontend testing gaps,
documentation gaps, deployment/header guidance, dependency review, API route
confirmation against `open-proofline/server`, Catalyst licensing hygiene, and
Codex workflow improvements.

Never include raw tokens, secrets, exploit details, private deployment details,
or user safety data in public issue drafts.
