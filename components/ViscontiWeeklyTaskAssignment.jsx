"use client";

import { useMemo, useState } from "react";

const PEOPLE = ["Dario", "Roberto", "Carmelo", "Francesco"];

export default function ViscontiWeeklyTaskAssignment({ members = [], projects = [] }) {
  const team = useMemo(() => members.filter(m => PEOPLE.some(p => String(m.display_name || m.name || "").toLowerCase().includes(p.toLowerCase()))), [members]);
  const [form, setForm] = useState({ title: "", description: "", responsible_id: "", project_id: "", due_date: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function change(e) { setForm(x => ({ ...x, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.responsible_id) { setMessage("Indica incarico e responsabile."); return; }
    setSaving(true); setMessage("");
    try {
      const r = await fetch("/api/visconti-work/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          responsible_id: form.responsible_id,
          project_id: form.project_id || null,
          due_date: form.due_date || null,
          priority: form.priority,
          workflow_status: "todo",
          category: "internal",
          next_action: form.description.trim() || null
        })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Impossibile creare l'incarico.");
      setForm({ title: "", description: "", responsible_id: "", project_id: "", due_date: "", priority: "normal" });
      setMessage("Incarico creato nelle Attività.");
    } catch (err) { setMessage(err.message); }
    finally { setSaving(false); }
  }

  return <section className="wm-task-assignment"><style>{`.wm-task-assignment{max-width:1450px;margin:0 auto;padding:0 34px 14px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.wm-task-assignment-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.wm-task-assignment-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;color:#7d8797;font-weight:850}.wm-task-assignment-title{font-size:17px;font-weight:900;margin-top:4px}.wm-task-assignment-sub{font-size:10px;color:#707b8b;margin:5px 0 14px}.wm-task-assignment-grid{display:grid;grid-template-columns:1.7fr 1.1fr 1fr 1fr 145px 105px;gap:8px}.wm-task-assignment input,.wm-task-assignment select{width:100%;border:1px solid #d8dee7;border-radius:8px;padding:9px 10px;font-size:10px;background:#fff;color:#172033}.wm-task-assignment textarea{grid-column:1/-1;width:100%;min-height:48px;border:1px solid #d8dee7;border-radius:8px;padding:9px 10px;font-size:10px;resize:vertical}.wm-task-assignment button{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:8px;padding:9px 11px;font-size:10px;font-weight:850;cursor:pointer}.wm-task-assignment button:disabled{opacity:.6}.wm-task-assignment-message{margin-top:8px;font-size:9px;color:#596577;font-weight:750}@media(max-width:1000px){.wm-task-assignment-grid{grid-template-columns:1fr 1fr 1fr}}@media(max-width:650px){.wm-task-assignment{padding:0 14px 12px}.wm-task-assignment-grid{grid-template-columns:1fr}.wm-task-assignment textarea{grid-column:auto}}`}</style><div className="wm-task-assignment-card"><div className="wm-task-assignment-kicker">Vincenzo · incarico settimanale</div><div className="wm-task-assignment-title">Assegna un nuovo lavoro</div><div className="wm-task-assignment-sub">Il nuovo incarico entra direttamente in Attività: sarà verificato il prossimo lunedì. Nessun archivio parallelo.</div><form onSubmit={submit}><div className="wm-task-assignment-grid"><input name="title" value={form.title} onChange={change} placeholder="Cosa deve essere fatto?"/><select name="responsible_id" value={form.responsible_id} onChange={change}><option value="">Responsabile</option>{team.map(m=><option key={m.id} value={m.id}>{m.display_name || m.name}</option>)}</select><select name="project_id" value={form.project_id} onChange={change}><option value="">Progetto (opzionale)</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name || p.project_name}</option>)}</select><input type="date" name="due_date" value={form.due_date} onChange={change} title="Scadenza"/><select name="priority" value={form.priority} onChange={change}><option value="normal">Priorità normale</option><option value="high">Alta</option><option value="urgent">Urgente</option><option value="low">Bassa</option></select><button disabled={saving}>{saving ? "Salvataggio…" : "Assegna"}</button><textarea name="description" value={form.description} onChange={change} placeholder="Risultato atteso / istruzioni per la settimana"/></div></form>{message && <div className="wm-task-assignment-message">{message}</div>}</div></section>;
}
