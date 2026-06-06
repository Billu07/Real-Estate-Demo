"use client";

import * as React from "react";
import { usePintech } from "@/lib/store";
import { unitRollup, unitItemCounts } from "@/lib/completion";
import { PageHeader } from "@/components/layout/page-header";
import { UnitCard } from "@/components/workspace/unit-card";
import { UpdateComposer } from "@/components/workspace/update-composer";
import { Card, CardBody, CardHeader, Stat, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function EngineerDashboard() {
  const projects = usePintech((s) => s.projects);
  const user = usePintech((s) => s.currentUser());
  const [activeId, setActiveId] = React.useState(projects[0]?.id ?? "");

  const project = projects.find((p) => p.id === activeId) ?? projects[0];

  // Flatten units, surface the least-complete first — "what needs work today".
  const units = project.floors
    .flatMap((f) => f.units.map((u) => ({ floor: f, unit: u, ratio: unitRollup(u).ratio })))
    .sort((a, b) => a.ratio - b.ratio);

  let pending = 0;
  let inProgress = 0;
  let complete = 0;
  for (const { unit } of units) {
    const c = unitItemCounts(unit);
    pending += c.total - c.complete - c.inProgress;
    inProgress += c.inProgress;
    complete += c.complete;
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader eyebrow={`Hi, ${user.name.split(" ")[0]}`} title="Field Tasks" subtitle="Update site progress and report issues from here" />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardBody><Stat label="Items Pending" value={pending} tone="default" /></CardBody></Card>
        <Card><CardBody><Stat label="In Progress" value={inProgress} /></CardBody></Card>
        <Card><CardBody><Stat label="Completed" value={complete} tone="good" /></CardBody></Card>
      </div>

      {/* Project selector */}
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
              p.id === activeId ? "border-teal-500 bg-teal-50 text-teal-700" : "border-border bg-surface text-ink-soft hover:bg-surface-muted",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <UpdateComposer project={project} />

      <Card>
        <CardHeader title="Units to update" subtitle="Sorted by what needs the most work" action={<Badge>{units.length} units</Badge>} />
        <CardBody className="space-y-2.5 pt-3">
          {units.map(({ unit }) => (
            <UnitCard key={unit.id} projectId={project.id} unit={unit} canEdit />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
