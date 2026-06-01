import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Session } from "../api/schemas";
import { clearSession, loadSession, saveSession } from "./session";

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
