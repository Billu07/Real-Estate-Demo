"use client";

import Link from "next/link";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { usePintech } from "@/lib/store";
import { projectsForManager, summarizeProject, billingAlerts } from "@/lib/data/selectors";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardBody, CardHeader, Stat, Badge, ProgressBar } from "@/components/ui";
import { pct } from "@/lib/utils";

export default function PmDashboard() {
  const projects = usePintech((s) => s.projects);
  const activity = usePintech((s) => s.activity);
  const user = usePintech((s) => s.currentUser());

  const mine = projectsForManager(projects, user.id);
  const summaries = mine.map(summarizeProject);
  const avg = summaries.length ? summaries.reduce((s, x) => s + x.ratio, 0) / summaries.length : 0;
  const myIds = new Set(mine.map((p) => p.id));
  const myActivity = activity.filter((a) => myIds.has(a.projectId));
  const openIssues = myActivity.filter((a) => a.kind === "issue").length;
  const alerts = billingAlerts(mine);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader eyebrow={`Welcome back, ${user.name.split(" ")[0]}`} title="My Dashboard" subtitle={`${mine.length} active projects under your management`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardBody><Stat label="My Projects" value={mine.length} sub={`${summaries.reduce((s, x) => s + x.units, 0)} units`} /></CardBody></Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <Stat label="Avg Progress" value={pct(avg)} sub="Across your sites" />
              <ProgressRing ratio={avg} size={52} stroke={6} />
            </div>
          </CardBody>
        </Card>
        <Card><CardBody><Stat label="Open Issues" value={openIssues} sub="Flagged from the field" tone={openIssues > 0 ? "alert" : "default"} /></CardBody></Card>
        <Card><CardBody><Stat label="Billing Gaps" value={alerts.length} sub="Contractors over-billed" tone={alerts.length > 0 ? "alert" : "default"} /></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {alerts.length > 0 ? (
            <Card className="border-[var(--color-status-alert)]/25">
              <CardHeader
                title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--color-status-alert)]" /> Needs your attention</span>}
                subtitle="Contractor billing ahead of verified progress"
              />
              <CardBody className="space-y-2 pt-3">
                {alerts.map((a) => (
                  <Link key={a.contractor.id} href={`/projects/${a.project.id}?tab=contractors`} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-[13.5px] transition-colors hover:bg-surface-muted">
                    <span><span className="font-medium text-ink">{a.contractor.name}</span> <span className="text-ink-faint">· {a.project.name}</span></span>
                    <span className="font-semibold tabular-nums text-[var(--color-status-alert)]">+{pct(a.gap)}</span>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="My projects" subtitle="Open a project to log progress" />
            <CardBody className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
              {summaries.map((s) => (
                <Link key={s.project.id} href={`/projects/${s.project.id}`} className="group rounded-xl border border-border p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/40">
                  <div className="flex items-center gap-3">
                    <ProgressRing ratio={s.ratio} size={50} stroke={6} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[14px] font-semibold text-ink">{s.project.name}</p>
                        <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-[12px] text-ink-faint">{s.project.floors.length} floors · {s.units} units</p>
                    </div>
                  </div>
                  <div className="mt-3"><ProgressBar ratio={s.ratio} /></div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Recent updates" subtitle="From your sites" action={<Badge tone="teal">Live</Badge>} />
          <CardBody className="pt-2">
            {myActivity.length > 0 ? <ActivityFeed items={myActivity} limit={10} /> : <p className="py-6 text-center text-[13px] text-ink-faint">No updates yet.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
