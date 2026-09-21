"use client";

import { useEffect, useMemo, useState } from "react";

const fmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";
const nameOf = (m) => m?.display_name || m?.name || "—";

export default function ViscontiMeetingActionsEditor({ projects = [], members = [] }) {
  const [meeting, setMeeting] = useState(null);
  const [topics, setTopics] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name || p.project_name || "—"])), [projects]);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, nameOf(m)])), [members]);

  async function load() {
    const r = await fetch("/api/visconti-work/meetings?history=1", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMeeting(j.meeting || null);
      setTopics((j.topics || []).filter(t => t.topic_type === "activity" || t.responsible_id));
    } else setMessage(j.error || "Errore nel caricamento degli incarichi.");
  }

  useEffect(() => { load(); }, []);

  function edit(topic) {
    setEditing(topic.id);
    setDraft({
      title: topic.title || "",
      project_id: topic.project_id || "",
      responsible_id: topic.responsible_id || "",
      due_date: topic.due_date ? String(topic.due_date).slice(0, 10) : "",
      discussion: topic.discussion || "",
      decision: topic.decision || "",
      action_text: topic.action || "",
      status: topic.status || "open",
    });
    setMessage("");
  }

  async function save(id) {
    if (!draft?.title.trim()) return setMessage("L'incarico deve avere un titolo.");
    if (!draft.responsible_id) return setMessage("Indica il responsabile dell'incarico.");
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...draft }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setTopics(xs => xs.map(x => x.id === id ? j.topic : x));
      setEditing(null); setDraft(null); setMessage("Lavoro assegnato modificato e salvato.");
    } else setMessage(j.error || "Impossibile modificare l'incarico.");
    setSaving(false);
  }

  return <section className="vmae">
    <style>{`
      .vmae{max-width:1450px;margin:14px auto 0;padding:0 34px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.vmae-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.vmae-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.vmae-kicker{font-size:8px;text-transform:uppercase;letter-spacing:.13em;font-weight:850;color:#7d8797}.vmae-title{font-size:17px;margin:4px 0}.vmae-sub{font-size:10px;color:#697487;margin:0}.vmae-count{font-size:9px;font-weight:800;color:#315ba7;background:#edf3ff;padding:6px 9px;border-radius:999px}.vmae-list{display:grid;gap:8px}.vmae-row{border:1px solid #e1e5eb;border-radius:10px;padding:11px;background:#fafbfc}.vmae-rowhead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.vmae-name{font-size:10px;font-weight:850}.vmae-meta{font-size:8px;color:#7d8797;margin-top:4px}.vmae-btn{border:1px solid #d8dee7;background:#fff;color:#172033;border-radius:8px;padding:7px 10px;font-size:9px;font-weight:800;cursor:pointer}.vmae-primary{background:#172b4d;color:#fff;border-color:#172b4d}.vmae-edit{margin-top:10px;padding:11px;background:#f7f8fa;border:1px solid #e2e6ec;border-radius:10px}.vmae-grid{display:grid;grid-template-columns:2fr 1fr 1fr 150px;gap:7px}.vmae-input,.vmae-select,.vmae-textarea{width:100%;border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:8px 9px;font-size:9px;color:#172033}.vmae-textarea{min-height:65px;resize:vertical}.vmae-wide{grid-column:1/-1}.vmae-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}.vmae-msg{margin-top:9px;padding:8px 10px;background:#edf3ff;border-radius:8px;color:#315ba7;font-size:9px;font-weight:750}@media(max-width:850px){.vmae{padding:0 14px}.vmae-grid{grid-template-columns:1fr}.vmae-wide{grid-column:auto}.vmae-rowhead{flex-direction:column}.vmae-btn{width:100%}}
    `}</style>
    <div className="vmae-card">
      <div className="vmae-head"><div><div className="vmae-kicker">Regia operativa</div><h2 className="vmae-title">Lavori assegnati</h2><p className="vmae-sub">Modifica incarico, progetto, responsabile, scadenza e contenuti della discussione.</p></div><div className="vmae-count">{topics.length} incarichi</div></div>
      {!topics.length ? <div className="vmae-meta">Nessun lavoro assegnato nella riunione.</div> : <div className="vmae-list">{topics.map(topic => <article className="vmae-row" key={topic.id}>
        <div className="vmae-rowhead"><div><div className="vmae-name">{topic.title || "Incarico senza titolo"}</div><div className="vmae-meta">{projectMap.get(topic.project_id) || "Nessun progetto"} · {memberMap.get(topic.responsible_id) || "Nessun responsabile"}{topic.due_date ? ` · scadenza ${fmt(topic.due_date)}` : ""} · {topic.status || "open"}</div></div><button className="vmae-btn" onClick={() => edit(topic)}>{editing === topic.id ? "Modifica in corso" : "MODIFICA"}</button></div>
        {editing === topic.id && draft && <div className="vmae-edit">
          <div className="vmae-grid">
            <input className="vmae-input" value={draft.title} onChange={e => setDraft({...draft,title:e.target.value})} placeholder="Cosa deve essere fatto?" />
            <select className="vmae-select" value={draft.project_id} onChange={e => setDraft({...draft,project_id:e.target.value})}><option value="">Progetto</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name || p.project_name || "—"}</option>)}</select>
            <select className="vmae-select" value={draft.responsible_id} onChange={e => setDraft({...draft,responsible_id:e.target.value})}><option value="">Responsabile</option>{members.map(m => <option key={m.id} value={m.id}>{nameOf(m)}</option>)}</select>
            <input className="vmae-input" type="date" value={draft.due_date} onChange={e => setDraft({...draft,due_date:e.target.value})} />
            <textarea className="vmae-textarea vmae-wide" value={draft.discussion} onChange={e => setDraft({...draft,discussion:e.target.value})} placeholder="Discussione / interventi" />
            <textarea className="vmae-textarea" value={draft.decision} onChange={e => setDraft({...draft,decision:e.target.value})} placeholder="Decisione" />
            <textarea className="vmae-textarea" value={draft.action_text} onChange={e => setDraft({...draft,action_text:e.target.value})} placeholder="Azione conseguente" />
            <select className="vmae-select" value={draft.status} onChange={e => setDraft({...draft,status:e.target.value})}><option value="open">Da verificare</option><option value="in_progress">In corso</option><option value="decided">Decisa</option><option value="closed">Chiusa</option></select>
          </div>
          <div className="vmae-actions"><button className="vmae-btn" onClick={() => {setEditing(null);setDraft(null);}}>Annulla</button><button className="vmae-btn vmae-primary" onClick={() => save(topic.id)} disabled={saving}>{saving ? "Salvataggio…" : "Salva modifiche"}</button></div>
        </div>}
      </article>)}</div>}
      {message && <div className="vmae-msg">{message}</div>}
    </div>
  </section>;
}
