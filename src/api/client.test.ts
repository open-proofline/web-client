import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { server } from "../test/setup";
import { CredentialModeError, createProoflineApiClient } from "./client";
import { ApiError, safeErrorMessage } from "./errors";

beforeEach(() => {
  vi.stubEnv("VITE_PROOFLINE_AUTH_MODE", "bearer");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("parses live account responses with zod", async () => {
  server.use(
    http.get("*/v1/account", ({ request }) => {
      expect(request.credentials).toBe("omit");
      return HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          email: "live-user@example.invalid",
          email_verified_at: "2026-06-01T00:20:00Z",
          account_state: "active",
          role: "user",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:30:00Z",
          password_changed_at: "2026-06-01T00:15:00Z",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(client.getCurrentAccount()).resolves.toEqual({
    id: "acct_live",
    username: "live-user",
    email: "live-user@example.invalid",
    email_verified_at: "2026-06-01T00:20:00Z",
    account_state: "active",
    role: "user",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:30:00Z",
    password_changed_at: "2026-06-01T00:15:00Z",
  });
});

test("parses cookie login responses without retaining raw tokens", async () => {
  server.use(
    http.post("*/v1/auth/web/login", async ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        username: "cookie-user",
        password: "valid-password",
      });
      return HttpResponse.json(
        {
          session_id: "ses_cookie",
          account: {
            id: "acct_cookie",
            username: "cookie-user",
            role: "user",
          },
          token: "raw-cookie-session-token-must-not-retain",
          created_at: "2026-06-01T00:00:00Z",
          expires_at: "2026-06-01T01:00:00Z",
        },
        { status: 201 },
      );
    }),
    http.get("*/v1/auth/web/csrf", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({
        csrf_token: "csrf-token",
        header_name: "X-CSRF-Token",
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
  });

  const response = await client.login({
    username: "cookie-user",
    password: "valid-password",
  });

  expect(response).toEqual({
    session_id: "ses_cookie",
    account: {
      id: "acct_cookie",
      username: "cookie-user",
      role: "user",
    },
    created_at: "2026-06-01T00:00:00Z",
    expires_at: "2026-06-01T01:00:00Z",
  });
  expect("token" in response).toBe(false);
});

test("uses cookie credentials without authorization headers for authenticated reads", async () => {
  server.use(
    http.get("*/v1/account", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({
        account: {
          id: "acct_cookie",
          username: "cookie-user",
          role: "user",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
  });

  await expect(client.getCurrentAccount()).resolves.toMatchObject({
    id: "acct_cookie",
    username: "cookie-user",
  });
});

test("changes account passwords with bearer authentication", async () => {
  server.use(
    http.post("*/v1/account/password", async ({ request }) => {
      expect(request.credentials).toBe("omit");
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      await expect(request.json()).resolves.toEqual({
        current_password: "current-password",
        new_password: "replacement-password",
      });
      return HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
          password_changed_at: "2026-06-01T00:45:00Z",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(
    client.changePassword({
      currentPassword: "current-password",
      newPassword: "replacement-password",
    }),
  ).resolves.toMatchObject({
    id: "acct_live",
    username: "live-user",
    password_changed_at: "2026-06-01T00:45:00Z",
  });
});

test("attaches cookie CSRF headers to unsafe password-change requests", async () => {
  server.use(
    http.get("*/v1/auth/web/csrf", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({
        csrf_token: "csrf-token",
        header_name: "X-CSRF-Token",
      });
    }),
    http.post("*/v1/account/password", async ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.headers.get("x-csrf-token")).toBe("csrf-token");
      await expect(request.json()).resolves.toEqual({
        current_password: "current-password",
        new_password: "replacement-password",
      });
      return HttpResponse.json({
        account: {
          id: "acct_cookie",
          username: "cookie-user",
          role: "user",
          password_changed_at: "2026-06-01T00:45:00Z",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
  });

  await expect(
    client.changePassword({
      currentPassword: "current-password",
      newPassword: "replacement-password",
    }),
  ).resolves.toMatchObject({
    id: "acct_cookie",
    password_changed_at: "2026-06-01T00:45:00Z",
  });
});

test("attaches cookie CSRF headers to unsafe cookie logout requests", async () => {
  server.use(
    http.get("*/v1/auth/web/csrf", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({
        csrf_token: "csrf-token",
        header_name: "X-CSRF-Token",
      });
    }),
    http.post("*/v1/auth/web/logout", ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.headers.get("x-csrf-token")).toBe("csrf-token");
      return HttpResponse.json({ revoked: true });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
  });

  await expect(client.logout()).resolves.toBeUndefined();
});

test("refreshes cookie CSRF state once after a rejected unsafe request", async () => {
  let csrfFetches = 0;
  let logoutAttempts = 0;
  server.use(
    http.get("*/v1/auth/web/csrf", () => {
      csrfFetches += 1;
      return HttpResponse.json({
        csrf_token: csrfFetches === 1 ? "stale-csrf" : "fresh-csrf",
        header_name: "X-CSRF-Token",
      });
    }),
    http.post("*/v1/auth/web/logout", ({ request }) => {
      logoutAttempts += 1;
      if (logoutAttempts === 1) {
        expect(request.headers.get("x-csrf-token")).toBe("stale-csrf");
        return HttpResponse.json(
          {
            error: {
              code: "csrf_required",
              message: "CSRF token is required",
            },
          },
          { status: 403 },
        );
      }
      expect(request.headers.get("x-csrf-token")).toBe("fresh-csrf");
      return HttpResponse.json({ revoked: true });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
  });

  await expect(client.logout()).resolves.toBeUndefined();
  expect(csrfFetches).toBe(2);
  expect(logoutAttempts).toBe(2);
});

test("rejects mixed cookie mode and bearer tokens before sending authenticated requests", async () => {
  let requestCount = 0;
  server.use(
    http.get("*/v1/account", () => {
      requestCount += 1;
      return HttpResponse.json({
        account: {
          id: "acct_cookie",
          username: "cookie-user",
          role: "user",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    authMode: "cookie",
    getToken: () => "test-session-token",
  });

  await expect(client.getCurrentAccount()).rejects.toBeInstanceOf(
    CredentialModeError,
  );
  expect(requestCount).toBe(0);
});

test("submits public registration and parses accepted responses", async () => {
  server.use(
    http.post("*/v1/auth/register", async ({ request }) => {
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        username: "new-user",
        email: "new-user@example.invalid",
        password: "valid-password",
      });
      return HttpResponse.json(
        {
          status: "verification_required",
          message:
            "If registration can be completed, a verification email will be sent.",
        },
        { status: 202 },
      );
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(
    client.registerAccount({
      username: "new-user",
      email: "new-user@example.invalid",
      password: "valid-password",
    }),
  ).resolves.toEqual({
    status: "verification_required",
    message:
      "If registration can be completed, a verification email will be sent.",
  });
});

test("preserves paid-registration placeholder errors", async () => {
  server.use(
    http.post("*/v1/auth/register", () =>
      HttpResponse.json(
        {
          error: {
            code: "registration_payment_unavailable",
            message: "paid registration is not available",
          },
        },
        { status: 503 },
      ),
    ),
  );

  const client = createProoflineApiClient({ mode: "live" });

  let caughtError: unknown;
  try {
    await client.registerAccount({
      username: "paid-user",
      email: "paid-user@example.invalid",
      password: "valid-password",
    });
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ApiError);
  if (!(caughtError instanceof ApiError)) {
    throw new Error("expected API error");
  }
  expect(caughtError.status).toBe(503);
  expect(caughtError.code).toBe("registration_payment_unavailable");
});

test("preserves disabled registration errors", async () => {
  server.use(
    http.post("*/v1/auth/register", () =>
      HttpResponse.json(
        {
          error: {
            code: "registration_disabled",
            message: "public account registration is disabled",
          },
        },
        { status: 403 },
      ),
    ),
  );

  const client = createProoflineApiClient({ mode: "live" });

  let caughtError: unknown;
  try {
    await client.registerAccount({
      username: "new-user",
      email: "new-user@example.invalid",
      password: "valid-password",
    });
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ApiError);
  if (!(caughtError instanceof ApiError)) {
    throw new Error("expected API error");
  }
  expect(caughtError.status).toBe(403);
  expect(caughtError.code).toBe("registration_disabled");
});

test("preserves registration validation errors", async () => {
  server.use(
    http.post("*/v1/auth/register", () =>
      HttpResponse.json(
        {
          error: {
            code: "invalid_email",
            message: "email is invalid",
          },
        },
        { status: 400 },
      ),
    ),
  );

  const client = createProoflineApiClient({ mode: "live" });

  let caughtError: unknown;
  try {
    await client.registerAccount({
      username: "new-user",
      email: "not-an-address",
      password: "valid-password",
    });
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ApiError);
  if (!(caughtError instanceof ApiError)) {
    throw new Error("expected API error");
  }
  expect(caughtError.status).toBe(400);
  expect(caughtError.code).toBe("invalid_email");
});

test("submits email verification and parses verified responses", async () => {
  server.use(
    http.post("*/v1/auth/email/verify", async ({ request }) => {
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        token: "verification-token",
      });
      return HttpResponse.json({ status: "verified" });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(
    client.verifyAccountEmail({ token: "verification-token" }),
  ).resolves.toEqual({ status: "verified" });
});

test("rejects invalid live account responses with a safe error message", async () => {
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "owner",
        },
      }),
    ),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  let caughtError: unknown;
  try {
    await client.getCurrentAccount();
  } catch (error) {
    caughtError = error;
  }
  expect(caughtError).toBeDefined();
  expect(safeErrorMessage(caughtError)).toBe(
    "The request could not be completed.",
  );
});

test("parses live owned incident list responses without retaining private fields", async () => {
  server.use(
    http.get("*/v1/incidents", ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      return HttpResponse.json({
        incidents: [
          {
            id: "inc_live",
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:10:00Z",
            status: "open",
            client_label: "owner phone",
            incident_mode: "interaction_record",
            capture_profile: "audio_location",
            escalation_policy: "none",
            sharing_state: "private",
            deletion_state: "active",
            owner_account_id: "acct_private",
            notes: "private note",
            stored_path: "incidents/inc_live/private.enc",
            object_key: "private/object/key",
            wrapped_key_ciphertext: "wrapped-ciphertext",
            plaintext: "private plaintext",
            raw_key: "raw-key",
          },
        ],
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  const incidents = await client.listOwnedIncidents();

  expect(incidents).toEqual([
    {
      id: "inc_live",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:10:00Z",
      status: "open",
      client_label: "owner phone",
      incident_mode: "interaction_record",
      capture_profile: "audio_location",
      escalation_policy: "none",
      sharing_state: "private",
      deletion_state: "active",
    },
  ]);
  const incident = incidents[0];
  if (!incident) {
    throw new Error("expected parsed incident");
  }
  expect("owner_account_id" in incident).toBe(false);
  expect("notes" in incident).toBe(false);
  expect("stored_path" in incident).toBe(false);
  expect("object_key" in incident).toBe(false);
  expect("wrapped_key_ciphertext" in incident).toBe(false);
  expect("plaintext" in incident).toBe(false);
  expect("raw_key" in incident).toBe(false);
});

test("returns null when no incident deletion request exists", async () => {
  server.use(
    http.get("*/v1/incidents/inc_live/deletion", ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      return HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      );
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(client.readIncidentDeletion("inc_live")).resolves.toBeNull();
});

test("requests live incident deletion with a safe reason code", async () => {
  server.use(
    http.post("*/v1/incidents/inc_live/deletion", async ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      await expect(request.json()).resolves.toEqual({
        reason_code: "account_delete",
        allow_open: true,
      });
      return HttpResponse.json(
        {
          deletion: {
            decision_id: "del_live",
            incident_id: "inc_live",
            source: "account_request",
            reason_code: "account_delete",
            actor_account_id: "acct_live",
            allow_open: true,
            state: "deletion_pending",
            item_count: 2,
            requested_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:00:00Z",
            stored_path: "incidents/inc_live/private.enc",
            object_key: "private/object/key",
            wrapped_key_ciphertext: "wrapped-ciphertext",
          },
        },
        { status: 202 },
      );
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  const deletion = await client.requestIncidentDeletion("inc_live", {
    reasonCode: "account_delete",
    allowOpen: true,
  });

  expect(deletion).toMatchObject({
    decision_id: "del_live",
    incident_id: "inc_live",
    state: "deletion_pending",
    item_count: 2,
  });
  expect("stored_path" in deletion).toBe(false);
  expect("object_key" in deletion).toBe(false);
  expect("wrapped_key_ciphertext" in deletion).toBe(false);
});

test("creates live contact public keys with only public metadata fields", async () => {
  server.use(
    http.post("*/v1/contact-public-keys", async ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      await expect(request.json()).resolves.toEqual({
        contact_id: "ctc_live",
        display_label: "Trusted contact",
        wrapping_algorithm: "age-v1-x25519",
        public_key: "age1public",
        public_key_fingerprint: "fingerprint-live",
        key_state: "pending_verification",
      });
      return HttpResponse.json(
        {
          contact_public_key: {
            public_key_id: "cpk_live",
            owner_account_id: "acct_live",
            contact_id: "ctc_live",
            version: 2,
            display_label: "Trusted contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key: "age1public",
            public_key_fingerprint: "fingerprint-live",
            key_state: "pending_verification",
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:00:00Z",
            contact_private_key: "must-not-retain",
            raw_media_key: "raw-media-key",
            plaintext: "private plaintext",
            wrapped_key_ciphertext: "wrapped-ciphertext",
            request_body: "private request",
            stored_path: "incidents/inc_live/private.enc",
            object_key: "private/object/key",
          },
        },
        { status: 201 },
      );
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  const contactKey = await client.createContactPublicKey({
    contactId: "ctc_live",
    displayLabel: "Trusted contact",
    wrappingAlgorithm: "age-v1-x25519",
    publicKey: "age1public",
    publicKeyFingerprint: "fingerprint-live",
    keyState: "pending_verification",
  });

  expect(contactKey).toMatchObject({
    public_key_id: "cpk_live",
    contact_id: "ctc_live",
    key_state: "pending_verification",
  });
  expect("contact_private_key" in contactKey).toBe(false);
  expect("raw_media_key" in contactKey).toBe(false);
  expect("plaintext" in contactKey).toBe(false);
  expect("wrapped_key_ciphertext" in contactKey).toBe(false);
  expect("request_body" in contactKey).toBe(false);
  expect("stored_path" in contactKey).toBe(false);
  expect("object_key" in contactKey).toBe(false);
});

test("updates live contact public-key label and state", async () => {
  server.use(
    http.patch("*/v1/contact-public-keys/cpk_live", async ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      await expect(request.json()).resolves.toEqual({
        display_label: "Verified contact",
        key_state: "active",
      });
      return HttpResponse.json({
        contact_public_key: {
          public_key_id: "cpk_live",
          owner_account_id: "acct_live",
          contact_id: "ctc_live",
          version: 1,
          display_label: "Verified contact",
          wrapping_algorithm: "age-v1-x25519",
          public_key: "age1public",
          public_key_fingerprint: "fingerprint-live",
          key_state: "active",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:10:00Z",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(
    client.updateContactPublicKey("cpk_live", {
      displayLabel: "Verified contact",
      keyState: "active",
    }),
  ).resolves.toMatchObject({
    public_key_id: "cpk_live",
    display_label: "Verified contact",
    key_state: "active",
  });
});

test("revokes live contact public keys through the revoke route", async () => {
  server.use(
    http.post("*/v1/contact-public-keys/cpk_live/revoke", ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      return HttpResponse.json({
        contact_public_key: {
          public_key_id: "cpk_live",
          owner_account_id: "acct_live",
          contact_id: "ctc_live",
          version: 1,
          display_label: "Verified contact",
          wrapping_algorithm: "age-v1-x25519",
          public_key: "age1public",
          public_key_fingerprint: "fingerprint-live",
          key_state: "revoked",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:10:00Z",
          revoked_at: "2026-06-01T00:10:00Z",
        },
      });
    }),
  );

  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  await expect(client.revokeContactPublicKey("cpk_live")).resolves.toMatchObject(
    {
      public_key_id: "cpk_live",
      key_state: "revoked",
      revoked_at: "2026-06-01T00:10:00Z",
    },
  );
});
