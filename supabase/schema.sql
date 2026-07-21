-- ============================================================
-- Spin Wheel — Supabase schema + RLS
-- Run this in the Supabase SQL Editor for your project.
-- One project, four tables:
--   spin_config / knockout_config  -> wheel configs (manager edits)
--   normal_spin_results            -> each prize won on the normal spinner
--   knockout_spin_results          -> each prize won on the knockout spinner
-- ============================================================

-- Required extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- Wheel config tables (single-row, id = 1) ----------
create table if not exists public.spin_config (
  id          smallint primary key default 1,
  data        jsonb   not null,
  updated_at  timestamptz not null default now(),
  constraint spin_config_single_row check (id = 1)
);
alter table public.spin_config enable row level security;

create table if not exists public.knockout_config (
  id          smallint primary key default 1,
  data        jsonb   not null,
  updated_at  timestamptz not null default now(),
  constraint knockout_config_single_row check (id = 1)
);
alter table public.knockout_config enable row level security;

-- ---------- Result tables ----------
create table if not exists public.normal_spin_results (
  id           uuid primary key default gen_random_uuid(),
  prize        text not null,
  emoji        text default '',
  wedge_index  integer,
  won_at       timestamptz not null default now()
);
alter table public.normal_spin_results enable row level security;

create table if not exists public.knockout_spin_results (
  id              uuid primary key default gen_random_uuid(),
  prize           text not null,
  emoji           text default '',
  wedge_index     integer,
  items_remaining integer,
  won_at          timestamptz not null default now()
);
alter table public.knockout_spin_results enable row level security;

-- ---------- Seed default configs so the wheels work on first load ----------
insert into public.spin_config (id, data) values (1, '{
  "items": [
    {"label": "Yay!", "color": "#FF69B4", "emoji": "🎊"},
    {"label": "Yes!", "color": "#38B6FF", "emoji": "✨"}
  ],
  "spinDuration": 5000,
  "minSpins": 5,
  "maxSpins": 10
}'::jsonb)
on conflict (id) do nothing;

insert into public.knockout_config (id, data) values (1, '{
  "items": [
    {"label": "Alex", "color": "#FF6B6B", "emoji": "🦊"},
    {"label": "Sam", "color": "#38B6FF", "emoji": "🐼"},
    {"label": "Jordan", "color": "#FFD93D", "emoji": "🐰"},
    {"label": "Taylor", "color": "#6BCB77", "emoji": "🐸"},
    {"label": "Casey", "color": "#FF8E72", "emoji": "🐯"},
    {"label": "Riley", "color": "#C084FC", "emoji": "🦉"},
    {"label": "Morgan", "color": "#4D96FF", "emoji": "🐵"},
    {"label": "Jamie", "color": "#FF6B9D", "emoji": "🐶"}
  ],
  "spinDuration": 5000,
  "minSpins": 5,
  "maxSpins": 10
}'::jsonb)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security policies
-- The anon (public) key is used client-side, so these policies apply to
-- unauthenticated requests. Result tables: INSERT + SELECT only (no
-- public update/delete). Config tables: SELECT + INSERT + UPDATE so the
-- manager page can read and save edits; DELETE is blocked.
-- ============================================================

-- normal_spin_results: anyone may insert a result and read history,
-- but no one can update or delete results publicly.
drop policy if exists "normal_results_insert" on public.normal_spin_results;
create policy "normal_results_insert" on public.normal_spin_results
  for insert to anon, authenticated with check (true);

drop policy if exists "normal_results_select" on public.normal_spin_results;
create policy "normal_results_select" on public.normal_spin_results
  for select to anon, authenticated using (true);

-- knockout_spin_results: same pattern.
drop policy if exists "knockout_results_insert" on public.knockout_spin_results;
create policy "knockout_results_insert" on public.knockout_spin_results
  for insert to anon, authenticated with check (true);

drop policy if exists "knockout_results_select" on public.knockout_spin_results;
create policy "knockout_results_select" on public.knockout_spin_results
  for select to anon, authenticated using (true);

-- spin_config: read + upsert (insert/update). No delete.
drop policy if exists "spin_config_select" on public.spin_config;
create policy "spin_config_select" on public.spin_config
  for select to anon, authenticated using (true);

drop policy if exists "spin_config_upsert" on public.spin_config;
create policy "spin_config_upsert" on public.spin_config
  for insert to anon, authenticated with check (true);

drop policy if exists "spin_config_update" on public.spin_config;
create policy "spin_config_update" on public.spin_config
  for update to anon, authenticated using (true);

-- knockout_config: same pattern.
drop policy if exists "knockout_config_select" on public.knockout_config;
create policy "knockout_config_select" on public.knockout_config
  for select to anon, authenticated using (true);

drop policy if exists "knockout_config_upsert" on public.knockout_config;
create policy "knockout_config_upsert" on public.knockout_config
  for insert to anon, authenticated with check (true);

drop policy if exists "knockout_config_update" on public.knockout_config;
create policy "knockout_config_update" on public.knockout_config
  for update to anon, authenticated using (true);

-- NOTE: no DELETE policies are created, so public/anon DELETE on all
-- four tables is denied by default (RLS denies when no matching policy).
--
-- SECURITY NOTE: the config tables allow anyone with the anon key to
-- edit wheel items. That's the tradeoff of a no-auth manager. To lock
-- this down later, drop the *_upsert/*_update policies and add Supabase
-- Auth, then scope writes to authenticated admins.
