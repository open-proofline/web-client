# API Client

The API client supports a configurable base URL through
`VITE_PROOFLINE_API_BASE_URL`.

Default local backend:

```text
http://127.0.0.1:8080
```

## Modes

`VITE_PROOFLINE_API_MODE=mock` is the default bootstrap mode. It uses typed
prototype data so browser smoke tests do not require a live backend.

`VITE_PROOFLINE_API_MODE=live` calls the current server API.

## Confirmed Backend Routes

From current `open-proofline/server` docs and route registration:

- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/account`
- `POST /v1/incidents`
- `GET /v1/incidents/{incident_id}`
- `GET /v1/contact-public-keys`
- `GET /v1/contact-public-keys/{public_key_id}`
- `GET /v1/incidents/{incident_id}/sharing-grants`
- `GET /v1/sharing-grants/{grant_id}`
- `GET /v1/incidents/{incident_id}/wrapped-keys`
- `GET /v1/wrapped-keys/{wrapped_key_id}`

## Unsupported Live Owned Incident List

Current `open-proofline/server` does not expose `GET /v1/incidents`.
Its main route registration mounts `POST /v1/incidents` and
`GET /v1/incidents/{incident_id}`, and its route test expects
`GET /v1/incidents` to return `404`.

The web client therefore does not call `GET /v1/incidents` in live mode. Mock
mode still returns typed prototype incident records for browser smoke tests and
UI review, but those records are not backend truth. Live owned-incident listing
should remain disabled until `open-proofline/server` adds and documents an
account-owned list route.

## Frontend Metadata Boundary

Incident detail parsing keeps browser state focused on public-safe metadata.
If backend chunk responses include private `stored_path` values for upload or
storage internals, the frontend schema does not retain those fields.

## Logging Boundary

The client must not log session tokens, Authorization headers, request bodies,
uploaded bytes, plaintext, raw keys, raw media keys, contact private keys,
wrapped-key ciphertext, object keys, stored paths, private deployment details,
or user safety data.
