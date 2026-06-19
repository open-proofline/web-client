# Codex Prompt: Review Open Issues For Stale Or Fixed Work

Review open issues and identify issues that may be fixed, stale, duplicate,
superseded, or still valid.

Do **not** change application code. Do **not** close issues unless explicitly
requested.

## Output Directory

```text
.issue-review-drafts/YYYY-MM-DD/<branch-slug>/
```

## Statuses

- `keep-open`
- `fixed-current-branch-not-merged`
- `close-fixed`
- `close-duplicate`
- `close-superseded`
- `needs-update`
- `needs-human-review`
- `sensitive-do-not-publicly-discuss`

Distinguish current-branch fixes from merged target-branch fixes.
For issues involving public voice, governance, README baseline, or
source-of-truth mapping, verify against current `open-proofline/website`
documents before marking them stale or fixed.

Validation:

```bash
git diff --stat
git diff -- .issue-review-drafts
```
