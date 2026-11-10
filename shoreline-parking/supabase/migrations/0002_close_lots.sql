-- ============================================================
-- Close a lot: lets an admin mark a lot closed (with an optional typed
-- reason) so everyone sees "Do not park here" on the Operations Dashboard.
-- Additive and safe: existing rows default to open, nothing else changes.
-- ============================================================

alter table public.lot_status
  add column if not exists is_closed boolean not null default false;

alter table public.lot_status
  add column if not exists closed_reason text
    check (closed_reason is null or char_length(closed_reason) <= 60);
