# Codex Prompt: Project Context Check

Read current project context before making changes.

Do **not** change files. Do **not** add features.

## Source Of Truth

Read relevant local files first:

- `README.md`
- `AGENTS.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `docs/README.md`
- relevant `docs/` files
- relevant source, route, API, auth, and test files
- relevant issue or PR

For backend facts, treat `open-proofline/server` as the external source of
truth. Do not turn server planning docs into web-client implementation claims.

## Output

Return:

1. current web-client scope
2. current frontend surfaces
3. backend assumptions that need server-doc confirmation
4. security boundaries and non-goals
5. likely affected files
6. files or areas that must not change
7. likely validation commands
8. recommended next reusable prompt
9. clarifying questions only if required
