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
  window.history.replaceState(null, "", "/");
  vi.unstubAllEnvs();
});

test("renders the login screen", async () => {
  renderRoute("/login");

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Experimental · Not for emergency reliance"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Account menu")).toBeInTheDocument();
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

test("registers in mock mode with a sample-only accepted state", async () => {
  renderRoute("/register");

  expect(
    await screen.findByText(
      "Use 12 to 72 characters. Longer non-ASCII passwords may count as more than one character.",
    ),
  ).toBeInTheDocument();

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "new-user" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new-user@example.invalid" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "valid-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Check your email to continue.",
  );
  expect(
    screen.getByText(
      "Sample registration accepted. No account is created and no email is sent.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("Review workspace")).toBeNull();
});

test.each(["not-an-address", "a@a"])(
  "blocks registration submission when the email is not in address format",
  async (email) => {
    vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
    const registrationRequest = vi.fn();
    server.use(
      http.post("*/v1/auth/register", () => {
        registrationRequest();
        return HttpResponse.json(
          {
            status: "verification_required",
            message:
              "If registration can be completed, a verification email will be sent.",
          },
          { status: 202 },
        );
      }),
    );

    renderRoute("/register");

    fireEvent.change(await screen.findByLabelText("Username"), {
      target: { value: "new-user" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "valid-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(
        "Enter a valid email address like example@example.com",
      ),
    ).toBeInTheDocument();
    expect(registrationRequest).toHaveBeenCalledTimes(0);
    expect(screen.queryByText("Check your email to continue.")).toBeNull();
  },
);

test.each([
  {
    password: "short",
    message: "Password must be at least 12 bytes.",
  },
  {
    password: "a".repeat(73),
    message: "Password must be at most 72 bytes.",
  },
])(
  "blocks registration submission when the password is outside server byte limits",
  async ({ password, message }) => {
    vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
    const registrationRequest = vi.fn();
    server.use(
      http.post("*/v1/auth/register", () => {
        registrationRequest();
        return HttpResponse.json(
          {
            status: "verification_required",
            message:
              "If registration can be completed, a verification email will be sent.",
          },
          { status: 202 },
        );
      }),
    );

    renderRoute("/register");

    fireEvent.change(await screen.findByLabelText("Username"), {
      target: { value: "new-user" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new-user@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: password },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(registrationRequest).toHaveBeenCalledTimes(0);
    expect(screen.queryByText("Check your email to continue.")).toBeNull();
  },
);

test("submits live registration without creating a session", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  server.use(
    http.post("*/v1/auth/register", async ({ request }) => {
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        username: "new-user",
        email: "new-user@example.invalid",
        password: "valid-password",
      });
      return HttpResponse.json(
        {
          status: "verification_required",
          message:
            "If registration can be completed, a verification email will be sent.",
        },
        { status: 202 },
      );
    }),
  );

  renderRoute("/register");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "new-user" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new-user@example.invalid" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "valid-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Check your email to continue.",
  );
  expect(
    screen.getByText(
      "If registration can be completed, a verification email will be sent.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("live-user")).toBeNull();
});

const registrationErrorCases = [
  {
    code: "registration_disabled",
    message: "Public registration is not enabled for this deployment.",
  },
  {
    code: "registration_payment_unavailable",
    message:
      "Paid registration is not available in this experimental client. No payment was started.",
  },
  {
    code: "invalid_username",
    message: "Use a username that meets the server requirements.",
  },
  {
    code: "invalid_email",
    message: "Enter a valid email address.",
  },
  {
    code: "invalid_password",
    message: "Use a password that meets the server requirements.",
  },
] as const;

test.each(registrationErrorCases)(
  "maps $code registration errors to safe UI text",
  async ({ code, message }) => {
    vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
    server.use(
      http.post("*/v1/auth/register", () =>
        HttpResponse.json(
          {
            error: {
              code,
              message: "server registration error",
            },
          },
          { status: code.startsWith("registration_") ? 403 : 400 },
        ),
      ),
    );

    renderRoute("/register");

    fireEvent.change(await screen.findByLabelText("Username"), {
      target: { value: "new-user" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new-user@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "valid-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText("server registration error")).toBeNull();
    expect(screen.queryByText("live-user")).toBeNull();
  },
);

test("shows a pending email verification login state", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  server.use(
    http.post("*/v1/auth/login", () =>
      HttpResponse.json(
        {
          error: {
            code: "email_verification_required",
            message: "email verification is required before login",
          },
        },
        { status: 403 },
      ),
    ),
  );

  renderRoute("/login");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "pending-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "valid-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(
    "Verify your email address before logging in.",
  );
  expect(alert).toHaveTextContent("Check your verification email");
  expect(
    screen.getByRole("link", { name: "email verification page" }),
  ).toHaveAttribute("href", "/verify-email");
  expect(screen.queryByText("Review workspace")).toBeNull();
});

test("keeps generic login failures generic", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  server.use(
    http.post("*/v1/auth/login", () =>
      HttpResponse.json(
        {
          error: {
            code: "invalid_credentials",
            message: "username or password is invalid",
          },
        },
        { status: 401 },
      ),
    ),
  );

  renderRoute("/login");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "unknown-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrong-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("username or password is invalid");
  expect(alert).not.toHaveTextContent("verification email");
  expect(
    screen.queryByRole("link", { name: "email verification page" }),
  ).toBeNull();
});

test("verifies email links and clears URL fragments", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  window.history.pushState(null, "", "/verify-email#token=unit-token");
  server.use(
    http.post("*/v1/auth/email/verify", async ({ request }) => {
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        token: "unit-token",
      });
      return HttpResponse.json({ status: "verified" });
    }),
  );

  renderRoute("/verify-email");

  expect(
    await screen.findByText("Your email address has been verified."),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe("/verify-email");
  expect(window.location.hash).toBe("");
  expect(screen.queryByText("unit-token")).toBeNull();
});

test("shows a safe missing email verification code state", async () => {
  window.history.pushState(null, "", "/verify-email");

  renderRoute("/verify-email");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This verification link is missing its verification code.",
  );
  expect(window.location.hash).toBe("");
});

