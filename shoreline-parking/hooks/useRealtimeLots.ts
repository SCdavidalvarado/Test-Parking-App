"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import type { LotWithStatus, ParkingSettings } from "@/types/domain";
import { DEFAULT_STATUS_THRESHOLDS } from "@/lib/constants";

interface UseRealtimeLotsResult {
  lots: LotWithStatus[];
  settings: ParkingSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads all lots + their live status + the parking_settings singleton, and
 * re-fetches whenever any relevant row changes via Supabase Realtime. Used
 * by both the Operations Dashboard (read-only) and the Admin Dashboard
 * (which also writes, then relies on this same subscription to reconcile).
 */
export function useRealtimeLots(): UseRealtimeLotsResult {
  const [lots, setLots] = useState<LotWithStatus[]>([]);
  const [settings, setSettings] = useState<ParkingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = getBrowserClient();

    const [lotsRes, statusRes, settingsRes] = await Promise.all([
      supabase.from("lots").select("*").eq("is_active", true).order("display_order"),
      supabase.from("lot_status").select("*"),
      supabase.from("parking_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    if (lotsRes.data) {
      const statusByLotId = new Map(
        (statusRes.data ?? []).map((s) => [s.lot_id, s])
      );
      const merged: LotWithStatus[] = lotsRes.data.map((lot) => {
        const status = statusByLotId.get(lot.id);
        return {
          id: lot.id,
          key: lot.key,
          name: lot.name,
          capacity: lot.capacity,
          display_order: lot.display_order,
          estimated_pct: status?.estimated_pct ?? 0,
          entrances_affected: status?.entrances_affected ?? [],
          notes: status?.notes ?? null,
          updated_at: status?.updated_at ?? null,
        };
      });
      setLots(merged);
    }

    if (settingsRes.data) {
      setSettings({
        id: settingsRes.data.id,
        traffic_flow: settingsRes.data.traffic_flow,
        status_thresholds: settingsRes.data.status_thresholds ?? DEFAULT_STATUS_THRESHOLDS,
        last_updated_at: settingsRes.data.last_updated_at,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const supabase = getBrowserClient();
    const channel = supabase
      .channel("parking-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lot_status" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_settings" },
        () => fetchAll()
      )
      .subscribe();

    // Safety net: also re-fetch every 8 seconds. Realtime gives instant
    // updates, but this keeps both dashboards correct (within a few
    // seconds) even if Realtime isn't enabled for the tables or a
    // connection drops silently.
    const poll = setInterval(fetchAll, 8000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { lots, settings, loading, refresh: fetchAll };
}
