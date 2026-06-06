# Pintech ERP

A role-based construction project ERP for **NRD Projects** — replacing a messy
multi-sheet Google Sheets system with a live, beautiful command center.

The product solves the client's core control gap: **contractor billing running
ahead of verified site progress** (e.g. billed 50% while only 33% is built), plus
granular, real-time progress tracking from **Project → Floor → Unit/Shop → Work Item**.

## Run the demo

```bash
npm install
npm run dev      # http://localhost:3000
```

The app boots on realistic seeded data modeled on the real NRD spreadsheets — no
backend required. Use the **role switcher** (top-right) to move between Super Admin,
Project Manager, Engineer, and Sales views.

### The demo story
1. As **Project Manager**, open a project → expand a unit → mark a work item
   *Complete*. Watch the unit / floor / project rings recompute instantly.
2. Switch to **Super Admin** → the **Command Center** already reflects the change,
   and the billing-vs-progress alerts recalculate live.

## Architecture

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** — flat teal + navy design system (`app/globals.css`)
- **Zustand** — live in-memory store driving the PM → Command Center sync (`lib/store.ts`)
- **Recharts** — flat progress + billing charts
- **Weighted completion engine** (`lib/completion.ts`) — work items carry weights
  ("ceiling cluster ~15%, tile ~1%") and roll up through every level.

### Going live with Supabase
The UI depends only on the repository seam (`lib/data/repository.ts`). To persist
and go multi-user:
1. Run `docs/supabase-schema.sql` in your Supabase project.
2. Set the env vars in `.env.example`.
3. Implement the repository against Supabase (Postgres + Auth + RLS + Realtime).

No screen changes are required — every component already consumes the domain shapes
in `lib/data/types.ts`.

## Roadmap (post-MVP)
- Live Supabase wiring + per-user auth and row-level security
- Contractor portal & payment approvals gated on verified progress
- Deeper sales/CRM module and maintenance-charge automation
- Mobile layout, exports, audit log

## Deployment (Vercel)

This is a standard Next.js app — Vercel auto-detects it. Set these **Environment
Variables** in the Vercel project (Settings → Environment Variables), for all
environments:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service-role key (server-only) |

Then deploy. Before the deployed app shows live data, make sure the database has
been provisioned:

1. Run `docs/supabase-schema.sql` (tables)
2. Run `docs/supabase-rls-demo.sql` (demo anon policies)
3. Run `docs/supabase-migration-2.sql` (team fields + payment approvals)
4. Seed: `node scripts/seed-supabase.mjs` then `node scripts/seed-payments.mjs`

If Supabase is unreachable or unmigrated, the app automatically falls back to
seeded demo data, so it never hard-fails in a presentation.

> Security: rotate the service-role key if it was ever shared, and replace the
> demo RLS policies with real per-role auth before any production use.
