import { Link, Navigate, createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/use-auth";
import {
  isUnsupportedLiveRouteError,
  ownedIncidentListRoute,
  prooflineQueryKeys,
} from "../api/client";
import { rootRoute } from "./__root";
import { Button } from "../components/catalyst/button";
import { EmptyState } from "../components/proofline/EmptyState";
import {
  ContentSection,
  InlineStatus,
  PageHeader,
} from "../components/proofline/Layout";
import { StatusBadge } from "../components/proofline/StatusBadge";

function DashboardPage() {
  const { isAuthenticated, apiClient } = useAuth();
  const incidents = useQuery({
    queryKey: prooflineQueryKeys.incidents,
    queryFn: () => apiClient.listOwnedIncidents(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const openCount =
    incidents.data?.filter((incident) => incident.status === "open").length ??
    0;
  const sharedCount =
    incidents.data?.filter(
      (incident) => incident.sharing_state === "trusted_contact_access",
    ).length ?? 0;
  const incidentListUnsupported = isUnsupportedLiveRouteError(
    incidents.error,
    ownedIncidentListRoute,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Incident review workspace"
        body={
          <>
            <p>
              Review account session state, owned incident metadata, stream and
              chunk metadata, contact public-key metadata, sharing grants, and
              wrapped-key metadata. This app does not record, decrypt, unwrap
              keys, export playable media, or contact emergency services.
            </p>
            <p className="mt-3 text-proofline-text-muted">
              {apiClient.mode === "mock"
                ? "Mock mode shows sample incident records only; they are not live backend data."
                : "Live mode can read confirmed incident detail routes, but owned incident listing is disabled until the server exposes a list route."}
            </p>
          </>
        }
        action={<Button href="/incidents">View incidents</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="API mode" value={apiClient.mode} />
        <Metric
          label="Open incidents"
          value={incidentListUnsupported ? "unavailable" : openCount}
        />
        <Metric
          label="Shared metadata records"
          value={incidentListUnsupported ? "unavailable" : sharedCount}
        />
      </section>

      <ContentSection
        title="Recent incidents"
        trailing={
          <span>
            {incidentListUnsupported
              ? "Live list unavailable"
              : incidents.isLoading
                ? "Loading"
                : `${incidents.data?.length ?? 0} visible`}
          </span>
        }
      >
        {incidents.isError ? (
          <InlineStatus role="alert" tone="danger">
            {incidentListUnsupported
              ? "Live owned incident listing is disabled because current open-proofline/server does not expose GET /v1/incidents. Mock mode uses sample incident records only."
              : "Incident metadata could not be loaded."}
          </InlineStatus>
        ) : incidents.isLoading ? (
          <p className="text-sm text-proofline-text-muted">
            Loading incident metadata.
          </p>
        ) : incidents.data?.length ? (
          <div className="divide-y divide-proofline-border">
            {incidents.data.slice(0, 4).map((incident) => (
              <Link
                key={incident.id}
                to="/incidents/$incidentId"
                params={{ incidentId: incident.id }}
                className="flex flex-col gap-2 rounded-md px-3 py-3 hover:bg-proofline-surface-elevated focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium text-proofline-text">
                    {incident.id}
                  </div>
                  <div className="text-sm text-proofline-text-muted">
                    {incident.incident_mode ?? "generic"} ·{" "}
                    {incident.client_label ?? "no client label"}
                  </div>
                </div>
                <StatusBadge value={incident.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No incidents"
            body="Owned incident metadata will appear here when available."
          />
        )}
      </ContentSection>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-proofline-border bg-proofline-surface-elevated p-5 shadow-lg shadow-proofline-bg-deep/20">
      <dt className="text-sm font-medium text-proofline-text-muted">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-proofline-text">
        {value}
      </dd>
    </div>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
