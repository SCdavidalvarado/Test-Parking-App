"use client";

import { Card } from "@/components/ui/Card";
import { TRAFFIC_FLOW_OPTIONS } from "@/lib/constants";
import type { TrafficFlow } from "@/types/database.types";

export function TrafficFlowControl({
  value,
  onChange,
}: {
  value: TrafficFlow | null;
  onChange: (flow: TrafficFlow) => void;
}) {
  return (
    <Card className="p-6">
      <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold">
        Traffic Flow
      </span>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TRAFFIC_FLOW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold border transition-colors ${
              value === opt.value
                ? "bg-charcoal text-cream border-charcoal"
                : "bg-surface text-charcoal-muted border-line hover:border-charcoal/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
