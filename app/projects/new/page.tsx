"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { usePintech } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";
import type { Floor, Project, ProjectKind, Unit, WorkItem, WorkStatus } from "@/lib/data/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, Button, Badge } from "@/components/ui";
import { Field, inputClass } from "@/components/modal";
import { bdt, cn } from "@/lib/utils";

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(16).slice(2)}`);

const WORK_TEMPLATE = [
  { name: "Bricks Layout", weight: 8 },
  { name: "Lintel / False Slab", weight: 10 },
  { name: "Brick Works", weight: 10 },
  { name: "Ceiling Plaster", weight: 15 },
  { name: "Plastering", weight: 12 },
  { name: "Door Frame Setting", weight: 6 },
  { name: "Window Grill Setting", weight: 5 },
  { name: "Washroom Grill Setting", weight: 4 },
  { name: "Electrical Wiring", weight: 12 },
  { name: "Sanitary", weight: 8 },
  { name: "Tiles Work", weight: 6 },
  { name: "Gas Line", weight: 4 },
];

const KINDS: { value: ProjectKind; label: string; hint: string }[] = [
  { value: "residential", label: "Residential", hint: "Apartment units across floors" },
  { value: "commercial", label: "Commercial", hint: "Shops / office space" },
  { value: "mixed", label: "Mixed-use", hint: "Commercial ground floor + residential above" },
];

interface FloorDraft {
  id: string;
  name: string;
  type: Unit["type"];
  unitCount: number;
}
interface ContractorDraft {
  id: string;
  name: string;
  scope: string;
  contractValue: string;
  isPartner: boolean;
}

const STEPS = ["Basics", "Structure", "Contractors", "Review"];

export default function NewProjectWizard() {
  const router = useRouter();
  const users = usePintech((s) => s.users);
  const createProject = usePintech((s) => s.createProject);

  const [step, setStep] = React.useState(0);

  // Step 1
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [kind, setKind] = React.useState<ProjectKind>("residential");
  const [location, setLocation] = React.useState("");
  const [managerId, setManagerId] = React.useState("");
  const [startedOn, setStartedOn] = React.useState(new Date().toISOString().slice(0, 10));

  // Step 2
  const [floors, setFloors] = React.useState<FloorDraft[]>([
    { id: uuid(), name: "Ground Floor", type: kind === "residential" ? "residential" : "commercial", unitCount: 4 },
    { id: uuid(), name: "1st Floor", type: "residential", unitCount: 6 },
  ]);

  // Step 3
  const [contractors, setContractors] = React.useState<ContractorDraft[]>([
    { id: uuid(), name: "", scope: "Civil", contractValue: "", isPartner: true },
  ]);

  const managers = users.filter((u) => u.role === "project_manager" || u.role === "super_admin");
  const totalUnits = floors.reduce((s, f) => s + (Number(f.unitCount) || 0), 0);

  const canNext =
    step === 0 ? name.trim() && code.trim() && location.trim()
    : step === 1 ? floors.length > 0 && floors.every((f) => f.name.trim() && f.unitCount > 0)
    : true;

  function buildUnits(f: FloorDraft): Unit[] {
    const letters = "ABCDEFGHIJ".split("");
    return Array.from({ length: f.unitCount }).map((_, i) => {
      const items: WorkItem[] = WORK_TEMPLATE.map((t) => ({ id: uuid(), name: t.name, weight: t.weight, status: "pending" as WorkStatus }));
      return {
        id: uuid(),
        name: f.type === "commercial" ? `Shop ${i + 1}` : `Unit ${letters[i] ?? i + 1}`,
        type: f.type,
        saleStatus: "available" as const,
        workItems: items,
      };
    });
  }

  function submit() {
    const projectId = uuid();
    const builtFloors: Floor[] = floors.map((f, idx) => ({ id: uuid(), name: f.name.trim(), code: `${code}-${idx}`, order: idx, units: buildUnits(f) }));
    const builtContractors = contractors
      .filter((c) => c.name.trim())
      .map((c) => ({ id: uuid(), name: c.name.trim(), scope: c.scope, isPartner: c.isPartner, contractValue: Number(c.contractValue) || 0, billedPct: 0, securityDeposit: Math.round((Number(c.contractValue) || 0) * 0.05), verifiedProgress: 0 }));
    const project: Project = {
      id: projectId,
      name: name.trim(),
      code: code.trim(),
      kind,
      location: location.trim(),
      managerId: managerId || (managers[0]?.id ?? ""),
      startedOn,
      floors: builtFloors,
      contractors: builtContractors,
    };
    createProject(project, managerId || managers[0]?.id || null);
    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="mx-auto max-w-[860px] space-y-6">
      <button onClick={() => router.push("/projects")} className="inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </button>
      <PageHeader eyebrow="Create a new project" title="New Project" subtitle="Set up a building, its floors and units, and contractors in a few steps" />

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors", i < step ? "bg-teal-600 text-white" : i === step ? "bg-navy-800 text-white" : "bg-surface-muted text-ink-faint")}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-[13px] font-medium", i === step ? "text-ink" : "text-ink-faint")}>{label}</span>
            </div>
            {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-5">
          {step === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Project name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tarulata 3" className={inputClass} /></Field>
              <Field label="Project code"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 011" className={inputClass} /></Field>
              <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Uttara, Sector 11" className={inputClass} /></Field>
              <Field label="Start date"><input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} className={inputClass} /></Field>
              <Field label="Project manager">
                <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={inputClass}>
                  <option value="">Select…</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">Building type</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {KINDS.map((k) => (
                    <button key={k.value} onClick={() => setKind(k.value)} className={cn("rounded-xl border p-3 text-left transition-colors", kind === k.value ? "border-teal-500 bg-teal-50/50" : "border-border hover:bg-surface-muted")}>
                      <span className="block text-[13.5px] font-semibold text-ink">{k.label}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-faint">{k.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-soft">Add floors and how many units / shops each has.</p>
                <Badge tone="teal">{totalUnits} units total</Badge>
              </div>
              {floors.map((f, i) => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                  <input value={f.name} onChange={(e) => setFloors((p) => p.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))} placeholder={`Floor ${i + 1} name`} className={inputClass + " w-40 flex-1"} />
                  <select value={f.type} onChange={(e) => setFloors((p) => p.map((x) => (x.id === f.id ? { ...x, type: e.target.value as Unit["type"] } : x)))} className={inputClass + " w-36"}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-ink-faint">Units</span>
                    <input value={f.unitCount} onChange={(e) => setFloors((p) => p.map((x) => (x.id === f.id ? { ...x, unitCount: Math.min(10, Number(e.target.value.replace(/[^0-9]/g, "")) || 0) } : x)))} className={inputClass + " w-16 text-center tabular-nums"} />
                  </div>
                  <button onClick={() => setFloors((p) => p.filter((x) => x.id !== f.id))} className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-[var(--color-status-alert)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="subtle" onClick={() => setFloors((p) => [...p, { id: uuid(), name: `${p.length}th Floor`, type: "residential", unitCount: 6 }])}><Plus className="h-4 w-4" /> Add floor</Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-[13px] text-ink-soft">Add contractors (optional). You can manage these later too.</p>
              {contractors.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                  <input value={c.name} onChange={(e) => setContractors((p) => p.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} placeholder="Contractor name" className={inputClass + " w-44 flex-1"} />
                  <select value={c.scope} onChange={(e) => setContractors((p) => p.map((x) => (x.id === c.id ? { ...x, scope: e.target.value } : x)))} className={inputClass + " w-36"}>
                    {["Civil", "Electrical", "Sanitary", "Piling", "Finishing"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={c.contractValue} onChange={(e) => setContractors((p) => p.map((x) => (x.id === c.id ? { ...x, contractValue: e.target.value.replace(/[^0-9]/g, "") } : x)))} placeholder="Contract value" className={inputClass + " w-36 tabular-nums"} />
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-soft"><input type="checkbox" checked={c.isPartner} onChange={(e) => setContractors((p) => p.map((x) => (x.id === c.id ? { ...x, isPartner: e.target.checked } : x)))} /> Partner</label>
                  <button onClick={() => setContractors((p) => p.filter((x) => x.id !== c.id))} className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-[var(--color-status-alert)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="subtle" onClick={() => setContractors((p) => [...p, { id: uuid(), name: "", scope: "Civil", contractValue: "", isPartner: false }])}><Plus className="h-4 w-4" /> Add contractor</Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <ReviewRow label="Project" value={`${name} · #${code}`} />
              <ReviewRow label="Type & location" value={`${KINDS.find((k) => k.value === kind)?.label} · ${location}`} />
              <ReviewRow label="Manager" value={managers.find((m) => m.id === managerId)?.name ?? managers[0]?.name ?? "—"} />
              <ReviewRow label="Structure" value={`${floors.length} floors · ${totalUnits} units`} />
              <ReviewRow label="Contractors" value={contractors.filter((c) => c.name.trim()).length ? contractors.filter((c) => c.name.trim()).map((c) => c.name).join(", ") : "None yet"} />
              <ReviewRow label="Total contract value" value={bdt(contractors.reduce((s, c) => s + (Number(c.contractValue) || 0), 0))} />
              <p className="rounded-lg bg-teal-50/60 px-3 py-2.5 text-[12.5px] text-teal-800">Creating this project adds {totalUnits} units, each pre-loaded with the standard {WORK_TEMPLATE.length}-item work checklist, ready for the team to track.</p>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => (step === 0 ? router.push("/projects") : setStep((s) => s - 1))}>{step === 0 ? "Cancel" : "Back"}</Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={submit}><Check className="h-4 w-4" /> Create project</Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <span className="text-[12.5px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="text-[13.5px] font-medium text-ink">{value}</span>
    </div>
  );
}
