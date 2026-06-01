import {
  sessionSchema,
  type LoginResponse,
  type Session,
} from "../api/schemas";

const storageKey = "proofline.web-client.session";

let memorySession: Session | null = null;

function shouldUseLocalStorage(): boolean {
  return import.meta.env.VITE_PROOFLINE_SESSION_STORAGE === "localStorage";
}

function hasUsableExpiration(session: Session): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function sessionFromLogin(
  response: LoginResponse,
  mode: Session["mode"],
): Session {
  return {
    sessionId: response.session_id,
    account: response.account,
    token: response.token,
    createdAt: response.created_at,
    expiresAt: response.expires_at,
    mode,
  };
}

export function loadSession(): Session | null {
  if (memorySession) {
    if (!hasUsableExpiration(memorySession)) {
      clearSession();
      return null;
    }
    return memorySession;
  }

  if (!shouldUseLocalStorage() || typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    const parsedSession = sessionSchema.parse(JSON.parse(stored));
    if (!hasUsableExpiration(parsedSession)) {
      clearSession();
      return null;
    }
    memorySession = parsedSession;
    return parsedSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveSession(session: Session): void {
  memorySession = session;

  if (shouldUseLocalStorage() && typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }
}

export function clearSession(): void {
  memorySession = null;

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
  }
}
