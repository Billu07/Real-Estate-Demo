"use client";

import type { WorkStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: WorkStatus; label: string; active: string }[] = [
  { value: "pending", label: "Pending", active: "bg-surface text-ink-soft shadow-sm" },
  { value: "in_progress", label: "In Progress", active: "bg-[var(--color-status-progress)] text-white shadow-sm" },
  { value: "complete", label: "Complete", active: "bg-teal-600 text-white shadow-sm" },
];

export function StatusToggle({
  value,
  onChange,
  disabled,
}: {
  value: WorkStatus;
  onChange: (s: WorkStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("inline-flex rounded-lg bg-surface-muted p-0.5", disabled && "pointer-events-none opacity-60")}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
            value === o.value ? o.active : "text-ink-faint hover:text-ink-soft",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
