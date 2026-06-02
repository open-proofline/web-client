import {
  Link as RouterLink,
  Navigate,
  createRoute,
} from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ApiError } from "../api/errors";
import { useAuth } from "../auth/use-auth";
import { Button } from "../components/catalyst/button";
import {
  Description,
  ErrorMessage,
  Field,
  FieldGroup,
  Label,
} from "../components/catalyst/fieldset";
import { Input } from "../components/catalyst/input";
import { rootRoute } from "./__root";

type RegistrationResult =
  | { state: "idle" }
  | { state: "accepted"; message: string }
  | { state: "error"; message: string };

const minPasswordBytes = 12;
const maxPasswordBytes = 72;
const maxEmailBytes = 254;
const emailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRequirements = "Password must be 12 to 72 bytes. Longer non-ASCII passwords may use more than one byte per character.";

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function emailValidationMessage(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === "") {
    return "Enter a valid email address like example@example.com";
  }
  if (byteLength(normalizedEmail) > maxEmailBytes) {
    return "Email must be at most 254 bytes.";
  }
  if ([...normalizedEmail].some((character) => character.charCodeAt(0) > 127)) {
    return "Enter a valid email address like example@example.com.";
  }
  if (!emailAddressPattern.test(normalizedEmail)) {
    return "Enter a valid email address like example@example.com";
  }
  return null;
}

function passwordValidationMessage(password: string): string | null {
  const length = byteLength(password);

  if (length < minPasswordBytes) {
    return `Password must be at least ${minPasswordBytes} bytes.`;
  }
  if (length > maxPasswordBytes) {
    return `Password must be at most ${maxPasswordBytes} bytes.`;
  }
  return null;
}

function registrationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Registration could not be completed.";
  }

  switch (error.code) {
    case "registration_disabled":
      return "Public registration is not enabled for this deployment.";
    case "registration_payment_unavailable":
      return "Paid registration is not available in this prototype. No payment was started.";
    case "invalid_username":
      return "Use a username that meets the server requirements.";
    case "invalid_email":
      return "Enter a valid email address.";
    case "invalid_password":
      return "Use a password that meets the server requirements.";
    default:
      return "Registration could not be completed.";
  }
}

function RegisterPage() {
  const { apiClient, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<RegistrationResult>({
    state: "idle",
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({ state: "idle" });

    const emailValidation = emailValidationMessage(email);
    const passwordValidation = passwordValidationMessage(password);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    if (emailValidation !== null || passwordValidation !== null) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.registerAccount({
        username,
        email,
        password,
      });
      setResult({ state: "accepted", message: response.message });
    } catch (error) {
      setResult({ state: "error", message: registrationErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-proofline-border bg-proofline-surface p-6 shadow-lg shadow-proofline-bg-deep/20">
      <div>
        <p className="text-sm font-medium text-proofline-text-muted">
          Proofline Web Client
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-proofline-text">
          Create account
        </h1>
        <p className="mt-2 text-sm text-proofline-text-secondary">
          This prototype uses {apiClient.mode} API mode. Registration creates
          no browser session; verify your email before logging in.
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
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              pattern={emailAddressPattern.source}
              value={email}
              invalid={emailError !== null}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError !== null) {
                  setEmailError(emailValidationMessage(event.target.value));
                }
              }}
              onInvalid={(event) => {
                event.preventDefault();
                setEmailError(emailValidationMessage(email));
              }}
              required
            />
            {emailError !== null ? <ErrorMessage>{emailError}</ErrorMessage> : null}
          </Field>
          <Field>
            <Label>Password</Label>
            <Description>{passwordRequirements}</Description>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              invalid={passwordError !== null}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError !== null) {
                  setPasswordError(passwordValidationMessage(event.target.value));
                }
              }}
              required
            />
            {passwordError !== null ? (
              <ErrorMessage>{passwordError}</ErrorMessage>
            ) : null}
          </Field>
        </FieldGroup>

        {result.state === "accepted" ? (
          <div
            role="status"
            className="mt-4 rounded-md border border-proofline-success/40 bg-proofline-success-bg p-3 text-sm text-proofline-success"
          >
            <p>Check your email to continue.</p>
            <p className="mt-2 text-proofline-text-secondary">
              {result.message}
            </p>
          </div>
        ) : null}

        {result.state === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
          >
            {result.message}
          </p>
        ) : null}

        <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-proofline-text-secondary">
        Already have an account?{" "}
        <RouterLink
          to="/login"
          className="font-medium text-proofline-text underline underline-offset-4 focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
        >
          Log in
        </RouterLink>
        .
      </p>
    </section>
  );
}

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});
