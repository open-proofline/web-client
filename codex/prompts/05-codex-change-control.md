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
  keys, raw media keys, wrapped-key ciphertext, private deployment details, or
  user safety data.
- Preserve Tailwind Catalyst licensing boundaries.
- Treat `open-proofline/server` as backend source of truth.

## Check

Assess whether the task has a clear goal, affected files, validation commands,
out-of-scope items, and a clean enough working tree.

Return one of:

- `Ready`
- `Needs clarification`
- `Create backlog item`
- `Sensitive security handling`
- `Browser/key custody design required`

Include likely validation commands and the next prompt to use.
