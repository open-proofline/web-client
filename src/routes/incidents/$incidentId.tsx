import { Navigate, createRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { prooflineQueryKeys } from "../../api/client";
import { useAuth } from "../../auth/use-auth";
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

  const incident = useQuery({
    queryKey: prooflineQueryKeys.incident(incidentId),
    queryFn: () => apiClient.readIncident(incidentId),
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
