import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { TrafficFlowBadge } from "./TrafficFlowBadge";
import type { CapacityStatus } from "@/types/domain";
import type { TrafficFlow } from "@/types/database.types";

export function OverallSummaryCard({
  pct,
  status,
  trafficFlow,
  lastUpdated,
}: {
  pct: number;
  status: CapacityStatus;
  trafficFlow: TrafficFlow;
  lastUpdated: Date | null;
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
              {pct}%
            </span>
            <StatusPill status={status} />
          </div>
          <div className="mt-6">
            <ProgressBar pct={pct} status={status} size="lg" />
          </div>
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
