"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Profile button for the top-right corner. Signed out: a way to sign in.
 * Signed in: a way into the admin portal, plus sign out.
 */
export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSignOut() {
    await getBrowserClient().auth.signOut();
    setOpen(false);
    router.refresh();
  }

  const initial = user?.email?.trim()[0]?.toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={user ? "Account menu" : "Sign in menu"}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
          user
            ? "border-charcoal bg-charcoal text-cream hover:bg-charcoal/90"
            : "border-line bg-surface text-charcoal hover:bg-surface-muted"
        }`}
      >
        {user && initial ? (
          <span className="font-display text-base font-semibold">{initial}</span>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close the account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-40 mt-3 w-72 rounded-2xl border border-line bg-surface p-4 shadow-[0_14px_44px_rgba(17,24,39,0.18)]"
          >
            {user ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-muted">
                    Signed in
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-charcoal">{user.email}</div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal/90"
                >
                  Open admin portal
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center rounded-full border border-line bg-surface-muted px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-line/50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-muted">
                    Parking team
                  </div>
                  <p className="mt-1 text-sm text-charcoal-muted">
                    Sign in to update the lots and open the admin portal.
                  </p>
                </div>
                <Link
                  href="/admin/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal/90"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
