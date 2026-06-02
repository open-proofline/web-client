import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { server } from "../test/setup";
import {
  createProoflineApiClient,
  isUnsupportedLiveRouteError,
  ownedIncidentListRoute,
} from "./client";
import { ApiError, safeErrorMessage } from "./errors";

test("parses live account responses with zod", async () => {
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
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
      }),
    ),
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

test("does not call an unconfirmed live owned incident list route", async () => {
  const client = createProoflineApiClient({
    mode: "live",
    getToken: () => "test-session-token",
  });

  let caughtError: unknown;
  try {
    await client.listOwnedIncidents();
  } catch (error) {
    caughtError = error;
  }

  expect(isUnsupportedLiveRouteError(caughtError, ownedIncidentListRoute)).toBe(
    true,
  );
});
