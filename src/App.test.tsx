import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, vi } from "vitest";
import { AuthProvider } from "./auth/use-auth";
import { clearSession, saveSession } from "./auth/session";
import { createAppRouter } from "./router";
import { server } from "./test/setup";

function renderRoute(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  clearSession();
  vi.unstubAllEnvs();
});

test("renders the login screen", async () => {
  renderRoute("/login");

  expect(
    await screen.findByRole("heading", { name: "Log in" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Experimental prototype. Not for emergency reliance."),
  ).toBeInTheDocument();
});

test("prefills prototype credentials in mock mode", async () => {
  renderRoute("/login");

  expect(await screen.findByLabelText("Username")).toHaveValue(
    "prototype-user",
  );
  expect(screen.getByLabelText("Password")).toHaveValue("prototype-password");
});

test("does not prefill prototype credentials in live mode", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  renderRoute("/login");

  expect(await screen.findByLabelText("Username")).toHaveValue("");
  expect(screen.getByLabelText("Password")).toHaveValue("");
});

test("shows the live incident list limitation", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "current open-proofline/server does not expose GET /v1/incidents",
  );
});

test("shows generic dependent metadata errors on incident detail", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("http://127.0.0.1:8080/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "open",
          deletion_state: "active",
        },
        streams: [],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("http://127.0.0.1:8080/v1/contact-public-keys", () =>
      HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
    http.get(
      "http://127.0.0.1:8080/v1/incidents/inc_live/sharing-grants",
      () =>
        HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
    http.get("http://127.0.0.1:8080/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(await screen.findAllByRole("alert")).toHaveLength(3);
  expect(
    screen.getByText("Contact public-key metadata could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Sharing-grant metadata could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Wrapped-key metadata could not be loaded."),
  ).toBeInTheDocument();
});

function saveLiveSession() {
  saveSession({
    sessionId: "ses_live",
    account: {
      id: "acct_live",
      username: "live-user",
      role: "user",
    },
    token: "test-session-token",
    createdAt: "2026-06-01T00:00:00Z",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    mode: "live",
  });
}
