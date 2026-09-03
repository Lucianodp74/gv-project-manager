"use client";

import { useState } from "react";

const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

async function request(path, options = {}) {
  const headers = { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Operazione non riuscita (${response.status}).`);
  if (response.status === 204) return [];
  return response.json();
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
      const date = new Date().toISOString().slice(0, 10);
      await request(`projects?id=eq.${encodeURIComponent(projectId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          go_no_go_status: next,
          go_no_go_date: date,
          go_no_go_notes: next === "go" ? "GO registrato dal Control Tower" : "NO-GO registrato dal Control Tower",
          spv_status: next === "go" ? "to_create" : "cancelled",
          connection_transfer_status: next === "go" ? "to_request" : "not_applicable",
          updated_at: new Date().toISOString(),
        }),
      });
      if (next === "go") {
        const titles = ["Costituire società veicolo", "Aprire P.IVA e PEC", "Richiedere voltura della connessione"];
        const existing = await request(`visconti_task_board?project_id=eq.${encodeURIComponent(projectId)}&select=id,title`);
        const existingTitles = new Set(existing.map((task) => task.title));
        const tasks = [
          { title: titles[0], description: "Costituire la SPV del progetto dopo la decisione GO.", category: "general" },
          { title: titles[1], description: "Completare P.IVA, codice fiscale e PEC della SPV.", category: "general" },
          { title: titles[2], description: "Voltura della connessione da Gruppo Visconti Srl alla SPV.", category: "connection" },
        ].filter((task) => !existingTitles.has(task.title)).map((task) => ({
          project_id: projectId,
          title: task.title,
          description: task.description,
          workflow_status: "todo",
          attention_state: "normal",
          priority: "high",
          category: task.category,
          next_action: task.description,
        }));
        if (tasks.length) await request("visconti_task_board", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(tasks) });
      }
      window.location.reload();
    } catch (e) {
      setError(e.message || "Operazione non riuscita.");
      setSaving(false);
    }
  }

  return <div className="vct-decision"><style>{`.vct-decision{display:flex;align-items:center;gap:7px}.vct-btn{border:1px solid #dfe3e9;background:#fff;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}.vct-btn:disabled{opacity:.55;cursor:wait}.vct-go{background:#172b4d;color:#fff;border-color:#172b4d}.vct-no{color:#a33;background:#fff6f5}.vct-error{font-size:9px;color:#b43a34;max-width:150px}`}</style><button className="vct-btn vct-go" disabled={saving} onClick={() => decide("go")}>GO</button><button className="vct-btn vct-no" disabled={saving} onClick={() => decide("no_go")}>NO-GO</button>{error && <span className="vct-error">{error}</span>}</div>;
}
