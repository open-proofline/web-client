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
- Treat `open-proofline/website` as source of truth for public governance,
  political alignment, cooperative/public-good posture, public voice, reusable
  README structure, and source-of-truth mapping.
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

Read `README.md`, `AGENTS.md`, `SECURITY.md`, relevant docs, reusable prompts,
source, and tests. When the issue touches public voice, README structure, or
source-of-truth mapping, also inspect the current website source documents.

Before editing, summarize issue goal, acceptance criteria, likely files,
validation commands, out-of-scope items, and security sensitivity.

## Validation

For documentation or reusable-prompt-only changes:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

For frontend source, route, browser-flow, auth, API-client, or behavior changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

Run `npm run test:e2e` when route/browser flows change.
