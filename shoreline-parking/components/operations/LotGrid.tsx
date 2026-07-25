import { LotCard } from "./LotCard";
import type { LotWithStatus } from "@/types/domain";
import type { StatusThresholds } from "@/types/database.types";

export function LotGrid({
  lots,
  thresholds,
}: {
  lots: LotWithStatus[];
  thresholds: StatusThresholds;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {lots.map((lot) => (
        <LotCard key={lot.id} lot={lot} thresholds={thresholds} />
      ))}
    </div>
  );
}
