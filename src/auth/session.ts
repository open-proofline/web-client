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
    memorySession = sessionSchema.parse(JSON.parse(stored));
    return memorySession;
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
