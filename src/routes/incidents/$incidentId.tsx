import { Navigate, createRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { prooflineQueryKeys } from "../../api/client";
import { useAuth } from "../../auth/use-auth";
import { EmptyState } from "../../components/proofline/EmptyState";
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
      <p className="text-sm text-proofline-text-muted">
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
      <section className="rounded-lg border border-proofline-border bg-proofline-surface p-6 shadow-lg shadow-proofline-bg-deep/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-proofline-text-muted">
              Incident detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-proofline-text">
              {detail.incident.id}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-proofline-text-secondary">
              Metadata review only. This view does not play media, decrypt
              browser-side, unwrap keys, or expose raw key material.
            </p>
          </div>
          <StatusBadge value={detail.incident.status} />
        </div>

        <div className="mt-6">
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
        </div>
      </section>

      <MetadataSection title="Streams" count={detail.streams.length}>
        {detail.streams.length ? (
          <div className="divide-y divide-proofline-border">
            {detail.streams.map((stream) => (
              <div key={stream.id} className="grid gap-2 py-4 md:grid-cols-5">
                <div className="font-medium text-proofline-text">
                  {stream.id}
                </div>
                <div className="text-proofline-text-secondary">
                  {stream.media_type}
                </div>
                <div>
                  <StatusBadge value={stream.status} />
                </div>
                <div className="text-proofline-text-secondary">
                  {stream.chunk_count ?? 0} chunks
                </div>
                <div className="text-proofline-text-secondary">
                  {stream.byte_size ?? 0} bytes
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No streams"
            body="Stream metadata is not present."
          />
        )}
      </MetadataSection>

      <MetadataSection title="Chunks" count={detail.chunks.length}>
        {detail.chunks.length ? (
          <div className="divide-y divide-proofline-border">
            {detail.chunks.map((chunk) => (
              <div key={chunk.id} className="grid gap-2 py-4 md:grid-cols-5">
                <div className="font-medium text-proofline-text">
                  {chunk.id}
                </div>
                <div className="text-proofline-text-secondary">
                  #{chunk.chunk_index}
                </div>
                <div className="text-proofline-text-secondary">
                  {chunk.media_type}
                </div>
                <div className="text-proofline-text-secondary">
                  {chunk.byte_size ?? 0} bytes
                </div>
                <div className="truncate text-proofline-text-muted">
                  {chunk.sha256_hex ?? "No hash"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No chunks" body="Chunk metadata is not present." />
        )}
      </MetadataSection>

      <MetadataSection
        title="Contact public keys"
        count={contacts.data?.length ?? 0}
      >
        {contacts.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading contact key metadata.
          </p>
        ) : contacts.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {contacts.data.map((contact) => (
              <div
                key={contact.public_key_id}
                className="grid gap-2 py-4 md:grid-cols-4"
              >
                <div className="font-medium text-proofline-text">
                  {contact.display_label ?? contact.contact_id}
                </div>
                <div className="text-proofline-text-secondary">
                  {contact.wrapping_algorithm}
                </div>
                <div className="truncate text-proofline-text-muted">
                  {contact.public_key_fingerprint}
                </div>
                <StatusBadge value={contact.key_state} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No contact keys"
            body="Contact public-key metadata will appear here."
          />
        )}
      </MetadataSection>

      <MetadataSection title="Sharing grants" count={grants.data?.length ?? 0}>
        {grants.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading sharing-grant metadata.
          </p>
        ) : grants.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {grants.data.map((grant) => (
              <div
                key={grant.grant_id}
                className="grid gap-2 py-4 md:grid-cols-5"
              >
                <div className="font-medium text-proofline-text">
                  {grant.grant_id}
                </div>
                <div className="text-proofline-text-secondary">
                  {grant.recipient_type}
                </div>
                <div className="text-proofline-text-secondary">
                  {grant.data_class}
                </div>
                <div className="text-proofline-text-secondary">
                  {grant.expires_at ?? "No expiry"}
                </div>
                <StatusBadge value={grant.grant_state} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No grants"
            body="Sharing-grant metadata will appear here when present."
          />
        )}
      </MetadataSection>

      <MetadataSection
        title="Wrapped keys"
        count={wrappedKeys.data?.length ?? 0}
      >
        {wrappedKeys.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading wrapped-key metadata.
          </p>
        ) : wrappedKeys.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {wrappedKeys.data.map((record) => (
              <div
                key={record.wrapped_key_id}
                className="grid gap-2 py-4 md:grid-cols-5"
              >
                <div className="font-medium text-proofline-text">
                  {record.wrapped_key_id}
                </div>
                <div className="text-proofline-text-secondary">
                  {record.media_key_id}
                </div>
                <div className="text-proofline-text-secondary">
                  {record.wrapping_algorithm}
                </div>
                <div className="text-proofline-text-secondary">
                  Grant {record.grant_id}
                </div>
                <StatusBadge value={record.wrapped_key_state} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No wrapped keys"
            body="Wrapped-key delivery metadata will appear here. This app does not unwrap keys."
          />
        )}
      </MetadataSection>
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
    <section className="rounded-lg border border-proofline-border bg-proofline-surface p-6 shadow-lg shadow-proofline-bg-deep/20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-proofline-text">{title}</h2>
        <span className="text-sm text-proofline-text-muted">
          {count} records
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export const incidentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents/$incidentId",
  component: IncidentDetailPage,
});
