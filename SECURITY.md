# Security Policy

Proofline Web Client is experimental and not production-ready.

Do not report security vulnerabilities through public GitHub issues. Use GitHub
private vulnerability reporting where available, and keep sensitive details out
of public issues, PRs, docs, prompts, screenshots, logs, and examples.

Do not report real secrets, raw session tokens, browser session cookies, CSRF
tokens, raw viewer tokens, token-bearing viewer links, Authorization headers,
request bodies, uploaded bytes, plaintext, raw keys, raw media keys, contact
private keys, wrapped-key ciphertext, verification credentials, stored paths,
object keys, private deployment details, exploit details, or user safety data in
public issues.

Backend security issues may belong in
[`open-proofline/server`](https://github.com/open-proofline/server). Web-client
issues involving XSS, dependency risk, browser token handling, local storage,
browser-cookie auth, CSRF handling, credentialed CORS, or UI disclosure should
be handled carefully and without public sensitive details.

Project-wide governance, public-good posture, and public voice belong in
[`open-proofline/website`](https://github.com/open-proofline/website). They are
not a substitute for component-specific security review.

This repo does not implement recording, browser decryption, backend decryption,
trusted-contact decryption, key escrow, playable media export, emergency
dispatch, or production safety workflows.
