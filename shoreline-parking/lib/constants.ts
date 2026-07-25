import type { StatusThresholds, TrafficFlow } from "@/types/database.types";

export const ENTRANCES = [
  "Entrance 1",
  "Entrance 2",
  "Entrance 3",
  "Entrance 4",
  "Entrance 5",
  "Entrance 6",
  "Entrance 7",
  "Entrance 8",
] as const;

export const TRAFFIC_FLOW_OPTIONS: { value: TrafficFlow; label: string }[] = [
  { value: "heavy", label: "Heavy Flow" },
  { value: "medium", label: "Medium Flow" },
  { value: "light", label: "Light Flow" },
  { value: "trickle", label: "Trickle" },
];

// Used only if parking_settings hasn't loaded yet — the real values always
// come from the database (parking_settings.status_thresholds) so they stay
// editable from a future Settings page without a code change.
export const DEFAULT_STATUS_THRESHOLDS: StatusThresholds = {
  open: 60,
  filling: 85,
  nearlyFull: 97,
};

// Fixed lot capacities, matching the SQL seed data. Kept here too so the UI
// has an immediate fallback while data is loading.
export const OVERALL_CAPACITY = 1601;
