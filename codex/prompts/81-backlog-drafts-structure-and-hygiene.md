# Codex Prompt: Backlog Drafts Structure And Hygiene

Review backlog draft structure and hygiene.

Do **not** change application code. Do **not** create or close GitHub issues.

## Preferred Structure

```text
.backlog-drafts/
  YYYY-MM-DD/
    <branch-slug>/
      README.md
      001-short-kebab-title.md
      create-issues-review.md
      private-notes/
        README.md
```

## Required Public Draft Sections

- `## Priority`
- `## Type`
- `## Labels`
- `## Branch scope`

Every public draft should include the `backlog` label and at least one topic
label. Private notes must not be used for public issue creation.
Public drafts must not include raw tokens, secrets, exploit details, private
deployment details, request bodies, plaintext, raw keys, wrapped-key
ciphertext, stored paths, object keys, or user safety data.

Validate with:

```bash
git diff --stat
git diff -- .backlog-drafts codex/prompts
```
