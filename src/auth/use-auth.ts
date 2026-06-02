import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createProoflineApiClient,
  type ProoflineApiClient,
} from "../api/client";
import { ApiError, safeErrorMessage } from "../api/errors";
import type { Session } from "../api/schemas";
import {
  clearSession,
  loadSession,
  saveSession,
  sessionFromLogin,
} from "./session";

type AuthContextValue = {
  apiClient: ProoflineApiClient;
  session: Session | null;
  isAuthenticated: boolean;
  login: (credentials: {
    username: string;
    password: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; code?: "email_verification_required"; message: string }
  >;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const token = session?.token ?? null;

  const apiClient = useMemo(
    () =>
      createProoflineApiClient({
        getToken: () => token,
      }),
    [token],
  );

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      try {
        const response = await apiClient.login(credentials);
        const nextSession = sessionFromLogin(response, apiClient.mode);
        saveSession(nextSession);
        setSession(nextSession);
        return { ok: true as const };
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === "email_verification_required"
        ) {
          return {
            ok: false as const,
            code: "email_verification_required" as const,
            message:
              "Verify your email address before logging in. Check your verification email for the link.",
          };
        }
        return { ok: false as const, message: safeErrorMessage(error) };
      }
    },
    [apiClient],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } finally {
      clearSession();
      setSession(null);
    }
  }, [apiClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      apiClient,
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [apiClient, session, login, logout],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
