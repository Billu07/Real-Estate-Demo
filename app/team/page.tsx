"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { usePintech } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";
import type { Role, User } from "@/lib/data/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, Stat, Avatar, Badge, Button } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/modal";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["super_admin", "project_manager", "engineer", "sales"];

export default function TeamPage() {
  const users = usePintech((s) => s.users);
  const addUser = usePintech((s) => s.addUser);
  const updateUser = usePintech((s) => s.updateUser);
  const [editing, setEditing] = React.useState<User | "new" | null>(null);

  const active = users.filter((u) => u.active !== false);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader
        eyebrow="People & access"
        title="Team"
        subtitle="Manage who can access Pintech ERP and what they can do"
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Invite member</Button>}
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
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={u.initials} className={cn(u.active === false && "opacity-40")} />
                        <div>
                          <p className="font-medium text-ink">{u.name}</p>
                          <p className="text-[12px] text-ink-faint">{u.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge tone={u.role === "super_admin" ? "teal" : "neutral"}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-5 py-3 text-ink-soft">{u.title}</td>
                    <td className="px-5 py-3">
                      {u.active === false ? <span className="text-[12.5px] text-ink-faint">Inactive</span> : <span className="inline-flex items-center gap-1.5 text-[12.5px] text-teal-700"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Active</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="subtle" onClick={() => setEditing(u)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateUser(u.id, { active: u.active === false })}>
                          {u.active === false ? "Reactivate" : "Deactivate"}
                        </Button>
                      </div>
                    </td>
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
          onSave={(data) => {
            if (editing === "new") addUser(data);
            else updateUser(editing.id, data);
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MemberDialog({ user, onSave, onClose }: { user: User | null; onSave: (d: { name: string; title: string; role: Role; email: string }) => void; onClose: () => void }) {
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [title, setTitle] = React.useState(user?.title ?? "");
  const [role, setRole] = React.useState<Role>(user?.role ?? "engineer");

  const valid = name.trim() && title.trim();

  return (
    <Modal
      title={user ? "Edit member" : "Invite member"}
      subtitle={user ? "Update role and details" : "Add a new person to the workspace"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => onSave({ name: name.trim(), title: title.trim(), role, email: email.trim() })}>{user ? "Save changes" : "Send invite"}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Full name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tanvir Hasan" className={inputClass} /></Field>
        <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@nrdprojects.com" className={inputClass} /></Field>
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Site Engineer" className={inputClass} /></Field>
        <Field label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
