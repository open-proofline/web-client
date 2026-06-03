import { Link as RouterLink } from "@tanstack/react-router";
import type { Session } from "../../api/schemas";

type ProfileMenuProps = {
  session: Session | null;
  onLogout: () => void;
};

function accountInitial(session: Session | null): string {
  return session?.account.username.trim().charAt(0).toUpperCase() || "P";
}

export function ProfileMenu({ session, onLogout }: ProfileMenuProps) {
  const isSignedIn = session !== null;

  return (
    <details className="group relative">
      <summary
        aria-label="Account menu"
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-proofline-border bg-proofline-surface-elevated text-sm font-semibold text-proofline-text shadow-lg shadow-proofline-bg-deep/20 hover:bg-proofline-surface-strong focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus group-open:bg-proofline-surface-strong [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">{accountInitial(session)}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-proofline-border bg-proofline-surface shadow-xl shadow-proofline-bg-deep/40">
        <div className="border-b border-proofline-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-proofline-text-muted">
            Account
          </p>
          {isSignedIn ? (
            <p className="mt-1 truncate text-sm font-medium text-proofline-text">
              {session.account.username}
            </p>
          ) : (
            <p className="mt-1 text-sm text-proofline-text-secondary">
              Sign in to review incidents.
            </p>
          )}
        </div>

        <div className="p-1">
          {isSignedIn ? (
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
              onClick={() => void onLogout()}
            >
              Sign out
            </button>
          ) : (
            <>
              <RouterLink
                to="/login"
                className="block rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
              >
                Sign in
              </RouterLink>
              <RouterLink
                to="/register"
                className="block rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
              >
                Create account
              </RouterLink>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
