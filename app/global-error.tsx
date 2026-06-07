"use client";

// Catches errors thrown in the root layout itself. Must render its own <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f5f7fa", color: "#16283c", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ color: "#0f807c", fontWeight: 700, fontSize: 15 }}>Pintech ERP</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>The app failed to load</h2>
            <p style={{ fontSize: 14, color: "#4a5a6e", marginTop: 8 }}>Please reload the page. If this persists, contact support.</p>
            {error?.message ? <p style={{ fontSize: 12, color: "#7b8a9c", marginTop: 12, background: "#eef1f5", padding: "8px 12px", borderRadius: 8 }}>{error.message}</p> : null}
            <button onClick={reset} style={{ marginTop: 20, height: 36, padding: "0 16px", background: "#0f807c", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer" }}>Reload</button>
          </div>
        </div>
      </body>
    </html>
  );
}
