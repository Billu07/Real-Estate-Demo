"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { usePintech } from "@/lib/store";
import { projectRollup, billingGap } from "@/lib/completion";
import { summarizeProject, OVER_BILL_THRESHOLD } from "@/lib/data/selectors";
import { ProgressRing } from "@/components/progress-ring";
import { BillingVsProgressChart } from "@/components/charts";
import { ActivityFeed } from "@/components/activity-feed";
import { FloorSection } from "@/components/workspace/floor-section";
import { UpdateComposer } from "@/components/workspace/update-composer";
import { Card, CardBody, CardHeader, Badge, Button, SalePill, ProgressBar } from "@/components/ui";
import { Modal, Field, inputClass } from "@/components/modal";
import { bdt, pct, cn } from "@/lib/utils";

type Tab = "progress" | "contractors" | "sales";
const KIND_LABEL: Record<string, string> = { residential: "Residential", commercial: "Commercial", mixed: "Mixed-use" };

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const projects = usePintech((s) => s.projects);
  const activity = usePintech((s) => s.activity);
  const role = usePintech((s) => s.currentRole);
  const addFloor = usePintech((s) => s.addFloor);

  const project = projects.find((p) => p.id === params.id);
  const initialTab = (search.get("tab") as Tab) || "progress";
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [addingFloor, setAddingFloor] = React.useState(false);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-ink-soft">Project not found.</p>
        <Link href="/projects" className="mt-2 inline-block text-teal-700 hover:underline">Back to projects</Link>
      </div>
    );
  }

  const canEdit = role === "super_admin" || role === "project_manager" || role === "engineer";
  const ratio = projectRollup(project).ratio;
  const summary = summarizeProject(project);
  const projectActivity = activity.filter((a) => a.projectId === project.id);

  const tabs: { id: Tab; label: string }[] = [
    { id: "progress", label: "Progress" },
    { id: "contractors", label: "Contractors" },
    { id: "sales", label: "Sales & Units" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <Link href={role === "super_admin" ? "/command-center" : "/projects"} className="inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      {/* Project header */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-6">
          <ProgressRing ratio={ratio} size={84} stroke={8} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[22px] font-semibold tracking-tight text-ink">{project.name}</h2>
              <Badge>{KIND_LABEL[project.kind]}</Badge>
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-faint">#{project.code}</span>
            </div>
            <p className="mt-1 text-[13px] text-ink-faint">
              {project.location} · {project.floors.length} floors · {summary.units} units · started {new Date(project.startedOn).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <HeaderStat label="Units sold" value={`${summary.sold}/${summary.units}`} />
            <HeaderStat label="Contract value" value={bdt(summary.contractValue)} />
            <HeaderStat label="Billing alerts" value={String(summary.flaggedContractors)} tone={summary.flaggedContractors > 0 ? "alert" : "default"} />
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative px-4 py-2.5 text-[14px] font-medium transition-colors",
              tab === t.id ? "text-ink" : "text-ink-faint hover:text-ink-soft",
            )}
          >
            {t.label}
            {tab === t.id ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-teal-500" /> : null}
          </button>
        ))}
      </div>

      {tab === "progress" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {canEdit ? <UpdateComposer project={project} /> : null}
            {project.floors.map((f) => (
              <FloorSection key={f.id} projectId={project.id} floor={f} canEdit={canEdit} />
            ))}

            {canEdit ? (
              addingFloor ? (
                <AddFloorForm
                  defaultCode={`${project.code}-${project.floors.length}`}
                  onCancel={() => setAddingFloor(false)}
                  onAdd={(name, code) => {
                    addFloor(project.id, name, code);
                    setAddingFloor(false);
                  }}
                />
              ) : (
                <Button variant="subtle" onClick={() => setAddingFloor(true)}>
                  <Plus className="h-4 w-4" /> Add floor
                </Button>
              )
            ) : null}
          </div>

          <div>
            <Card>
              <CardHeader title="Project activity" subtitle="Updates synced to the Command Center" />
              <CardBody className="pt-2">
                {projectActivity.length > 0 ? (
                  <ActivityFeed items={projectActivity} limit={12} />
                ) : (
                  <p className="py-6 text-center text-[13px] text-ink-faint">No updates yet. Post one above.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "contractors" ? <ContractorsTab project={project} /> : null}
      {tab === "sales" ? <SalesTab project={project} /> : null}
    </div>
  );
}

function HeaderStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "alert" }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn("mt-1 text-[17px] font-semibold tabular-nums", tone === "alert" ? "text-[var(--color-status-alert)]" : "text-ink")}>{value}</p>
    </div>
  );
}

function AddFloorForm({ defaultCode, onAdd, onCancel }: { defaultCode: string; onAdd: (name: string, code: string) => void; onCancel: () => void }) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState(defaultCode);
  const submit = () => name.trim() && onAdd(name.trim(), code.trim() || defaultCode);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-teal-300 bg-teal-50/40 p-2.5">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Floor name, e.g. 5th Floor" className="h-8 w-48 rounded-md border border-border bg-surface px-2.5 text-[13px] focus:border-teal-400" />
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="h-8 w-28 rounded-md border border-border bg-surface px-2.5 text-[13px] focus:border-teal-400" />
      <button onClick={submit} className="h-8 rounded-md bg-teal-600 px-3 text-[13px] font-medium text-white hover:bg-teal-700">Add</button>
      <button onClick={onCancel} className="h-8 rounded-md px-2 text-[13px] text-ink-faint hover:text-ink">Cancel</button>
    </div>
  );
}

