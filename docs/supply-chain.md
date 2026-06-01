# Supply Chain Review

This repository is the experimental Proofline web client. Supply-chain checks
protect the frontend build and browser bundle, but they do not make the app
production-ready and do not change product boundaries. This repo must not add
backend, mobile, protocol, browser decryption, key unwrapping, recording,
playable export, emergency dispatch, OAuth/JWT, or public admin dashboard
behavior through dependency or workflow changes.

## CI Dependency Audit

CI runs `npm ci` from the committed lockfile and then runs:

```bash
npm run audit
```

The audit script runs `npm audit --audit-level=moderate` against production and
development dependencies. A failing audit should block the PR until the finding
is fixed, removed from the dependency graph, or explicitly triaged with a
security note explaining scope, exploitability, and follow-up.

Local reviewers should also run the audit when `package.json` or
`package-lock.json` changes.

## Package And Lockfile Changes

Package changes should be small and reviewable:

- Commit `package.json` and `package-lock.json` together when dependencies
  change.
- Prefer existing dependencies and browser-native APIs before adding a package.
- Explain why each new runtime dependency belongs in the browser bundle.
- Review package license, maintainer/source, install scripts, transitive size,
  browser permissions, and whether the dependency handles credentials, media,
  keys, uploads, or incident metadata.
- Do not commit `node_modules`, generated package tarballs, or vendored
  third-party source unless a separate licensing and provenance review is
  explicitly scoped.
- Do not add dependency code that introduces recording, capture, browser
  decryption, raw key handling, playable export, emergency dispatch, OAuth/JWT,
  public admin dashboards, or backend behavior without a separate issue and
  threat model.

## GitHub Dependency Review

For pull requests that change dependency manifests or lockfiles, reviewers
should inspect the dependency diff and audit output. If GitHub dependency
review is enabled for the repository, dependency-review results should have no
untriaged vulnerable dependency additions before merge.

This repository does not rely on live backend integration for dependency
review. Mock-backed tests remain the default validation path.

## Workflow Action Pinning

Workflow changes are supply-chain changes and should be reviewed as carefully
as runtime dependencies.

Current CI uses GitHub-owned actions with explicit major-version tags. New
third-party actions should be pinned to a full commit SHA unless there is a
documented reason to use a version tag. Any action that receives write
permissions, secrets, deployment credentials, package-publishing credentials,
or artifact signing material should be pinned to a full commit SHA.

Workflow review expectations:

- Keep `permissions` as narrow as the job allows when adding privileged jobs.
- Prefer GitHub-owned or well-established actions for common setup steps.
- Avoid actions that execute unreviewed install scripts or fetch executable
  code outside the package manager lockfile without a clear reason.
- Document why any new action is needed and what token or secret access it has.
- Re-run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`,
  and `npm run test:e2e` when workflow changes can affect validation behavior.

## Manual Review Checklist

- `npm run audit` passes or has an explicit triage note.
- Dependency diffs are intentional, minimal, and include lockfile updates.
- New packages do not expand Proofline product boundaries incidentally.
- Workflow actions are GitHub-owned version tags or full-SHA pinned according
  to the policy above.
- Workflow jobs do not gain broad repository, secret, or deployment access
  without a scoped review.
