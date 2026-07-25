import type { StatusThresholds, TrafficFlow } from "./database.types";

export interface LotWithStatus {
  id: string;
  key: string;
  name: string;
  capacity: number;
  display_order: number;
  estimated_pct: number;
  entrances_affected: string[];
  notes: string | null;
  updated_at: string | null;
}

export interface ParkingSettings {
  id: number;
  traffic_flow: TrafficFlow;
  status_thresholds: StatusThresholds;
  last_updated_at: string;
}

export type CapacityStatus = "Open" | "Filling Up" | "Nearly Full" | "Full";
