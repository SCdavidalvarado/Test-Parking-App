"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRealtimeLots } from "@/hooks/useRealtimeLots";
import { useSelectedSession } from "@/hooks/useSelectedSession";
import { getBrowserClient } from "@/lib/supabase/client";
import { TrafficFlowControl } from "@/components/admin/TrafficFlowControl";
import { LotEditorCard } from "@/components/admin/LotEditorCard";
import { SessionPicker } from "@/components/SessionPicker";
import { computeOverallPct, getStatusForPct, mostRecentTimestamp } from "@/lib/calculations";
import { selectionKey } from "@/lib/sessions";
import { StatusPill } from "@/components/ui/StatusPill";
import type { SessionLotStatusRow, TrafficFlow } from "@/types/database.types";

type LotValues = Partial<
  Pick<SessionLotStatusRow, "estimated_pct" | "entrances_affected" | "notes" | "is_closed" | "closed_reason">
>;

export default function AdminDashboardPage() {
  const { selection, now, select, jumpToLive, isLive, ready } = useSelectedSession();
  const { lots, session, thresholds, loading, refresh } = useRealtimeLots(selection);

  const overallPct = computeOverallPct(lots);
  const overallStatus = getStatusForPct(overallPct, thresholds);
  const lastUpdated = mostRecentTimestamp(lots, session?.last_updated_at ?? null);

  // Shows a visible error if a save is rejected by the database.
  const [saveError, setSaveError] = useState<string | null>(null);

  // Makes sure a saved record exists for the Sunday + service being edited
  // (creating it the first time anything is saved), and who is signed in.
  const getUserAndSession = useCallback(async () => {
    if (!selection) return null;
    const supabase = getBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("You're signed out \u2014 please sign in again, then retry.");
      return null;
    }

    const { data, error } = await supabase
      .from("service_sessions")
      .upsert(
        { service_date: selection.date, service_slot: selection.slot, updated_by: user.id },
        { onConflict: "service_date,service_slot" }
      )
      .select("id")
      .single();

    if (error || !data) {
      setSaveError(`Couldn't save: ${error?.message ?? "unknown error"}`);
      return null;
    }
    return { userId: user.id, sessionId: data.id };
  }, [selection]);

  const runLotUpdate = useCallback(
    async (lotId: string, values: LotValues) => {
      const ctx = await getUserAndSession();
      if (!ctx) return;
      const { error } = await getBrowserClient()
        .from("session_lot_status")
        .upsert(
          { session_id: ctx.sessionId, lot_id: lotId, ...values, updated_by: ctx.userId },
          { onConflict: "session_id,lot_id" }
        );
      setSaveError(error ? `Couldn't save: ${error.message}` : null);
      refresh();
    },
    [getUserAndSession, refresh]
  );

  // Debounce percentage writes so dragging the slider doesn't fire a write
  // per pixel. LotEditorCard keeps its own local draft so the slider itself
  // feels instant regardless of this delay.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleUpdatePct = useCallback(
    (lotId: string, pct: number) => {
      clearTimeout(debounceTimers.current[lotId]);
      debounceTimers.current[lotId] = setTimeout(() => {
        runLotUpdate(lotId, { estimated_pct: pct });
      }, 300);
    },
    [runLotUpdate]
  );

  const handleToggleEntrance = useCallback(
    (lotId: string, entrance: string, current: string[]) => {
      const next = current.includes(entrance)
        ? current.filter((e) => e !== entrance)
        : [...current, entrance];
      return runLotUpdate(lotId, { entrances_affected: next });
    },
    [runLotUpdate]
  );

  const handleSaveNotes = useCallback(
    (lotId: string, notes: string) => runLotUpdate(lotId, { notes }),
    [runLotUpdate]
  );

  const handleToggleClosed = useCallback(
    (lotId: string, nextClosed: boolean) =>
      runLotUpdate(
        lotId,
        nextClosed ? { is_closed: true } : { is_closed: false, closed_reason: null }
      ),
    [runLotUpdate]
  );

  const handleSaveReason = useCallback(
    (lotId: string, reason: string) =>
      runLotUpdate(lotId, { closed_reason: reason.trim() === "" ? null : reason.trim() }),
    [runLotUpdate]
  );

  const handleTrafficFlowChange = useCallback(
    async (flow: TrafficFlow) => {
      if (!selection) return;
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("You're signed out \u2014 please sign in again, then retry.");
        return;
      }
      const { error } = await supabase.from("service_sessions").upsert(
        {
          service_date: selection.date,
          service_slot: selection.slot,
          traffic_flow: flow,
          updated_by: user.id,
        },
        { onConflict: "service_date,service_slot" }
      );
      setSaveError(error ? `Couldn't save: ${error.message}` : null);
      refresh();
    },
    [selection, refresh]
  );

  const sortedLots = useMemo(
    () => [...lots].sort((a, b) => a.display_order - b.display_order),
    [lots]
  );

  if (!ready || loading || !selection || !now) {
    return <div className="h-64 rounded-xl2 bg-surface-muted animate-pulse" />;
  }

  const isPastSelection = selection.date < now.date;
  const selKey = selectionKey(selection);

  return (
    <div className="flex flex-col gap-6">
      {saveError && (
        <div
          role="alert"
          className="rounded-xl2 border border-status-full/30 bg-status-full-bg px-4 py-3 text-sm font-medium text-status-full"
        >
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Overall Estimated Capacity
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-display text-4xl font-semibold tracking-tight text-charcoal">
              {overallPct}%
            </span>
            <StatusPill status={overallStatus} />
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Not started \u2014 ready to go"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Editing
          </span>
          <SessionPicker
            selection={selection}
            now={now}
            isLive={isLive}
            onSelect={select}
            onJumpToLive={jumpToLive}
          />
        </div>
      </div>

      {isPastSelection && (
        <div className="rounded-xl2 border border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-700">
          This service has already happened. Changes you make here update its saved record.
        </div>
      )}

      <TrafficFlowControl
        value={session?.traffic_flow ?? null}
        onChange={handleTrafficFlowChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedLots.map((lot) => (
          <LotEditorCard
            key={`${selKey}-${lot.id}`}
            lot={lot}
            thresholds={thresholds}
            onUpdatePct={handleUpdatePct}
            onToggleEntrance={handleToggleEntrance}
            onSaveNotes={handleSaveNotes}
            onToggleClosed={handleToggleClosed}
            onSaveReason={handleSaveReason}
          />
        ))}
      </div>
    </div>
  );
}
