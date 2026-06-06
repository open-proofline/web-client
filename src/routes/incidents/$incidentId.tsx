import { useState } from "react";
import { Navigate, createRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prooflineQueryKeys } from "../../api/client";
import type { IncidentDeletionStatus } from "../../api/schemas";
import { useAuth } from "../../auth/use-auth";
import { Button } from "../../components/catalyst/button";
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

function IncidentDetailPage() {
  const { incidentId } = useParams({ from: "/incidents/$incidentId" });
  const { isAuthenticated, apiClient } = useAuth();
  const queryClient = useQueryClient();
  const [confirmedOpenDeletion, setConfirmedOpenDeletion] = useState(false);

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
    queryKey: prooflineQueryKeys.contactPublicKeys,
    queryFn: () => apiClient.listContactPublicKeys(),
    enabled: isAuthenticated,
  });
  const grants = useQuery({
    queryKey: prooflineQueryKeys.sharingGrants(incidentId),
    queryFn: () => apiClient.listSharingGrants(incidentId),
    enabled: isAuthenticated,
  });
  const wrappedKeys = useQuery({
    queryKey: prooflineQueryKeys.wrappedKeys(incidentId),
    queryFn: () => apiClient.listWrappedKeys(incidentId),
    enabled: isAuthenticated,
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
              <MetadataRow
                key={grant.grant_id}
                title={grant.grant_id}
                items={[
                  { label: "Recipient", value: grant.recipient_type },
                  { label: "Data class", value: grant.data_class },
                  { label: "Expires", value: grant.expires_at ?? "No expiry" },
                ]}
                status={<StatusBadge value={grant.grant_state} />}
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
