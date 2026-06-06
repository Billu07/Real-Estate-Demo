"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { Unit } from "@/lib/data/types";
import { usePintech } from "@/lib/store";
import { unitRollup, unitItemCounts } from "@/lib/completion";
import { ProgressRing } from "@/components/progress-ring";
import { SalePill } from "@/components/ui";
import { StatusToggle } from "./status-toggle";
import { cn } from "@/lib/utils";

export function UnitCard({ projectId, unit, canEdit }: { projectId: string; unit: Unit; canEdit: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const setStatus = usePintech((s) => s.setWorkItemStatus);
  const addItem = usePintech((s) => s.addWorkItem);

  const rollup = unitRollup(unit);
  const counts = unitItemCounts(unit);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted">
        <ProgressRing ratio={rollup.ratio} size={46} stroke={5} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{unit.name}</span>
            <SalePill status={unit.saleStatus} />
          </div>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {counts.complete} of {counts.total} items complete{counts.inProgress > 0 ? ` · ${counts.inProgress} in progress` : ""}
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="border-t border-border bg-surface-muted/40 px-4 py-3">
          <div className="divide-y divide-border">
            {unit.workItems.map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-ink">
                    {w.name}
                    {w.custom ? <span className="ml-2 rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy-500">custom</span> : null}
                  </p>
                  <p className="text-[11px] text-ink-faint">weight {w.weight}</p>
                </div>
                <StatusToggle value={w.status} disabled={!canEdit} onChange={(s) => setStatus(projectId, unit.id, w.id, s)} />
              </div>
            ))}
          </div>

          {canEdit ? (
            adding ? (
              <AddFieldForm
                onCancel={() => setAdding(false)}
                onAdd={(name, weight) => {
                  addItem(projectId, unit.id, name, weight);
                  setAdding(false);
                }}
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-teal-700 transition-colors hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add field
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AddFieldForm({ onAdd, onCancel }: { onAdd: (name: string, weight: number) => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const [weight, setWeight] = React.useState("5");

  const submit = () => {
    const w = Number(weight) || 1;
    if (name.trim()) onAdd(name.trim(), w);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/40 p-2.5">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="New field, e.g. Gas line leaked"
        className="h-8 flex-1 rounded-md border border-border bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:border-teal-400"
      />
      <input
        value={weight}
        onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ""))}
        className="h-8 w-16 rounded-md border border-border bg-surface px-2.5 text-[13px] text-ink focus:border-teal-400"
        aria-label="Weight"
      />
      <button onClick={submit} className="h-8 rounded-md bg-teal-600 px-3 text-[13px] font-medium text-white hover:bg-teal-700">Add</button>
      <button onClick={onCancel} className="h-8 rounded-md px-2 text-[13px] text-ink-faint hover:text-ink">Cancel</button>
    </div>
  );
}
