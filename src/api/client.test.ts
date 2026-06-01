import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { server } from "../test/setup";
import { createProoflineApiClient } from "./client";
import { safeErrorMessage } from "./errors";

test("parses live account responses with zod", async () => {
  server.use(
    http.get("http://127.0.0.1:8080/v1/account", () =>
      HttpResponse.json({
        id: "acct_live",
        username: "live-user",
        role: "user",
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:30:00Z",
        password_changed_at: "2026-06-01T00:15:00Z",
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
    role: "user",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:30:00Z",
    password_changed_at: "2026-06-01T00:15:00Z",
  });
});

test("rejects invalid live account responses with a safe error message", async () => {
  server.use(
    http.get("http://127.0.0.1:8080/v1/account", () =>
      HttpResponse.json({
        id: "acct_live",
        username: "live-user",
        role: "owner",
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
