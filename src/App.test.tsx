import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { AuthProvider } from "./auth/use-auth";
import { createAppRouter } from "./router";

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
