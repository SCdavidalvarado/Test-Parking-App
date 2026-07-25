-- ============================================================
-- Shoreline City Church — Parking System
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

-- Static lot configuration (rarely changes)
create table if not exists lots (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  name          text not null,
  capacity      int not null check (capacity >= 0),
  display_order int not null default 0,
  is_active     boolean not null default true
);

-- Mutable live state, one row per lot
create table if not exists lot_status (
  lot_id             uuid primary key references lots(id) on delete cascade,
  estimated_pct      numeric not null default 0 check (estimated_pct between 0 and 100),
  entrances_affected text[] not null default '{}',
  notes              text,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users(id)
);

-- Append-only audit trail
create table if not exists lot_status_history (
  id                 bigint generated always as identity primary key,
  lot_id             uuid references lots(id) on delete set null,
  estimated_pct      numeric,
  entrances_affected text[],
  notes              text,
  changed_at         timestamptz not null default now(),
  changed_by         uuid references auth.users(id)
);

-- Singleton row: traffic flow + configurable status thresholds
create table if not exists parking_settings (
  id                int primary key default 1 check (id = 1),
  traffic_flow      text not null default 'medium'
                      check (traffic_flow in ('heavy','medium','light','trickle')),
  status_thresholds jsonb not null default
    '{"open": 60, "filling": 85, "nearlyFull": 97}'::jsonb,
  last_updated_at   timestamptz not null default now(),
  updated_by        uuid references auth.users(id)
);

-- Roles for admin accounts (one row per Supabase Auth user who is an admin)
create table if not exists profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role      text not null default 'parking_admin'
              check (role in ('parking_admin','super_admin'))
);

-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------

-- Auto-stamp lot_status.updated_at on every write
create or replace function set_lot_status_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lot_status_updated_at on lot_status;
create trigger trg_lot_status_updated_at
  before update on lot_status
  for each row execute function set_lot_status_updated_at();

-- Auto-stamp parking_settings.last_updated_at on every write
create or replace function set_parking_settings_updated_at()
returns trigger as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_parking_settings_updated_at on parking_settings;
create trigger trg_parking_settings_updated_at
  before update on parking_settings
  for each row execute function set_parking_settings_updated_at();

-- Log every lot_status change into the audit trail
create or replace function log_lot_status_history()
returns trigger as $$
begin
  insert into lot_status_history (lot_id, estimated_pct, entrances_affected, notes, changed_by)
  values (new.lot_id, new.estimated_pct, new.entrances_affected, new.notes, new.updated_by);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_log_lot_status_history on lot_status;
create trigger trg_log_lot_status_history
  after insert or update on lot_status
  for each row execute function log_lot_status_history();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table lots enable row level security;
alter table lot_status enable row level security;
alter table lot_status_history enable row level security;
alter table parking_settings enable row level security;
alter table profiles enable row level security;

-- Helper: is the current user a parking admin (or super admin)?
create or replace function is_parking_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('parking_admin','super_admin')
  );
$$ language sql stable security definer;

-- Public read access (Operations Dashboard has no login)
create policy "Public can read lots" on lots
  for select using (true);

create policy "Public can read lot_status" on lot_status
  for select using (true);

create policy "Public can read parking_settings" on parking_settings
  for select using (true);

-- Only admins can write live status / settings
create policy "Admins can update lot_status" on lot_status
  for update using (is_parking_admin());

create policy "Admins can insert lot_status" on lot_status
  for insert with check (is_parking_admin());

create policy "Admins can update parking_settings" on parking_settings
  for update using (is_parking_admin());

-- History is admin-readable only (internal audit trail)
create policy "Admins can read history" on lot_status_history
  for select using (is_parking_admin());

-- Profiles: a user can read their own profile row
create policy "Users can read own profile" on profiles
  for select using (id = auth.uid());

-- No public policy for INSERT/UPDATE/DELETE on lots or profiles —
-- capacities and roles are managed directly in the Supabase dashboard
-- for now (a future Settings page can add super_admin-only policies here).
