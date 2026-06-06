import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  vi.stubEnv("VITE_PROOFLINE_AUTH_MODE", "bearer");
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
  expect(screen.getByText("Experimental")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Proofline home" }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Account menu")).toBeNull();
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
    await screen.findByText("Choose a password between 12 to 72 characters."),
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
  expect(screen.queryByText("Account overview")).toBeNull();
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
  expect(screen.queryByText("Account overview")).toBeNull();
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

test("logs in and out with browser-cookie auth mode", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  vi.stubEnv("VITE_PROOFLINE_AUTH_MODE", "cookie");
  let csrfRequests = 0;
  let incidentListRequests = 0;
  let logoutRequests = 0;
  server.use(
    http.post("*/v1/auth/web/login", async ({ request }) => {
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      await expect(request.json()).resolves.toEqual({
        username: "cookie-user",
        password: "valid-password",
      });
      return HttpResponse.json(
        {
          session_id: "ses_cookie",
          account: {
            id: "acct_cookie",
            username: "cookie-user",
            role: "user",
          },
          token: "raw-cookie-session-token-must-not-display",
          created_at: "2026-06-01T00:00:00Z",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        { status: 201 },
      );
    }),
    http.get("*/v1/auth/web/csrf", ({ request }) => {
      csrfRequests += 1;
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({
        csrf_token: "csrf-token",
        header_name: "X-CSRF-Token",
      });
    }),
    http.get("*/v1/incidents", ({ request }) => {
      incidentListRequests += 1;
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      return HttpResponse.json({ incidents: [] });
    }),
    http.post("*/v1/auth/web/logout", ({ request }) => {
      logoutRequests += 1;
      expect(request.credentials).toBe("include");
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.headers.get("x-csrf-token")).toBe("csrf-token");
      return HttpResponse.json({ revoked: true });
    }),
  );

  renderRoute("/login");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "cookie-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "valid-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", { name: "Account overview" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Account menu"));
  expect(screen.getByText("cookie-user")).toBeInTheDocument();
  expect(screen.queryByText("raw-cookie-session-token-must-not-display")).toBe(
    null,
  );
  expect(screen.queryByText("csrf-token")).toBeNull();

  fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
  expect(csrfRequests).toBe(1);
  expect(incidentListRequests).toBeGreaterThanOrEqual(1);
  expect(logoutRequests).toBe(1);
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
      name: "Account overview",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Sign in" })).toBeNull();
});

test("clears stale bearer sessions when cookie auth mode is configured", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  vi.stubEnv("VITE_PROOFLINE_AUTH_MODE", "cookie");
  saveLiveSession();

  renderRoute("/");

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Account overview")).toBeNull();
});

test("logs in with mock credentials and renders the dashboard", async () => {
  renderRoute("/login");

  fireEvent.click(await screen.findByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", {
      name: "Account overview",
    }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Account menu"));
  expect(screen.getByText("prototype-user")).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "Sign out" }),
  ).toBeInTheDocument();
  fireEvent.pointerDown(document.body);
  expect(
    screen.queryByRole("menuitem", { name: "Sign out" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Open records")).toBeInTheDocument();
  expect(screen.getByText("Shared records")).toBeInTheDocument();
});

test("renders authenticated mock incident list records", async () => {
  saveMockSession();

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incident records" }),
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
  expect(screen.getAllByText("str_audio_001")).not.toHaveLength(0);
  expect(screen.getByText("No shared access")).toBeInTheDocument();
  expect(screen.getByText("No key delivery")).toBeInTheDocument();
});

test("renders live contact-key empty state", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ contact_public_keys: [] }),
    ),
  );

  renderRoute("/contact-keys");

  expect(
    await screen.findByRole("heading", { name: "Contact public keys" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("No contact keys")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Only active contact keys are eligible for new sharing grants. This app does not handle contact private keys, media keys, decryption, or wrapped-key ciphertext.",
    ),
  ).toBeInTheDocument();
});

