# Codex Workflow Prompts

These prompts are reusable scoped workflows for `open-proofline/web-client`.

The web-client repository is frontend-only. `open-proofline/server` remains the
source of truth for current backend behavior, routes, security model, and
deployment constraints.

## Prompts

- `00-project-context-check.md`: read repo context before changes
- `05-codex-change-control.md`: decide whether a task is scoped enough
- `10-frontend-readability-maintenance.md`: maintain frontend readability
- `20-code-review.md`: review current changes
- `30-security-review.md`: review frontend security posture
- `40-documentation-update.md`: update docs without overpromising
- `50-web-security-header-review.md`: review browser security header posture
- `70-work-on-github-issue.md`: work on one issue
- `75-create-draft-pr-from-current-branch.md`: create a draft PR
- `76-request-codex-pr-review.md`: request Codex review
- `80-backlog-scan-issue-drafts.md`: generate backlog drafts
- `81-backlog-drafts-structure-and-hygiene.md`: review draft hygiene
- `82-review-open-issues-for-stale-or-fixed.md`: review open issues
- `85-create-github-issues-from-drafts.md`: prepare issue creation commands
- `90-release-check.md`: pre-release check
- `95-validate-deep-research-report.md`: validate technical review reports

## Standard Validation

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

Run Playwright when route or browser flows change. Do not claim validation
passed unless commands actually ran.