function ContractorsTab({ project }: { project: ReturnType<typeof usePintech.getState>["projects"][number] }) {
  const role = usePintech((s) => s.currentRole);
  const requestPayment = usePintech((s) => s.requestPayment);
  const canRequest = role === "super_admin" || role === "project_manager";
  const [requesting, setRequesting] = React.useState<{ id: string; name: string; contractValue: number } | null>(null);

  const chartData = project.contractors.map((c) => ({
    name: c.name,
    billed: Math.round(c.billedPct * 100),
    verified: Math.round(c.verifiedProgress * 100),
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Contractors" subtitle="Billing held accountable against verified site progress" />
        <CardBody className="space-y-2 pt-2">
          {project.contractors.map((c) => {
            const gap = billingGap(c.billedPct, c.verifiedProgress);
            const flagged = gap > OVER_BILL_THRESHOLD;
            return (
              <div key={c.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold text-ink">{c.name}</span>
                      {c.isPartner ? <Badge tone="teal">Partner</Badge> : <Badge>Sub-contractor</Badge>}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-faint">{c.scope} · contract {bdt(c.contractValue)} · deposit {bdt(c.securityDeposit)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[15px] font-semibold tabular-nums", flagged ? "text-[var(--color-status-alert)]" : "text-teal-700")}>{gap > 0 ? "+" : ""}{pct(gap)}</p>
                    <p className="text-[11px] text-ink-faint">{flagged ? "over-billed" : "in tolerance"}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Row label="Billed" value={pct(c.billedPct)} ratio={c.billedPct} tone={flagged ? "alert" : "navy"} />
                  <Row label="Verified" value={pct(c.verifiedProgress)} ratio={c.verifiedProgress} tone="teal" />
                </div>
                {canRequest && c.billedPct < 1 ? (
                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <Button size="sm" variant="subtle" onClick={() => setRequesting({ id: c.id, name: c.name, contractValue: c.contractValue })}>Request payment</Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardBody>
      </Card>

      {requesting ? (
        <RequestPaymentDialog
          contractor={requesting}
          onClose={() => setRequesting(null)}
          onSubmit={(amount, note) => {
            requestPayment(project.id, requesting.id, amount, note);
            setRequesting(null);
          }}
        />
      ) : null}

      <Card>
        <CardHeader title="Billed vs verified" />
        <CardBody className="pt-2">
          <BillingVsProgressChart data={chartData} />
          <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-status-alert)]" /> Billed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy-500" /> Verified</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, ratio, tone }: { label: string; value: string; ratio: number; tone: "teal" | "navy" | "alert" }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[12px] text-ink-faint">{label}</span>
      <ProgressBar ratio={ratio} tone={tone === "teal" ? "teal" : "navy"} className={tone === "alert" ? "[&>div]:bg-[var(--color-status-alert)]" : ""} />
      <span className="w-10 text-right text-[12px] font-medium tabular-nums text-ink-soft">{value}</span>
    </div>
  );
}

function SalesTab({ project }: { project: ReturnType<typeof usePintech.getState>["projects"][number] }) {
  const rows = project.floors.flatMap((f) => f.units.map((u) => ({ floor: f.name, unit: u })));

  return (
    <Card>
      <CardHeader title="Units & sales" subtitle={`${rows.length} units across ${project.floors.length} floors`} />
      <CardBody className="pt-2">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-muted text-[12px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Floor</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Buyer</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ floor, unit }) => (
                <tr key={unit.id} className="transition-colors hover:bg-surface-muted/50">
                  <td className="px-4 py-2.5 font-medium text-ink">{unit.name}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{floor}</td>
                  <td className="px-4 py-2.5 text-ink-soft capitalize">{unit.type}</td>
                  <td className="px-4 py-2.5"><SalePill status={unit.saleStatus} /></td>
                  <td className="px-4 py-2.5 text-ink-soft">{unit.buyer ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">{unit.salePrice ? bdt(unit.salePrice) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function RequestPaymentDialog({ contractor, onSubmit, onClose }: { contractor: { id: string; name: string; contractValue: number }; onSubmit: (amount: number, note: string) => void; onClose: () => void }) {
  const [amount, setAmount] = React.useState(String(Math.round(contractor.contractValue * 0.1)));
  const [note, setNote] = React.useState("");
  const amt = Number(amount) || 0;

  return (
    <Modal
      title={`Request payment`}
      subtitle={`${contractor.name} · contract ${bdt(contractor.contractValue)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={amt <= 0} onClick={() => onSubmit(amt, note.trim())}>Send for approval</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Installment amount (BDT)">
          <input autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} className={inputClass + " tabular-nums"} />
        </Field>
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Next milestone installment" className={inputClass} />
        </Field>
        <p className="rounded-lg bg-surface-muted/60 px-3 py-2 text-[12px] text-ink-faint">
          This goes to the Owner&apos;s Approvals queue, checked against verified site progress before release.
        </p>
      </div>
    </Modal>
  );
}