test("creates live contact public keys without displaying private fields", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  const contactKeys: unknown[] = [];
  server.use(
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ contact_public_keys: contactKeys }),
    ),
    http.post("*/v1/contact-public-keys", async ({ request }) => {
      await expect(request.json()).resolves.toEqual({
        display_label: "Trusted contact",
        wrapping_algorithm: "age-v1-x25519",
        public_key: "age1public",
        public_key_fingerprint: "fingerprint-live",
        key_state: "pending_verification",
      });
      const contactKey = {
        public_key_id: "cpk_live",
        owner_account_id: "acct_live",
        contact_id: "ctc_live",
        version: 1,
        display_label: "Trusted contact",
        wrapping_algorithm: "age-v1-x25519",
        public_key: "age1public",
        public_key_fingerprint: "fingerprint-live",
        key_state: "pending_verification",
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-01T00:00:00Z",
        contact_private_key: "must-not-display",
        raw_media_key: "raw-media-key",
        plaintext: "private plaintext",
        wrapped_key_ciphertext: "wrapped-ciphertext",
        request_body: "private request",
        stored_path: "incidents/inc_live/private.enc",
        object_key: "private/object/key",
      };
      contactKeys.push(contactKey);
      return HttpResponse.json(
        { contact_public_key: contactKey },
        { status: 201 },
      );
    }),
  );

  renderRoute("/contact-keys");

  expect(
    await screen.findByRole("heading", { name: "Contact public keys" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Display label"), {
    target: { value: "Trusted contact" },
  });
  fireEvent.change(screen.getByLabelText("Public key"), {
    target: { value: "age1public" },
  });
  fireEvent.change(screen.getByLabelText("Fingerprint"), {
    target: { value: "fingerprint-live" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save contact key" }));

  expect(
    await screen.findByText("Contact public key saved."),
  ).toBeInTheDocument();
  expect(await screen.findAllByText("Trusted contact")).not.toHaveLength(0);
  expect(screen.getByText("fingerprint-live")).toBeInTheDocument();
  expect(screen.queryByText("must-not-display")).toBeNull();
  expect(screen.queryByText("raw-media-key")).toBeNull();
  expect(screen.queryByText("private plaintext")).toBeNull();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
  expect(screen.queryByText("private request")).toBeNull();
  expect(screen.queryByText("incidents/inc_live/private.enc")).toBeNull();
  expect(screen.queryByText("private/object/key")).toBeNull();
});

test("updates and revokes live contact public keys with safe states", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  let contactKey: Record<string, unknown> = {
    public_key_id: "cpk_live",
    owner_account_id: "acct_live",
    contact_id: "ctc_live",
    version: 1,
    display_label: "Trusted contact",
    wrapping_algorithm: "age-v1-x25519",
    public_key: "age1public",
    public_key_fingerprint: "fingerprint-live",
    key_state: "active",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  };
  server.use(
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ contact_public_keys: [contactKey] }),
    ),
    http.patch("*/v1/contact-public-keys/cpk_live", async ({ request }) => {
      await expect(request.json()).resolves.toEqual({
        display_label: "Verified contact",
        key_state: "lost",
      });
      contactKey = {
        ...contactKey,
        display_label: "Verified contact",
        key_state: "lost",
        updated_at: "2026-06-01T00:10:00Z",
      };
      return HttpResponse.json({ contact_public_key: contactKey });
    }),
    http.post("*/v1/contact-public-keys/cpk_live/revoke", () => {
      contactKey = {
        ...contactKey,
        key_state: "revoked",
        revoked_at: "2026-06-01T00:20:00Z",
        updated_at: "2026-06-01T00:20:00Z",
      };
      return HttpResponse.json({ contact_public_key: contactKey });
    }),
  );

  renderRoute("/contact-keys");

  expect(await screen.findAllByText("Trusted contact")).not.toHaveLength(0);
  expect(screen.getByText("Yes")).toBeInTheDocument();
  const record = screen
    .getAllByText("Trusted contact")
    .find((element) => element.tagName !== "OPTION")
    ?.closest(".space-y-4") as HTMLElement | null;
  if (!record) {
    throw new Error("expected contact key record");
  }
  fireEvent.change(within(record).getByLabelText("Display label"), {
    target: { value: "Verified contact" },
  });
  fireEvent.change(within(record).getByLabelText("Reviewed state"), {
    target: { value: "lost" },
  });
  fireEvent.click(within(record).getByRole("button", { name: "Save" }));

  expect(await screen.findByText("Contact key updated.")).toBeInTheDocument();
  expect(await screen.findAllByText("Verified contact")).not.toHaveLength(0);
  expect(await screen.findByText("No")).toBeInTheDocument();

  const updatedRecord = screen
    .getAllByText("Verified contact")
    .find((element) => element.tagName !== "OPTION")
    ?.closest(".space-y-4") as HTMLElement | null;
  if (!updatedRecord) {
    throw new Error("expected updated contact key record");
  }
  fireEvent.click(within(updatedRecord).getByRole("button", { name: "Revoke" }));

  expect(await screen.findByText("Contact key revoked.")).toBeInTheDocument();
  expect(
    await screen.findByText(
      "Revoked keys are not eligible for new sharing grants and cannot be reactivated here.",
    ),
  ).toBeInTheDocument();
  expect(
    within(updatedRecord).getByRole("button", { name: "Revoke" }),
  ).toBeDisabled();
});

