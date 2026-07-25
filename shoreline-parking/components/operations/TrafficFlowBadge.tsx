import type { TrafficFlow } from "@/types/database.types";
import { TRAFFIC_FLOW_OPTIONS } from "@/lib/constants";

const STYLES: Record<TrafficFlow, string> = {
  heavy: "bg-status-nearly-bg text-status-nearly",
  medium: "bg-status-filling-bg text-status-filling",
  light: "bg-status-open-bg text-status-open",
  trickle: "bg-surface-muted text-charcoal-muted",
};

export function TrafficFlowBadge({ flow }: { flow: TrafficFlow }) {
  const label = TRAFFIC_FLOW_OPTIONS.find((o) => o.value === flow)?.label ?? flow;
  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
        Traffic Flow
      </span>
      <span
        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold tracking-wide ${STYLES[flow]}`}
      >
        {label}
      </span>
    </div>
  );
}
