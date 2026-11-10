import type { CapacityStatus } from "@/types/domain";

const STYLES: Record<CapacityStatus, string> = {
  Open: "bg-status-open-bg text-status-open",
  "Filling Up": "bg-status-filling-bg text-status-filling",
  "Nearly Full": "bg-status-nearly-bg text-status-nearly",
  Full: "bg-status-full-bg text-status-full",
};

export function StatusPill({
  status,
  size = "md",
}: {
  status: CapacityStatus;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${
        STYLES[status]
      } ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-sm"}`}
    >
      {status}
    </span>
  );
}

export function statusAccentColor(status: CapacityStatus): string {
  switch (status) {
    case "Open":
      return "#4C9F8A";
    case "Filling Up":
      return "#D9A441";
    case "Nearly Full":
      return "#E07A3A";
    case "Full":
      return "#C2413B";
  }
}
