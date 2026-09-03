"use client";

import { useState } from "react";

async function decideRequest(projectId, decision) {
  const response = await fetch("/api/visconti-control-tower-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, decision }),
    cache: "no-store",
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) throw new Error(data.error || `Operazione non riuscita (${response.status}).`);
  return data;
}

export default function ViscontiControlTowerDecision({ projectId, status = "pending" }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!projectId || status !== "pending") return null;

  async function decide(next) {
    const message = next === "go"
      ? "Confermare GO? Verranno avviati SPV, P.IVA/PEC e voltura della connessione."
      : "Confermare NO-GO? Il progetto verrà fermato senza avviare SPV e voltura.";
    if (!window.confirm(message)) return;
    setSaving(true); setError("");
    try {
      await decideRequest(projectId, next);
      window.location.reload();
    } catch (e) {
      setError(e.message || "Operazione non riuscita.");
      setSaving(false);
    }
  }

  return <div className="vct-decision"><style>{`.vct-decision{display:flex;align-items:center;gap:7px}.vct-btn{border:1px solid #dfe3e9;background:#fff;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}.vct-btn:disabled{opacity:.55;cursor:wait}.vct-go{background:#172b4d;color:#fff;border-color:#172b4d}.vct-no{color:#a33;background:#fff6f5}.vct-error{font-size:9px;color:#b43a34;max-width:190px}`}</style><button className="vct-btn vct-go" disabled={saving} onClick={() => decide("go")}>GO</button><button className="vct-btn vct-no" disabled={saving} onClick={() => decide("no_go")}>NO-GO</button>{error && <span className="vct-error">{error}</span>}</div>;
}
