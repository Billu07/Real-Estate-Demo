import * as React from "react";
import { cn } from "@/lib/utils";

/** Flat progress ring — single teal arc on a soft track. No gradients. */
export function ProgressRing({
  ratio,
  size = 72,
  stroke = 7,
  className,
  label,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  const offset = c * (1 - clamped);
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-teal-500)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {label ?? <span className="text-sm font-semibold tabular-nums text-ink">{Math.round(clamped * 100)}%</span>}
      </span>
    </div>
  );
}
