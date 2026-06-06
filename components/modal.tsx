"use client";

import * as React from "react";

export function Modal({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-[16px] font-bold tracking-tight text-ink">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[13px] text-ink-faint">{subtitle}</p> : null}
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-teal-400";
