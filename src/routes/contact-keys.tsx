import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, createRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { prooflineQueryKeys } from "../api/client";
import type { ContactPublicKey } from "../api/schemas";
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
import { Select } from "../components/catalyst/select";
import { Textarea } from "../components/catalyst/textarea";
import { EmptyState } from "../components/proofline/EmptyState";
import {
  ContentSection,
  InlineStatus,
  MetadataRow,
  PageHeader,
} from "../components/proofline/Layout";
import { StatusBadge } from "../components/proofline/StatusBadge";
import { rootRoute } from "./__root";

type ResultState =
  | { state: "idle" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type CreateFormErrorField =
  | "displayLabel"
  | "wrappingAlgorithm"
  | "publicKey"
  | "fingerprint";
type CreateFormErrors = Partial<Record<CreateFormErrorField, string>>;

const maxDisplayLabelBytes = 200;
const maxWrappingAlgorithmBytes = 80;
const maxPublicKeyBytes = 4096;
const maxFingerprintBytes = 256;

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function isGrantEligible(contactKey: ContactPublicKey): boolean {
  return contactKey.key_state === "active";
}

function validateCreateForm({
  displayLabel,
  wrappingAlgorithm,
  publicKey,
  fingerprint,
}: {
  displayLabel: string;
  wrappingAlgorithm: string;
  publicKey: string;
  fingerprint: string;
}): CreateFormErrors {
  const errors: CreateFormErrors = {};
  if (byteLength(displayLabel) > maxDisplayLabelBytes) {
    errors.displayLabel = "Display label must be 200 bytes or less.";
  }
  if (wrappingAlgorithm.trim() === "") {
    errors.wrappingAlgorithm = "Enter a wrapping algorithm.";
  } else if (byteLength(wrappingAlgorithm) > maxWrappingAlgorithmBytes) {
    errors.wrappingAlgorithm = "Wrapping algorithm must be 80 bytes or less.";
  }
  if (publicKey.trim() === "") {
    errors.publicKey = "Enter the contact public key.";
  } else if (byteLength(publicKey) > maxPublicKeyBytes) {
    errors.publicKey = "Public key must be 4096 bytes or less.";
  }
  if (fingerprint.trim() === "") {
    errors.fingerprint = "Enter the public-key fingerprint.";
  } else if (byteLength(fingerprint) > maxFingerprintBytes) {
    errors.fingerprint = "Fingerprint must be 256 bytes or less.";
  }
  return errors;
}

function hasErrors(errors: CreateFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function clearCreateFormError(
  errors: CreateFormErrors,
  field: CreateFormErrorField,
): CreateFormErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

function ContactKeysPage() {
  const { isAuthenticated, apiClient } = useAuth();
  const queryClient = useQueryClient();
  const contactKeys = useQuery({
    queryKey: prooflineQueryKeys.contactPublicKeys,
    queryFn: () => apiClient.listContactPublicKeys(),
    enabled: isAuthenticated,
  });
  const [displayLabel, setDisplayLabel] = useState("");
  const [wrappingAlgorithm, setWrappingAlgorithm] =
    useState("age-v1-x25519");
  const [publicKey, setPublicKey] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [keyState, setKeyState] = useState("pending_verification");
  const [contactId, setContactId] = useState("");
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
  const [result, setResult] = useState<ResultState>({ state: "idle" });

  const existingContacts = useMemo(() => {
    const contacts = new Map<string, string>();
    for (const contactKey of contactKeys.data ?? []) {
      contacts.set(
        contactKey.contact_id,
        contactKey.display_label ?? contactKey.contact_id,
      );
    }
    return Array.from(contacts.entries()).sort((first, second) =>
      first[1].localeCompare(second[1]),
    );
  }, [contactKeys.data]);

  const createContactKey = useMutation({
    mutationFn: () => {
      const request = {
        wrappingAlgorithm: wrappingAlgorithm.trim(),
        publicKey: publicKey.trim(),
        publicKeyFingerprint: fingerprint.trim(),
        keyState,
        ...(contactId ? { contactId } : {}),
        ...(displayLabel.trim()
          ? { displayLabel: displayLabel.trim() }
          : {}),
      };
      return apiClient.createContactPublicKey(request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.contactPublicKeys,
      });
    },
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({ state: "idle" });
    const errors = validateCreateForm({
      displayLabel,
      wrappingAlgorithm,
      publicKey,
      fingerprint,
    });
    setCreateErrors(errors);
    if (hasErrors(errors)) {
      return;
    }
    try {
      await createContactKey.mutateAsync();
      setDisplayLabel("");
      setPublicKey("");
      setFingerprint("");
      setKeyState("pending_verification");
      setContactId("");
      setResult({
        state: "success",
        message: "Contact public key saved.",
      });
    } catch {
      setResult({
        state: "error",
        message: "Contact public key could not be saved.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contact keys"
        title="Contact public keys"
        body={
          <>
            <p>
              Manage trusted-contact public-key metadata for future sharing
              grants.
            </p>
            <p className="mt-3 text-proofline-text-muted">
              Only active contact keys are eligible for new sharing grants. This
              app does not handle contact private keys, media keys, decryption,
              or wrapped-key ciphertext.
            </p>
          </>
        }
      />

      <InlineStatus tone="warning">
        Public-key metadata is access-enabling metadata. Verify keys out of band
        before marking them active.
      </InlineStatus>

      <ContentSection title="Register public key">
        <form onSubmit={handleCreateSubmit} className="max-w-2xl space-y-5">
          <FieldGroup>
            <Field>
              <Label>Contact</Label>
              <Description>
                Choose an existing contact to rotate their key, or leave this
                set to new contact.
              </Description>
              <Select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
              >
                <option value="">New contact</option>
                {existingContacts.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Display label</Label>
              <Description>
                Use a short label only. Do not enter private relationship
                context or safety narrative.
              </Description>
              <Input
                value={displayLabel}
                invalid={createErrors.displayLabel !== undefined}
                onChange={(event) => {
                  setDisplayLabel(event.target.value);
                  if (createErrors.displayLabel !== undefined) {
                    if (byteLength(event.target.value) > maxDisplayLabelBytes) {
                      setCreateErrors((current) => ({
                        ...current,
                        displayLabel:
                          "Display label must be 200 bytes or less.",
                      }));
                    } else {
                      setCreateErrors((current) =>
                        clearCreateFormError(current, "displayLabel"),
                      );
                    }
                  }
                }}
              />
              {createErrors.displayLabel ? (
                <ErrorMessage>{createErrors.displayLabel}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Wrapping algorithm</Label>
              <Input
                value={wrappingAlgorithm}
                invalid={createErrors.wrappingAlgorithm !== undefined}
                onChange={(event) => {
                  setWrappingAlgorithm(event.target.value);
                  if (createErrors.wrappingAlgorithm !== undefined) {
                    setCreateErrors((current) =>
                      clearCreateFormError(current, "wrappingAlgorithm"),
                    );
                  }
                }}
                required
              />
              {createErrors.wrappingAlgorithm ? (
                <ErrorMessage>{createErrors.wrappingAlgorithm}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Public key</Label>
              <Textarea
                value={publicKey}
                invalid={createErrors.publicKey !== undefined}
                rows={4}
                onChange={(event) => {
                  setPublicKey(event.target.value);
                  if (createErrors.publicKey !== undefined) {
                    setCreateErrors((current) =>
                      clearCreateFormError(current, "publicKey"),
                    );
                  }
                }}
                required
              />
              {createErrors.publicKey ? (
                <ErrorMessage>{createErrors.publicKey}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Fingerprint</Label>
              <Input
                value={fingerprint}
                invalid={createErrors.fingerprint !== undefined}
                onChange={(event) => {
                  setFingerprint(event.target.value);
                  if (createErrors.fingerprint !== undefined) {
                    setCreateErrors((current) =>
                      clearCreateFormError(current, "fingerprint"),
                    );
                  }
                }}
                required
              />
              {createErrors.fingerprint ? (
                <ErrorMessage>{createErrors.fingerprint}</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Reviewed state</Label>
              <Select
                value={keyState}
                onChange={(event) => setKeyState(event.target.value)}
              >
                <option value="pending_verification">
                  Pending verification
                </option>
                <option value="active">Active</option>
                <option value="replaced">Replaced</option>
                <option value="lost">Lost</option>
              </Select>
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

          <Button type="submit" disabled={createContactKey.isPending}>
            {createContactKey.isPending ? "Saving key" : "Save contact key"}
          </Button>
        </form>
      </ContentSection>

      <ContentSection
        title="Contact keys"
        trailing={`${contactKeys.data?.length ?? 0} records`}
      >
        {contactKeys.isError ? (
          <InlineStatus role="alert" tone="danger">
            Contact keys could not be loaded.
          </InlineStatus>
        ) : contactKeys.isLoading ? (
          <p role="status" className="text-sm text-proofline-text-muted">
            Loading contact keys.
          </p>
        ) : contactKeys.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {contactKeys.data.map((contactKey) => (
              <ContactKeyRow key={contactKey.public_key_id} record={contactKey} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No contact keys"
            body="Register a contact public key before creating sharing grants."
          />
        )}
      </ContentSection>
    </div>
  );
}

function ContactKeyRow({ record }: { record: ContactPublicKey }) {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();
  const [displayLabel, setDisplayLabel] = useState(record.display_label ?? "");
  const [keyState, setKeyState] = useState(record.key_state);
  const [displayLabelError, setDisplayLabelError] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<ResultState>({ state: "idle" });
  const isRevoked = record.key_state === "revoked";
  const updateContactKey = useMutation({
    mutationFn: () =>
      apiClient.updateContactPublicKey(record.public_key_id, {
        displayLabel: displayLabel.trim(),
        keyState,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.contactPublicKeys,
      });
    },
  });
  const revokeContactKey = useMutation({
    mutationFn: () => apiClient.revokeContactPublicKey(record.public_key_id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.contactPublicKeys,
      });
    },
  });

  async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({ state: "idle" });
    if (byteLength(displayLabel) > maxDisplayLabelBytes) {
      setDisplayLabelError("Display label must be 200 bytes or less.");
      return;
    }
    setDisplayLabelError(null);
    try {
      await updateContactKey.mutateAsync();
      setResult({ state: "success", message: "Contact key updated." });
    } catch {
      setResult({
        state: "error",
        message: "Contact key could not be updated.",
      });
    }
  }

  async function handleRevoke() {
    setResult({ state: "idle" });
    try {
      await revokeContactKey.mutateAsync();
      setKeyState("revoked");
      setResult({ state: "success", message: "Contact key revoked." });
    } catch {
      setResult({
        state: "error",
        message: "Contact key could not be revoked.",
      });
    }
  }

  return (
    <div className="space-y-4 py-5">
      <MetadataRow
        title={record.display_label || record.contact_id}
        items={[
          { label: "Contact", value: record.contact_id },
          { label: "Version", value: record.version ?? 1 },
          { label: "Algorithm", value: record.wrapping_algorithm },
          { label: "Fingerprint", value: record.public_key_fingerprint },
          {
            label: "Eligible for new grants",
            value: isGrantEligible(record) ? "Yes" : "No",
          },
          { label: "Updated", value: record.updated_at },
          { label: "Revoked", value: record.revoked_at },
        ]}
        status={<StatusBadge value={record.key_state} />}
      />

      <form
        onSubmit={handleUpdateSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto_auto]"
      >
        <Field>
          <Label>Display label</Label>
          <Input
            value={displayLabel}
            invalid={displayLabelError !== null}
            onChange={(event) => {
              setDisplayLabel(event.target.value);
              if (displayLabelError !== null) {
                setDisplayLabelError(
                  byteLength(event.target.value) > maxDisplayLabelBytes
                    ? "Display label must be 200 bytes or less."
                    : null,
                );
              }
            }}
          />
          {displayLabelError ? (
            <ErrorMessage>{displayLabelError}</ErrorMessage>
          ) : null}
        </Field>
        <Field>
          <Label>Reviewed state</Label>
          <Select
            value={keyState}
            disabled={isRevoked}
            onChange={(event) => setKeyState(event.target.value)}
          >
            <option value="pending_verification">Pending</option>
            <option value="active">Active</option>
            <option value="replaced">Replaced</option>
            <option value="lost">Lost</option>
            <option value="revoked">Revoked</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button
            type="submit"
            outline
            disabled={updateContactKey.isPending || isRevoked}
          >
            {updateContactKey.isPending ? "Saving" : "Save"}
          </Button>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            color="red"
            disabled={revokeContactKey.isPending || isRevoked}
            onClick={handleRevoke}
          >
            {revokeContactKey.isPending ? "Revoking" : "Revoke"}
          </Button>
        </div>
      </form>

      {result.state === "success" ? (
        <InlineStatus tone="success">{result.message}</InlineStatus>
      ) : null}
      {result.state === "error" ? (
        <InlineStatus role="alert" tone="danger">
          {result.message}
        </InlineStatus>
      ) : null}
      {isRevoked ? (
        <InlineStatus tone="warning">
          Revoked keys are not eligible for new sharing grants and cannot be
          reactivated here.
        </InlineStatus>
      ) : null}
    </div>
  );
}

export const contactKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact-keys",
  component: ContactKeysPage,
});
