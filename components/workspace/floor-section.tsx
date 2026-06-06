"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { Floor, Unit } from "@/lib/data/types";
import { usePintech } from "@/lib/store";
import { floorRollup } from "@/lib/completion";
import { ProgressBar } from "@/components/ui";
import { UnitCard } from "./unit-card";
import { pct } from "@/lib/utils";

export function FloorSection({ projectId, floor, canEdit }: { projectId: string; floor: Floor; canEdit: boolean }) {
  const [adding, setAdding] = React.useState(false);
  const addUnit = usePintech((s) => s.addUnit);
  const rollup = floorRollup(floor);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{floor.name}</h3>
          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-faint">{floor.code}</span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <ProgressBar ratio={rollup.ratio} className="max-w-xs" />
          <span className="text-[12.5px] font-medium tabular-nums text-ink-soft">{pct(rollup.ratio)}</span>
        </div>
        <span className="text-[12.5px] text-ink-faint">{floor.units.length} units</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {floor.units.map((u) => (
          <UnitCard key={u.id} projectId={projectId} unit={u} canEdit={canEdit} />
        ))}
      </div>

      {canEdit ? (
        adding ? (
          <AddUnitForm
            onCancel={() => setAdding(false)}
            onAdd={(name, type) => {
              addUnit(projectId, floor.id, name, type);
              setAdding(false);
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add unit / shop
          </button>
        )
      ) : null}
    </section>
  );
}

function AddUnitForm({ onAdd, onCancel }: { onAdd: (name: string, type: Unit["type"]) => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<Unit["type"]>("residential");
  const submit = () => name.trim() && onAdd(name.trim(), type);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/40 p-2.5">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Unit / shop name"
        className="h-8 w-48 rounded-md border border-border bg-surface px-2.5 text-[13px] focus:border-teal-400"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as Unit["type"])}
        className="h-8 rounded-md border border-border bg-surface px-2 text-[13px] focus:border-teal-400"
      >
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
      </select>
      <button onClick={submit} className="h-8 rounded-md bg-teal-600 px-3 text-[13px] font-medium text-white hover:bg-teal-700">Add</button>
      <button onClick={onCancel} className="h-8 rounded-md px-2 text-[13px] text-ink-faint hover:text-ink">Cancel</button>
    </div>
  );
}
