// These mirror the SQL in supabase/migrations/0001_init.sql.
// Once your project is live, you can replace this file with the auto-generated
// version by running: npx supabase gen types typescript --project-id YOUR_REF

export type TrafficFlow = "heavy" | "medium" | "light" | "trickle";
export type ProfileRole = "parking_admin" | "super_admin";

export interface StatusThresholds {
  open: number; // pct below this = "Open"
  filling: number; // pct below this = "Filling Up"
  nearlyFull: number; // pct below this = "Nearly Full", at/above = "Full"
}

export interface Database {
  public: {
    Tables: {
      lots: {
        Row: {
          id: string;
          key: string;
          name: string;
          capacity: number;
          display_order: number;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["lots"]["Row"]> & {
          key: string;
          name: string;
          capacity: number;
        };
        Update: Partial<Database["public"]["Tables"]["lots"]["Row"]>;
        Relationships: [];
      };
      lot_status: {
        Row: {
          lot_id: string;
          estimated_pct: number;
          entrances_affected: string[];
          notes: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lot_status"]["Row"]> & {
          lot_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lot_status"]["Row"]>;
        Relationships: [];
      };
      lot_status_history: {
        Row: {
          id: number;
          lot_id: string;
          estimated_pct: number | null;
          entrances_affected: string[] | null;
          notes: string | null;
          changed_at: string;
          changed_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lot_status_history"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lot_status_history"]["Row"]>;
        Relationships: [];
      };
      parking_settings: {
        Row: {
          id: number;
          traffic_flow: TrafficFlow;
          status_thresholds: StatusThresholds;
          last_updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["parking_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["parking_settings"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: ProfileRole;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
