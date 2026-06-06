import { useState, type FormEvent } from "react";
import { Navigate, createRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  prooflineQueryKeys,
  type CreateSharingGrantRequest,
} from "../../api/client";
import type {
  ContactPublicKey,
  IncidentDeletionStatus,
  SharingGrant,
} from "../../api/schemas";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/use-auth";
import { Button } from "../../components/catalyst/button";
import {
  ErrorMessage,
  Field,
  Label,
} from "../../components/catalyst/fieldset";
import { Input } from "../../components/catalyst/input";
import { Select } from "../../components/catalyst/select";
import { EmptyState } from "../../components/proofline/EmptyState";
import {
  ContentSection,
  InlineStatus,
  MetadataRow,
  PageHeader,
} from "../../components/proofline/Layout";
import { MetadataGrid } from "../../components/proofline/MetadataGrid";
import { StatusBadge } from "../../components/proofline/StatusBadge";
import { rootRoute } from "../__root";

type ResultState =
  | { state: "idle" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type SharingGrantFormErrors = Partial<
  Record<"contactPublicKeyId" | "expiresAt", string>
>;

const defaultGrantDataClass = "metadata_ciphertext";

function isActiveContactKey(contactKey: ContactPublicKey): boolean {
  return contactKey.key_state === "active";
}

function isExpiredGrant(grant: SharingGrant, now = new Date()): boolean {
  if (!grant.expires_at) {
    return false;
  }
  const expiresAt = Date.parse(grant.expires_at);
  return Number.isFinite(expiresAt) && expiresAt <= now.getTime();
}

function grantDisplayState(grant: SharingGrant): string {
  if (grant.grant_state === "active" && isExpiredGrant(grant)) {
    return "expired";
  }
  return grant.grant_state;
}

function isActiveDeliveryGrant(grant: SharingGrant): boolean {
  return grant.grant_state === "active" && !isExpiredGrant(grant);
}

function normalizeFutureExpiry(value: string): {
  expiresAt?: string;
  error?: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    return { error: "Enter a valid expiry timestamp." };
  }
  if (parsed <= Date.now()) {
    return { error: "Expiry must be in the future." };
  }
  return { expiresAt: new Date(parsed).toISOString() };
}

function sharingGrantCreateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "sharing_grant_dependency_not_found") {
      return "Sharing grant dependency was not available.";
    }
    if (error.code === "invalid_expires_at") {
      return "Expiry must be in the future.";
    }
  }
  return "Sharing grant could not be created.";
}

