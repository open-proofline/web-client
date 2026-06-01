import { Link, Navigate, createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { prooflineQueryKeys } from "../../api/client";
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

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">
          Owned incident metadata
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">Incidents</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          This list is for authenticated account incident review. The current
          server docs confirm incident read-by-ID; a backend list route still
          needs confirmation for live mode.
        </p>
      </div>

      {incidents.isError ? (
        <p
          role="alert"
          className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          Incident metadata could not be loaded.
        </p>
      ) : incidents.isLoading ? (
        <p className="mt-6 text-sm text-zinc-600">Loading incident metadata.</p>
      ) : incidents.data?.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Incident</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Sharing</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {incidents.data.map((incident) => (
                <tr key={incident.id}>
                  <td className="px-4 py-3">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: incident.id }}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      {incident.id}
                    </Link>
                    <div className="text-zinc-500">
                      {incident.client_label ?? "No client label"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {incident.incident_mode ?? "generic"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
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
