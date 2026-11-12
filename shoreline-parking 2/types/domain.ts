import type { ServiceSlot, StatusThresholds, TrafficFlow } from "./database.types";

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
  is_closed: boolean;
  closed_reason: string | null;
}

export interface ParkingSettings {
  id: number;
  traffic_flow: TrafficFlow;
  status_thresholds: StatusThresholds;
  last_updated_at: string;
}

export type CapacityStatus = "Open" | "Filling Up" | "Nearly Full" | "Full";

export interface ServiceSession {
  id: string;
  service_date: string;
  service_slot: ServiceSlot;
  traffic_flow: TrafficFlow | null;
  last_updated_at: string;
}
