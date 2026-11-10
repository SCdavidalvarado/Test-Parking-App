-- ============================================================
-- FIX: percentages not saving from the Admin Dashboard
--
-- Cause: every lot_status update fires a trigger that writes to
-- lot_status_history. That table has Row Level Security on and no
-- INSERT policy, so the trigger was blocked and the whole update
-- rolled back. Making the trigger function SECURITY DEFINER lets it
-- write the audit row regardless.
--
-- Run this once in the Supabase SQL Editor (new query tab).
-- ============================================================

create or replace function log_lot_status_history()
returns trigger as $$
begin
  insert into lot_status_history (lot_id, estimated_pct, entrances_affected, notes, changed_by)
  values (new.lot_id, new.estimated_pct, new.entrances_affected, new.notes, new.updated_by);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ------------------------------------------------------------
-- If the above errors with "must be owner of function", use the
-- dashboard instead (same trick as the profiles policy):
--   Authentication -> Policies -> table lot_status_history ->
--   New Policy -> from scratch:
--     Name: Allow history inserts
--     Command: INSERT
--     Target roles: authenticated
--     WITH CHECK expression: true
-- ------------------------------------------------------------
