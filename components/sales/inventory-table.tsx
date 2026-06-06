"use client";

import * as React from "react";
import { usePintech } from "@/lib/store";
import { flattenUnits } from "@/lib/data/selectors";
import type { SaleStatus } from "@/lib/data/types";
import { Card, CardBody, CardHeader, SalePill, Button, ProgressBar } from "@/components/ui";
import { bdt, pct, cn } from "@/lib/utils";

type Filter = "all" | "available" | "sold" | "after_sold";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "sold", label: "Sold" },
  { id: "after_sold", label: "After Sold" },
];

export function InventoryTable({ canSell = true, title = "Inventory", subtitle }: { canSell?: boolean; title?: string; subtitle?: string }) {
  const projects = usePintech((s) => s.projects);
  const setSale = usePintech((s) => s.setUnitSale);
  const post = usePintech((s) => s.postUpdate);
  const user = usePintech((s) => s.currentUser());

  const [filter, setFilter] = React.useState<Filter>("all");
  const [projectId, setProjectId] = React.useState<string>("all");
  const [selling, setSelling] = React.useState<{ projectId: string; unitId: string; unitName: string; projectName: string } | null>(null);

  const all = flattenUnits(projects);
  const rows = all.filter((r) => (filter === "all" || r.unit.saleStatus === filter) && (projectId === "all" || r.project.id === projectId));

  const confirmSale = (price: number, buyer: string, status: SaleStatus) => {
    if (!selling) return;
    setSale(selling.projectId, selling.unitId, status, price, buyer);
    post({
      projectId: selling.projectId,
      projectName: selling.projectName,
      authorId: user.id,
      authorName: user.name,
      kind: "sale",
      message: `${selling.unitName} ${status === "after_sold" ? "marked after-sold" : "sold"}${buyer ? ` to ${buyer}` : ""}`,
    });
    setSelling(null);
  };

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle ?? `${rows.length} of ${all.length} units`}
        action={
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-8 rounded-lg border border-border bg-surface px-2.5 text-[13px] text-ink-soft focus:border-teal-400">
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        }
      />
      <CardBody className="pt-3">
        <div className="mb-3 inline-flex rounded-lg bg-surface-muted p-0.5">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn("rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors", filter === f.id ? "bg-surface text-ink shadow-sm" : "text-ink-faint hover:text-ink-soft")}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead className="bg-surface-muted text-[12px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Type</th>
                <th className="hidden px-4 py-2.5 font-medium xl:table-cell">Progress</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Buyer</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                {canSell ? <th className="px-4 py-2.5 text-right font-medium">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ project, floor, unit }) => (
                <tr key={unit.id} className="transition-colors hover:bg-surface-muted/50">
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-ink">{unit.name} <span className="font-normal text-ink-faint">· {floor.name}</span></td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{project.name}</td>
                  <td className="hidden whitespace-nowrap px-4 py-2.5 capitalize text-ink-soft lg:table-cell">{unit.type}</td>
                  <td className="hidden px-4 py-2.5 xl:table-cell"><div className="flex items-center gap-2"><ProgressBar ratio={unitRatio(project, unit.id)} className="w-20" /><span className="text-[12px] tabular-nums text-ink-faint">{pct(unitRatio(project, unit.id))}</span></div></td>
                  <td className="px-4 py-2.5"><SalePill status={unit.saleStatus} /></td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{unit.buyer ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-soft">{unit.salePrice ? bdt(unit.salePrice) : "—"}</td>
                  {canSell ? (
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {unit.saleStatus === "available" ? (
                        <Button size="sm" onClick={() => setSelling({ projectId: project.id, unitId: unit.id, unitName: unit.name, projectName: project.name })}>Mark sold</Button>
                      ) : (
                        <Button size="sm" variant="subtle" onClick={() => setSale(project.id, unit.id, "available")}>Release</Button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>

      {selling ? <SaleDialog title={`Sell ${selling.unitName}`} onCancel={() => setSelling(null)} onConfirm={confirmSale} /> : null}
    </Card>
  );
}

function unitRatio(project: { floors: { units: { id: string; workItems: { weight: number; status: string }[] }[] }[] }, unitId: string): number {
  for (const f of project.floors) {
    for (const u of f.units) {
      if (u.id === unitId) {
        const total = u.workItems.reduce((s, w) => s + w.weight, 0);
        const done = u.workItems.reduce((s, w) => s + w.weight * (w.status === "complete" ? 1 : w.status === "in_progress" ? 0.5 : 0), 0);
        return total > 0 ? done / total : 0;
      }
    }
  }
  return 0;
}

function SaleDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: (price: number, buyer: string, status: SaleStatus) => void; onCancel: () => void }) {
  const [price, setPrice] = React.useState("7000000");
  const [buyer, setBuyer] = React.useState("");
  const [status, setStatus] = React.useState<SaleStatus>("sold");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/30 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-[16px] font-bold text-ink">{title}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Buyer name">
            <input autoFocus value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="e.g. Rahman Family" className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13.5px] focus:border-teal-400" />
          </Field>
          <Field label="Sale price (BDT)">
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13.5px] tabular-nums focus:border-teal-400" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)} className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] focus:border-teal-400">
              <option value="sold">Sold</option>
              <option value="after_sold">After Sold</option>
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(Number(price) || 0, buyer.trim(), status)}>Confirm sale</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
