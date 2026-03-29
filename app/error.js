"use client";

/**
 * FIX #2 — SAFETY NET
 *
 * Next.js App Router error boundary. If ANY unhandled error
 * reaches the route level, this component renders instead of
 * a blank page or 404. The user sees a clear error + retry button.
 */
export default function Error({ error, reset }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0c0f14",
        color: "#e8ecf4",
        fontFamily: "'DM Sans', sans-serif",
        textAlign: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: "rgba(239,68,68,0.12)",
          color: "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          fontSize: 28,
        }}
      >
        ⚠
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
        Errore di caricamento
      </h2>
      <p style={{ color: "#7a839a", fontSize: 13, maxWidth: 420, lineHeight: 1.6, marginBottom: 8 }}>
        Si è verificato un errore durante il caricamento dell&apos;applicazione. 
        Verifica la connessione internet e le variabili d&apos;ambiente Supabase.
      </p>
      <pre
        style={{
          background: "#141820",
          border: "1px solid #242a38",
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 11,
          color: "#ef4444",
          maxWidth: 480,
          overflow: "auto",
          marginBottom: 20,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {error?.message || "Unknown error"}
      </pre>
      <button
        onClick={reset}
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Riprova
      </button>
    </div>
  );
}
