"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardHat } from "lucide-react";
import { usePintech } from "@/lib/store";
import { NAV, ROLE_LABEL } from "@/lib/roles";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const TITLES: { match: string; title: string }[] = [
  { match: "/command-center", title: "Command Center" },
  { match: "/dashboard/pm", title: "My Dashboard" },
  { match: "/dashboard/engineer", title: "Field Tasks" },
  { match: "/dashboard/sales", title: "Sales Desk" },
  { match: "/inventory", title: "Inventory" },
  { match: "/payments", title: "Approvals" },
  { match: "/team", title: "Team" },
  { match: "/account", title: "Account" },
  { match: "/projects/new", title: "New Project" },
  { match: "/projects", title: "Projects" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = usePintech((s) => s.currentRole);
  const ready = usePintech((s) => s.ready);
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));
  const title = TITLES.find((t) => pathname.startsWith(t.match))?.title ?? "Pintech ERP";

  // The login route renders without the app chrome.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-navy-800 bg-navy-900">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-display text-[15px] font-bold text-white">P</span>
          <span className="font-display text-[15px] font-bold tracking-tight text-white">
            Pintech<span className="text-teal-400"> ERP</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-300/70">
            {ROLE_LABEL[role]}
          </p>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all",
                  active ? "bg-navy-700 text-white shadow-sm" : "text-navy-200 hover:bg-navy-800 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-navy-800 px-5 py-4">
          <p className="flex items-center gap-2 text-[12px] text-navy-300">
            <HardHat className="h-4 w-4 text-teal-400" />
            NRD Projects · Live demo
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-canvas/85 px-7 backdrop-blur-md">
          <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">{title}</h1>
          <UserMenu />
        </header>
        <main className="flex-1 px-7 py-7">{ready ? children : <LoadingState />}</main>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-teal-500" />
      <p className="text-[13px]">Loading live data…</p>
    </div>
  );
}
