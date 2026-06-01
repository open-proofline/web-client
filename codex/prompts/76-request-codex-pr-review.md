# Codex Prompt: Request Codex Review On Pull Request

Use when a draft PR exists and should be reviewed by Codex.

## Inputs

Pull request number: `<PR_NUMBER>`

Expected base branch: `<EXPECTED_BASE_BRANCH>`

## First Steps

```bash
gh pr view <PR_NUMBER> --repo open-proofline/web-client --json number,title,state,isDraft,baseRefName,headRefName,statusCheckRollup,url
```

Confirm the actual base and head branches. Stop if the base does not match the
expected base.

## PR Comment

Post only after confirming the base:

```md
@codex review

Please review this PR for correctness, security, scope control, tests, and
consistency with README.md, AGENTS.md, SECURITY.md, and relevant docs.

Focus on frontend route behavior, API client assumptions against
open-proofline/server, token handling, no secret logging, no browser decryption
or key unwrapping, Catalyst licensing boundaries, and validation results.
```

Do not merge, approve, or mark ready for review.
