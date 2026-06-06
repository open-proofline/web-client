# Static Host Headers Template

This template is a deployment-review starting point for static hosts, CDNs, or
reverse proxies that serve the built Proofline web-client assets. It is not a
drop-in production approval and does not approve public backend `/v1` exposure.

Use placeholder origins in committed examples. Replace them only in private
deployment configuration after reviewing the final static app origin, API
origin, cookie/CORS mode, proxy routing, and backend deployment boundary.

## Scope

Apply these headers only to the static web-client host that serves the Vite
build output. Do not apply this file to the backend API listener, the
private-admin listener, `/admin`, `/v1/admin/...`, token-bearing viewer paths,
or authenticated API responses.

Static host headers do not implement backend behavior, deploy the site, enable
browser recording, enable browser decryption, enable payment flows, or provide
emergency response. The web client remains experimental and not for emergency
reliance.

## Adaptable `_headers`-Style Template

The format below matches the common `_headers` shape used by several static
hosts. If your host uses a different format, copy the header names and values
into that platform's reviewed configuration syntax instead of committing
private deployment details.

```text
# Static Proofline web-client HTML and route fallbacks.
# Replace https://api.example.invalid only in private deployment config after
# reviewing the exact API origin in open-proofline/server and deployment docs.
/*
  Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.example.invalid
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), display-capture=(), payment=(), usb=(), serial=(), bluetooth=(), midi=(), clipboard-read=(), clipboard-write=()
  X-Frame-Options: DENY
  Cache-Control: no-store

# Hashed Vite assets may use long-lived immutable caching.
/assets/*
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

# Optional deployment-edge HTTPS policy for reviewed public hostnames only.
# Do not set HSTS on localhost, temporary preview domains, or before every
# subdomain under the hostname is ready for HTTPS-only access.
# /*
#   Strict-Transport-Security: max-age=31536000; includeSubDomains
```

If the API is served from the same reviewed origin as the static app,
`connect-src 'self'` may be sufficient. If the API is on a separate origin,
list only that exact reviewed origin. Do not use wildcard API origins for
credentialed browser-cookie requests.

## Review Notes

- Keep `frame-ancestors 'none'` and `X-Frame-Options: DENY` unless a separate
  product review approves embedding.
- Keep camera, microphone, geolocation, display capture, payment, USB, serial,
  Bluetooth, MIDI, and clipboard permissions denied by default.
- Keep `Referrer-Policy: no-referrer` so route paths and query strings are not
  sent to other origins.
- Review CSP in `Content-Security-Policy-Report-Only` mode before enforcing it
  on a new deployment.
- Do not add inline script allowances, broad `*` sources, unreviewed analytics,
  or third-party origins without a separate security note.
- Keep HTML and route fallback responses on `no-store` or another short
  revalidation policy so users receive security wording and route changes
  promptly.
- Do not use static asset cache rules for account, incident, token, or API
  responses. Those responses need server-side cache policy.
- Do not route private admin surfaces such as `/admin` or `/v1/admin/...`
  through the public static host.

## Not Covered

This template does not cover:

- public `/v1` exposure approval;
- credentialed CORS approval;
- CSRF header-name review;
- browser-cookie attribute review;
- TLS certificate or HSTS preload review;
- backend rate limits, abuse controls, logging, or operations;
- deploy automation or live deployment;
- production readiness.
