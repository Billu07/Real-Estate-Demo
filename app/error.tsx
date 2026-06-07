"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <p className="font-display text-[15px] font-bold tracking-tight text-teal-700">Pintech ERP</p>
        <h2 className="mt-3 font-display text-[22px] font-bold tracking-tight text-ink">Something went wrong</h2>
        <p className="mt-2 text-[14px] text-ink-soft">An unexpected error occurred while loading this view. You can retry, or reload the page.</p>
        {error?.message ? <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-left text-[12px] text-ink-faint">{error.message}</p> : null}
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={reset} className="inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700">Try again</button>
          <button onClick={() => (window.location.href = "/")} className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-navy-700 hover:bg-surface-muted">Go home</button>
        </div>
      </div>
    </div>
  );
}
