-- ============================================================
-- Sunday + service picker: every Sunday service gets its own saved record.
--
--   service_sessions      one row per (Sunday date, service time) + its traffic flow
--   session_lot_status    one row per lot per session (percent, entrances,
--                         notes, closed + reason)
--
-- A session is created the first time an admin saves something for it, so
-- every future Sunday/service starts empty and "ready to go" with no setup.
-- The older lot_status / parking_settings tables are left in place, untouched
-- (parking_settings is still used for the status thresholds).
-- ============================================================

create table if not exists public.service_sessions (
  id              uuid primary key default gen_random_uuid(),
  service_date    date not null,
  service_slot    text not null check (service_slot in ('8:00', '9:30', '11:30')),
  traffic_flow    text check (traffic_flow in ('heavy', 'medium', 'light', 'trickle')),
  last_updated_at timestamptz not null default now(),
  updated_by      uuid references auth.users(id),
  unique (service_date, service_slot)
);

create table if not exists public.session_lot_status (
  session_id         uuid not null references public.service_sessions(id) on delete cascade,
  lot_id             uuid not null references public.lots(id) on delete cascade,
  estimated_pct      numeric not null default 0 check (estimated_pct between 0 and 100),
  entrances_affected text[] not null default '{}',
  notes              text,
  is_closed          boolean not null default false,
  closed_reason      text check (closed_reason is null or char_length(closed_reason) <= 60),
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users(id),
  primary key (session_id, lot_id)
);

-- Keep timestamps honest ------------------------------------------------

create or replace function public.stamp_session_lot_status()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stamp_session_lot_status on public.session_lot_status;
create trigger trg_stamp_session_lot_status
  before insert or update on public.session_lot_status
  for each row execute function public.stamp_session_lot_status();

create or replace function public.stamp_service_session()
returns trigger
language plpgsql
as $$
begin
  new.last_updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stamp_service_session on public.service_sessions;
create trigger trg_stamp_service_session
  before update on public.service_sessions
  for each row execute function public.stamp_service_session();

-- When any lot in a session changes, bump the session's "last updated" time.
create or replace function public.touch_service_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.service_sessions set last_updated_at = now() where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_service_session on public.session_lot_status;
create trigger trg_touch_service_session
  after insert or update on public.session_lot_status
  for each row execute function public.touch_service_session();

-- Row Level Security ------------------------------------------------------

alter table public.service_sessions enable row level security;
alter table public.session_lot_status enable row level security;

drop policy if exists "Public can read service_sessions" on public.service_sessions;
create policy "Public can read service_sessions" on public.service_sessions
  for select using (true);

drop policy if exists "Public can read session_lot_status" on public.session_lot_status;
create policy "Public can read session_lot_status" on public.session_lot_status
  for select using (true);

drop policy if exists "Admins can insert service_sessions" on public.service_sessions;
create policy "Admins can insert service_sessions" on public.service_sessions
  for insert with check (public.is_parking_admin());

drop policy if exists "Admins can update service_sessions" on public.service_sessions;
create policy "Admins can update service_sessions" on public.service_sessions
  for update using (public.is_parking_admin()) with check (public.is_parking_admin());

drop policy if exists "Admins can insert session_lot_status" on public.session_lot_status;
create policy "Admins can insert session_lot_status" on public.session_lot_status
  for insert with check (public.is_parking_admin());

drop policy if exists "Admins can update session_lot_status" on public.session_lot_status;
create policy "Admins can update session_lot_status" on public.session_lot_status
  for update using (public.is_parking_admin()) with check (public.is_parking_admin());

-- Realtime (best effort: the app also re-checks every 8 seconds) ------------

do $$
begin
  alter publication supabase_realtime add table public.service_sessions;
  alter publication supabase_realtime add table public.session_lot_status;
exception when others then
  raise notice 'Realtime publication not updated: %', sqlerrm;
end $$;
