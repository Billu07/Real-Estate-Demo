"use client";

import * as React from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { usePintech } from "@/lib/store";
import type { PaymentRequest } from "@/lib/data/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, Stat, Badge, Button, ProgressBar } from "@/components/ui";
import { bdt, pct, cn } from "@/lib/utils";

const RISK_TOLERANCE = 0.1;

function resultingBilled(r: PaymentRequest) {
  return Math.min(1, r.billedBefore + r.amount / Math.max(1, r.contractValue));
}
function isRisky(r: PaymentRequest) {
  return resultingBilled(r) > r.verifiedAtRequest + RISK_TOLERANCE;
}

export default function PaymentsPage() {
  const payments = usePintech((s) => s.payments);
  const decide = usePintech((s) => s.decidePayment);

  const pending = payments.filter((p) => p.status === "pending");
  const decided = payments.filter((p) => p.status !== "pending");
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
  const risky = pending.filter(isRisky).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <PageHeader eyebrow="Contractor payments" title="Approvals" subtitle="Release payments only when verified site progress supports them" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardBody><Stat label="Pending Requests" value={pending.length} /></CardBody></Card>
        <Card><CardBody><Stat label="Pending Amount" value={bdt(pendingTotal)} /></CardBody></Card>
        <Card><CardBody><Stat label="Flagged (over verified)" value={risky} tone={risky > 0 ? "alert" : "default"} /></CardBody></Card>
        <Card><CardBody><Stat label="Decided" value={decided.length} sub="This period" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Awaiting your decision" subtitle="Each request is checked against verified progress" action={<Badge tone={risky > 0 ? "alert" : "neutral"}>{pending.length} pending</Badge>} />
        <CardBody className="space-y-3 pt-3">
          {pending.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-ink-faint">No payment requests awaiting approval.</p>
          ) : (
            pending.map((r) => <RequestCard key={r.id} r={r} onDecide={decide} />)
          )}
        </CardBody>
      </Card>

      {decided.length > 0 ? (
        <Card>
          <CardHeader title="Decision history" />
          <CardBody className="pt-2">
            <div className="divide-y divide-border">
              {decided.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 text-[13.5px]">
                  <div>
                    <p className="font-medium text-ink">{r.contractorName} <span className="font-normal text-ink-faint">· {r.projectName}</span></p>
                    <p className="text-[12px] text-ink-faint">{bdt(r.amount)} · decided by {r.decidedByName ?? "—"}</p>
                  </div>
                  <Badge tone={r.status === "approved" ? "teal" : "alert"}>{r.status === "approved" ? "Approved" : "Rejected"}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function RequestCard({ r, onDecide }: { r: PaymentRequest; onDecide: (id: string, s: "approved" | "rejected") => void }) {
  const after = resultingBilled(r);
  const risky = isRisky(r);

  return (
    <div className={cn("rounded-xl border p-4", risky ? "border-[var(--color-status-alert)]/30 bg-[var(--color-status-alert-bg)]/25" : "border-border")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink">{r.contractorName}</span>
            <Badge>{r.contractorScope}</Badge>
            {risky ? <Badge tone="alert"><AlertTriangle className="mr-1 h-3 w-3" /> Exceeds verified</Badge> : null}
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">{r.projectName} · requested by {r.requestedByName}</p>
          {r.note ? <p className="mt-1.5 text-[13px] text-ink-soft">“{r.note}”</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[20px] font-bold tabular-nums text-ink">{bdt(r.amount)}</p>
          <p className="text-[11px] text-ink-faint">installment requested</p>
        </div>
      </div>

      {/* The gate: billed → resulting vs verified */}
      <div className="mt-4 rounded-lg bg-surface-muted/60 p-3">
        <div className="flex items-center justify-between text-[12px] text-ink-faint">
          <span>Billed {pct(r.billedBefore)} → <span className={cn("font-semibold", risky ? "text-[var(--color-status-alert)]" : "text-ink-soft")}>{pct(after)}</span> after this</span>
          <span>Verified progress {pct(r.verifiedAtRequest)}</span>
        </div>
        <div className="relative mt-2">
          <ProgressBar ratio={r.verifiedAtRequest} tone="navy" />
          <span className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-[var(--color-status-alert)]" style={{ left: `${after * 100}%` }} title="Billed after approval" />
        </div>
        {risky ? (
          <p className="mt-2 text-[12px] text-[var(--color-status-alert)]">Approving puts billing {pct(after - r.verifiedAtRequest)} ahead of verified work. Confirm before releasing.</p>
        ) : (
          <p className="mt-2 text-[12px] text-teal-700">Within tolerance of verified progress.</p>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="subtle" onClick={() => onDecide(r.id, "rejected")}><X className="h-4 w-4" /> Reject</Button>
        <Button onClick={() => onDecide(r.id, "approved")}><Check className="h-4 w-4" /> Approve payment</Button>
      </div>
    </div>
  );
}
