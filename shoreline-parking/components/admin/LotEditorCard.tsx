"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { getStatusForPct } from "@/lib/calculations";
import { ENTRANCES } from "@/lib/constants";
import type { LotWithStatus } from "@/types/domain";
import type { StatusThresholds } from "@/types/database.types";

interface LotEditorCardProps {
  lot: LotWithStatus;
  thresholds: StatusThresholds;
  onUpdatePct: (lotId: string, pct: number) => void;
  onToggleEntrance: (lotId: string, entrance: string, currentlyAffected: string[]) => void;
  onSaveNotes: (lotId: string, notes: string) => void;
  onToggleClosed: (lotId: string, nextClosed: boolean) => void;
  onSaveReason: (lotId: string, reason: string) => void;
}

export function LotEditorCard({
  lot,
  thresholds,
  onUpdatePct,
  onToggleEntrance,
  onSaveNotes,
  onToggleClosed,
  onSaveReason,
}: LotEditorCardProps) {
  const [notesDraft, setNotesDraft] = useState(lot.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  // Keep the draft in sync if another admin updates notes and Realtime
  // pushes a fresh value in, as long as this admin hasn't started typing.
  useEffect(() => {
    if (!notesDirty) setNotesDraft(lot.notes ?? "");
  }, [lot.notes, notesDirty]);

  // Local draft for the percentage slider so dragging feels instant — the
  // parent debounces the actual write, and Realtime reconciles afterward.
  // While the admin is actively dragging (pctDirty), we trust the local
  // value over whatever the prop says.
  const [pctDraft, setPctDraft] = useState(lot.estimated_pct);
  const pctDirty = useRef(false);
  const pctDirtyTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!pctDirty.current) setPctDraft(lot.estimated_pct);
  }, [lot.estimated_pct]);

  function handleSliderChange(value: number) {
    pctDirty.current = true;
    setPctDraft(value);
    onUpdatePct(lot.id, value);
    clearTimeout(pctDirtyTimer.current);
    pctDirtyTimer.current = setTimeout(() => {
      pctDirty.current = false;
    }, 1200);
  }

  // Typed reason for a closed lot: kept as a local draft so typing feels
  // instant, then saved automatically a moment after the admin stops typing
  // (or when they click out of the box).
  const MAX_REASON = 60;
  const [reasonDraft, setReasonDraft] = useState(lot.closed_reason ?? "");
  const reasonDirty = useRef(false);
  const reasonTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!reasonDirty.current) setReasonDraft(lot.closed_reason ?? "");
  }, [lot.closed_reason]);

  function handleReasonChange(value: string) {
    const next = value.slice(0, MAX_REASON);
    reasonDirty.current = true;
    setReasonDraft(next);
    clearTimeout(reasonTimer.current);
    reasonTimer.current = setTimeout(() => {
      onSaveReason(lot.id, next);
      reasonDirty.current = false;
    }, 700);
  }

  function flushReason() {
    if (!reasonDirty.current) return;
    clearTimeout(reasonTimer.current);
    onSaveReason(lot.id, reasonDraft);
    reasonDirty.current = false;
  }

  function handleToggleClosed() {
    // Don't let a pending reason save land after the lot is reopened.
    clearTimeout(reasonTimer.current);
    reasonDirty.current = false;
    onToggleClosed(lot.id, !lot.is_closed);
  }

  const status = getStatusForPct(pctDraft, thresholds);

  return (
    <Card className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal">{lot.name}</h3>
        {lot.is_closed ? (
          <span className="inline-flex items-center rounded-full bg-charcoal px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream">
            Closed
          </span>
        ) : (
          <StatusPill status={status} size="sm" />
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            {Math.round(pctDraft)}%
          </span>
          <span className="text-xs text-charcoal-muted">Capacity: {lot.capacity}</span>
        </div>
        {lot.is_closed ? (
          <div
            className="h-2.5 rounded-full"
            style={{
              background:
                "repeating-linear-gradient(135deg, #D1D5DB 0, #D1D5DB 8px, #F3F4F6 8px, #F3F4F6 16px)",
            }}
          />
        ) : (
          <ProgressBar pct={pctDraft} status={status} />
        )}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pctDraft}
          disabled={lot.is_closed}
          aria-label={`${lot.name} estimated fullness`}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className={`w-full mt-3 accent-charcoal ${
            lot.is_closed ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        />
      </div>

      <div>
        <button
          onClick={handleToggleClosed}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-charcoal px-4 py-3 text-sm font-bold transition-colors ${
            lot.is_closed
              ? "bg-charcoal text-cream hover:bg-charcoal/90"
              : "bg-surface text-charcoal hover:bg-surface-muted"
          }`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M5.6 5.6l12.8 12.8" />
          </svg>
          {lot.is_closed ? "Reopen lot" : "Close this lot"}
        </button>

        {lot.is_closed && (
          <div className="mt-4 border-t border-line pt-4">
            <label
              htmlFor={`closed-reason-${lot.id}`}
              className="block text-xs uppercase tracking-widest text-charcoal-muted font-semibold mb-2"
            >
              Why is it closed? Shown to everyone
            </label>
            <input
              id={`closed-reason-${lot.id}`}
              type="text"
              maxLength={MAX_REASON}
              value={reasonDraft}
              onChange={(e) => handleReasonChange(e.target.value)}
              onBlur={flushReason}
              placeholder="e.g. Wet grass — please use the other lots"
              className="w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/20"
            />
            <p className="mt-2 text-xs text-charcoal-muted">
              {reasonDraft.length} / {MAX_REASON} &middot; The percentage is paused while the lot is
              closed.
            </p>
          </div>
        )}
      </div>

      <div>
        <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold mb-2 block">
          Entrances Affected
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ENTRANCES.map((entrance) => {
            const active = lot.entrances_affected.includes(entrance);
            return (
              <button
                key={entrance}
                onClick={() => onToggleEntrance(lot.id, entrance, lot.entrances_affected)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-charcoal text-cream border-charcoal"
                    : "bg-surface text-charcoal-muted border-line hover:border-charcoal/30"
                }`}
              >
                {entrance}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold mb-2 block">
          Notes
        </label>
        <textarea
          value={notesDraft}
          onChange={(e) => {
            setNotesDraft(e.target.value);
            setNotesDirty(true);
          }}
          placeholder="Optional — visible to the parking team only"
          rows={2}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/20 resize-none"
        />
        {notesDirty && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onSaveNotes(lot.id, notesDraft);
                setNotesDirty(false);
              }}
              className="text-xs font-semibold text-charcoal bg-surface-muted border border-line rounded-full px-3 py-1.5 hover:bg-line/50"
            >
              Save notes
            </button>
            <button
              onClick={() => {
                setNotesDraft(lot.notes ?? "");
                setNotesDirty(false);
              }}
              className="text-xs font-semibold text-charcoal-muted px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
