import * as React from "react";
import { cn } from "@/lib/utils";
import type { WorkStatus, SaleStatus } from "@/lib/data/types";

/* ----------------------------- Card ----------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface",
        "shadow-[0_1px_2px_rgba(15,29,46,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, title, subtitle, action }: { className?: string; title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[13px] text-ink-faint">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ----------------------------- Button ----------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
    secondary: "bg-navy-800 text-white hover:bg-navy-900",
    ghost: "text-navy-700 hover:bg-surface-muted",
    subtle: "border border-border bg-surface text-navy-700 hover:bg-surface-muted",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-4 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ----------------------------- Stat ----------------------------- */
export function Stat({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "alert" | "good" }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums",
          tone === "alert" ? "text-[var(--color-status-alert)]" : tone === "good" ? "text-teal-700" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[12px] text-ink-faint">{sub}</p> : null}
    </div>
  );
}

/* ----------------------------- Progress bar ----------------------------- */
export function ProgressBar({ ratio, className, tone = "teal" }: { ratio: number; className?: string; tone?: "teal" | "navy" }) {
  const w = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tone === "teal" ? "bg-teal-500" : "bg-navy-500")}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* ----------------------------- Status pills ----------------------------- */
const WORK_LABEL: Record<WorkStatus, string> = { pending: "Pending", in_progress: "In Progress", complete: "Complete" };

export function StatusPill({ status }: { status: WorkStatus }) {
  const map: Record<WorkStatus, string> = {
    complete: "bg-[var(--color-status-complete-bg)] text-[var(--color-status-complete)]",
    in_progress: "bg-[var(--color-status-progress-bg)] text-[var(--color-status-progress)]",
    pending: "bg-[var(--color-status-pending-bg)] text-ink-soft",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", map[status])}>
      {WORK_LABEL[status]}
    </span>
  );
}

const SALE_LABEL: Record<SaleStatus, string> = { available: "Available", sold: "Sold", after_sold: "After Sold" };

export function SalePill({ status }: { status: SaleStatus }) {
  const map: Record<SaleStatus, string> = {
    sold: "bg-teal-50 text-teal-700 border border-teal-200",
    after_sold: "bg-navy-50 text-navy-600 border border-navy-100",
    available: "bg-surface-muted text-ink-faint border border-border",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", map[status])}>{SALE_LABEL[status]}</span>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "teal" | "alert" }) {
  const map = {
    neutral: "bg-surface-muted text-ink-soft",
    teal: "bg-teal-50 text-teal-700",
    alert: "bg-[var(--color-status-alert-bg)] text-[var(--color-status-alert)]",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", map[tone])}>{children}</span>;
}

/* ----------------------------- Avatar ----------------------------- */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-[13px] font-semibold text-white", className)}>
      {initials}
    </span>
  );
}
