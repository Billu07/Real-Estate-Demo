"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { usePintech } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/roles";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";

export function UserMenu() {
  const user = usePintech((s) => s.currentUser());
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

  async function signOut() {
    const sb = getBrowserSupabase();
    if (sb) await sb.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-muted">
        <Avatar initials={user.initials} className="h-7 w-7 text-[12px]" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="block text-[11px] text-ink-faint">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-faint" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <Avatar initials={user.initials} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-ink-faint">{user.email ?? user.title}</p>
            </div>
          </div>
          <Link href="/account" onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-surface-muted">
            <Settings className="h-4 w-4" /> Account settings
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-left text-[13.5px] font-medium text-ink-soft transition-colors hover:bg-surface-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
