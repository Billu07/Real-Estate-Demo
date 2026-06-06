"use client";

import type { ActivityUpdate, UpdateKind } from "@/lib/data/types";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

const DOT: Record<UpdateKind, string> = {
  progress: "bg-teal-500",
  issue: "bg-[var(--color-status-alert)]",
  sale: "bg-navy-500",
  billing: "bg-[var(--color-status-progress)]",
};

const KIND_LABEL: Record<UpdateKind, string> = {
  progress: "Progress",
  issue: "Issue",
  sale: "Sale",
  billing: "Billing",
};

export function ActivityFeed({ items, limit }: { items: ActivityUpdate[]; limit?: number }) {
  const mounted = useMounted();
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className="space-y-0.5">
      {shown.map((a) => (
        <li key={a.id} className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted">
          <span className="mt-1.5 flex-shrink-0">
            <span className={cn("block h-2 w-2 rounded-full", DOT[a.kind])} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-snug text-ink">{a.message}</p>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              <span className="font-medium text-ink-soft">{a.projectName}</span>
              {" · "}
              {KIND_LABEL[a.kind]} · {a.authorName}
              {mounted ? ` · ${relativeTime(a.createdAt)}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
