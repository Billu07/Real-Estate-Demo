"use client";

import * as React from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Field, inputClass } from "@/components/modal";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const sb = getBrowserSupabase();
    if (!sb) {
      setError("Authentication is not configured.");
      return;
    }
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
    // On success, AuthProvider detects the session and redirects.
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-navy-900 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-display text-[17px] font-bold text-white">P</span>
          <span className="font-display text-[17px] font-bold tracking-tight text-white">Pintech<span className="text-teal-400"> ERP</span></span>
        </div>
        <div className="max-w-sm">
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-white">Construction control, from groundwork to handover.</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-navy-200">Live progress from project to unit, contractor billing held to verified work, and a command center that sees everything.</p>
        </div>
        <p className="text-[12.5px] text-navy-300">NRD Projects · Pintech ERP</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-display text-[17px] font-bold text-white">P</span>
            <span className="font-display text-[17px] font-bold tracking-tight text-ink">Pintech<span className="text-teal-600"> ERP</span></span>
          </div>

          <h1 className="font-display text-[22px] font-bold tracking-tight text-ink">Sign in</h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nrdprojects.com" className={inputClass} required />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required />
            </Field>

            {error ? <p className="rounded-lg bg-[var(--color-status-alert-bg)] px-3 py-2 text-[12.5px] text-[var(--color-status-alert)]">{error}</p> : null}

            <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in…" : "Sign in"}</Button>
          </form>

          <p className="mt-6 text-[12px] text-ink-faint">Accounts are provisioned by your administrator. Contact the Owner to request access.</p>
        </div>
      </div>
    </div>
  );
}
