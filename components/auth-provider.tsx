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

    // Safety net: never sit on the loading splash forever.
    const timeout = setTimeout(() => {
      if (active) setStatus((s) => (s === "loading" ? "guest" : s));
    }, 8000);

    async function loadProfile(email: string | undefined) {
      if (!email) return;
      try {
        const { data } = await sb!.from("app_user").select("id,name,title,role,initials,email,active").eq("email", email).limit(1);
        if (data?.[0] && active) setAuthProfile(mapProfile(data[0]));
      } catch {
        // profile load failure shouldn't block an authenticated user
      }
    }

    // onAuthStateChange emits an INITIAL_SESSION event on subscribe with the
    // restored session — this is reliable, unlike getSession() which can hang
    // on its storage lock after a reload. The callback stays synchronous and
    // defers async work to avoid auth-lock deadlocks.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      clearTimeout(timeout);
      if (session?.user?.email) {
        const email = session.user.email;
        // Load the profile (role) before marking authed so role-based landing is
        // correct. This is a PostgREST call — reliable, unlike getSession().
        // Detached so the auth callback itself stays synchronous.
        void (async () => {
          await loadProfile(email);
          if (active) setStatus("authed");
        })();
      } else {
        setStatus("guest");
      }
    });

    return () => {
      active = false;
      clearTimeout(timeout);
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
