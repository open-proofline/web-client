# Architecture

The web client is a Vite React TypeScript app.

```mermaid
flowchart LR
    Browser["Browser app"] --> Router["TanStack Router"]
    Browser --> Query["TanStack Query"]
    Query --> Client["Typed API client + Zod validation"]
    Client --> Server["open-proofline/server /v1"]
    Router --> UI["Proofline UI + Catalyst components"]
```

## Boundaries

- The app reviews account and incident metadata.
- The app does not record media.
- The app does not decrypt chunks or unwrap wrapped keys.
- The app does not export playable media.
- The app does not contact emergency services.

`open-proofline/server` remains the source of truth for backend routes,
authorization, encrypted bundle behavior, and security headers.

## Source Layout

- `src/api/`: API client, Zod schemas, and safe error handling
- `src/auth/`: session state and auth hooks
- `src/routes/`: TanStack route definitions
- `src/components/proofline/`: app-specific components
- `src/components/catalyst/`: Catalyst component source used by this app
- `tests/e2e/`: Playwright smoke tests
