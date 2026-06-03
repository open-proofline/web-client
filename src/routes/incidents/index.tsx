import { Link, Navigate, createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  isUnsupportedLiveRouteError,
  ownedIncidentListRoute,
  prooflineQueryKeys,
} from "../../api/client";
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

  const incidentListUnsupported = isUnsupportedLiveRouteError(
    incidents.error,
    ownedIncidentListRoute,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Owned incident metadata"
        title="Incidents"
        body={
          apiClient.mode === "mock"
            ? "Mock mode shows sample incident records only; they are not live backend data."
            : "Live mode does not call an owned incident list route because current open-proofline/server does not expose GET /v1/incidents. Confirmed live support starts with incident read-by-ID."
        }
      />

      <ContentSection title="Incident records">
        {incidents.isError ? (
          <InlineStatus role="alert" tone="danger">
            {incidentListUnsupported
              ? "Live owned incident listing is disabled because current open-proofline/server does not expose GET /v1/incidents."
              : "Incident metadata could not be loaded."}
          </InlineStatus>
        ) : incidents.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading incident metadata.
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
            title="No incidents"
            body="Owned incident records will appear here when the API returns them."
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
