# Codex Prompt: Work On GitHub Issue

Work on one issue in `open-proofline/web-client`.

## Inputs

Issue number: `<ISSUE_NUMBER>`

Target base branch: `<TARGET_BASE_BRANCH>`

## Rules

- Use the current checked-out branch unless the maintainer asked otherwise.
- Do not create a PR unless explicitly requested.
- Keep the change scoped to the issue.
- Treat `open-proofline/server` as backend source of truth.
- If security-sensitive, stop and say whether public issue handling is
  appropriate.
- Do not add unrelated features or production-readiness claims.

## First Steps

```bash
git status --short --branch --untracked-files=all
git branch --show-current
git rev-parse HEAD
git fetch origin "<TARGET_BASE_BRANCH>"
gh issue view <ISSUE_NUMBER> --repo open-proofline/web-client
```

Read `README.md`, `AGENTS.md`, `SECURITY.md`, relevant docs, source, and tests.

Before editing, summarize issue goal, acceptance criteria, likely files,
validation commands, out-of-scope items, and security sensitivity.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run `npm run test:e2e` when route/browser flows change.
