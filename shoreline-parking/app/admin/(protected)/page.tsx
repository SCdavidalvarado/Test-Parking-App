"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRealtimeLots } from "@/hooks/useRealtimeLots";
import { getBrowserClient } from "@/lib/supabase/client";
import { TrafficFlowControl } from "@/components/admin/TrafficFlowControl";
import { LotEditorCard } from "@/components/admin/LotEditorCard";
import { computeOverallPct, getStatusForPct, mostRecentTimestamp } from "@/lib/calculations";
import { DEFAULT_STATUS_THRESHOLDS } from "@/lib/constants";
import { StatusPill } from "@/components/ui/StatusPill";
import type { TrafficFlow } from "@/types/database.types";

export default function AdminDashboardPage() {
  const { lots, settings, loading, refresh } = useRealtimeLots();
  const thresholds = settings?.status_thresholds ?? DEFAULT_STATUS_THRESHOLDS;

  const overallPct = computeOverallPct(lots);
  const overallStatus = getStatusForPct(overallPct, thresholds);
  const lastUpdated = mostRecentTimestamp(lots, settings?.last_updated_at ?? null);

  // Shows a visible error if a save is rejected by the database. Before this,
  // failed saves were silent — the slider moved but nothing was stored.
  const [saveError, setSaveError] = useState<string | null>(null);

  // Runs one update, surfaces any error, and refreshes the data afterward.
  const runUpdate = useCallback(
    async (
      table: "lot_status" | "parking_settings",
      values: Record<string, unknown>,
      match: { column: string; value: string | number }
    ) => {
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaveError("You're signed out — please sign in again, then retry.");
        return;
      }

      const { error } = await supabase
        .from(table)
        .update({ ...values, updated_by: user.id })
        .eq(match.column, match.value);

      if (error) {
        setSaveError(`Couldn't save: ${error.message}`);
      } else {
        setSaveError(null);
      }
      refresh();
    },
    [refresh]
  );

  // Debounce percentage writes so dragging the slider doesn't fire a write
  // per pixel. LotEditorCard keeps its own local draft so the slider itself
  // feels instant regardless of this delay.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleUpdatePct = useCallback(
    (lotId: string, pct: number) => {
      clearTimeout(debounceTimers.current[lotId]);
      debounceTimers.current[lotId] = setTimeout(() => {
        runUpdate("lot_status", { estimated_pct: pct }, { column: "lot_id", value: lotId });
      }, 300);
    },
    [runUpdate]
  );

  const handleToggleEntrance = useCallback(
    (lotId: string, entrance: string, current: string[]) => {
      const next = current.includes(entrance)
        ? current.filter((e) => e !== entrance)
        : [...current, entrance];
      return runUpdate("lot_status", { entrances_affected: next }, { column: "lot_id", value: lotId });
    },
    [runUpdate]
  );

  const handleSaveNotes = useCallback(
    (lotId: string, notes: string) =>
      runUpdate("lot_status", { notes }, { column: "lot_id", value: lotId }),
    [runUpdate]
  );

  const handleTrafficFlowChange = useCallback(
    (flow: TrafficFlow) =>
      runUpdate("parking_settings", { traffic_flow: flow }, { column: "id", value: 1 }),
    [runUpdate]
  );

  const sortedLots = useMemo(
    () => [...lots].sort((a, b) => a.display_order - b.display_order),
    [lots]
  );

  if (loading) {
    return <div className="h-64 rounded-xl2 bg-surface-muted animate-pulse" />;
  }

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              : "Not yet updated today"}
          </p>
        </div>
      </div>

      <TrafficFlowControl
        value={settings?.traffic_flow ?? "medium"}
        onChange={handleTrafficFlowChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedLots.map((lot) => (
          <LotEditorCard
            key={lot.id}
            lot={lot}
            thresholds={thresholds}
            onUpdatePct={handleUpdatePct}
            onToggleEntrance={handleToggleEntrance}
            onSaveNotes={handleSaveNotes}
          />
        ))}
      </div>
    </div>
  );
}
