"use client";

import { usePintech } from "@/lib/store";
import { salesSummary } from "@/lib/data/selectors";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryTable } from "@/components/sales/inventory-table";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardBody, CardHeader, Stat, Badge } from "@/components/ui";
import { bdt } from "@/lib/utils";

export default function SalesDashboard() {
  const projects = usePintech((s) => s.projects);
  const activity = usePintech((s) => s.activity);
  const user = usePintech((s) => s.currentUser());

  const s = salesSummary(projects);
  const sales = activity.filter((a) => a.kind === "sale");

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader eyebrow={`Welcome, ${user.name.split(" ")[0]}`} title="Sales Desk" subtitle="Inventory and sales across every project" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardBody><Stat label="Revenue Booked" value={bdt(s.revenue)} sub={`${s.sold + s.afterSold} units sold`} tone="good" /></CardBody></Card>
        <Card><CardBody><Stat label="Units Available" value={s.available} sub={`of ${s.total} total`} /></CardBody></Card>
        <Card><CardBody><Stat label="Sold / After Sold" value={`${s.sold} / ${s.afterSold}`} sub="Booked inventory" /></CardBody></Card>
        <Card><CardBody><Stat label="Pipeline Value" value={bdt(s.pipelineValue)} sub="Est. available inventory" /></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryTable canSell subtitle="Mark units sold and record the buyer" />
        </div>
        <Card>
          <CardHeader title="Recent sales" action={<Badge tone="teal">Live</Badge>} />
          <CardBody className="pt-2">
            {sales.length > 0 ? <ActivityFeed items={sales} limit={10} /> : <p className="py-6 text-center text-[13px] text-ink-faint">No sales recorded yet.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
