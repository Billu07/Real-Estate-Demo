"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { usePintech } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Role, User } from "@/lib/data/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, Stat, Avatar, Badge, Button } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/modal";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["super_admin", "project_manager", "engineer", "sales"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(r: any): User {
  return { id: r.id, name: r.name, title: r.title, role: r.role, initials: r.initials, email: r.email ?? undefined, active: r.active ?? true };
}

export default function TeamPage() {
  const users = usePintech((s) => s.users);
  const updateUser = usePintech((s) => s.updateUser);
  const upsertUserLocal = usePintech((s) => s.upsertUserLocal);
  const me = usePintech((s) => s.currentUser());
  const [editing, setEditing] = React.useState<User | "new" | null>(null);

  const isOwner = me.role === "super_admin";
  const active = users.filter((u) => u.active !== false);

  async function createMember(data: { name: string; title: string; role: Role; email: string; password: string }) {
    const sb = getBrowserSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    if (!sb || !token) {
      // Offline / seed mode — add locally.
      upsertUserLocal({ id: crypto.randomUUID(), name: data.name, title: data.title, role: data.role, email: data.email, active: true, initials: data.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") });
      return;
    }
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to create member.");
    upsertUserLocal(mapRow(json.user));
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader
        eyebrow="People & access"
        title="Team"
        subtitle="Manage who can sign in to Pintech ERP and what they can do"
        actions={isOwner ? <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add member</Button> : undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardBody><Stat label="Members" value={users.length} sub={`${active.length} active`} /></CardBody></Card>
        {ROLES.slice(0, 3).map((r) => (
          <Card key={r}><CardBody><Stat label={ROLE_LABEL[r] + "s"} value={users.filter((u) => u.role === r).length} /></CardBody></Card>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-surface-muted text-[12px] uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {isOwner ? <th className="px-5 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={u.initials} className={cn(u.active === false && "opacity-40")} />
                        <div>
                          <p className="font-medium text-ink">{u.name}{u.id === me.id ? <span className="ml-1.5 text-[11px] font-normal text-ink-faint">(you)</span> : null}</p>
                          <p className="text-[12px] text-ink-faint">{u.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge tone={u.role === "super_admin" ? "teal" : "neutral"}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-5 py-3 text-ink-soft">{u.title}</td>
                    <td className="px-5 py-3">
                      {u.active === false ? <span className="text-[12.5px] text-ink-faint">Inactive</span> : <span className="inline-flex items-center gap-1.5 text-[12.5px] text-teal-700"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Active</span>}
                    </td>
                    {isOwner ? (
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="subtle" onClick={() => setEditing(u)}>Edit</Button>
                          <Button size="sm" variant="ghost" disabled={u.id === me.id} onClick={() => updateUser(u.id, { active: u.active === false })}>
                            {u.active === false ? "Reactivate" : "Deactivate"}
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {editing ? (
        <MemberDialog
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaveExisting={(data) => { updateUser((editing as User).id, data); setEditing(null); }}
          onCreate={createMember}
        />
      ) : null}
    </div>
  );
}

function MemberDialog({
  user,
  onCreate,
  onSaveExisting,
  onClose,
}: {
  user: User | null;
  onCreate: (d: { name: string; title: string; role: Role; email: string; password: string }) => Promise<void>;
  onSaveExisting: (d: { name: string; title: string; role: Role; email: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [title, setTitle] = React.useState(user?.title ?? "");
  const [role, setRole] = React.useState<Role>(user?.role ?? "engineer");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const creating = !user;
  const valid = name.trim() && title.trim() && email.trim() && (!creating || password.length >= 8);

  async function save() {
    setError("");
    if (creating) {
      setSaving(true);
      try {
        await onCreate({ name: name.trim(), title: title.trim(), role, email: email.trim(), password });
        onClose();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
    } else {
      onSaveExisting({ name: name.trim(), title: title.trim(), role, email: email.trim() });
    }
  }

  return (
    <Modal
      title={creating ? "Add member" : "Edit member"}
      subtitle={creating ? "Create a sign-in account and assign a role" : "Update role and details"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid || saving} onClick={save}>{saving ? "Creating…" : creating ? "Create account" : "Save changes"}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Full name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tanvir Hasan" className={inputClass} /></Field>
        <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@nrdprojects.com" className={inputClass} disabled={!creating} /></Field>
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Site Engineer" className={inputClass} /></Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
        {creating ? (
          <Field label="Temporary password">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
          </Field>
        ) : null}
        {error ? <p className="rounded-lg bg-[var(--color-status-alert-bg)] px-3 py-2 text-[12.5px] text-[var(--color-status-alert)]">{error}</p> : null}
        {creating ? <p className="text-[11.5px] text-ink-faint">Share these credentials with the member. They can sign in immediately and change the password later.</p> : null}
      </div>
    </Modal>
  );
}