test("shows generic contact-key loading and request errors", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json(
        {
          error: {
            code: "unavailable",
            message: "backend private contact detail",
          },
        },
        { status: 503 },
      ),
    ),
    http.post("*/v1/contact-public-keys", () =>
      HttpResponse.json(
        {
          error: {
            code: "invalid_public_key",
            message: "private request detail",
          },
        },
        { status: 400 },
      ),
    ),
  );

  renderRoute("/contact-keys");

  expect(
    await screen.findByRole("heading", { name: "Contact public keys" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("Contact keys could not be loaded."),
  ).toBeInTheDocument();
  expect(screen.queryByText("backend private contact detail")).toBeNull();

  fireEvent.change(screen.getByLabelText("Public key"), {
    target: { value: "age1public" },
  });
  fireEvent.change(screen.getByLabelText("Fingerprint"), {
    target: { value: "fingerprint-live" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save contact key" }));

  expect(
    await screen.findByText("Contact public key could not be saved."),
  ).toBeInTheDocument();
  expect(screen.queryByText("private request detail")).toBeNull();
});

test("does not show stale contact-key metadata after switching sessions", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  let resolveBobContactKeys!: () => void;
  server.use(
    http.post("*/v1/auth/login", async ({ request }) => {
      const credentials = (await request.json()) as { username: string };
      return HttpResponse.json({
        session_id:
          credentials.username === "bob-user" ? "ses_bob" : "ses_alice",
        account: {
          id: credentials.username === "bob-user" ? "acct_bob" : "acct_alice",
          username: credentials.username,
          role: "user",
        },
        token:
          credentials.username === "bob-user" ? "token-bob" : "token-alice",
        created_at: "2026-06-01T00:00:00Z",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }),
    http.post("*/v1/auth/logout", () => HttpResponse.json({ revoked: true })),
    http.get("*/v1/contact-public-keys", async ({ request }) => {
      const authorization = request.headers.get("authorization");
      if (authorization === "Bearer token-bob") {
        await new Promise<void>((resolve) => {
          resolveBobContactKeys = resolve;
        });
        return HttpResponse.json({
          contact_public_keys: [
            {
              public_key_id: "cpk_bob",
              owner_account_id: "acct_bob",
              contact_id: "ctc_bob",
              version: 1,
              display_label: "Bob trusted contact",
              wrapping_algorithm: "age-v1-x25519",
              public_key: "age1bob",
              public_key_fingerprint: "fingerprint-bob",
              key_state: "active",
            },
          ],
        });
      }
      return HttpResponse.json({
        contact_public_keys: [
          {
            public_key_id: "cpk_alice",
            owner_account_id: "acct_alice",
            contact_id: "ctc_alice",
            version: 1,
            display_label: "Alice trusted contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key: "age1alice",
            public_key_fingerprint: "fingerprint-alice",
            key_state: "active",
          },
        ],
      });
    }),
  );

  renderRoute("/login");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "alice-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "alice-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", { name: "Account overview" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("link", { name: "Contact keys" })[0]!);
  expect(
    await screen.findByRole("heading", { name: "Contact public keys" }),
  ).toBeInTheDocument();
  expect(await screen.findAllByText("Alice trusted contact")).not.toHaveLength(
    0,
  );

  fireEvent.click(screen.getByLabelText("Account menu"));
  fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "bob-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "bob-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", { name: "Account overview" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("link", { name: "Contact keys" })[0]!);

  expect(await screen.findByText("Loading contact keys.")).toBeInTheDocument();
  expect(screen.queryByText("Alice trusted contact")).toBeNull();

  resolveBobContactKeys();
  expect(await screen.findAllByText("Bob trusted contact")).not.toHaveLength(0);
  expect(screen.queryByText("Alice trusted contact")).toBeNull();
});

test("creates and revokes live sharing grants from active contact keys", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  let grants: Record<string, unknown>[] = [];
  let sharingState = "private";
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          sharing_state: sharingState,
          deletion_state: "active",
        },
        streams: [
          {
            id: "str_audio",
            incident_id: "inc_live",
            media_type: "audio",
            status: "complete",
          },
        ],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({
        contact_public_keys: [
          {
            public_key_id: "cpk_active",
            owner_account_id: "acct_live",
            contact_id: "ctc_active",
            version: 1,
            display_label: "Trusted contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key_fingerprint: "fingerprint-active",
            key_state: "active",
          },
          {
            public_key_id: "cpk_pending",
            owner_account_id: "acct_live",
            contact_id: "ctc_pending",
            version: 1,
            display_label: "Pending contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key_fingerprint: "fingerprint-pending",
            key_state: "pending_verification",
          },
        ],
      }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ sharing_grants: grants }),
    ),
    http.post(
      "*/v1/incidents/inc_live/sharing-grants",
      async ({ request }) => {
        await expect(request.json()).resolves.toEqual({
          stream_id: "str_audio",
          contact_id: "ctc_active",
          contact_public_key_id: "cpk_active",
          data_class: "metadata_ciphertext",
          expires_at: expiresAt,
        });
        const grant = {
          grant_id: "sgr_live",
          owner_account_id: "acct_live",
          incident_id: "inc_live",
          stream_id: "str_audio",
          recipient_type: "trusted_contact",
          contact_id: "ctc_active",
          contact_public_key_id: "cpk_active",
          contact_public_key_version: 1,
          data_class: "metadata_ciphertext",
          grant_state: "active",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
          expires_at: expiresAt,
          wrapped_key_ciphertext: "wrapped-ciphertext",
          raw_media_key: "raw-media-key",
          request_body: "private request",
          stored_path: "incidents/inc_live/private.enc",
          object_key: "private/object/key",
        };
        grants = [grant];
        sharingState = "shared";
        return HttpResponse.json({ sharing_grant: grant }, { status: 201 });
      },
    ),
    http.post("*/v1/sharing-grants/sgr_live/revoke", () => {
      grants = grants.map((grant) =>
        grant.grant_id === "sgr_live"
          ? {
              ...grant,
              grant_state: "revoked",
              revoked_at: "2026-06-01T00:20:00Z",
              updated_at: "2026-06-01T00:20:00Z",
            }
          : grant,
      );
      sharingState = "private";
      return HttpResponse.json({ sharing_grant: grants[0] });
    }),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ wrapped_keys: [] }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  const contactKeySelect = (await screen.findByLabelText(
    "Active contact key",
  )) as HTMLSelectElement;
  fireEvent.change(contactKeySelect, {
    target: { value: "cpk_active" },
  });
  expect(
    Array.from(contactKeySelect.options).some((option) =>
      option.text.includes("Pending contact"),
    ),
  ).toBe(false);
  fireEvent.change(screen.getByLabelText("Scope"), {
    target: { value: "str_audio" },
  });
  fireEvent.change(screen.getByLabelText("Expires at"), {
    target: { value: expiresAt },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create sharing grant" }));

  expect(await screen.findByText("Sharing grant created.")).toBeInTheDocument();
  expect(await screen.findByText("sgr_live")).toBeInTheDocument();
  expect(await screen.findByText("shared")).toBeInTheDocument();
  expect(screen.queryByText("private")).toBeNull();
  expect(screen.getByText("Active delivery path")).toBeInTheDocument();
  expect(screen.getByText("Yes")).toBeInTheDocument();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
  expect(screen.queryByText("raw-media-key")).toBeNull();
  expect(screen.queryByText("private request")).toBeNull();
  expect(screen.queryByText("incidents/inc_live/private.enc")).toBeNull();
  expect(screen.queryByText("private/object/key")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

  expect(await screen.findByText("Sharing grant revoked.")).toBeInTheDocument();
  expect(await screen.findByText("revoked")).toBeInTheDocument();
  expect(await screen.findByText("private")).toBeInTheDocument();
  expect(screen.queryByText("shared")).toBeNull();
  expect(screen.getAllByText("No").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Revoke" })).toBeDisabled();
});

test("revokes live wrapped-key delivery without displaying sensitive fields", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  let wrappedKeys: Record<string, unknown>[] = [
    {
      wrapped_key_id: "wkey_live",
      owner_account_id: "acct_live",
      incident_id: "inc_live",
      stream_id: "str_audio",
      grant_id: "sgr_live",
      recipient_type: "trusted_contact",
      contact_id: "ctc_live",
      contact_public_key_id: "cpk_live",
      contact_public_key_version: 1,
      media_key_id: "media-key-live",
      wrapping_algorithm: "age-v1-x25519",
      wrapping_algorithm_version: "1",
      public_wrapping_metadata: {
        profile: "age-v1-x25519",
        recipient: {
          raw_media_key: "raw-media-key",
        },
      },
      wrapped_key_state: "active",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
      wrapped_key_ciphertext: "wrapped-ciphertext",
      raw_media_key: "raw-media-key",
      contact_private_key: "contact-private-key",
      plaintext: "private plaintext",
      request_body: "private request",
      stored_path: "incidents/inc_live/private.enc",
      object_key: "private/object/key",
    },
  ];
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          deletion_state: "active",
        },
        streams: [
          {
            id: "str_audio",
            incident_id: "inc_live",
            media_type: "audio",
            status: "complete",
          },
        ],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ contact_public_keys: [] }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ sharing_grants: [] }),
    ),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ wrapped_keys: wrappedKeys }),
    ),
    http.post("*/v1/wrapped-keys/wkey_live/revoke", () => {
      const revoked = {
        ...wrappedKeys[0],
        wrapped_key_state: "revoked",
        updated_at: "2026-06-01T00:10:00Z",
        revoked_at: "2026-06-01T00:10:00Z",
        revoked_by_account_id: "acct_live",
      };
      wrappedKeys = [];
      return HttpResponse.json({ wrapped_key: revoked });
    }),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("wkey_live")).toBeInTheDocument();
  expect(screen.getByText("media-key-live")).toBeInTheDocument();
  expect(screen.getAllByText("age-v1-x25519")).toHaveLength(2);
  expect(screen.getByText("Yes")).toBeInTheDocument();
  expect(
    screen.getByText(
      /Revocation stops future delivery of a wrapped-key record/,
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
  expect(screen.queryByText("raw-media-key")).toBeNull();
  expect(screen.queryByText("contact-private-key")).toBeNull();
  expect(screen.queryByText("private plaintext")).toBeNull();
  expect(screen.queryByText("private request")).toBeNull();
  expect(screen.queryByText("incidents/inc_live/private.enc")).toBeNull();
  expect(screen.queryByText("private/object/key")).toBeNull();
  expect(screen.queryByText("acct_live")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Revoke delivery" }));

  expect(await screen.findByText("Key delivery revoked.")).toBeInTheDocument();
  expect(await screen.findByText("No key delivery")).toBeInTheDocument();
  expect(screen.queryByText("wkey_live")).toBeNull();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
  expect(screen.queryByText("raw-media-key")).toBeNull();
  expect(screen.queryByText("acct_live")).toBeNull();
});

test("shows safe sharing-grant empty state without active contact keys", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          deletion_state: "active",
        },
        streams: [],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({
        contact_public_keys: [
          {
            public_key_id: "cpk_pending",
            owner_account_id: "acct_live",
            contact_id: "ctc_pending",
            version: 1,
            display_label: "Pending contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key_fingerprint: "fingerprint-pending",
            key_state: "pending_verification",
          },
        ],
      }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ sharing_grants: [] }),
    ),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ wrapped_keys: [] }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText(
      "No active contact keys are eligible for new sharing grants.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Create sharing grant" }),
  ).toBeNull();
});

