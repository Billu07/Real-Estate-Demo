"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { usePintech } from "@/lib/store";
import type { Project, UpdateKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const KINDS: { value: UpdateKind; label: string }[] = [
  { value: "progress", label: "Progress" },
  { value: "issue", label: "Issue" },
  { value: "sale", label: "Sale" },
  { value: "billing", label: "Billing" },
];

export function UpdateComposer({ project }: { project: Project }) {
  const post = usePintech((s) => s.postUpdate);
  const user = usePintech((s) => s.currentUser());
  const [kind, setKind] = React.useState<UpdateKind>("progress");
  const [message, setMessage] = React.useState("");

  const submit = () => {
    if (!message.trim()) return;
    post({
      projectId: project.id,
      projectName: project.name,
      authorId: user.id,
      authorName: user.name,
      kind,
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Post a field update, e.g. 4th floor ceiling cluster ongoing"
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-teal-400"
        />
        <button onClick={submit} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 text-[13px] font-medium text-white hover:bg-teal-700">
          <Send className="h-3.5 w-3.5" /> Post
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
              kind === k.value ? "bg-navy-800 text-white" : "bg-surface-muted text-ink-faint hover:text-ink-soft",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
