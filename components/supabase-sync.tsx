"use client";

import { useEffect } from "react";
import { usePintech } from "@/lib/store";
import { fetchAll } from "@/lib/data/supabase-repo";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { WorkStatus } from "@/lib/data/types";

/**
 * Hydrates the store from Supabase on mount and keeps it live via realtime.
 * No-op (seeded mode) when Supabase isn't configured. Renders nothing.
 */
export function SupabaseSync() {
  const hydrate = usePintech((s) => s.hydrate);
  const useSeedFallback = usePintech((s) => s.useSeedFallback);
  const applyRemoteWorkItem = usePintech((s) => s.applyRemoteWorkItem);
  const applyRemoteActivity = usePintech((s) => s.applyRemoteActivity);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    fetchAll()
      .then((data) => {
        if (cancelled) return;
        if (data) hydrate(data);
        else useSeedFallback();
      })
      .catch(() => {
        if (!cancelled) useSeedFallback();
      });

    const sb = getBrowserSupabase();
    if (!sb) return;

    const channel = sb
      .channel("pintech-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "work_item" }, (payload) => {
        const row = payload.new as { id: string; status: WorkStatus };
        applyRemoteWorkItem(row.id, row.status);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_update" }, (payload) => {
        const row = payload.new as { id: string; project_id: string; kind: string; message: string; created_at: string };
        const project = usePintech.getState().projects.find((p) => p.id === row.project_id);
        applyRemoteActivity({
          id: row.id,
          projectId: row.project_id,
          projectName: project?.name ?? "",
          authorId: "",
          authorName: "Field update",
          kind: row.kind as never,
          message: row.message,
          createdAt: row.created_at,
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [hydrate, useSeedFallback, applyRemoteWorkItem, applyRemoteActivity]);

  return null;
}
