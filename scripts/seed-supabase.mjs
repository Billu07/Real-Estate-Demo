// Seeds the live Supabase database with the demo NRD data.
//
// Prerequisite: the schema must already exist — run docs/supabase-schema.sql once
// in the Supabase SQL editor (DDL can't go through the REST API).
//
// Then:  node scripts/seed-supabase.mjs
// Uses the service-role key from .env.local (server-only; bypasses RLS).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildSeedProjects, buildSeedActivity, USERS } from "../lib/data/seed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  console.log("Clearing existing data…");
  for (const t of ["activity_update", "work_item", "unit", "floor", "contractor", "project", "app_user"]) {
    await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  console.log("Seeding users…");
  const users = await insert(
    "app_user",
    USERS.map((u) => ({ name: u.name, title: u.title, role: u.role, initials: u.initials, email: u.email ?? null, active: u.active ?? true })),
  );
  const userByRole = Object.fromEntries(users.map((u) => [u.role, u.id]));

  const projects = buildSeedProjects();
  const activity = buildSeedActivity();
  const projectIdMap = {}; // seedId -> dbId

  for (const p of projects) {
    console.log(`Seeding project ${p.name}…`);
    const [proj] = await insert("project", [
      {
        name: p.name,
        code: p.code,
        kind: p.kind,
        location: p.location,
        manager_id: userByRole["project_manager"],
        started_on: p.startedOn,
      },
    ]);
    projectIdMap[p.id] = proj.id;

    if (p.contractors.length) {
      await insert(
        "contractor",
        p.contractors.map((c) => ({
          project_id: proj.id,
          name: c.name,
          scope: c.scope,
          is_partner: c.isPartner,
          contract_value: c.contractValue,
          billed_pct: c.billedPct,
          security_deposit: c.securityDeposit,
          verified_progress: c.verifiedProgress,
        })),
      );
    }

    for (const f of p.floors) {
      const [floor] = await insert("floor", [
        { project_id: proj.id, name: f.name, code: f.code, sort_order: f.order },
      ]);
      for (const u of f.units) {
        const [unit] = await insert("unit", [
          {
            floor_id: floor.id,
            name: u.name,
            type: u.type,
            sale_status: u.saleStatus,
            sale_price: u.salePrice ?? null,
            buyer: u.buyer ?? null,
          },
        ]);
        if (u.workItems.length) {
          await insert(
            "work_item",
            u.workItems.map((w) => ({
              unit_id: unit.id,
              name: w.name,
              weight: w.weight,
              status: w.status,
              custom: Boolean(w.custom),
            })),
          );
        }
      }
    }
  }

  console.log("Seeding activity…");
  await insert(
    "activity_update",
    activity.map((a) => ({
      project_id: projectIdMap[a.projectId],
      author_id: userByRole[a.authorId === "u-admin" ? "super_admin" : a.authorId === "u-sales" ? "sales" : a.authorId === "u-eng" ? "engineer" : "project_manager"] ?? null,
      kind: a.kind,
      message: a.message,
      created_at: a.createdAt,
    })),
  );

  console.log("✅ Seed complete.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
