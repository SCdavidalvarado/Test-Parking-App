"use client";

import { useRealtimeLots } from "@/hooks/useRealtimeLots";
import { useSelectedSession } from "@/hooks/useSelectedSession";
import { OverallSummaryCard } from "@/components/operations/OverallSummaryCard";
import { LotGrid } from "@/components/operations/LotGrid";
import { SessionPicker } from "@/components/SessionPicker";
import { ProfileMenu } from "@/components/ProfileMenu";
import { computeOverallPct, getStatusForPct, mostRecentTimestamp } from "@/lib/calculations";
import { formatLong, slotLabel } from "@/lib/sessions";

export default function OperationsDashboardPage() {
  const { selection, now, select, jumpToLive, isLive, ready } = useSelectedSession();
  const { lots, session, thresholds, loading } = useRealtimeLots(selection);

  const overallPct = computeOverallPct(lots);
  const overallStatus = getStatusForPct(overallPct, thresholds);
  const lastUpdated = mostRecentTimestamp(lots, session?.last_updated_at ?? null);
  const closedNames = lots.filter((l) => l.is_closed).map((l) => l.name);
  const allClosed = lots.length > 0 && closedNames.length === lots.length;

  const subtitle = selection
    ? `Sunday, ${formatLong(selection.date)} \u00b7 ${slotLabel(selection.slot)} service`
    : "";
  const isPastSelection = selection && now ? selection.date < now.date : false;
  const showLoading = !ready || loading;

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl flex flex-col gap-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
              Shoreline City Church &middot; Dallas, TX
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-charcoal mt-1">
              SC Valet Tracker
            </h1>
            {subtitle && <p className="mt-2 text-base text-charcoal-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center justify-center gap-3 sm:justify-end sm:pt-2">
            {ready && selection && now && (
              <SessionPicker
                selection={selection}
                now={now}
                isLive={isLive}
                onSelect={select}
                onJumpToLive={jumpToLive}
              />
            )}
            <ProfileMenu />
          </div>
        </header>

        {showLoading ? (
          <LoadingState />
        ) : (
          <>
            {!session && (
              <div className="rounded-xl2 border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-sm text-gray-700">
                <strong className="font-semibold">No data yet for this service.</strong>{" "}
                {isPastSelection
                  ? "Nothing was saved for it."
                  : "Every lot starts at 0% and is ready for the parking team to fill in on Sunday."}
              </div>
            )}
            <OverallSummaryCard
              pct={overallPct}
              status={overallStatus}
              trafficFlow={session?.traffic_flow ?? null}
              lastUpdated={lastUpdated}
              closedNames={closedNames}
              allClosed={allClosed}
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