test("validates sharing-grant expiry before submission", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  const createGrant = vi.fn();
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          deletion_state: "active",
        },
        streams: [],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({
        contact_public_keys: [
          {
            public_key_id: "cpk_active",
            owner_account_id: "acct_live",
            contact_id: "ctc_active",
            version: 1,
            display_label: "Trusted contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key_fingerprint: "fingerprint-active",
            key_state: "active",
          },
        ],
      }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ sharing_grants: [] }),
    ),
    http.post("*/v1/incidents/inc_live/sharing-grants", () => {
      createGrant();
      return HttpResponse.json({ sharing_grant: {} }, { status: 201 });
    }),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ wrapped_keys: [] }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText("Active contact key"), {
    target: { value: "cpk_active" },
  });
  fireEvent.change(screen.getByLabelText("Expires at"), {
    target: { value: "2020-01-01T00:00:00Z" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create sharing grant" }));

  expect(
    await screen.findByText("Expiry must be in the future."),
  ).toBeInTheDocument();
  expect(createGrant).toHaveBeenCalledTimes(0);
});

test("keeps sharing-grant dependency errors generic", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          deletion_state: "active",
        },
        streams: [],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({
        contact_public_keys: [
          {
            public_key_id: "cpk_active",
            owner_account_id: "acct_live",
            contact_id: "ctc_active",
            version: 1,
            display_label: "Trusted contact",
            wrapping_algorithm: "age-v1-x25519",
            public_key_fingerprint: "fingerprint-active",
            key_state: "active",
          },
        ],
      }),
    ),
    http.get("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json({ sharing_grants: [] }),
    ),
    http.post("*/v1/incidents/inc_live/sharing-grants", () =>
      HttpResponse.json(
        {
          error: {
            code: "sharing_grant_dependency_not_found",
            message: "backend private dependency detail",
          },
        },
        { status: 404 },
      ),
    ),
    http.get("*/v1/incidents/inc_live/wrapped-keys", () =>
      HttpResponse.json({ wrapped_keys: [] }),
    ),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText("Active contact key"), {
    target: { value: "cpk_active" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create sharing grant" }));

  expect(
    await screen.findByText("Sharing grant dependency was not available."),
  ).toBeInTheDocument();
  expect(screen.queryByText("backend private dependency detail")).toBeNull();
});