test("shows a safe invalid email verification state", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  window.history.pushState(null, "", "/verify-email#token=expired-token");
  server.use(
    http.post("*/v1/auth/email/verify", () =>
      HttpResponse.json(
        {
          error: {
            code: "verification_token_invalid",
            message: "verification token is invalid or expired",
          },
        },
        { status: 400 },
      ),
    ),
  );

  renderRoute("/verify-email");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This verification link is invalid or has expired.",
  );
  expect(window.location.hash).toBe("");
  expect(screen.queryByText("expired-token")).toBeNull();
});

test("redirects unauthenticated incident routes to login", async () => {
  renderRoute("/incidents/inc_prototype_001");

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
});

test("redirects authenticated login visits to the dashboard", async () => {
  saveMockSession();

  renderRoute("/login");

  expect(
    await screen.findByRole("heading", {
      name: "Review workspace",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Sign in" })).toBeNull();
});

test("logs in with mock credentials and renders the dashboard", async () => {
  renderRoute("/login");

  fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", {
      name: "Review workspace",
    }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Account menu"));
  expect(screen.getByText("prototype-user")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  expect(screen.getByText("Open incidents")).toBeInTheDocument();
  expect(screen.getByText("Shared records")).toBeInTheDocument();
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
    screen.getByText("Sample records are shown for local testing only."),
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
    screen.getByRole("heading", { name: "Contact keys" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Shared access" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Key delivery" }),
  ).toBeInTheDocument();
  expect(screen.getByText("str_audio_001")).toBeInTheDocument();
  expect(screen.getByText("No shared access")).toBeInTheDocument();
  expect(screen.getByText("No key delivery")).toBeInTheDocument();
});

test("shows the live incident list limitation", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incidents" }),
  ).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The live incident list is not available yet.",
  );
});

test("shows generic dependent metadata errors on incident detail", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
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
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(await screen.findAllByRole("alert")).toHaveLength(3);
  expect(
    screen.getByText("Contact details could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Shared access details could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Key delivery details could not be loaded."),
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
