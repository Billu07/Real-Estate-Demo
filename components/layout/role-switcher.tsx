"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { usePintech } from "@/lib/store";
import { USERS } from "@/lib/data/seed";
import type { Role } from "@/lib/data/types";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL, ROLE_HOME } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const role = usePintech((s) => s.currentRole);
  const setRole = usePintech((s) => s.setRole);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = USERS.find((u) => u.role === role) ?? USERS[0];

  const pick = (r: Role) => {
    setRole(r);
    setOpen(false);
    router.push(ROLE_HOME[r]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-muted"
      >
        <Avatar initials={current.initials} className="h-7 w-7 text-[12px]" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-ink">{current.name}</span>
          <span className="block text-[11px] text-ink-faint">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-faint" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <p className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            View as role
          </p>
          {USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => pick(u.role)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted",
                u.role === role && "bg-teal-50",
              )}
            >
              <Avatar initials={u.initials} className="h-8 w-8" />
              <span className="leading-tight">
                <span className="block text-[13px] font-medium text-ink">{u.name}</span>
                <span className="block text-[12px] text-ink-faint">{u.title}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
