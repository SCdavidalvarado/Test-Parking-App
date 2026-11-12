"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function AdminHeader() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Shoreline City Church · Parking Admin
          </p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-charcoal">
            SC Valet Tracker
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface-muted px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-line/50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h14V10" />
            </svg>
            Home page
          </Link>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
