import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, vi } from "vitest";
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

beforeEach(() => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "mock");
});

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

test("redirects unauthenticated incident routes to login", async () => {
  renderRoute("/incidents/inc_prototype_001");

  expect(
    await screen.findByRole("heading", { name: "Log in" }),
  ).toBeInTheDocument();
});

test("logs in with mock credentials and renders the dashboard", async () => {
  renderRoute("/login");

  fireEvent.click(await screen.findByRole("button", { name: "Log in" }));

  expect(
    await screen.findByRole("heading", {
      name: "Incident review workspace",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText("Signed in as")).toBeInTheDocument();
  expect(screen.getByText("prototype-user")).toBeInTheDocument();
  expect(screen.getByText("Open incidents")).toBeInTheDocument();
  expect(screen.getByText("Shared metadata records")).toBeInTheDocument();
});

test("renders authenticated mock incident list records", async () => {
  saveMockSession();

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("inc_prototype_001")).toBeInTheDocument();
  expect(screen.getByText("inc_prototype_002")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Mock mode shows prototype incident records only; they are not live backend data.",
    ),
  ).toBeInTheDocument();
});

test("renders authenticated mock incident detail metadata sections", async () => {
  saveMockSession();

  renderRoute("/incidents/inc_prototype_001");

  expect(
    await screen.findByRole("heading", { name: "inc_prototype_001" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Streams" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Chunks" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Contact public keys" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Sharing grants" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Wrapped keys" }),
  ).toBeInTheDocument();
  expect(screen.getByText("str_audio_001")).toBeInTheDocument();
  expect(screen.getByText("No grants")).toBeInTheDocument();
  expect(screen.getByText("No wrapped keys")).toBeInTheDocument();
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
    http.get("http://127.0.0.1:8080/v1/incidents/inc_live/sharing-grants", () =>
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
  saveTestSession("live", "live-user");
}

function saveMockSession() {
  saveTestSession("mock", "prototype-user");
}

function saveTestSession(mode: "mock" | "live", username: string) {
  saveSession({
    sessionId: `ses_${mode}`,
    account: {
      id: `acct_${mode}`,
      username,
      role: "user",
    },
    token: "test-session-token",
    createdAt: "2026-06-01T00:00:00Z",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    mode,
  });
}
