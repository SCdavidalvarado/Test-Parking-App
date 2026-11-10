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
  if (lot.is_closed) {
    return <ClosedLotCard lot={lot} />;
  }

  const status = getStatusForPct(lot.estimated_pct, thresholds);

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal">{lot.name}</h3>
        <StatusPill status={status} size="sm" />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display text-3xl font-semibold tracking-tight text-charcoal">
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

function ClosedLotCard({ lot }: { lot: LotWithStatus }) {
  const reason = lot.closed_reason?.trim();

  return (
    <Card
      className="p-6 flex flex-col gap-4"
      style={{ borderStyle: "dashed", borderColor: "#9CA3AF", backgroundColor: "#F9FAFB" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-tight text-charcoal">{lot.name}</h3>
        <span className="inline-flex items-center rounded-full bg-charcoal px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream">
          Closed
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="font-display text-2xl font-semibold leading-tight tracking-tight text-charcoal">
          Do not park here
        </p>
        <p className="text-sm text-charcoal-muted">
          {reason ? `Reason: ${reason}` : "Closed by the parking team"}
        </p>
        <div
          className="h-2.5 rounded-full"
          style={{
            background:
              "repeating-linear-gradient(135deg, #D1D5DB 0, #D1D5DB 8px, #F3F4F6 8px, #F3F4F6 16px)",
          }}
        />
      </div>
    </Card>
  );
}
