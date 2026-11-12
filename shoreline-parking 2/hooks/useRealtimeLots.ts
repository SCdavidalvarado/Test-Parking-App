"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import type { LotWithStatus, ServiceSession } from "@/types/domain";
import type { StatusThresholds } from "@/types/database.types";
import { DEFAULT_STATUS_THRESHOLDS } from "@/lib/constants";
import { selectionKey, type Selection } from "@/lib/sessions";

interface UseRealtimeLotsResult {
  lots: LotWithStatus[];
  /** null until an admin has saved something for this Sunday + service. */
  session: ServiceSession | null;
  thresholds: StatusThresholds;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads every lot plus its saved status for ONE Sunday + service, and keeps it
 * fresh via Supabase Realtime (with an 8-second re-check as a safety net).
 * Lots with nothing saved yet show as empty — 0%, open, no entrances affected.
 */
export function useRealtimeLots(selection: Selection | null): UseRealtimeLotsResult {
  const [lots, setLots] = useState<LotWithStatus[]>([]);
  const [session, setSession] = useState<ServiceSession | null>(null);
  const [thresholds, setThresholds] = useState<StatusThresholds>(DEFAULT_STATUS_THRESHOLDS);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const date = selection?.date;
  const slot = selection?.slot;
  const key = selection ? selectionKey(selection) : null;

  // Lets a slow response for an old pick be ignored once the pick has changed.
  const latestKey = useRef<string | null>(null);
  latestKey.current = key;

  const fetchAll = useCallback(async () => {
    if (!date || !slot) return;
    const requestKey = `${date}|${slot}`;
    const supabase = getBrowserClient();

    const sessionRes = await supabase
      .from("service_sessions")
      .select("*")
      .eq("service_date", date)
      .eq("service_slot", slot)
      .maybeSingle();
    const currentSession = sessionRes.data ?? null;

    const [lotsRes, settingsRes, statusRes] = await Promise.all([
      supabase.from("lots").select("*").eq("is_active", true).order("display_order"),
      supabase.from("parking_settings").select("status_thresholds").eq("id", 1).maybeSingle(),
      currentSession
        ? supabase.from("session_lot_status").select("*").eq("session_id", currentSession.id)
        : Promise.resolve(null),
    ]);

    if (latestKey.current !== requestKey) return;

    if (lotsRes.data) {
      const statusByLotId = new Map(
        (statusRes?.data ?? []).map((s) => [s.lot_id, s])
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
          is_closed: status?.is_closed ?? false,
          closed_reason: status?.closed_reason ?? null,
        };
      });
      setLots(merged);
    }

    setSession(
      currentSession
        ? {
            id: currentSession.id,
            service_date: currentSession.service_date,
            service_slot: currentSession.service_slot,
            traffic_flow: currentSession.traffic_flow,
            last_updated_at: currentSession.last_updated_at,
          }
        : null
    );

    if (settingsRes.data?.status_thresholds) {
      setThresholds(settingsRes.data.status_thresholds);
    }

    setLoadedKey(requestKey);
  }, [date, slot]);

  useEffect(() => {
    if (!date || !slot) return;
    fetchAll();

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`parking-${date}-${slot}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_lot_status" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_sessions" },
        () => fetchAll()
      )
      .subscribe();

    // Safety net: also re-fetch every 8 seconds, so both dashboards stay
    // correct within a few seconds even if Realtime isn't enabled for these
    // tables or a connection drops silently.
    const poll = setInterval(fetchAll, 8000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [date, slot, fetchAll]);

  return {
    lots,
    session,
    thresholds,
    loading: !selection || loadedKey !== key,
    refresh: fetchAll,
  };
}
