import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { EntranceChips } from "./EntranceChips";
import { getStatusForPct } from "@/lib/calculations";
import type { LotWithStatus } from "@/types/domain";
import type { StatusThresholds } from "@/types/database.types";

export function LotCard({
  lot,
  thresholds,
}: {
  lot: LotWithStatus;
  thresholds: StatusThresholds;
}) {
  const status = getStatusForPct(lot.estimated_pct, thresholds);

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-medium text-charcoal">{lot.name}</h3>
        <StatusPill status={status} size="sm" />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display text-3xl font-medium text-charcoal">
            {Math.round(lot.estimated_pct)}%
          </span>
        </div>
        <ProgressBar pct={lot.estimated_pct} status={status} />
      </div>

      <div className="pt-2 border-t border-line">
        <span className="text-xs uppercase tracking-widest text-charcoal-muted font-semibold mb-2 block">
          Entrances Affected
        </span>
        <EntranceChips entrances={lot.entrances_affected} />
      </div>
    </Card>
  );
}
