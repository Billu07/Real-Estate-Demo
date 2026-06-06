"use client";

import * as React from "react";
import { usePintech } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, Button, Avatar, Badge } from "@/components/ui";
import { Field, inputClass } from "@/components/modal";

export default function AccountPage() {
  const user = usePintech((s) => s.currentUser());

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [status, setStatus] = React.useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const valid = current && next.length >= 8 && next === confirm;

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const sb = getBrowserSupabase();
    if (!sb || !user.email) {
      setStatus({ type: "err", msg: "Not signed in." });
      return;
    }
    setSaving(true);
    // Verify the current password first.
    const { error: signInErr } = await sb.auth.signInWithPassword({ email: user.email, password: current });
    if (signInErr) {
      setSaving(false);
      setStatus({ type: "err", msg: "Current password is incorrect." });
      return;
    }
    const { error } = await sb.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      setStatus({ type: "err", msg: error.message });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setStatus({ type: "ok", msg: "Password updated successfully." });
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <PageHeader eyebrow="Your account" title="Account settings" subtitle="Manage your profile and password" />

      <Card>
        <CardHeader title="Profile" />
        <CardBody className="flex items-center gap-4 pt-2">
          <Avatar initials={user.initials} className="h-12 w-12 text-[15px]" />
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">{user.name}</p>
            <p className="text-[13px] text-ink-faint">{user.email ?? "—"} · {user.title}</p>
          </div>
          <Badge tone={user.role === "super_admin" ? "teal" : "neutral"}>{ROLE_LABEL[user.role]}</Badge>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" subtitle="Use at least 8 characters" />
        <CardBody className="pt-3">
          <form onSubmit={changePassword} className="space-y-3">
            <Field label="Current password">
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} autoComplete="current-password" />
            </Field>
            <Field label="New password">
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
              {confirm && next !== confirm ? <span className="mt-1 block text-[12px] text-[var(--color-status-alert)]">Passwords don&apos;t match.</span> : null}
            </Field>

            {status ? (
              <p className={status.type === "ok" ? "rounded-lg bg-[var(--color-status-complete-bg)] px-3 py-2 text-[12.5px] text-[var(--color-status-complete)]" : "rounded-lg bg-[var(--color-status-alert-bg)] px-3 py-2 text-[12.5px] text-[var(--color-status-alert)]"}>
                {status.msg}
              </p>
            ) : null}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={!valid || saving}>{saving ? "Updating…" : "Update password"}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
