-- ============================================================================
-- Pintech ERP — DEMO row-level security policies
-- Supabase enables RLS by default, which blocks the anon key the demo app uses.
-- This adds permissive "allow everything" policies so the demo can read/write
-- with the anon key. Safe to re-run.
--
-- ⚠️  DEMO ONLY. Before production, replace `demo_all` with real per-role
--     policies tied to authenticated users (auth.uid()).
--
-- Paste into the Supabase SQL editor and Run.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['app_user','project','floor','unit','work_item','contractor','activity_update']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists demo_all on %I', t);
    execute format(
      'create policy demo_all on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
