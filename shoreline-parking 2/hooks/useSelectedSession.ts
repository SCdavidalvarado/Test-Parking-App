"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  autoSelection,
  getDallasNow,
  isValidSelection,
  type DallasNow,
  type Selection,
} from "@/lib/sessions";

const STORAGE_KEY = "sc-valet-selected-service";

/**
 * Which Sunday + service is being viewed.
 *
 * With nothing picked ("live" mode) it follows the clock in Dallas, so a screen
 * left open on Sunday moves from the 8:00 to the 9:30 to the 11:30 service by
 * itself. Once someone picks a service it stays on that one — and is remembered
 * for this browser tab, so the home page and admin portal stay on the same one.
 */
export function useSelectedSession() {
  const [now, setNow] = useState<DallasNow | null>(null);
  const [manual, setManual] = useState<Selection | null>(null);

  // Read the clock and the remembered pick after mount (not during the server
  // render), so the first paint always matches between server and browser.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidSelection(parsed)) setManual(parsed);
      }
    } catch {
      // Storage can be blocked (private mode) — live mode still works.
    }
    setNow(getDallasNow());
    const timer = setInterval(() => setNow(getDallasNow()), 60000);
    return () => clearInterval(timer);
  }, []);

  const auto = useMemo(() => (now ? autoSelection(now) : null), [now]);
  const selection = manual ?? auto;

  const select = useCallback((next: Selection) => {
    setManual(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const jumpToLive = useCallback(() => {
    setManual(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { selection, now, select, jumpToLive, isLive: manual === null, ready: now !== null };
}
