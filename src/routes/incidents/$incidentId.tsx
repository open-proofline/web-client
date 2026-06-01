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
    return <p className="text-sm text-zinc-600">Loading incident detail.</p>;
  }

  if (incident.isError || !incident.data) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        Incident detail could not be loaded.
      </p>
    );
  }

  const detail = incident.data;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Incident detail</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
              {detail.incident.id}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">
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
          <div className="divide-y divide-zinc-100">
            {detail.streams.map((stream) => (
              <div key={stream.id} className="grid gap-2 py-4 md:grid-cols-5">
                <div className="font-medium text-zinc-950">{stream.id}</div>
                <div className="text-zinc-700">{stream.media_type}</div>
                <div>
                  <StatusBadge value={stream.status} />
                </div>
                <div className="text-zinc-700">
                  {stream.chunk_count ?? 0} chunks
                </div>
                <div className="text-zinc-700">
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
          <div className="divide-y divide-zinc-100">
            {detail.chunks.map((chunk) => (
              <div key={chunk.id} className="grid gap-2 py-4 md:grid-cols-5">
                <div className="font-medium text-zinc-950">{chunk.id}</div>
                <div className="text-zinc-700">#{chunk.chunk_index}</div>
                <div className="text-zinc-700">{chunk.media_type}</div>
                <div className="text-zinc-700">
                  {chunk.byte_size ?? 0} bytes
                </div>
                <div className="truncate text-zinc-500">
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
          <p className="text-sm text-zinc-600">Loading contact key metadata.</p>
        ) : contacts.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {contacts.data.map((contact) => (
              <div
                key={contact.public_key_id}
                className="grid gap-2 py-4 md:grid-cols-4"
              >
                <div className="font-medium text-zinc-950">
                  {contact.display_label ?? contact.contact_id}
                </div>
                <div className="text-zinc-700">
                  {contact.wrapping_algorithm}
                </div>
                <div className="truncate text-zinc-500">
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
          <p className="text-sm text-zinc-600">
            Loading sharing-grant metadata.
          </p>
        ) : grants.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {grants.data.map((grant) => (
              <div
                key={grant.grant_id}
                className="grid gap-2 py-4 md:grid-cols-5"
              >
                <div className="font-medium text-zinc-950">
                  {grant.grant_id}
                </div>
                <div className="text-zinc-700">{grant.recipient_type}</div>
                <div className="text-zinc-700">{grant.data_class}</div>
                <div className="text-zinc-700">
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
          <p className="text-sm text-zinc-600">Loading wrapped-key metadata.</p>
        ) : wrappedKeys.data?.length ? (
          <div className="divide-y divide-zinc-100">
            {wrappedKeys.data.map((record) => (
              <div
                key={record.wrapped_key_id}
                className="grid gap-2 py-4 md:grid-cols-5"
              >
                <div className="font-medium text-zinc-950">
                  {record.wrapped_key_id}
                </div>
                <div className="text-zinc-700">{record.media_key_id}</div>
                <div className="text-zinc-700">{record.wrapping_algorithm}</div>
                <div className="text-zinc-700">Grant {record.grant_id}</div>
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
    <section className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
        <span className="text-sm text-zinc-500">{count} records</span>
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
