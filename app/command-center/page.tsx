"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePintech } from "@/lib/store";
import { buildPortfolio, billingAlerts, salesSummary } from "@/lib/data/selectors";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { ProgressByProjectChart } from "@/components/charts";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardBody, CardHeader, ProgressBar, SalePill, Stat, Badge } from "@/components/ui";
import { bdt, pct, cn } from "@/lib/utils";

export default function CommandCenterPage() {
  const projects = usePintech((s) => s.projects);
  const activity = usePintech((s) => s.activity);
  const user = usePintech((s) => s.currentUser());

  const portfolio = buildPortfolio(projects);
  const alerts = billingAlerts(projects);
  const sales = salesSummary(projects);

  const chartData = portfolio.summaries
    .map((s) => ({ name: s.project.name, value: Math.round(s.ratio * 100), flagged: s.flaggedContractors > 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader eyebrow={`Welcome back, ${user.name.split(" ")[0]}`} title="Command Center" subtitle="Portfolio-wide control across all NRD Projects sites" />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <Stat label="Overall Progress" value={pct(portfolio.overallRatio)} sub={`${portfolio.totalProjects} projects · ${portfolio.totalUnits} units`} />
              <ProgressRing ratio={portfolio.overallRatio} size={56} stroke={6} />
            </div>
          </CardBody>
        </Card>
        <Card><CardBody><Stat label="Revenue Booked" value={bdt(sales.revenue)} sub={`${portfolio.totalSold} units sold`} tone="good" /></CardBody></Card>
        <Card><CardBody><Stat label="Contract Value" value={bdt(portfolio.totalContractValue)} sub="Across all contractors" /></CardBody></Card>
        <Card className={cn(portfolio.alertCount > 0 && "border-[var(--color-status-alert)]/30 bg-[var(--color-status-alert-bg)]/30")}>
          <CardBody>
            <Stat label="Billing Alerts" value={portfolio.alertCount} sub={`${bdt(portfolio.totalExposure)} over-billed exposure`} tone={portfolio.alertCount > 0 ? "alert" : "default"} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: portfolio + chart */}
        <div className="space-y-6 lg:col-span-2">
          {/* Billing control — the headline differentiator */}
          <Card>
            <CardHeader
              title="Billing vs. verified progress"
              subtitle="Where contractor billing runs ahead of confirmed site work"
              action={<Badge tone="alert">{alerts.length} flagged</Badge>}
            />
            <CardBody className="space-y-2 pt-3">
              {alerts.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-faint">All contractor billing is within tolerance.</p>
              ) : (
                alerts.map((a) => (
                  <Link
                    key={a.project.id + a.contractor.id}
                    href={`/projects/${a.project.id}?tab=contractors`}
                    className="flex items-center gap-4 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {a.contractor.name} <span className="font-normal text-ink-faint">· {a.contractor.scope}</span>
                      </p>
                      <p className="text-[12.5px] text-ink-faint">{a.project.name}</p>
                    </div>
                    <div className="hidden w-56 sm:block">
                      <div className="flex justify-between text-[11px] text-ink-faint">
                        <span>Billed {pct(a.contractor.billedPct)}</span>
                        <span>Verified {pct(a.contractor.verifiedProgress)}</span>
                      </div>
                      <div className="relative mt-1">
                        <ProgressBar ratio={a.contractor.verifiedProgress} tone="navy" />
                        <span
                          className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-[var(--color-status-alert)]"
                          style={{ left: `${a.contractor.billedPct * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-[15px] font-semibold tabular-nums text-[var(--color-status-alert)]">+{pct(a.gap)}</p>
                      <p className="text-[11px] text-ink-faint">{bdt(a.exposure)}</p>
                    </div>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* Portfolio grid */}
          <Card>
            <CardHeader title="Projects" subtitle="Live weighted completion per site" />
            <CardBody className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
              {portfolio.summaries.map((s) => (
                <Link
                  key={s.project.id}
                  href={`/projects/${s.project.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <ProgressRing ratio={s.ratio} size={58} stroke={6} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14.5px] font-semibold text-ink">{s.project.name}</p>
                      <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="text-[12px] text-ink-faint">{s.project.location} · {s.units} units</p>
                    <div className="mt-2 flex items-center gap-2">
                      <SalePill status="sold" />
                      <span className="text-[12px] text-ink-faint">{s.sold} sold</span>
                      {s.flaggedContractors > 0 ? <Badge tone="alert">billing gap</Badge> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Progress by project" />
            <CardBody className="pt-2">
              <ProgressByProjectChart data={chartData} />
            </CardBody>
          </Card>
        </div>

        {/* Right: live activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Live activity" subtitle="Field updates as they happen" action={<Badge tone="teal">Realtime</Badge>} />
            <CardBody className="pt-2">
              <ActivityFeed items={activity} limit={9} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
