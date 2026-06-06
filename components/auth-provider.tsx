"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePintech } from "@/lib/store";
import { ROLE_HOME } from "@/lib/roles";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Role, User } from "@/lib/data/types";

type AuthStatus = "loading" | "authed" | "guest";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfile(row: any): User {
  return { id: row.id, name: row.name, title: row.title, role: row.role as Role, initials: row.initials, email: row.email ?? undefined, active: row.active ?? true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuthProfile = usePintech((s) => s.setAuthProfile);
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = React.useState<AuthStatus>(isSupabaseConfigured() ? "loading" : "authed");

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getBrowserSupabase();
    if (!sb) return;

    let active = true;

    async function loadProfile(email: string | undefined) {
      if (!email) return false;
      const { data } = await sb!.from("app_user").select("id,name,title,role,initials,email,active").eq("email", email).limit(1);
      const row = data?.[0];
      if (row && active) {
        setAuthProfile(mapProfile(row));
        return true;
      }
      return false;
    }

    sb.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        await loadProfile(data.session.user.email);
        setStatus("authed");
      } else {
        setStatus("guest");
      }
    });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        await loadProfile(session.user.email);
        setStatus("authed");
      } else {
        setStatus("guest");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setAuthProfile]);

  // Redirects
  React.useEffect(() => {
    if (status === "guest" && pathname !== "/login") router.replace("/login");
    if (status === "authed" && pathname === "/login") {
      const role = usePintech.getState().currentUser().role;
      router.replace(ROLE_HOME[role] ?? "/command-center");
    }
  }, [status, pathname, router]);

  if (status === "loading") return <Splash />;
  if (status === "guest" && pathname !== "/login") return <Splash />;
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-teal-500" />
    </div>
  );
}
