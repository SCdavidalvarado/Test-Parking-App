import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { TrafficFlowBadge } from "./TrafficFlowBadge";
import type { CapacityStatus } from "@/types/domain";
import type { TrafficFlow } from "@/types/database.types";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function OverallSummaryCard({
  pct,
  status,
  trafficFlow,
  lastUpdated,
  closedNames,
  allClosed,
}: {
  pct: number;
  status: CapacityStatus;
  trafficFlow: TrafficFlow;
  lastUpdated: Date | null;
  closedNames: string[];
  allClosed: boolean;
}) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
        <div className="flex-1">
          <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
            Estimated Capacity
          </span>
          <div className="mt-2 flex items-baseline gap-4">
            <span className="font-display text-6xl sm:text-7xl font-semibold tracking-tight text-charcoal">
              {allClosed ? "\u2014" : `${pct}%`}
            </span>
            {allClosed ? (
              <span className="inline-flex items-center rounded-full bg-charcoal px-3.5 py-1.5 text-sm font-semibold tracking-wide text-cream">
                All lots closed
              </span>
            ) : (
              <StatusPill status={status} />
            )}
          </div>
          <div className="mt-6">
            <ProgressBar pct={allClosed ? 0 : pct} status={status} size="lg" />
          </div>
          {closedNames.length > 0 && (
            <p className="mt-3 text-sm text-charcoal-muted">
              {joinNames(closedNames)} {closedNames.length === 1 ? "is" : "are"} closed and not
              counted in this number.
            </p>
          )}
          <p className="mt-3 text-sm text-charcoal-muted">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Not yet updated today"}
          </p>
        </div>
        <TrafficFlowBadge flow={trafficFlow} />
      </div>
    </Card>
  );
}