function IncidentDetailPage() {
  const { incidentId } = useParams({ from: "/incidents/$incidentId" });
  const { isAuthenticated, apiClient, session } = useAuth();
  const queryClient = useQueryClient();
  const [confirmedOpenDeletion, setConfirmedOpenDeletion] = useState(false);
  const contactPublicKeysQueryKey = prooflineQueryKeys.contactPublicKeys(
    session?.sessionId ?? "signed-out",
  );
  const sharingGrantsQueryKey = prooflineQueryKeys.sharingGrants(
    session?.sessionId ?? "signed-out",
    incidentId,
  );
  const wrappedKeysQueryKey = prooflineQueryKeys.wrappedKeys(
    session?.sessionId ?? "signed-out",
    incidentId,
  );
  const [grantContactPublicKeyId, setGrantContactPublicKeyId] = useState("");
  const [grantStreamId, setGrantStreamId] = useState("");
  const [grantDataClass, setGrantDataClass] = useState(defaultGrantDataClass);
  const [grantExpiresAt, setGrantExpiresAt] = useState("");
  const [grantErrors, setGrantErrors] = useState<SharingGrantFormErrors>({});
  const [grantResult, setGrantResult] = useState<ResultState>({
    state: "idle",
  });

  const incident = useQuery({
    queryKey: prooflineQueryKeys.incident(incidentId),
    queryFn: () => apiClient.readIncident(incidentId),
    enabled: isAuthenticated,
  });
  const deletion = useQuery({
    queryKey: prooflineQueryKeys.incidentDeletion(incidentId),
    queryFn: () => apiClient.readIncidentDeletion(incidentId),
    enabled: isAuthenticated,
  });
  const contacts = useQuery({
    queryKey: contactPublicKeysQueryKey,
    queryFn: () => apiClient.listContactPublicKeys(),
    enabled: isAuthenticated && session !== null,
  });
  const grants = useQuery({
    queryKey: sharingGrantsQueryKey,
    queryFn: () => apiClient.listSharingGrants(incidentId),
    enabled: isAuthenticated && session !== null,
  });
  const wrappedKeys = useQuery({
    queryKey: wrappedKeysQueryKey,
    queryFn: () => apiClient.listWrappedKeys(incidentId),
    enabled: isAuthenticated && session !== null,
  });
  const createSharingGrant = useMutation({
    mutationFn: (request: CreateSharingGrantRequest) =>
      apiClient.createSharingGrant(incidentId, request),
    onSuccess: (grant) => {
      queryClient.setQueryData<SharingGrant[]>(
        sharingGrantsQueryKey,
        (current) => [...(current ?? []), grant],
      );
      void queryClient.invalidateQueries({ queryKey: sharingGrantsQueryKey });
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.incident(incidentId),
      });
    },
  });
  const revokeSharingGrant = useMutation({
    mutationFn: (grantId: string) => apiClient.revokeSharingGrant(grantId),
    onSuccess: (grant) => {
      queryClient.setQueryData<SharingGrant[]>(
        sharingGrantsQueryKey,
        (current) =>
          (current ?? []).map((record) =>
            record.grant_id === grant.grant_id ? grant : record,
          ),
      );
      void queryClient.invalidateQueries({ queryKey: sharingGrantsQueryKey });
      void queryClient.invalidateQueries({ queryKey: wrappedKeysQueryKey });
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.incident(incidentId),
      });
    },
  });
  const requestDeletion = useMutation({
    mutationFn: () => {
      const detail = incident.data;
      if (!detail) {
        throw new Error("incident detail is not loaded");
      }
      return apiClient.requestIncidentDeletion(incidentId, {
        reasonCode: "account_delete",
        allowOpen: detail.incident.status === "open",
      });
    },
    onSuccess: (status) => {
      queryClient.setQueryData(
        prooflineQueryKeys.incidentDeletion(incidentId),
        status,
      );
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.incident(incidentId),
      });
      void queryClient.invalidateQueries({
        queryKey: prooflineQueryKeys.incidents,
      });
    },
  });
  const activeContactKeys = (contacts.data ?? []).filter(isActiveContactKey);

  async function handleCreateSharingGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGrantResult({ state: "idle" });
    const nextErrors: SharingGrantFormErrors = {};
    const selectedContactKey = activeContactKeys.find(
      (contactKey) => contactKey.public_key_id === grantContactPublicKeyId,
    );
    if (!selectedContactKey) {
      nextErrors.contactPublicKeyId = "Select an active contact key.";
    }
    const expiry = normalizeFutureExpiry(grantExpiresAt);
    if (expiry.error) {
      nextErrors.expiresAt = expiry.error;
    }
    setGrantErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !selectedContactKey) {
      return;
    }

    const request: CreateSharingGrantRequest = {
      contactId: selectedContactKey.contact_id,
      contactPublicKeyId: selectedContactKey.public_key_id,
      dataClass: grantDataClass,
      ...(grantStreamId ? { streamId: grantStreamId } : {}),
      ...(expiry.expiresAt ? { expiresAt: expiry.expiresAt } : {}),
    };
    try {
      await createSharingGrant.mutateAsync(request);
      setGrantContactPublicKeyId("");
      setGrantStreamId("");
      setGrantDataClass(defaultGrantDataClass);
      setGrantExpiresAt("");
      setGrantResult({
        state: "success",
        message: "Sharing grant created.",
      });
    } catch (error) {
      setGrantResult({
        state: "error",
        message: sharingGrantCreateErrorMessage(error),
      });
    }
  }

  async function handleRevokeSharingGrant(grantId: string) {
    setGrantResult({ state: "idle" });
    try {
      await revokeSharingGrant.mutateAsync(grantId);
      setGrantResult({
        state: "success",
        message: "Sharing grant revoked.",
      });
    } catch {
      setGrantResult({
        state: "error",
        message: "Sharing grant could not be revoked.",
      });
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (incident.isLoading) {
    return (
      <p role="status" className="text-sm text-proofline-text-muted">
        Loading incident detail.
      </p>
    );
  }

  if (incident.isError || !incident.data) {
    return (
      <p
        role="alert"
        className="rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
      >
        Incident detail could not be loaded.
      </p>
    );
  }

  const detail = incident.data;
  const isOpenIncident = detail.incident.status === "open";
  const requestDisabled =
    requestDeletion.isPending || (isOpenIncident && !confirmedOpenDeletion);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident detail"
        title={detail.incident.id}
        body={
          <>
            <p>
              Review status, streams, contacts, sharing, and protected-key
              delivery for this incident record.
            </p>
          </>
        }
        action={<StatusBadge value={detail.incident.status} />}
      />

      <InlineStatus tone="warning">
        Review only. This view does not play media, decrypt data, or expose
        private keys.
      </InlineStatus>

      <ContentSection title="Overview">
        <MetadataGrid
          items={[
            {
              label: "Mode",
              value: detail.incident.incident_mode ?? "generic",
            },
            {
              label: "Capture profile",
              value: detail.incident.capture_profile,
            },
            {
              label: "Escalation policy",
              value: detail.incident.escalation_policy,
            },
            { label: "Sharing state", value: detail.incident.sharing_state },
            {
              label: "Deletion state",
              value: detail.incident.deletion_state,
            },
            { label: "Created", value: detail.incident.created_at },
            { label: "Updated", value: detail.incident.updated_at },
            { label: "Client label", value: detail.incident.client_label },
          ]}
        />
      </ContentSection>

      <ContentSection
        title="Deletion request"
        trailing={
          deletion.data ? (
            <StatusBadge value={deletion.data.state} />
          ) : (
            "No request"
          )
        }
      >
        {deletion.isLoading ? (
          <p role="status" className="text-sm text-proofline-text-muted">
            Loading deletion status.
          </p>
        ) : deletion.isError ? (
          <MetadataError>Deletion status could not be loaded.</MetadataError>
        ) : deletion.data ? (
          <IncidentDeletionStatusView status={deletion.data} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-proofline-text-secondary">
              Request server-side deletion for this owned incident. This does
              not expose storage paths, object keys, request bodies, plaintext,
              raw keys, or wrapped-key ciphertext.
            </p>
            {isOpenIncident ? (
              <InlineStatus tone="warning">
                This incident is open. Confirm that it should be placed into
                deletion before sending the request.
              </InlineStatus>
            ) : null}
            {isOpenIncident ? (
              <label className="flex gap-3 rounded-md border border-proofline-border bg-proofline-surface-elevated p-3 text-sm leading-6 text-proofline-text-secondary">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-proofline-border text-proofline-primary focus:ring-proofline-focus"
                  checked={confirmedOpenDeletion}
                  onChange={(event) =>
                    setConfirmedOpenDeletion(event.currentTarget.checked)
                  }
                />
                <span>
                  Confirm this open incident should be submitted for deletion.
                </span>
              </label>
            ) : null}
            {requestDeletion.isError ? (
              <MetadataError>
                Deletion request could not be completed.
              </MetadataError>
            ) : null}
            <Button
              type="button"
              color="red"
              disabled={requestDisabled}
              onClick={() => requestDeletion.mutate()}
            >
              {requestDeletion.isPending
                ? "Requesting deletion"
                : "Request deletion"}
            </Button>
          </div>
        )}
      </ContentSection>

      <MetadataSection title="Streams" count={detail.streams.length}>
        {detail.streams.length ? (
          <div className="divide-y divide-proofline-border">
            {detail.streams.map((stream) => (
              <MetadataRow
                key={stream.id}
                title={stream.id}
                items={[
                  { label: "Media", value: stream.media_type },
                  { label: "Chunks", value: stream.chunk_count ?? 0 },
                  { label: "Bytes", value: stream.byte_size ?? 0 },
                ]}
                status={<StatusBadge value={stream.status} />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No streams"
            body="Stream details are not present."
          />
        )}
      </MetadataSection>

      <MetadataSection title="Chunks" count={detail.chunks.length}>
        {detail.chunks.length ? (
          <div className="divide-y divide-proofline-border">
            {detail.chunks.map((chunk) => (
              <MetadataRow
                key={chunk.id}
                title={chunk.id}
                items={[
                  { label: "Index", value: `#${chunk.chunk_index}` },
                  { label: "Media", value: chunk.media_type },
                  { label: "Bytes", value: chunk.byte_size ?? 0 },
                  { label: "SHA-256", value: chunk.sha256_hex ?? "No hash" },
                ]}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No chunks" body="Chunk details are not present." />
        )}
      </MetadataSection>

      <MetadataSection title="Contact keys" count={contacts.data?.length ?? 0}>
        {contacts.isError ? (
          <MetadataError>Contact details could not be loaded.</MetadataError>
        ) : contacts.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading contact details.
          </p>
        ) : contacts.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {contacts.data.map((contact) => (
              <MetadataRow
                key={contact.public_key_id}
                title={contact.display_label ?? contact.contact_id}
                items={[
                  { label: "Algorithm", value: contact.wrapping_algorithm },
                  {
                    label: "Fingerprint",
                    value: contact.public_key_fingerprint,
                  },
                ]}
                status={<StatusBadge value={contact.key_state} />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No contact keys"
            body="Contact key details will appear here."
          />
        )}
      </MetadataSection>

      <MetadataSection title="Shared access" count={grants.data?.length ?? 0}>
        <div className="space-y-5">
          <InlineStatus tone="info">
            Sharing grants authorize metadata or encrypted evidence only. They
            do not decrypt media, notify emergency services, or guarantee
            emergency response.
          </InlineStatus>

          {contacts.isError ? (
            <MetadataError>Eligible contact keys could not be loaded.</MetadataError>
          ) : contacts.isLoading ? (
            <p className="text-sm text-proofline-text-muted">
              Loading eligible contact keys.
            </p>
          ) : activeContactKeys.length ? (
            <form
              onSubmit={handleCreateSharingGrant}
              className="space-y-4 rounded-md border border-proofline-border bg-proofline-surface-elevated p-4"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <Field>
                  <Label>Active contact key</Label>
                  <Select
                    value={grantContactPublicKeyId}
                    invalid={grantErrors.contactPublicKeyId !== undefined}
                    onChange={(event) => {
                      setGrantContactPublicKeyId(event.target.value);
                      if (grantErrors.contactPublicKeyId !== undefined) {
                        setGrantErrors((current) => {
                          const next = { ...current };
                          delete next.contactPublicKeyId;
                          return next;
                        });
                      }
                    }}
                  >
                    <option value="">Select contact key</option>
                    {activeContactKeys.map((contactKey) => (
                      <option
                        key={contactKey.public_key_id}
                        value={contactKey.public_key_id}
                      >
                        {contactKey.display_label ?? contactKey.contact_id} (
                        {contactKey.public_key_fingerprint})
                      </option>
                    ))}
                  </Select>
                  {grantErrors.contactPublicKeyId ? (
                    <ErrorMessage>
                      {grantErrors.contactPublicKeyId}
                    </ErrorMessage>
                  ) : null}
                </Field>
                <Field>
                  <Label>Scope</Label>
                  <Select
                    value={grantStreamId}
                    onChange={(event) => setGrantStreamId(event.target.value)}
                  >
                    <option value="">Incident</option>
                    {detail.streams.map((stream) => (
                      <option key={stream.id} value={stream.id}>
                        {stream.id}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label>Data class</Label>
                  <Select
                    value={grantDataClass}
                    onChange={(event) =>
                      setGrantDataClass(event.target.value)
                    }
                  >
                    <option value="metadata">Metadata</option>
                    <option value="ciphertext">Ciphertext</option>
                    <option value="metadata_ciphertext">
                      Metadata and ciphertext
                    </option>
                  </Select>
                </Field>
                <Field>
                  <Label>Expires at</Label>
                  <Input
                    value={grantExpiresAt}
                    invalid={grantErrors.expiresAt !== undefined}
                    placeholder="2026-06-08T10:00:00Z"
                    onChange={(event) => {
                      setGrantExpiresAt(event.target.value);
                      if (grantErrors.expiresAt !== undefined) {
                        setGrantErrors((current) => {
                          const next = { ...current };
                          delete next.expiresAt;
                          return next;
                        });
                      }
                    }}
                  />
                  {grantErrors.expiresAt ? (
                    <ErrorMessage>{grantErrors.expiresAt}</ErrorMessage>
                  ) : null}
                </Field>
              </div>
              <Button type="submit" disabled={createSharingGrant.isPending}>
                {createSharingGrant.isPending
                  ? "Creating grant"
                  : "Create sharing grant"}
              </Button>
            </form>
          ) : (
            <InlineStatus tone="warning">
              No active contact keys are eligible for new sharing grants.
            </InlineStatus>
          )}

          {grantResult.state === "success" ? (
            <InlineStatus tone="success">{grantResult.message}</InlineStatus>
          ) : null}
          {grantResult.state === "error" ? (
            <InlineStatus role="alert" tone="danger">
              {grantResult.message}
            </InlineStatus>
          ) : null}
        </div>

        {grants.isError ? (
          <MetadataError>
            Shared access details could not be loaded.
          </MetadataError>
        ) : grants.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading shared access details.
          </p>
        ) : grants.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {grants.data.map((grant) => (
              <SharingGrantRow
                key={grant.grant_id}
                grant={grant}
                isRevoking={
                  revokeSharingGrant.isPending &&
                  revokeSharingGrant.variables === grant.grant_id
                }
                onRevoke={handleRevokeSharingGrant}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No shared access"
            body="Shared access details will appear here when present."
          />
        )}
      </MetadataSection>

      <MetadataSection
        title="Key delivery"
        count={wrappedKeys.data?.length ?? 0}
      >
        {wrappedKeys.isError ? (
          <MetadataError>
            Key delivery details could not be loaded.
          </MetadataError>
        ) : wrappedKeys.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading key delivery details.
          </p>
        ) : wrappedKeys.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {wrappedKeys.data.map((record) => (
              <MetadataRow
                key={record.wrapped_key_id}
                title={record.wrapped_key_id}
                items={[
                  { label: "Media key", value: record.media_key_id },
                  { label: "Algorithm", value: record.wrapping_algorithm },
                  { label: "Grant", value: record.grant_id },
                ]}
                status={<StatusBadge value={record.wrapped_key_state} />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No key delivery"
            body="Key delivery details will appear here. This app does not unlock encrypted media."
          />
        )}
      </MetadataSection>
    </div>
  );
}

function IncidentDeletionStatusView({
  status,
}: {
  status: IncidentDeletionStatus;
}) {
  return (
    <div className="space-y-4">
      <MetadataGrid
        items={[
          { label: "State", value: status.state },
          { label: "Source", value: status.source },
          { label: "Reason code", value: status.reason_code },
          { label: "Open allowed", value: status.allow_open ? "yes" : "no" },
          { label: "Items", value: status.item_count },
          { label: "Requested", value: status.requested_at },
          { label: "Updated", value: status.updated_at },
          { label: "Started", value: status.started_at },
          { label: "Completed", value: status.completed_at },
          { label: "Error code", value: status.error_code },
        ]}
      />
      <InlineStatus tone="info">
        Deletion status is server-controlled metadata. This app does not expose
        deletion item paths or private storage details.
      </InlineStatus>
    </div>
  );
}

function MetadataError({ children }: { children: React.ReactNode }) {
  return (
    <InlineStatus role="alert" tone="danger">
      {children}
    </InlineStatus>
  );
}

function SharingGrantRow({
  grant,
  isRevoking,
  onRevoke,
}: {
  grant: SharingGrant;
  isRevoking: boolean;
  onRevoke: (grantId: string) => void;
}) {
  const isRevoked = grant.grant_state === "revoked";
  return (
    <div className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <MetadataRow
        title={grant.grant_id}
        items={[
          { label: "Recipient", value: grant.recipient_type },
          { label: "Contact", value: grant.contact_id },
          { label: "Contact key", value: grant.contact_public_key_id },
          { label: "Scope", value: grant.stream_id || "Incident" },
          { label: "Data class", value: grant.data_class },
          { label: "Expires", value: grant.expires_at ?? "No expiry" },
          {
            label: "Active delivery path",
            value: isActiveDeliveryGrant(grant) ? "Yes" : "No",
          },
        ]}
        status={<StatusBadge value={grantDisplayState(grant)} />}
      />
      <div className="lg:justify-self-end">
        <Button
          type="button"
          color="red"
          disabled={isRevoking || isRevoked}
          onClick={() => onRevoke(grant.grant_id)}
        >
          {isRevoking ? "Revoking" : "Revoke"}
        </Button>
      </div>
    </div>
  );
}

function MetadataSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <ContentSection title={title} trailing={`${count} records`}>
      {children}
    </ContentSection>
  );
}

export const incidentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents/$incidentId",
  component: IncidentDetailPage,
});
