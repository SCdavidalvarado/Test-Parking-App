# Shoreline City Church — Parking Dashboard

Two dashboards sharing one Supabase database:

- **Operations Dashboard** (`/`) — public, read-only, updates live.
- **Parking Admin Dashboard** (`/admin`) — requires sign-in, edits everything.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run the two files in this order:
   - `supabase/migrations/0001_init.sql` (tables, triggers, security policies)
   - `supabase/seed.sql` (the 6 fixed lots + starting settings row)
3. Follow the comment at the bottom of `seed.sql` to create your first
   Parking Admin login (Authentication → Users → Add user, then insert a
   matching row into `profiles`).

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's **Settings → API** page.

## 3. Install and run locally

```bash
npm install
npm run dev
```

- Operations Dashboard: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## 4. Deploy

This is a standard Next.js 14 App Router project — deploys cleanly to
[Vercel](https://vercel.com) (recommended) or any Node host. Add the same
two environment variables in your hosting provider's dashboard.

## How it's organized

```
app/
  page.tsx                    Operations Dashboard (public)
  admin/
    login/page.tsx            Admin sign-in (unguarded)
    (protected)/
      layout.tsx              Auth guard + header — everything inside requires login
      page.tsx                Admin Dashboard
components/
  operations/                 Read-only display components
  admin/                      Editing components
  ui/                         Shared primitives (Card, Button, ProgressBar, StatusPill)
lib/
  supabase/                   Browser / server / middleware Supabase clients
  calculations.ts             Weighted overall %, status-from-thresholds — pure functions
  constants.ts                Entrance list, traffic flow options, default thresholds
hooks/
  useRealtimeLots.ts          Loads lots + settings, subscribes to Realtime changes
supabase/
  migrations/0001_init.sql    Schema, triggers, Row Level Security
  seed.sql                    The 6 fixed lots + starting data
```

## Notes on what's intentionally NOT built yet

- **Settings page for editing lot capacities.** Capacities are seeded once in
  `seed.sql`. Changing them today means editing the `lots` table directly in
  Supabase. The schema already separates static config (`lots`) from live
  state (`lot_status`) specifically so this is easy to add later without a
  migration.
- **Status threshold editor UI.** The 60 / 85 / 97 breakpoints live in
  `parking_settings.status_thresholds` (jsonb) and can be edited directly in
  the Supabase table editor today; a future admin UI can read/write the same
  column.
- **Role management UI.** Adding a new admin means inserting a row into
  `profiles` directly in Supabase (see `seed.sql`). `role` already
  distinguishes `parking_admin` from `super_admin` so a future "manage
  admins" screen only needs a UI, not a schema change.
- **`lot_status_history`** is already being written to on every change (via
  trigger) even though there's no UI for it yet — free audit trail for a
  future "activity log" view.
