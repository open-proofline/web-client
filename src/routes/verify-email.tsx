import { createRoute } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "../auth/use-auth";
import { AuthScreen } from "../components/proofline/AuthScreen";
import { Button } from "../components/catalyst/button";
import { rootRoute } from "./__root";

type VerificationState = "checking" | "missing" | "verified" | "invalid";

function readVerificationTokenFromHash(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash.replace(/^#/, "");
  const token = new URLSearchParams(hash).get("token")?.trim();
  return token ? token : null;
}

function clearLocationHash(): void {
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function VerifyEmailPage() {
  const { apiClient } = useAuth();
  const [state, setState] = useState<VerificationState>(() =>
    readVerificationTokenFromHash() ? "checking" : "missing",
  );
  const hasStarted = useRef(false);

  useLayoutEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;

    const token = readVerificationTokenFromHash();
    clearLocationHash();

    if (!token) {
      return;
    }

    void apiClient
      .verifyAccountEmail({ token })
      .then(() => {
        setState("verified");
      })
      .catch(() => {
        setState("invalid");
      });
  }, [apiClient]);

  return (
    <AuthScreen
      title="Verify email"
      lead="Proofline reads the verification credential from the link, submits it once, and clears the browser URL fragment."
    >
      {state === "checking" ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-proofline-border bg-proofline-surface-elevated p-3 text-sm text-proofline-text-secondary"
        >
          Checking your verification link.
        </p>
      ) : null}

      {state === "verified" ? (
        <div
          role="status"
          className="mt-4 rounded-md border border-proofline-success/40 bg-proofline-success-bg p-3 text-sm text-proofline-success"
        >
          <p>Your email address has been verified.</p>
          <p className="mt-2 text-proofline-text-secondary">
            You can now log in with your account credentials.
          </p>
        </div>
      ) : null}

      {state === "missing" ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-proofline-warning/40 bg-proofline-warning-bg p-3 text-sm text-proofline-warning"
        >
          This verification link is missing its verification credential.
        </p>
      ) : null}

      {state === "invalid" ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
        >
          This verification link is invalid or has expired.
        </p>
      ) : null}

      <Button href="/login" className="mt-6 w-full">
        Go to login
      </Button>
    </AuthScreen>
  );
}

export const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
});
