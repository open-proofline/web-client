import { Link, Navigate, createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  isUnsupportedLiveRouteError,
  ownedIncidentListRoute,
  prooflineQueryKeys,
} from "../../api/client";
import { useAuth } from "../../auth/use-auth";
import { EmptyState } from "../../components/proofline/EmptyState";
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
    <section className="rounded-lg border border-proofline-border bg-proofline-surface p-6 shadow-lg shadow-proofline-bg-deep/20">
      <div>
        <p className="text-sm font-medium text-proofline-text-muted">
          Owned incident metadata
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-proofline-text">
          Incidents
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-proofline-text-secondary">
          {apiClient.mode === "mock"
            ? "Mock mode shows prototype incident records only; they are not live backend data."
            : "Live mode does not call an owned incident list route because current open-proofline/server does not expose GET /v1/incidents. Confirmed live support starts with incident read-by-ID."}
        </p>
      </div>

      {incidents.isError ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-proofline-danger/40 bg-proofline-danger-bg p-3 text-sm text-proofline-danger"
        >
          {incidentListUnsupported
            ? "Live owned incident listing is disabled because current open-proofline/server does not expose GET /v1/incidents."
            : "Incident metadata could not be loaded."}
        </p>
      ) : incidents.isLoading ? (
        <p className="mt-6 text-sm text-proofline-text-muted">
          Loading incident metadata.
        </p>
      ) : incidents.data?.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-proofline-border">
          <table className="min-w-full divide-y divide-proofline-border text-left text-sm">
            <thead className="bg-proofline-surface-elevated text-xs uppercase text-proofline-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Incident</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Sharing</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-proofline-border bg-proofline-surface">
              {incidents.data.map((incident) => (
                <tr
                  key={incident.id}
                  className="hover:bg-proofline-surface-elevated"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: incident.id }}
                      className="font-medium text-proofline-accent-cyan hover:text-proofline-primary-hover focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                    >
                      {incident.id}
                    </Link>
                    <div className="text-proofline-text-muted">
                      {incident.client_label ?? "No client label"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-proofline-text-secondary">
                    {incident.incident_mode ?? "generic"}
                  </td>
                  <td className="px-4 py-3 text-proofline-text-secondary">
                    {incident.sharing_state ?? "private"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={incident.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No incidents"
            body="Owned incident records will appear here when the API returns them."
          />
        </div>
      )}
    </section>
  );
}

export const incidentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  component: IncidentsIndexPage,
});
