# Codex Prompt: Create Draft Pull Request From Current Branch

Prepare a draft PR for the current branch.

Do **not** change application code. Do **not** merge. Do **not** mark ready for
review unless explicitly requested.

## Inputs

Target base branch: `<TARGET_BASE_BRANCH>`

Issue number, if any: `<ISSUE_NUMBER>`

## Checks

```bash
git status --short --branch --untracked-files=all
CURRENT_BRANCH="$(git branch --show-current)"
git rev-parse HEAD
git fetch origin "<TARGET_BASE_BRANCH>"
git diff --stat "origin/<TARGET_BASE_BRANCH>..."
git diff "origin/<TARGET_BASE_BRANCH>..."
```

Do not create a PR if the branch is the same as the base, the base does not
exist, the diff has unrelated changes, or the base was inferred ambiguously.

## Validation Before PR

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

## PR Creation

```bash
git push -u origin "$CURRENT_BRANCH"
gh pr create --repo open-proofline/web-client --base "<TARGET_BASE_BRANCH>" --head "$CURRENT_BRANCH" --draft
```

Include summary, validation, and security/scope notes.