test("renders existing incident deletion status without private deletion internals", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents/inc_live", () =>
      HttpResponse.json({
        incident: {
          id: "inc_live",
          status: "closed",
          deletion_state: "deletion_pending",
        },
        streams: [],
        chunks: [],
        checkins: [],
      }),
    ),
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json({
        deletion: {
          decision_id: "del_live",
          incident_id: "inc_live",
          source: "account_request",
          reason_code: "account_delete",
          actor_account_id: "acct_live",
          allow_open: false,
          state: "deletion_pending",
          item_count: 2,
          requested_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:01:00Z",
          stored_path: "incidents/inc_live/private.enc",
          object_key: "private/object/key",
          wrapped_key_ciphertext: "wrapped-ciphertext",
        },
      }),
    ),
    ...emptyIncidentDetailHandlers("inc_live"),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Deletion request" }),
  ).toBeInTheDocument();
  expect(await screen.findAllByText("deletion pending")).not.toHaveLength(0);
  expect(screen.getByText("account_delete")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Request deletion" }),
  ).toBeNull();
  expect(screen.queryByText("incidents/inc_live/private.enc")).toBeNull();
  expect(screen.queryByText("private/object/key")).toBeNull();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
});

test("requires confirmation before requesting deletion for an open incident", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  const deletionRequest = vi.fn();
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
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.post("*/v1/incidents/inc_live/deletion", async ({ request }) => {
      deletionRequest();
      await expect(request.json()).resolves.toEqual({
        reason_code: "account_delete",
        allow_open: true,
      });
      return HttpResponse.json(
        {
          deletion: {
            decision_id: "del_live",
            incident_id: "inc_live",
            source: "account_request",
            reason_code: "account_delete",
            allow_open: true,
            state: "deletion_pending",
            item_count: 0,
            requested_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:00:00Z",
          },
        },
        { status: 202 },
      );
    }),
    ...emptyIncidentDetailHandlers("inc_live"),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  const button = await screen.findByRole("button", {
    name: "Request deletion",
  });
  expect(button).toBeDisabled();
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Confirm this open incident should be submitted for deletion.",
    }),
  );
  expect(button).toBeEnabled();
  fireEvent.click(button);

  expect(await screen.findAllByText("deletion pending")).not.toHaveLength(0);
  expect(deletionRequest).toHaveBeenCalledTimes(1);
});

