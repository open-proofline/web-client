import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Session } from "../api/schemas";
import {
  clearSession,
  loadSession,
  saveSession,
  sessionFromLogin,
} from "./session";

const storageKey = "proofline.web-client.session";
const now = new Date("2026-06-01T00:00:00Z");

function session(overrides: Partial<Session> = {}): Session {
  return {
    sessionId: "ses_test",
    account: {
      id: "acct_test",
      username: "test-user",
      role: "user",
    },
    token: "test-session-token",
    createdAt: "2026-06-01T00:00:00Z",
    expiresAt: "2026-06-01T01:00:00Z",
    mode: "mock",
    authMode: "bearer",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  clearSession();
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test("returns null when no persisted session is present", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");

  expect(loadSession()).toBeNull();
});

test("loads a valid unexpired local-storage session", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");
  const validSession = session();
  window.localStorage.setItem(storageKey, JSON.stringify(validSession));

  expect(loadSession()).toEqual(validSession);
  expect(window.localStorage.getItem(storageKey)).not.toBeNull();
});

test("clears expired local-storage sessions on load", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(session({ expiresAt: "2026-05-31T23:59:59Z" })),
  );

  expect(loadSession()).toBeNull();
  expect(window.localStorage.getItem(storageKey)).toBeNull();
});

test("clears malformed local-storage session expirations on load", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(session({ expiresAt: "not-a-date" })),
  );

  expect(loadSession()).toBeNull();
  expect(window.localStorage.getItem(storageKey)).toBeNull();
});

test("clears expired memory sessions on load", () => {
  saveSession(session({ expiresAt: "2026-05-31T23:59:59Z" }));

  expect(loadSession()).toBeNull();
});

test("loads legacy bearer sessions without an explicit auth mode", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");
  const legacySession = session();
  const storedSession: Partial<Session> = { ...legacySession };
  delete storedSession.authMode;
  window.localStorage.setItem(storageKey, JSON.stringify(storedSession));

  expect(loadSession()).toEqual(legacySession);
});

test("rejects persisted cookie sessions that contain bearer tokens", () => {
  vi.stubEnv("VITE_PROOFLINE_SESSION_STORAGE", "localStorage");
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(session({ authMode: "cookie" })),
  );

  expect(loadSession()).toBeNull();
  expect(window.localStorage.getItem(storageKey)).toBeNull();
});

test("creates bearer sessions with tokens from bearer login responses", () => {
  expect(
    sessionFromLogin(
      {
        session_id: "ses_live",
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
        },
        token: "bearer-token",
        created_at: "2026-06-01T00:00:00Z",
        expires_at: "2026-06-01T01:00:00Z",
      },
      "live",
      "bearer",
    ),
  ).toMatchObject({
    sessionId: "ses_live",
    token: "bearer-token",
    mode: "live",
    authMode: "bearer",
  });
});

test("creates cookie sessions without bearer tokens", () => {
  const cookieSession = sessionFromLogin(
    {
      session_id: "ses_cookie",
      account: {
        id: "acct_cookie",
        username: "cookie-user",
        role: "user",
      },
      created_at: "2026-06-01T00:00:00Z",
      expires_at: "2026-06-01T01:00:00Z",
    },
    "live",
    "cookie",
  );

  expect(cookieSession).toMatchObject({
    sessionId: "ses_cookie",
    mode: "live",
    authMode: "cookie",
  });
  expect("token" in cookieSession).toBe(false);
});
