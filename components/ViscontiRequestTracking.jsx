"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function isRequest(task) {
  const text = `${task.title || ""} ${task.next_action || ""}`.toLowerCase();
  return ["authority", "document", "connection"].includes(task.category) || /(richiest|ricevut|voltura|cdu|p\.?\s*iva|pec|autorizzaz|conferma|terna|istanza|protocollo)/i.test(text);
}
function dateLabel(value) { return value ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—"; }

export default function ViscontiRequestTracking({ tasks = [] }) {
  const router = useRouter();
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const requests = useMemo(() => tasks.filter(isRequest), [tasks]);

  async function mark(task, kind) {
    setSaving(`${task.id}:${kind}`); setError("");
    try {
      const body = { id: task.id };
      if (kind === "done") body.request_done_at = new Date().toISOString();
      if (kind === "received") body.response_received_at = new Date().toISOString();
      const response = await fetch("/api/visconti-work/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Aggiornamento non riuscito");
      router.refresh();
    } catch (e) { setError(e.message || "Aggiornamento non riuscito"); } finally { setSaving(""); }
  }

  if (!requests.length) return null;
  return <section className="vtr-wrap"><style>{`.vtr-wrap{margin-top:16px;background:#fff;border:1px solid #e7e9ee;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vtr-head{padding:15px 18px;border-bottom:1px solid #eef0f3}.vtr-title{font-size:14px;font-weight:800}.vtr-sub{font-size:11px;color:#7d8594;margin-top:3px}.vtr-row{display:grid;grid-template-columns:minmax(220px,1fr) 150px 150px 120px;gap:12px;align-items:center;padding:12px 18px;border-top:1px solid #eef0f3}.vtr-name{font-size:12px;font-weight:750}.vtr-project{font-size:10px;color:#7d8594;margin-top:3px}.vtr-actions{display:flex;gap:6px}.vtr-btn{border:1px solid #dfe3e9;background:#fff;border-radius:8px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}.vtr-btn:disabled{opacity:.5;cursor:wait}.vtr-done{background:#f1f5ff;color:#315ca8}.vtr-received{background:#edf9f2;color:#18794e}.vtr-state{font-size:10px;font-weight:800}.vtr-wait{color:#996400}.vtr-ok{color:#18794e}.vtr-error{padding:10px 18px;background:#fff0ef;color:#b43a34;font-size:10px}@media(max-width:850px){.vtr-row{grid-template-columns:1fr}.vtr-actions{flex-wrap:wrap}}`}</style><div className="vtr-head"><div className="vtr-title">Richieste · FATTO / RICEVUTO</div><div className="vtr-sub">Una richiesta è chiusa solo quando è stata fatta e la risposta è stata realmente ricevuta.</div></div>{requests.map(task => { const done=Boolean(task.request_done_at || task.action_done_at); const received=Boolean(task.response_received_at); return <div className="vtr-row" key={task.id}><div><div className="vtr-name">{task.title}</div><div className="vtr-project">{task.project_name || "Progetto non collegato"}{task.due_date ? ` · scadenza ${task.due_date}` : ""}</div></div><div className="vtr-actions"><button className="vtr-btn vtr-done" disabled={saving===`${task.id}:done` || done} onClick={()=>mark(task,"done")}>{done ? `✓ FATTO ${dateLabel(task.request_done_at || task.action_done_at)}` : "FATTO"}</button></div><div className="vtr-actions"><button className="vtr-btn vtr-received" disabled={saving===`${task.id}:received` || received || !done} onClick={()=>mark(task,"received")}>{received ? `✓ RICEVUTO ${dateLabel(task.response_received_at)}` : "RICEVUTO"}</button></div><div className={`vtr-state ${received ? "vtr-ok" : "vtr-wait"}`}>{received ? "Completata" : done ? "In attesa" : "Da fare"}</div></div>})}{error&&<div className="vtr-error">{error}</div>}</section>;
}