test("shows generic deletion status and request errors", async () => {
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
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "unavailable",
            message: "backend private deletion detail",
          },
        },
        { status: 503 },
      ),
    ),
    ...emptyIncidentDetailHandlers("inc_live"),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText("Deletion status could not be loaded."),
  ).toBeInTheDocument();
  expect(screen.queryByText("backend private deletion detail")).toBeNull();
});

test("shows a generic deletion request failure for missing or unowned incidents", async () => {
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
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
    ),
    http.post("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "forbidden",
            message: "private ownership detail",
          },
        },
        { status: 403 },
      ),
    ),
    ...emptyIncidentDetailHandlers("inc_live"),
  );

  renderRoute("/incidents/inc_live");

  expect(
    await screen.findByRole("heading", { name: "inc_live" }),
  ).toBeInTheDocument();
  fireEvent.click(
    await screen.findByRole("checkbox", {
      name: "Confirm this open incident should be submitted for deletion.",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Request deletion" }));

  expect(
    await screen.findByText("Deletion request could not be completed."),
  ).toBeInTheDocument();
  expect(screen.queryByText("private ownership detail")).toBeNull();
});

test("redirects unauthenticated account profile visits to login", async () => {
  renderRoute("/account");

  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();
});

test("changes a live account password and keeps the current session active", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  let resolvePasswordChange!: () => void;
  const passwordRequest = vi.fn();
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          email: "live-user@example.invalid",
          email_verified_at: "2026-06-01T00:20:00Z",
          account_state: "active",
          role: "user",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:30:00Z",
          password_changed_at: "2026-06-01T00:15:00Z",
        },
      }),
    ),
    http.post("*/v1/account/password", async ({ request }) => {
      passwordRequest();
      expect(request.credentials).toBe("omit");
      expect(request.headers.get("authorization")).toBe(
        "Bearer test-session-token",
      );
      await expect(request.json()).resolves.toEqual({
        current_password: "current-password",
        new_password: "replacement-password",
      });
      await new Promise<void>((resolve) => {
        resolvePasswordChange = resolve;
      });
      return HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          email: "live-user@example.invalid",
          email_verified_at: "2026-06-01T00:20:00Z",
          account_state: "active",
          role: "user",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:50:00Z",
          password_changed_at: "2026-06-01T00:50:00Z",
        },
      });
    }),
  );

  renderRoute("/account");

  expect(
    await screen.findByRole("heading", { name: "Account profile" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("live-user")).toBeInTheDocument();
  expect(screen.getByText("Password changed")).toBeInTheDocument();
  expect(screen.getByText("2026-06-01T00:15:00Z")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "current-password" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));

  expect(
    await screen.findByRole("button", { name: "Changing password" }),
  ).toBeDisabled();
  expect(passwordRequest).toHaveBeenCalledTimes(1);
  resolvePasswordChange();

  expect(await screen.findByRole("status")).toHaveTextContent(
    "This browser session remains active; other sessions were revoked by the server.",
  );
  expect(screen.getAllByText("2026-06-01T00:50:00Z")).toHaveLength(2);
  expect(screen.getByLabelText("Current password")).toHaveValue("");
  expect(screen.getByLabelText("New password")).toHaveValue("");
  expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  expect(screen.queryByText("current-password")).toBeNull();
  expect(screen.queryByText("replacement-password")).toBeNull();
});

