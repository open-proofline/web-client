import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/use-auth";
import { rootRoute } from "./__root";
import { Button } from "../components/catalyst/button";
import { Field, FieldGroup, Label } from "../components/catalyst/fieldset";
import { Input } from "../components/catalyst/input";

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login({ username, password });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await navigate({ to: "/" });
  }

  if (isAuthenticated) {
    void navigate({ to: "/" });
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-proofline-border bg-proofline-surface p-6 shadow-lg shadow-proofline-bg-deep/20">
      <div>
        <p className="text-sm font-medium text-proofline-text-muted">
          Proofline Web Client
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-proofline-text">
          Log in
        </h1>
        <p className="mt-2 text-sm text-proofline-text-secondary">
          This prototype uses {apiClient.mode} API mode. Browser token
          persistence is memory-only unless explicitly configured for local
          development.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
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
          <p
            role="alert"
            className="mt-4 rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in" : "Log in"}
        </Button>
      </form>
    </section>
  );
}

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
