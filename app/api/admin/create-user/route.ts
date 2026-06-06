import { NextResponse } from "next/server";
import { createServiceSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Provisions a real auth account + app_user profile. Owner-only.
// The caller's access token (Bearer) is verified and must map to a super_admin.

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createServiceSupabaseClient();

  // Verify the caller and confirm they are an Owner.
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller.user?.email) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const { data: callerProfile } = await admin.from("app_user").select("role").eq("email", caller.user.email).limit(1);
  if (callerProfile?.[0]?.role !== "super_admin") {
    return NextResponse.json({ error: "Only the Owner can add members." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { name, email, password, title, role } = body ?? {};
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Create the auth account.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: String(email).trim(),
    password: String(password),
    email_confirm: true,
  });
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

  // Create the profile.
  const profile = {
    name: String(name).trim(),
    title: String(title ?? "Member").trim(),
    role,
    initials: initials(String(name)),
    email: String(email).trim(),
    active: true,
  };
  const { data: inserted, error: insertErr } = await admin.from("app_user").insert(profile).select().single();
  if (insertErr) {
    // Roll back the auth account so we don't orphan it.
    if (created.user?.id) await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ user: inserted });
}
