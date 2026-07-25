import type { StatusThresholds } from "@/types/database.types";
import type { CapacityStatus, LotWithStatus } from "@/types/domain";

/**
 * Weighted overall percentage across all lots, weighted by each lot's
 * capacity. Never stored — always derived, so it can't drift out of sync
 * with the individual lot percentages.
 */
export function computeOverallPct(lots: LotWithStatus[]): number {
  const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
  if (totalCapacity === 0) return 0;
  const weightedSum = lots.reduce(
    (sum, lot) => sum + lot.capacity * (clampPct(lot.estimated_pct) / 100),
    0
  );
  return Math.round((weightedSum / totalCapacity) * 100);
}

export function getStatusForPct(
  pct: number,
  thresholds: StatusThresholds
): CapacityStatus {
  const p = clampPct(pct);
  if (p < thresholds.open) return "Open";
  if (p < thresholds.filling) return "Filling Up";
  if (p < thresholds.nearlyFull) return "Nearly Full";
  return "Full";
}

export function clampPct(pct: number): number {
  return Math.max(0, Math.min(100, pct));
}

export function mostRecentTimestamp(
  lots: LotWithStatus[],
  settingsLastUpdatedAt: string | null
): Date | null {
  const timestamps = [
    ...lots.map((l) => (l.updated_at ? new Date(l.updated_at).getTime() : 0)),
    settingsLastUpdatedAt ? new Date(settingsLastUpdatedAt).getTime() : 0,
  ];
  const max = Math.max(...timestamps, 0);
  return max > 0 ? new Date(max) : null;
}
