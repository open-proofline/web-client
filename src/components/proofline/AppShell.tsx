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
  const showNavigation = isAuthenticated && location.pathname !== "/login";

  return (
    <div className="min-h-screen bg-zinc-50">
      <PrototypeNotice />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <RouterLink to="/" className="text-lg font-semibold text-zinc-950">
              Proofline
            </RouterLink>
            <p className="text-sm text-zinc-600">
              Account and incident review prototype
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {session ? (
              <span className="text-sm text-zinc-600">
                Signed in as{" "}
                <span className="font-medium text-zinc-950">
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
            <div className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-2 lg:flex-col">
              {navigation.map((item) => (
                <RouterLink
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 [&.active]:bg-zinc-900 [&.active]:text-white"
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
