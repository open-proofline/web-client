# Codex Prompt: Validate Deep Research Technical Review Report

Validate and public-harden a technical review report for this repository.

Do **not** change application code. Do **not** create GitHub issues unless
explicitly requested.

## Inputs

Reviewed branch/ref: `<REVIEWED_BRANCH_OR_REF>`

Reviewed commit SHA: `<REVIEWED_COMMIT_SHA>`

Report path: `<REPORT_PATH>`

Output report path:

```text
docs/reports/<YYYY-MM-DD>-proofline-web-client-<TARGET_RELEASE_OR_VERSION>-technical-review.md
```

Issue handling mode: `drafts_only`, `create_issues`, or `none`

## Rules

- Pin citations and report metadata to the reviewed commit.
- Treat `open-proofline/server` as backend source of truth.
- Separate current implementation from future design.
- Keep public wording safe under `SECURITY.md`.
- Do not include raw tokens, secrets, exploit details, private deployment
  details, or user safety data.
- Do not claim production readiness, legal review, audit, browser decryption,
  recording, playable export, or emergency dispatch.

## Validation

If docs only:

```bash
git diff --stat
git diff -- docs .backlog-drafts
```

If code changed unexpectedly, stop and explain why.
