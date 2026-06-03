import {
  Link as RouterLink,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { Button } from "../catalyst/button";
import { PrototypeNotice } from "./PrototypeNotice";
import { ProoflineLogo } from "./ProoflineLogo";
import { useAuth } from "../../auth/use-auth";

const navigation = [
  { to: "/", label: "Dashboard" },
  { to: "/incidents", label: "Incidents" },
];

export function AppShell() {
  const { isAuthenticated, session, logout } = useAuth();
  const location = useLocation();
  const showNavigation =
    isAuthenticated &&
    location.pathname !== "/login" &&
    location.pathname !== "/register" &&
    location.pathname !== "/verify-email";

  return (
    <div className="min-h-screen bg-proofline-bg text-proofline-text">
      <header className="border-b border-proofline-border bg-proofline-bg-deep">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ProoflineLogo className="size-10 shrink-0" />
              <div className="min-w-0">
                <RouterLink
                  to="/"
                  className="text-lg font-semibold text-proofline-text focus:outline-2 focus:outline-offset-4 focus:outline-proofline-focus"
                >
                  Proofline
                </RouterLink>
                <p className="mt-1 text-sm leading-5 text-proofline-text-muted">
                  Account and incident metadata review
                </p>
                <p className="mt-1 text-xs leading-5 text-proofline-text-muted">
                  Users and trusted contacts remain responsible for contacting
                  emergency services.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <PrototypeNotice />
              {session ? (
                <span className="text-sm text-proofline-text-muted">
                  Signed in as{" "}
                  <span className="font-medium text-proofline-text">
                    {session.account.username}
                  </span>
                </span>
              ) : null}
              {isAuthenticated ? (
                <Button outline onClick={() => void logout()}>
                  Log out
                </Button>
              ) : (
                <Button href="/login">Log in</Button>
              )}
            </div>
          </div>

          {showNavigation ? (
            <nav aria-label="Primary" className="-mx-4 overflow-x-auto px-4">
              <div className="flex min-w-max gap-2 pb-1 lg:hidden">
                {navigation.map((item) => (
                  <RouterLink
                    key={item.to}
                    to={item.to}
                    className="rounded-full border border-proofline-border px-4 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus [&.active]:border-proofline-border-strong [&.active]:bg-proofline-surface-strong [&.active]:text-proofline-text"
                  >
                    {item.label}
                  </RouterLink>
                ))}
              </div>
            </nav>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[220px_1fr] lg:py-6">
        {showNavigation ? (
          <nav
            aria-label="Primary"
            className="hidden lg:sticky lg:top-6 lg:block lg:self-start"
          >
            <div className="flex gap-2 rounded-lg border border-proofline-border bg-proofline-surface p-2 shadow-lg shadow-proofline-bg-deep/30 lg:flex-col">
              {navigation.map((item) => (
                <RouterLink
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus [&.active]:bg-proofline-surface-strong [&.active]:text-proofline-text"
                >
                  {item.label}
                </RouterLink>
              ))}
            </div>
          </nav>
        ) : null}
        <main className={showNavigation ? "" : "lg:col-start-1 lg:col-end-3"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
