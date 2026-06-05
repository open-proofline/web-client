import { Link as RouterLink } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex size-10 items-center justify-center rounded-full border border-proofline-border bg-proofline-surface-elevated text-sm font-semibold leading-none text-proofline-text shadow-lg shadow-proofline-bg-deep/20 hover:bg-proofline-surface-strong focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus aria-expanded:bg-proofline-surface-strong"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{accountInitial(session)}</span>
      </button>
      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-proofline-border bg-proofline-surface shadow-xl shadow-proofline-bg-deep/40"
        >
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
              <>
                <RouterLink
                  to="/account"
                  role="menuitem"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                  onClick={() => setIsOpen(false)}
                >
                  Account profile
                </RouterLink>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                  onClick={() => {
                    setIsOpen(false);
                    void onLogout();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <RouterLink
                  to="/login"
                  role="menuitem"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </RouterLink>
                <RouterLink
                  to="/register"
                  role="menuitem"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-proofline-text-muted hover:bg-proofline-surface-elevated hover:text-proofline-text focus:outline-2 focus:outline-offset-2 focus:outline-proofline-focus"
                  onClick={() => setIsOpen(false)}
                >
                  Create account
                </RouterLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
