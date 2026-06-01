import {
  RouterProvider,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { incidentDetailRoute } from "./routes/incidents/$incidentId";
import { incidentsRoute } from "./routes/incidents/index";
import { indexRoute } from "./routes/index";
import { loginRoute } from "./routes/login";
import { rootRoute } from "./routes/__root";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  incidentsRoute,
  incidentDetailRoute,
]);

export function createAppRouter(options: { history?: RouterHistory } = {}) {
  return createRouter({
    routeTree,
    history: options.history,
    defaultPreload: "intent",
  });
}

export function AppRouter() {
  const router = createAppRouter();
  return <RouterProvider router={router} />;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
