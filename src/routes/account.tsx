import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, createRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ApiError } from "../api/errors";
import { prooflineQueryKeys } from "../api/client";
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
import {
  ContentSection,
  InlineStatus,
  PageHeader,
} from "../components/proofline/Layout";
import { MetadataGrid } from "../components/proofline/MetadataGrid";
import { StatusBadge } from "../components/proofline/StatusBadge";
import { rootRoute } from "./__root";

type PasswordChangeResult =
  | { state: "idle" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const minPasswordBytes = 12;
const maxPasswordBytes = 72;
const passwordRequirements =
  "Choose a new password between 12 to 72 characters.";

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
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

function passwordChangeErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Password could not be changed.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "Current password was not accepted.";
    case "invalid_password":
      return "Use a new password that meets the server requirements.";
    case "authentication_required":
      return "Sign in again before changing your password.";
    default:
      return "Password could not be changed.";
  }
}

function AccountPage() {
  const { isAuthenticated, apiClient, changePassword, session } = useAuth();
  const queryClient = useQueryClient();
  const accountQueryKey = prooflineQueryKeys.account(
    session?.sessionId ?? "signed-out",
  );
  const account = useQuery({
    queryKey: accountQueryKey,
    queryFn: () => apiClient.getCurrentAccount(),
    enabled: isAuthenticated && session !== null,
  });
  const passwordChange = useMutation({
    mutationFn: changePassword,
    onSuccess: (updatedAccount) => {
      queryClient.setQueryData(accountQueryKey, updatedAccount);
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState<
    string | null
  >(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [result, setResult] = useState<PasswordChangeResult>({
    state: "idle",
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({ state: "idle" });

    const currentValidation =
      currentPassword === "" ? "Enter your current password." : null;
    const passwordValidation = passwordValidationMessage(newPassword);
    const confirmationValidation =
      confirmPassword !== newPassword ? "New passwords must match." : null;

    setCurrentPasswordError(currentValidation);
    setNewPasswordError(passwordValidation);
    setConfirmPasswordError(confirmationValidation);
    if (
      currentValidation !== null ||
      passwordValidation !== null ||
      confirmationValidation !== null
    ) {
      return;
    }

    try {
      await passwordChange.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setResult({
        state: "success",
        message:
          "Password changed. This browser session remains active; other sessions were revoked by the server.",
      });
    } catch (error) {
      setResult({
        state: "error",
        message: passwordChangeErrorMessage(error),
      });
    }
  }

  const displayedAccount = account.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Account profile"
        body={
          <>
            <p>
              Review account metadata returned by the authenticated server API.
            </p>
            <p className="mt-3 text-proofline-text-muted">
              Changing your password keeps this browser session active and
              revokes other sessions for the account.
            </p>
          </>
        }
      />

      <ContentSection
        title="Profile metadata"
        trailing={
          displayedAccount ? (
            <StatusBadge value={displayedAccount.account_state ?? "active"} />
          ) : null
        }
      >
        {account.isError ? (
          <InlineStatus role="alert" tone="danger">
            Account metadata could not be loaded.
          </InlineStatus>
        ) : account.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading account metadata.
          </p>
        ) : displayedAccount ? (
          <MetadataGrid
            items={[
              { label: "Username", value: displayedAccount.username },
              { label: "Role", value: displayedAccount.role },
              {
                label: "Account state",
                value: displayedAccount.account_state ?? "active",
              },
              {
                label: "Email verified",
                value: displayedAccount.email_verified_at ? "Yes" : "No",
              },
              { label: "Created", value: displayedAccount.created_at },
              { label: "Updated", value: displayedAccount.updated_at },
              {
                label: "Password changed",
                value: displayedAccount.password_changed_at,
              },
            ]}
          />
        ) : null}
      </ContentSection>

      <ContentSection title="Change password">
        <form onSubmit={handleSubmit} className="max-w-xl">
          <FieldGroup>
            <Field>
              <Label>Current password</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                invalid={currentPasswordError !== null}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (currentPasswordError !== null) {
                    setCurrentPasswordError(
                      event.target.value === ""
                        ? "Enter your current password."
                        : null,
                    );
                  }
                }}
                required
              />
              {currentPasswordError !== null ? (
                <ErrorMessage>{currentPasswordError}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>New password</Label>
              <Description>{passwordRequirements}</Description>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                invalid={newPasswordError !== null}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (newPasswordError !== null) {
                    setNewPasswordError(
                      passwordValidationMessage(event.target.value),
                    );
                  }
                }}
                required
              />
              {newPasswordError !== null ? (
                <ErrorMessage>{newPasswordError}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Confirm new password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                invalid={confirmPasswordError !== null}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (confirmPasswordError !== null) {
                    setConfirmPasswordError(
                      event.target.value === newPassword
                        ? null
                        : "New passwords must match.",
                    );
                  }
                }}
                required
              />
              {confirmPasswordError !== null ? (
                <ErrorMessage>{confirmPasswordError}</ErrorMessage>
              ) : null}
            </Field>
          </FieldGroup>

          {result.state === "success" ? (
            <InlineStatus tone="success">{result.message}</InlineStatus>
          ) : null}
          {result.state === "error" ? (
            <InlineStatus role="alert" tone="danger">
              {result.message}
            </InlineStatus>
          ) : null}

          <Button
            type="submit"
            className="mt-6"
            disabled={passwordChange.isPending}
          >
            {passwordChange.isPending ? "Changing password" : "Change password"}
          </Button>
        </form>
      </ContentSection>
    </div>
  );
}

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: AccountPage,
});
