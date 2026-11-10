"use client";

import { useRealtimeLots } from "@/hooks/useRealtimeLots";
import { OverallSummaryCard } from "@/components/operations/OverallSummaryCard";
import { LotGrid } from "@/components/operations/LotGrid";
import { computeOverallPct, getStatusForPct, mostRecentTimestamp } from "@/lib/calculations";
import { DEFAULT_STATUS_THRESHOLDS } from "@/lib/constants";

export default function OperationsDashboardPage() {
  const { lots, settings, loading } = useRealtimeLots();

  const thresholds = settings?.status_thresholds ?? DEFAULT_STATUS_THRESHOLDS;
  const overallPct = computeOverallPct(lots);
  const overallStatus = getStatusForPct(overallPct, thresholds);
  const lastUpdated = mostRecentTimestamp(lots, settings?.last_updated_at ?? null);

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl flex flex-col gap-8">
        <header className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Shoreline City Church &middot; Dallas, TX
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-charcoal mt-1">
            Parking Status
          </h1>
        </header>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <OverallSummaryCard
              pct={overallPct}
              status={overallStatus}
              trafficFlow={settings?.traffic_flow ?? "medium"}
              lastUpdated={lastUpdated}
            />
            <LotGrid lots={lots} thresholds={thresholds} />
          </>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-48 rounded-xl2 bg-surface-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl2 bg-surface-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
