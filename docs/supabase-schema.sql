-- ============================================================================
-- Pintech ERP — Supabase schema  (safe to run multiple times)
-- Paste this whole file into the Supabase SQL editor and click "Run".
-- Then, locally:  node scripts/seed-supabase.mjs
-- ============================================================================

-- ---- Enum types (guarded so re-running won't error) ----
do $$ begin
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('super_admin', 'project_manager', 'engineer', 'sales');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_status') then
    create type work_status as enum ('pending', 'in_progress', 'complete');
  end if;
  if not exists (select 1 from pg_type where typname = 'unit_type') then
    create type unit_type as enum ('residential', 'commercial');
  end if;
  if not exists (select 1 from pg_type where typname = 'sale_status') then
    create type sale_status as enum ('available', 'sold', 'after_sold');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_kind') then
    create type project_kind as enum ('residential', 'commercial', 'mixed');
  end if;
  if not exists (select 1 from pg_type where typname = 'update_kind') then
    create type update_kind as enum ('progress', 'issue', 'sale', 'billing');
  end if;
end $$;

-- ---- Tables ----
create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  role role not null,
  initials text not null
);

create table if not exists project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  kind project_kind not null,
  location text not null,
  manager_id uuid references app_user(id) on delete set null,
  started_on date not null,
  created_at timestamptz default now()
);

create table if not exists floor (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  code text not null,
  sort_order int not null default 0
);

create table if not exists unit (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floor(id) on delete cascade,
  name text not null,
  type unit_type not null,
  sale_status sale_status not null default 'available',
  sale_price bigint,
  buyer text
);

create table if not exists work_item (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references unit(id) on delete cascade,
  name text not null,
  weight numeric not null default 1,
  status work_status not null default 'pending',
  custom boolean not null default false
);

create table if not exists contractor (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  scope text not null,
  is_partner boolean not null default false,
  contract_value bigint not null default 0,
  billed_pct numeric not null default 0,        -- 0..1
  security_deposit bigint not null default 0,
  verified_progress numeric not null default 0  -- 0..1
);

create table if not exists activity_update (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  author_id uuid references app_user(id) on delete set null,
  kind update_kind not null,
  message text not null,
  created_at timestamptz default now()
);

-- ---- Indexes ----
create index if not exists idx_floor_project on floor (project_id);
create index if not exists idx_unit_floor on unit (floor_id);
create index if not exists idx_work_item_unit on work_item (unit_id);
create index if not exists idx_contractor_project on contractor (project_id);
create index if not exists idx_activity_project on activity_update (project_id, created_at desc);

-- ---- Grants: let the demo read/write with the anon key (NO auth yet) ----
-- NOTE: This is for the demo. Before production, enable RLS and replace these
-- with per-role policies.
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

-- ---- Realtime: stream work_item + activity changes to the Command Center ----
do $$ begin
  begin
    alter publication supabase_realtime add table work_item;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table unit;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table activity_update;
  exception when duplicate_object then null; end;
end $$;
