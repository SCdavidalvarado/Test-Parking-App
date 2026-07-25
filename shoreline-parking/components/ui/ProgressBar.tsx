import type { CapacityStatus } from "@/types/domain";
import { statusAccentColor } from "./StatusPill";

export function ProgressBar({
  pct,
  status,
  size = "sm",
}: {
  pct: number;
  status: CapacityStatus;
  size?: "sm" | "lg";
}) {
  const color = statusAccentColor(status);
  return (
    <div
      className={`w-full rounded-full bg-surface-muted overflow-hidden ${
        size === "lg" ? "h-4" : "h-2.5"
      }`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
      />
    </div>
  );
}
