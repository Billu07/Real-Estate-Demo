"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { usePintech } from "@/lib/store";
import { summarizeProject } from "@/lib/data/selectors";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { Card, CardBody, ProgressBar, Badge, Button } from "@/components/ui";
import { pct } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = { residential: "Residential", commercial: "Commercial", mixed: "Mixed-use" };

export default function ProjectsPage() {
  const projects = usePintech((s) => s.projects);
  const role = usePintech((s) => s.currentRole);
  const router = useRouter();
  const canCreate = role === "super_admin" || role === "project_manager";

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader
        eyebrow="Select a project to update progress"
        title="Projects"
        actions={canCreate ? <Button onClick={() => router.push("/projects/new")}><Plus className="h-4 w-4" /> New project</Button> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const s = summarizeProject(p);
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition-colors hover:border-teal-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-ink">{p.name}</p>
                      <p className="text-[12.5px] text-ink-faint">{p.location}</p>
                    </div>
                    <ProgressRing ratio={s.ratio} size={52} stroke={6} />
                  </div>

                  <ProgressBar ratio={s.ratio} />

                  <div className="flex items-center justify-between text-[12.5px] text-ink-faint">
                    <span>{p.floors.length} floors · {s.units} units</span>
                    <Badge>{KIND_LABEL[p.kind]}</Badge>
                  </div>

                  <div className="flex items-center gap-3 border-t border-border pt-3 text-[12.5px]">
                    <span className="text-ink-soft">{s.sold} sold</span>
                    <span className="text-ink-faint">·</span>
                    <span className="text-ink-soft">{pct(s.ratio)} complete</span>
                    {s.flaggedContractors > 0 ? <Badge tone="alert">billing gap</Badge> : null}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
