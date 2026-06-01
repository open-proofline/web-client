# Codex Prompt: Prepare GitHub Issue Creation Commands From Drafts

Read reviewed backlog drafts and generate a script that can create issues with
GitHub CLI.

Do **not** create issues unless explicitly told to run commands. Do **not**
include sensitive details in public issues.

## Script

Create:

```text
scripts/create-backlog-issues.sh
```

Use `open-proofline/web-client`.

## Requirements

- Choose an explicit or newest branch-scoped `.backlog-drafts/` directory.
- Exclude private notes.
- Verify each draft has priority, type, labels, and branch scope.
- Verify labels exist with `gh label list --repo open-proofline/web-client`.
- Use one `--label` argument per label.
- Do not silently drop labels or create unlabeled issues.
- Preserve branch-scope notes in issue bodies.
