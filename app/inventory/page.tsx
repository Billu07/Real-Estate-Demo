"use client";

import { usePintech } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryTable } from "@/components/sales/inventory-table";

export default function InventoryPage() {
  const role = usePintech((s) => s.currentRole);
  const canSell = role === "super_admin" || role === "sales";

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <PageHeader eyebrow="Every unit, every project" title="Inventory" subtitle="Availability and sales status across the portfolio" />
      <InventoryTable canSell={canSell} />
    </div>
  );
}
