"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardHat, PanelLeft } from "lucide-react";
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

const STORAGE_KEY = "pintech-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = usePintech((s) => s.currentRole);
  const ready = usePintech((s) => s.ready);
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));
  const title = TITLES.find((t) => pathname.startsWith(t.match))?.title ?? "Pintech ERP";

  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // The login route renders without the app chrome.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-navy-800 bg-navy-900 transition-[width] duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div className={cn("flex h-16 items-center", collapsed ? "justify-center px-0" : "gap-2.5 px-5")}>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500 font-display text-[15px] font-bold text-white">P</span>
          {!collapsed ? (
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              Pintech<span className="text-teal-400"> ERP</span>
            </span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {!collapsed ? (
            <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-300/70">{ROLE_LABEL[role]}</p>
          ) : (
            <div className="pb-2" />
          )}
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center rounded-lg text-[14px] font-medium transition-colors",
                  collapsed ? "h-10 justify-center" : "gap-3 px-3 py-2.5",
                  active ? "bg-navy-700 text-white shadow-sm" : "text-navy-200 hover:bg-navy-800 hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed ? item.label : null}
                {collapsed ? (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-navy-800 px-2 py-1 text-[12px] font-medium text-white shadow-lg group-hover:block">
                    {item.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed ? (
          <div className="border-t border-navy-800 px-5 py-4">
            <p className="flex items-center gap-2 text-[12px] text-navy-300">
              <HardHat className="h-4 w-4 text-teal-400" />
              NRD Projects
            </p>
          </div>
        ) : (
          <div className="flex justify-center border-t border-navy-800 py-4">
            <HardHat className="h-4 w-4 text-teal-400" />
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={cn("flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ease-out", collapsed ? "pl-[68px]" : "pl-60")}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-canvas/85 px-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-soft"
            >
              <PanelLeft className="h-[18px] w-[18px]" />
            </button>
            <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">{title}</h1>
          </div>
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
