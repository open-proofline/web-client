import {
  Link as RouterLink,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { ProfileMenu } from "./ProfileMenu";
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ProoflineLogo className="size-12 shrink-0 scale-125 object-contain sm:size-14" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <RouterLink
                    to="/"
                    className="text-lg font-semibold leading-6 text-proofline-text focus:outline-2 focus:outline-offset-4 focus:outline-proofline-focus"
                  >
                    Proofline
                  </RouterLink>
                  <PrototypeNotice />
                </div>
                <p className="mt-1 text-xs leading-4 text-proofline-text-muted">
                  Not an emergency service
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <ProfileMenu session={session} onLogout={logout} />
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