test("does not show stale account metadata after switching sessions", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  let resolveBobAccount!: () => void;
  server.use(
    http.post("*/v1/auth/login", async ({ request }) => {
      const credentials = (await request.json()) as { username: string };
      return HttpResponse.json({
        session_id:
          credentials.username === "bob-user" ? "ses_bob" : "ses_alice",
        account: {
          id: credentials.username === "bob-user" ? "acct_bob" : "acct_alice",
          username: credentials.username,
          role: "user",
        },
        token:
          credentials.username === "bob-user" ? "token-bob" : "token-alice",
        created_at: "2026-06-01T00:00:00Z",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }),
    http.post("*/v1/auth/logout", () => HttpResponse.json({ revoked: true })),
    http.get("*/v1/account", async ({ request }) => {
      const authorization = request.headers.get("authorization");
      if (authorization === "Bearer token-bob") {
        await new Promise<void>((resolve) => {
          resolveBobAccount = resolve;
        });
        return HttpResponse.json({
          account: {
            id: "acct_bob",
            username: "bob-user",
            role: "user",
          },
        });
      }
      return HttpResponse.json({
        account: {
          id: "acct_alice",
          username: "alice-user",
          role: "user",
        },
      });
    }),
  );

  renderRoute("/login");

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "alice-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "alice-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", { name: "Account overview" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("link", { name: "Account" })[0]!);
  expect(
    await screen.findByRole("heading", { name: "Account profile" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("alice-user")).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Account menu"));
  fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
  expect(
    await screen.findByRole("heading", { name: "Sign in" }),
  ).toBeInTheDocument();

  fireEvent.change(await screen.findByLabelText("Username"), {
    target: { value: "bob-user" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "bob-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(
    await screen.findByRole("heading", { name: "Account overview" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("link", { name: "Account" })[0]!);

  expect(
    await screen.findByText("Loading account metadata."),
  ).toBeInTheDocument();
  expect(screen.queryByText("alice-user")).toBeNull();

  resolveBobAccount();
  expect(await screen.findByText("bob-user")).toBeInTheDocument();
  expect(screen.queryByText("alice-user")).toBeNull();
});

test("blocks password-change validation failures before calling the API", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  const passwordRequest = vi.fn();
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
        },
      }),
    ),
    http.post("*/v1/account/password", () => {
      passwordRequest();
      return HttpResponse.json({ account: { id: "acct_live" } });
    }),
  );

  renderRoute("/account");

  await screen.findByRole("heading", { name: "Account profile" });
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "current-password" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "short" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "different-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));

  expect(
    await screen.findByText("Password must be at least 12 bytes."),
  ).toBeInTheDocument();
  expect(screen.getByText("New passwords must match.")).toBeInTheDocument();
  expect(passwordRequest).toHaveBeenCalledTimes(0);
});

test("maps invalid current password errors to safe account UI text", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
        },
      }),
    ),
    http.post("*/v1/account/password", () =>
      HttpResponse.json(
        {
          error: {
            code: "invalid_credentials",
            message: "current password is invalid",
          },
        },
        { status: 401 },
      ),
    ),
  );

  renderRoute("/account");

  await submitPasswordChange();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Current password was not accepted.",
  );
});

