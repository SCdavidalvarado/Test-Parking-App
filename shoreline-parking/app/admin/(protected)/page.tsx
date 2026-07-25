"use client";

import { useCallback, useMemo, useRef } from "react";
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

  // Debounce percentage writes so dragging the slider doesn't fire a write
  // per pixel — mirrors the pattern used in the original single-page console.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Debounced write — LotEditorCard keeps its own local draft state so the
  // slider itself feels instant regardless of this delay.
  const handleUpdatePct = useCallback((lotId: string, pct: number) => {
    clearTimeout(debounceTimers.current[lotId]);
    debounceTimers.current[lotId] = setTimeout(async () => {
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("lot_status")
        .update({ estimated_pct: pct, updated_by: user?.id ?? null })
        .eq("lot_id", lotId);
    }, 300);
  }, []);

  const handleToggleEntrance = useCallback(
    async (lotId: string, entrance: string, current: string[]) => {
      const next = current.includes(entrance)
        ? current.filter((e) => e !== entrance)
        : [...current, entrance];
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("lot_status")
        .update({ entrances_affected: next, updated_by: user?.id ?? null })
        .eq("lot_id", lotId);
      refresh();
    },
    [refresh]
  );

  const handleSaveNotes = useCallback(
    async (lotId: string, notes: string) => {
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("lot_status")
        .update({ notes, updated_by: user?.id ?? null })
        .eq("lot_id", lotId);
      refresh();
    },
    [refresh]
  );

  const handleTrafficFlowChange = useCallback(
    async (flow: TrafficFlow) => {
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("parking_settings")
        .update({ traffic_flow: flow, last_updated_at: new Date().toISOString(), updated_by: user?.id ?? null })
        .eq("id", 1);
      refresh();
    },
    [refresh]
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Overall Estimated Capacity
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-display text-4xl font-medium text-charcoal">
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
