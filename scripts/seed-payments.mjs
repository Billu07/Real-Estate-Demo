// Seeds a few demo payment requests so the Approvals screen isn't empty.
// Prerequisite: run docs/supabase-migration-2.sql first.  node scripts/seed-payments.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  await sb.from("payment_request").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: pm } = await sb.from("app_user").select("id").eq("role", "project_manager").limit(1).single();
  const { data: contractors } = await sb
    .from("contractor")
    .select("id,name,scope,project_id,contract_value,billed_pct,verified_progress")
    .limit(40);

  // Request the next installment for a handful of contractors (mix of safe + risky).
  const pick = (contractors ?? []).filter((c) => Number(c.billed_pct) < 0.95).slice(0, 5);
  const rows = pick.map((c, i) => {
    const installment = Math.round(Number(c.contract_value) * 0.1); // next 10%
    return {
      project_id: c.project_id,
      contractor_id: c.id,
      amount: installment,
      billed_before: Number(c.billed_pct),
      verified_at_request: Number(c.verified_progress),
      note: i % 2 === 0 ? "Next milestone installment" : "Material + labour for current phase",
      status: "pending",
      requested_by: pm?.id ?? null,
    };
  });

  const { error } = await sb.from("payment_request").insert(rows);
  if (error) throw new Error(error.message);
  console.log(`✅ Seeded ${rows.length} payment requests.`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
