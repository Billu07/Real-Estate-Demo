import * as React from "react";

/** Standardized module header used across every screen for a consistent SaaS feel. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-[12.5px] font-medium text-ink-faint">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-[24px] font-bold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13.5px] text-ink-soft">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
