"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during SSR and the first client render, true thereafter.
 * Use to gate time-relative or otherwise non-deterministic output so the
 * server-rendered HTML and the first client render always match.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
