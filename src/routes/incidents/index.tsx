import { Link, Navigate, createRoute } from "@tanstack/react-router";
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
import { StatusBadge } from "../../components/proofline/StatusBadge";
import { rootRoute } from "../__root";

function IncidentsIndexPage() {
  const { isAuthenticated, apiClient } = useAuth();
  const incidents = useQuery({
    queryKey: prooflineQueryKeys.incidents,
    queryFn: () => apiClient.listOwnedIncidents(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence overview"
        title="Incident records"
        body={
          apiClient.mode === "mock"
            ? "Sample records are shown for local testing only."
            : "Live mode shows incident records returned by the authenticated API."
        }
      />

      <ContentSection title="Recent records">
        {incidents.isError ? (
          <InlineStatus role="alert" tone="danger">
            Incident records could not be loaded.
          </InlineStatus>
        ) : incidents.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading incident records.
          </p>
        ) : incidents.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {incidents.data.map((incident) => (
              <MetadataRow
                key={incident.id}
                title={
                  <Link
                    to="/incidents/$incidentId"
                    params={{ incidentId: incident.id }}
                    className="text-proofline-accent-cyan hover:text-proofline-primary-hover focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                  >
                    {incident.id}
                  </Link>
                }
                items={[
                  {
                    label: "Label",
                    value: incident.client_label ?? "No client label",
                  },
                  {
                    label: "Mode",
                    value: incident.incident_mode ?? "generic",
                  },
                  {
                    label: "Sharing",
                    value: incident.sharing_state ?? "private",
                  },
                ]}
                status={<StatusBadge value={incident.status} />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No records"
            body="Incident records will appear here when available."
          />
        )}
      </ContentSection>
    </div>
  );
}

export const incidentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  component: IncidentsIndexPage,
});
