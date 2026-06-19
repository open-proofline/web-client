# Codex Prompt: Change-Control Check

Review a requested task before implementation.

Do **not** change code or docs unless explicitly asked.

## Global Constraints

- Keep changes scoped.
- Do not claim production readiness.
- Do not implement backend features here.
- Do not add recording, browser decryption, key unwrapping, key escrow,
  backend decryption, break-glass access, playable export, emergency dispatch,
  OAuth, JWT, push/SMS/Messenger notifications, public admin dashboards, mobile
  client code, or protocol repository behavior unless explicitly scoped.
- Do not log raw tokens, Authorization headers, request bodies, plaintext, raw
  keys, raw media keys, wrapped-key ciphertext, verification credentials,
  stored paths, object keys, private deployment details, or user safety data.
- Preserve Tailwind Catalyst licensing boundaries.
- Treat `open-proofline/server` as backend source of truth.
- Treat `open-proofline/website` as source of truth for public governance,
  political alignment, cooperative/public-good posture, public voice, reusable
  README structure, and source-of-truth mapping.

## Check

Assess whether the task has a clear goal, affected files, validation commands,
out-of-scope items, and a clean enough working tree.

For documentation or reusable-prompt-only tasks, prefer:

```bash
npx prettier --check \
  README.md AGENTS.md SECURITY.md CHANGELOG.md \
  docs/*.md codex/*.md codex/prompts/*.md
git diff --check
```

For frontend behavior, route, auth, API-client, or browser-flow changes, use
the full web-client validation stack.

Return one of:

- `Ready`
- `Needs clarification`
- `Create backlog item`
- `Sensitive security handling`
- `Browser/key custody design required`

Include likely validation commands and the next prompt to use.
