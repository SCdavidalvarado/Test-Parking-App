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
}

export function LotEditorCard({
  lot,
  thresholds,
  onUpdatePct,
  onToggleEntrance,
  onSaveNotes,
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

  const status = getStatusForPct(pctDraft, thresholds);

  return (
    <Card className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-medium text-charcoal">{lot.name}</h3>
        <StatusPill status={status} size="sm" />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display text-3xl font-medium text-charcoal">
            {Math.round(pctDraft)}%
          </span>
          <span className="text-xs text-charcoal-muted">Capacity: {lot.capacity}</span>
        </div>
        <ProgressBar pct={pctDraft} status={status} />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pctDraft}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full mt-3 accent-charcoal cursor-pointer"
        />
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
