-- ============================================================
-- Run this AFTER 0001_init.sql. Safe to re-run (upserts by key).
-- ============================================================

insert into lots (key, name, capacity, display_order) values
  ('north',    'North Lot',    191, 1),
  ('east',     'East Lot',     198, 2),
  ('south',    'South Lot',    165, 3),
  ('west',     'West Lot',     235, 4),
  ('business', 'Business Lot', 462, 5),
  ('grass',    'Grass Lot',    350, 6)
on conflict (key) do update set
  name = excluded.name,
  capacity = excluded.capacity,
  display_order = excluded.display_order;

-- One lot_status row per lot, starting at 0%
insert into lot_status (lot_id, estimated_pct, entrances_affected)
select id, 0, '{}'::text[] from lots
on conflict (lot_id) do nothing;

-- Singleton settings row
insert into parking_settings (id, traffic_flow, status_thresholds)
values (1, 'medium', '{"open": 60, "filling": 85, "nearlyFull": 97}'::jsonb)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Creating your first Parking Admin (do this once, manually):
--
-- 1. In the Supabase dashboard: Authentication -> Users -> Add user
--    (enter their email + a temporary password, or send an invite).
-- 2. Copy that user's UUID from the Users table.
-- 3. Run, substituting the UUID and name:
--
--    insert into profiles (id, full_name, role)
--    values ('PASTE-USER-UUID-HERE', 'Jane Doe', 'parking_admin');
--
-- Repeat step 3 for every Parking Team member who needs admin access.
-- ------------------------------------------------------------
