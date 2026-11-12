"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  SERVICE_SLOTS,
  formatShort,
  slotLabel,
  sundayOptions,
  type DallasNow,
  type Selection,
} from "@/lib/sessions";

interface SessionPickerProps {
  selection: Selection;
  now: DallasNow;
  /** True when nothing has been picked and the app is following the clock. */
  isLive: boolean;
  onSelect: (next: Selection) => void;
  onJumpToLive: () => void;
}

/**
 * "Sun, Nov 15 · 9:30 AM" button. Opens a small menu: pick a Sunday on the
 * left, then pick that Sunday's service on the right.
 */
export function SessionPicker({
  selection,
  now,
  isLive,
  onSelect,
  onJumpToLive,
}: SessionPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(selection.date);
  // "date|slot" for every service that already has saved data.
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const today = now.date;
  const options = useMemo(() => sundayOptions(today), [today]);
  const picked = options.find((o) => o.date === pickedDate) ?? options[1];

  // Each time the menu opens: start on the Sunday being viewed, find out which
  // services have saved data, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    setPickedDate(selection.date);

    let cancelled = false;
    getBrowserClient()
      .from("service_sessions")
      .select("service_date, service_slot")
      .in("service_date", options.map((o) => o.date))
      .then(({ data }) => {
        if (!cancelled && data) {
          setSaved(new Set(data.map((r) => `${r.service_date}|${r.service_slot}`)));
        }
      });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, selection.date, options]);

  const dateHasData = (date: string) => SERVICE_SLOTS.some((s) => saved.has(`${date}|${s.id}`));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-charcoal py-3 pl-4 pr-4 text-sm font-semibold text-cream transition-colors hover:bg-charcoal/90"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="3" />
          <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        </svg>
        <span>
          {formatShort(selection.date)} &middot; {slotLabel(selection.slot)}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            aria-label="Close the Sunday picker"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
          />
          <div
            role="dialog"
            aria-label="Choose a Sunday and service"
            className="fixed inset-x-4 top-24 z-40 max-h-[80vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-[0_14px_44px_rgba(17,24,39,0.18)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:max-h-none sm:w-[640px] sm:overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
                <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-muted">
                  1 &middot; Pick a Sunday
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  {options.map((o) => {
                    const sel = o.date === pickedDate;
                    const sub = dateHasData(o.date)
                      ? "Has saved data"
                      : o.isPast
                        ? "No data saved"
                        : "Empty \u2014 ready to go";
                    return (
                      <button
                        key={o.date}
                        onClick={() => setPickedDate(o.date)}
                        className={`flex min-h-[52px] w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                          sel
                            ? "border-charcoal bg-charcoal text-cream"
                            : "border-line bg-surface text-charcoal hover:bg-surface-muted"
                        }`}
                      >
                        <span className="flex flex-col items-start gap-0.5">
                          <span className="text-[15px] font-semibold">{o.short}</span>
                          <span className={`text-xs ${sel ? "text-gray-300" : "text-charcoal-muted"}`}>
                            {sub}
                          </span>
                        </span>
                        {o.tag && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              sel ? "bg-cream text-charcoal" : "bg-surface-muted text-gray-700"
                            }`}
                          >
                            {o.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col bg-gray-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-muted">
                  2 &middot; Choose a service &middot; {picked.short}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {SERVICE_SLOTS.map((s) => {
                    const isCurrent = pickedDate === selection.date && s.id === selection.slot;
                    const hasData = saved.has(`${pickedDate}|${s.id}`);
                    const sub = hasData
                      ? "Saved \u00b7 tap to view"
                      : picked.isPast
                        ? "No data saved"
                        : "Empty \u2014 ready to go";
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSelect({ date: pickedDate, slot: s.id });
                          setOpen(false);
                        }}
                        className={`flex min-h-[68px] w-full items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                          isCurrent
                            ? "border-charcoal bg-charcoal text-cream"
                            : "border-line bg-surface text-charcoal hover:bg-surface-muted"
                        }`}
                      >
                        <span className="flex flex-col items-start gap-0.5">
                          <span className="font-display text-xl font-semibold tracking-tight">
                            {s.label}
                          </span>
                          <span className={`text-xs ${isCurrent ? "text-gray-300" : "text-charcoal-muted"}`}>
                            {sub}
                          </span>
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-charcoal">
                            Viewing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-xs text-charcoal-muted">
                    {isLive ? "Following the clock in Dallas." : "Tap a service to open it."}
                  </span>
                  <button
                    onClick={() => {
                      onJumpToLive();
                      setOpen(false);
                    }}
                    disabled={isLive}
                    className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-charcoal transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Jump to current service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
