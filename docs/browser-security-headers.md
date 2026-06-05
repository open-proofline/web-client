# Browser Security Headers

This page documents a recommended browser-facing header posture for deploying
the experimental web client as static assets. These headers are deployment
guidance only. They do not make the app production-ready, do not replace a
frontend threat model, and do not change the current product boundaries.

The web client does not implement recording, browser decryption, key escrow,
raw key storage, playable media export, emergency dispatch, or production
safety workflows. Users and trusted contacts remain responsible for contacting
emergency services.

## Scope

Apply these headers at the static web-client host, CDN, or reverse proxy that
serves the built React assets. Development servers and local previews may need
different headers for hot reload, source maps, or localhost API access.

Do not treat static web-client header configuration as backend `/v1` exposure
approval. Backend behavior and public API readiness remain governed by
`open-proofline/server`. Public routing for `/v1`, especially `/v1/admin/...`,
requires separate server, deployment, abuse-control, credential-storage, CSRF,
logging, and operations review.

If the web client uses the server browser-session cookie mode, static hosting
review must also cover credentialed CORS. The API origin must be an exact
reviewed origin configured in `open-proofline/server`; wildcard origins are not
acceptable for credentialed requests.

## Recommended Starting Set

Use exact origins for the deployed static site and reviewed API origin. If the
API is served from the same origin, `connect-src 'self'` may be enough. If the
API is on a separate origin, add only that reviewed origin.

```http
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.example.invalid
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), display-capture=(), payment=(), usb=(), serial=(), bluetooth=(), midi=(), clipboard-read=(), clipboard-write=()
X-Frame-Options: DENY
```

Review CSP in `Content-Security-Policy-Report-Only` mode before enforcing it
for a new deployment. Do not weaken the policy with broad `*`, unreviewed
third-party origins, or inline script allowances unless that exception has a
specific review note.

## Header Notes

### Content Security Policy

CSP should default to same-origin assets and a reviewed API origin. The current
Vite build emits static JavaScript and CSS assets, so production deployments
should not need inline scripts. Keep `object-src 'none'`, `base-uri 'none'`,
and `frame-ancestors 'none'` unless a separately reviewed product requirement
changes the browser embedding model.

`connect-src` is the key boundary between the static app and backend APIs. Do
not add public `/v1` origins casually. The current backend source of truth is
`open-proofline/server`, and this web client must not claim broader backend
readiness than the server docs and deployment review support.

### Credentialed CORS And CSRF

The current implementation uses bearer-token live auth by default and supports
an explicit browser-cookie auth mode. Cookie mode sends
`credentials: "include"` only to the reviewed API origin, does not attach an
`Authorization` header, and attaches the server-provided CSRF header to unsafe
cookie-authenticated requests.

Static headers cannot make credentialed CORS safe by themselves. Server
configuration must use exact allowed origins, secure cookie settings for public
HTTPS origins, and the reviewed CSRF header name. Do not enable wildcard CORS,
do not proxy private admin routes through the public web origin, and do not
document cookie mode as production-ready without a separate deployment review.

### Content Sniffing

`X-Content-Type-Options: nosniff` should be set on HTML, JavaScript, CSS, and
other static assets so browsers do not reinterpret asset types.

### Referrer Policy

`Referrer-Policy: no-referrer` is the conservative default for this prototype.
It avoids sending route paths or query strings to other origins. If analytics
or support tooling is later added, revisit this choice before deployment.

### Permissions Policy

The current web client does not record, capture camera or microphone input,
read location, or perform payment flows. Deny those browser capabilities by
default through `Permissions-Policy`. Any future recording, capture, location,
payment, clipboard, or device access must be separately scoped, threat-modeled,
and reviewed before the policy is relaxed.

### Frame Restrictions

Use `frame-ancestors 'none'` in CSP and `X-Frame-Options: DENY` for legacy
browser defense. The app is not designed to be embedded in another site.

### Cache Expectations

Static hashed assets can use long-lived immutable caching:

```http
Cache-Control: public, max-age=31536000, immutable
```

Serve `index.html`, service-level error pages, and any non-hashed asset with a
short revalidation policy or `no-store` so users receive security wording and
route changes promptly:

```http
Cache-Control: no-store
```

Do not use static asset cache rules for authenticated `/v1` API responses.
Backend responses that include account or incident metadata require their own
server-side cache policy.

### HTTPS And HSTS

Serve deployed public origins only over HTTPS. HSTS belongs at the TLS
terminator, CDN, or reverse proxy for the final production hostname after
subdomain and preload implications are reviewed:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Do not set HSTS on localhost or temporary preview domains. Do not use
`includeSubDomains` until every subdomain under the production domain is ready
for HTTPS-only access.

## Review Checklist

- CSP names only the static origin and reviewed API origin.
- Credentialed CORS, if used, is limited to exact reviewed origins and not `*`.
- Cookie-auth requests do not also attach bearer credentials.
- Unsafe cookie-auth requests attach the reviewed CSRF header.
- No public edge routes private admin surfaces such as `/v1/admin/...`.
- `nosniff`, referrer policy, permissions policy, and frame restrictions are
  present on the static app.
- Cache rules distinguish hashed static assets from HTML, error pages, and API
  responses.
- HSTS is configured only at the HTTPS edge for reviewed hostnames.
- UI and deployment docs still state that the app is experimental and not for
  emergency reliance.
