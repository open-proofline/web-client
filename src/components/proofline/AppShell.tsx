import {
  Link as RouterLink,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { Button } from "../catalyst/button";
import { PrototypeNotice } from "./PrototypeNotice";
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
      <PrototypeNotice />
      <header className="border-b border-proofline-border bg-proofline-bg-deep">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <RouterLink
              to="/"
              className="text-lg font-semibold text-proofline-text focus:outline-2 focus:outline-offset-4 focus:outline-proofline-focus"
            >
              Proofline
            </RouterLink>
            <p className="text-sm text-proofline-text-muted">
              Account and incident review prototype
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        {showNavigation ? (
          <nav
            aria-label="Primary"
            className="lg:sticky lg:top-6 lg:self-start"
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
