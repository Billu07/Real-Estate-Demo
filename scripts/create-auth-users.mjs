// Creates Supabase Auth accounts and links them to app_user profiles (by email).
// Idempotent: skips accounts that already exist.  node scripts/create-auth-users.mjs

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

const DEMO_PASSWORD = "PintechDemo!2026";

// Owner account requested by the client + the four demo role accounts.
const ACCOUNTS = [
  { email: "snowfix07@gmail.com", name: "Owner", title: "Super Admin", role: "super_admin", initials: "OW" },
  { email: "soumya@nrdprojects.com", role: "super_admin" },
  { email: "minhaz@nrdprojects.com", role: "project_manager" },
  { email: "arjun@nrdprojects.com", role: "engineer" },
  { email: "nusrat@nrdprojects.com", role: "sales" },
];

async function findAuthUserByEmail(email) {
  // Paginate through users (small dataset).
  for (let page = 1; page <= 5; page++) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    const found = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return null;
}

async function main() {
  for (const acc of ACCOUNTS) {
    let authUser = await findAuthUserByEmail(acc.email);
    if (authUser) {
      console.log(`• ${acc.email} — auth account already exists`);
    } else {
      const { data, error } = await sb.auth.admin.createUser({ email: acc.email, password: DEMO_PASSWORD, email_confirm: true });
      if (error) {
        console.error(`✗ ${acc.email}: ${error.message}`);
        continue;
      }
      authUser = data.user;
      console.log(`✓ ${acc.email} — auth account created`);
    }

    // Ensure an app_user profile exists for this email.
    const { data: existing } = await sb.from("app_user").select("id").eq("email", acc.email).limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await sb.from("app_user").insert({
        name: acc.name ?? acc.email.split("@")[0],
        title: acc.title ?? "Member",
        role: acc.role,
        initials: acc.initials ?? acc.email.slice(0, 2).toUpperCase(),
        email: acc.email,
        active: true,
      });
      if (error) console.error(`  profile insert failed: ${error.message}`);
      else console.log(`  + profile created (${acc.role})`);
    }
  }
  console.log(`\nDone. Demo password for all created accounts: ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
