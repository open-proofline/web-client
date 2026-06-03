import {
  Link as RouterLink,
  Navigate,
  createRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/use-auth";
import { rootRoute } from "./__root";
import { AuthScreen } from "../components/proofline/AuthScreen";
import { Button } from "../components/catalyst/button";
import { Field, FieldGroup, Label } from "../components/catalyst/fieldset";
import { Input } from "../components/catalyst/input";

type LoginErrorState = {
  message: string;
  code?: "email_verification_required";
};

function LoginPage() {
  const { login, isAuthenticated, apiClient } = useAuth();
  const navigate = useNavigate();
  const isMockMode = apiClient.mode === "mock";
  const [username, setUsername] = useState(() =>
    isMockMode ? "prototype-user" : "",
  );
  const [password, setPassword] = useState(() =>
    isMockMode ? "prototype-password" : "",
  );
  const [error, setError] = useState<LoginErrorState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmailVerificationRequired =
    error?.code === "email_verification_required";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login({ username, password });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(
        result.code
          ? { message: result.message, code: result.code }
          : { message: result.message },
      );
      return;
    }
    await navigate({ to: "/" });
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <AuthScreen
      title="Sign in"
      showBranding={false}
      lead={
        apiClient.mode === "mock"
          ? "Sample mode fills test credentials and uses sample records only."
          : "Access your Proofline account to review incident records and manage your account."
      }
      footer={
        <>
          Need an account?{" "}
          <RouterLink
            to="/register"
            className="font-medium text-proofline-text underline underline-offset-4 focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
          >
            Create account
          </RouterLink>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <Label>Username</Label>
            <Input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </Field>
          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
        </FieldGroup>

        {error ? (
          <div
            role="alert"
            className={
              isEmailVerificationRequired
                ? "mt-4 rounded-md border border-proofline-warning/40 bg-proofline-warning-bg p-3 text-sm text-proofline-warning"
                : "mt-4 rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
            }
          >
            <p>{error.message}</p>
            {isEmailVerificationRequired ? (
              <p className="mt-2 text-proofline-text-secondary">
                If you already have a verification link, open it in this browser
                or go to the{" "}
                <RouterLink
                  to="/verify-email"
                  className="font-medium text-proofline-text underline underline-offset-4 focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                >
                  email verification page
                </RouterLink>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </AuthScreen>
  );
}

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