test("maps unauthorized password-change errors to safe account UI text", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
        },
      }),
    ),
    http.post("*/v1/account/password", () =>
      HttpResponse.json(
        {
          error: {
            code: "authentication_required",
            message: "authentication is required",
          },
        },
        { status: 401 },
      ),
    ),
  );

  renderRoute("/account");

  await submitPasswordChange();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Sign in again before changing your password.",
  );
});

test("keeps generic password-change failures generic", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/account", () =>
      HttpResponse.json({
        account: {
          id: "acct_live",
          username: "live-user",
          role: "user",
        },
      }),
    ),
    http.post("*/v1/account/password", () =>
      HttpResponse.json(
        {
          error: {
            code: "unavailable",
            message: "backend private account detail",
          },
        },
        { status: 503 },
      ),
    ),
  );

  renderRoute("/account");

  await submitPasswordChange();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Password could not be changed.",
  );
  expect(screen.queryByText("backend private account detail")).toBeNull();
});

test("renders live incident list records without displaying private fields", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents", () =>
      HttpResponse.json({
        incidents: [
          {
            id: "inc_live",
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:10:00Z",
            status: "open",
            client_label: "owner phone",
            incident_mode: "interaction_record",
            capture_profile: "audio_location",
            escalation_policy: "none",
            sharing_state: "private",
            deletion_state: "active",
            owner_account_id: "acct_private",
            notes: "private note",
            stored_path: "incidents/inc_live/private.enc",
            object_key: "private/object/key",
            wrapped_key_ciphertext: "wrapped-ciphertext",
            plaintext: "private plaintext",
            raw_key: "raw-key",
          },
        ],
      }),
    ),
  );

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incident records" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Live mode shows incident records returned by the authenticated API.",
    ),
  ).toBeInTheDocument();
  expect(await screen.findByText("inc_live")).toBeInTheDocument();
  expect(screen.getByText("owner phone")).toBeInTheDocument();
  expect(screen.queryByText("acct_private")).toBeNull();
  expect(screen.queryByText("private note")).toBeNull();
  expect(screen.queryByText("incidents/inc_live/private.enc")).toBeNull();
  expect(screen.queryByText("private/object/key")).toBeNull();
  expect(screen.queryByText("wrapped-ciphertext")).toBeNull();
  expect(screen.queryByText("private plaintext")).toBeNull();
  expect(screen.queryByText("raw-key")).toBeNull();
});

test("shows an accessible live incident list empty state", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents", () => HttpResponse.json({ incidents: [] })),
  );

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incident records" }),
  ).toBeInTheDocument();
  expect(await screen.findByText("No records")).toBeInTheDocument();
  expect(
    screen.getByText("Incident records will appear here when available."),
  ).toBeInTheDocument();
});

test("shows a generic live incident list request failure", async () => {
  vi.stubEnv("VITE_PROOFLINE_API_MODE", "live");
  saveLiveSession();
  server.use(
    http.get("*/v1/incidents", () =>
      HttpResponse.json(
        {
          error: {
            code: "unavailable",
            message: "backend private detail",
          },
        },
        { status: 503 },
      ),
    ),
  );

  renderRoute("/incidents");

  expect(
    await screen.findByRole("heading", { name: "Incident records" }),
  ).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Incident records could not be loaded.",
  );
  expect(screen.queryByText("backend private detail")).toBeNull();
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
    http.get("*/v1/incidents/inc_live/deletion", () =>
      HttpResponse.json(
        {
          error: {
            code: "incident_deletion_not_found",
            message: "incident deletion was not found",
          },
        },
        { status: 404 },
      ),
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
  expect(await screen.findAllByRole("alert")).toHaveLength(4);
  expect(
    screen.getByText("Contact details could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Shared access details could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Eligible contact keys could not be loaded."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Key delivery details could not be loaded."),
  ).toBeInTheDocument();
});

async function submitPasswordChange() {
  await screen.findByRole("heading", { name: "Account profile" });
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "current-password" },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "replacement-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
}

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
    authMode: "bearer",
  });
}

function emptyIncidentDetailHandlers(incidentId: string) {
  return [
    http.get("*/v1/contact-public-keys", () =>
      HttpResponse.json({ contact_public_keys: [] }),
    ),
    http.get(`*/v1/incidents/${incidentId}/sharing-grants`, () =>
      HttpResponse.json({ sharing_grants: [] }),
    ),
    http.get(`*/v1/incidents/${incidentId}/wrapped-keys`, () =>
      HttpResponse.json({ wrapped_keys: [] }),
    ),
  ];
}
