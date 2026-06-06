-- ============================================================================
-- Pintech ERP — Migration 2: team fields + contractor payment approvals
-- Paste into the Supabase SQL editor and Run. Safe to re-run.
-- Then locally:  node scripts/seed-payments.mjs   (seeds a few demo requests)
-- ============================================================================

-- ---- Team / user fields ----
alter table app_user add column if not exists email text;
alter table app_user add column if not exists active boolean not null default true;

-- ---- Payment approval workflow ----
do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists payment_request (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  contractor_id uuid not null references contractor(id) on delete cascade,
  amount bigint not null,                 -- installment requested, BDT
  billed_before numeric not null,         -- contractor.billed_pct at request time
  verified_at_request numeric not null,   -- contractor.verified_progress at request time
  note text,
  status payment_status not null default 'pending',
  requested_by uuid references app_user(id) on delete set null,
  decided_by uuid references app_user(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_payment_project on payment_request (project_id);
create index if not exists idx_payment_status on payment_request (status, created_at desc);

-- ---- Grants + demo RLS policy for the new table ----
grant all on payment_request to anon, authenticated, service_role;
alter table payment_request enable row level security;
drop policy if exists demo_all on payment_request;
create policy demo_all on payment_request for all to anon, authenticated using (true) with check (true);

-- ---- Realtime ----
do $$ begin
  begin alter publication supabase_realtime add table payment_request; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table contractor; exception when duplicate_object then null; end;
end $$;
