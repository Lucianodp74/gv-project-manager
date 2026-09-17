"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STATUS = {
  open: { label: "Da verificare", cls: "amber" },
  decided: { label: "Decisa", cls: "blue" },
  in_progress: { label: "In corso", cls: "blue" },
  closed: { label: "Chiusa", cls: "green" },
};

const fmt = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";
const nameOf = (m) => m?.display_name || m?.name || "—";

export default function ViscontiWeeklyMeetingV5({ data = {} }) {
  const members = data.members || [];
  const projects = data.projects || [];
  const tasks = (data.tasks || []).filter(t => t.workflow_status !== "cancelled");
  const [meeting, setMeeting] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [form, setForm] = useState({ title: "", project_id: "", responsible_id: "", due_date: "", discussion: "" });

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name || p.project_name || "—"])), [projects]);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, nameOf(m)])), [members]);
  const assignments = useMemo(() => topics.filter(t => t.topic_type === "activity" && t.responsible_id), [topics]);
  const decisions = useMemo(() => topics.filter(t => t.decision || t.topic_type === "decision"), [topics]);
  const openAssignments = assignments.filter(t => t.status !== "closed");
  const overdueTasks = tasks.filter(t => t.workflow_status !== "done" && t.attention_state === "overdue");
  const blockedTasks = tasks.filter(t => t.workflow_status === "blocked");
  const review = useMemo(() => assignments.filter(t => t.status !== "closed" || (t.due_date && String(t.due_date).slice(0, 10) <= new Date().toISOString().slice(0, 10))), [assignments]);

  const people = useMemo(() => members.map(m => {
    const own = assignments.filter(a => a.responsible_id === m.id);
    const done = own.filter(a => a.status === "closed").length;
    const linked = tasks.filter(t => t.responsible_id === m.id || t.assignee_person_id === m.id);
    return { ...m, own, done, linked, blocked: linked.filter(t => t.workflow_status === "blocked").length, overdue: linked.filter(t => t.workflow_status !== "done" && t.attention_state === "overdue").length };
  }).filter(m => m.own.length || m.linked.length || ["Antonio", "Luciano", "Roberto", "Dario", "Carmelo", "Francesco", "Noemi", "Federica", "Giggi"].some(n => nameOf(m).toLowerCase().includes(n.toLowerCase()))), [members, assignments, tasks]);

  const selected = selectedMember ? people.find(p => p.id === selectedMember) : null;

  async function load() {
    setLoading(true);
    setMessage("");
    const r = await fetch("/api/visconti-work/meetings", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setMeeting(j.meeting); setTopics(j.topics || []); }
    else setMessage(j.error || "Errore nel caricamento della riunione.");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openMeeting() {
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "meeting" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setMeeting(j.meeting); else setMessage(j.error || "Impossibile aprire la riunione.");
    setSaving(false);
  }

  async function addTopic(e) {
    e.preventDefault();
    if (!meeting || !form.title.trim()) return setMessage("Apri una riunione e indica il tema.");
    if (!form.responsible_id) return setMessage("Per un incarico indica il responsabile.");
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      action: "topic", meeting_id: meeting.id, title: form.title.trim(), topic_type: "activity", project_id: form.project_id || null,
      responsible_id: form.responsible_id, due_date: form.due_date || null, discussion: form.discussion || ""
    }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setTopics(x => [...x, j.topic]); setForm({ title: "", project_id: "", responsible_id: "", due_date: "", discussion: "" }); }
    else setMessage(j.error || "Impossibile salvare l'incarico.");
    setSaving(false);
  }

  async function updateTopic(id, patch) {
    const r = await fetch("/api/visconti-work/meetings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setTopics(xs => xs.map(x => x.id === id ? j.topic : x));
    else setMessage(j.error || "Impossibile aggiornare il punto.");
  }

  async function closeMeeting() {
    if (!meeting) return;
    const r = await fetch("/api/visconti-work/meetings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: meeting.id, kind: "meeting", status: "closed" }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setMeeting(j.meeting); setMessage("Riunione chiusa: gli incarichi restano nello storico."); }
    else setMessage(j.error || "Impossibile chiudere la riunione.");
  }

  return <main className="wm5">
    <style>{`
      .wm5{min-height:100vh;background:#f4f6f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.wm5 *{box-sizing:border-box}.wm5-head{background:#fff;border-bottom:1px solid #e1e5eb;padding:14px 34px;display:flex;justify-content:space-between;align-items:center}.wm5-brand{font-size:12px;font-weight:850;color:#172b4d}.wm5-nav{display:flex;gap:5px}.wm5-nav a{padding:8px 11px;border-radius:8px;text-decoration:none;color:#687181;font-size:11px;font-weight:800}.wm5-nav a.active,.wm5-nav a:hover{background:#172b4d;color:#fff}.wm5-main{max-width:1450px;margin:auto;padding:28px 34px 60px}.wm5-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.wm5-kicker{text-transform:uppercase;letter-spacing:.13em;font-size:9px;font-weight:850;color:#7d8797}.wm5-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.wm5-sub{font-size:12px;color:#697487;line-height:1.5;margin:0;max-width:950px}.wm5-btn{border:1px solid #d8dee7;background:#fff;color:#172033;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:800;cursor:pointer}.wm5-primary{background:#172b4d;color:#fff;border-color:#172b4d}.wm5-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px;margin-top:14px}.wm5-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:20px 0 14px}.wm5-kpi{background:#fff;border:1px solid #e1e5eb;border-radius:12px;padding:12px 14px}.wm5-kpi small{display:block;text-transform:uppercase;color:#7d8797;font-size:8px;font-weight:850}.wm5-kpi b{display:block;font-size:22px;margin-top:4px}.wm5-kpi span{font-size:9px;color:#7d8797}.wm5-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,.8fr);gap:14px}.wm5-section-title{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.wm5-section-title h2{font-size:16px;margin:0}.wm5-section-title p{font-size:10px;color:#7d8797;margin:4px 0}.wm5-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.wm5-step{border:1px solid #e1e5eb;border-radius:11px;padding:12px;background:#fff}.wm5-step strong{font-size:10px}.wm5-step div{font-size:9px;color:#6f7988;line-height:1.4;margin-top:5px}.wm5-team{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.wm5-person{border:1px solid #e1e5eb;border-radius:11px;padding:12px;cursor:pointer;background:#fff}.wm5-person.active{border-color:#172b4d;box-shadow:0 0 0 1px #172b4d}.wm5-person b{font-size:11px}.wm5-role{font-size:8px;color:#7d8797;margin-top:3px}.wm5-stats{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;font-size:8px;color:#697487}.wm5-stats strong{color:#172033}.wm5-table{width:100%;border-collapse:collapse}.wm5-table th{text-align:left;text-transform:uppercase;font-size:8px;color:#8992a0;padding:8px;border-bottom:1px solid #e5e8ed}.wm5-table td{padding:9px 8px;border-bottom:1px solid #eef0f3;font-size:9px;vertical-align:top}.wm5-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:850}.wm5-amber{background:#fff4dc;color:#986400}.wm5-blue{background:#edf3ff;color:#315ba7}.wm5-green{background:#eaf8f1;color:#18794e}.wm5-red{background:#fff0ef;color:#b23c36}.wm5-muted{color:#7d8797;font-size:9px}.wm5-form{background:#f7f8fa;border:1px solid #e2e6ec;border-radius:12px;padding:14px}.wm5-formgrid{display:grid;grid-template-columns:1.5fr 1fr 1fr 145px;gap:8px}.wm5-input,.wm5-select,.wm5-textarea{width:100%;border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:9px 10px;font-size:10px;color:#172033}.wm5-textarea{min-height:45px}.wm5-full{grid-column:1/-1}.wm5-actions{display:flex;gap:6px;justify-content:flex-end}.wm5-alert{margin-top:10px;padding:9px;border-radius:9px;background:#edf3ff;color:#315ba7;font-size:9px;font-weight:750}.wm5-empty{padding:20px;text-align:center;color:#7d8797;font-size:10px;border:1px dashed #dce1e8;border-radius:10px}.wm5-detail{margin-top:10px;padding:12px;background:#f7f8fa;border-radius:10px;font-size:9px}.wm5-detail b{font-size:10px}@media(max-width:1100px){.wm5-kpis{grid-template-columns:repeat(3,1fr)}.wm5-grid{grid-template-columns:1fr}.wm5-flow{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.wm5-head{padding:13px 16px}.wm5-main{padding:20px 14px}.wm5-nav{display:none}.wm5-top{flex-direction:column;align-items:flex-start}.wm5-title{font-size:25px}.wm5-kpis{grid-template-columns:1fr 1fr}.wm5-flow,.wm5-team,.wm5-formgrid{grid-template-columns:1fr}.wm5-full{grid-column:auto}.wm5-table{display:block;overflow:auto;white-space:nowrap}}
    `}</style>

    <header className="wm5-head"><div className="wm5-brand">GRUPPO VISCONTI · WORK</div><nav className="wm5-nav"><Link href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link className="active" href="/visconti-work/meetings">Riunioni</Link><Link href="/visconti-work/connection">Connessioni</Link></nav></header>

    <section className="wm5-main">
      <div className="wm5-top"><div><div className="wm5-kicker">Riunione settimanale · regia del lavoro</div><h1 className="wm5-title">Dal lunedì alla verifica del lunedì successivo</h1><p className="wm5-sub">La riunione non è solo un verbale: qui si decide cosa fare, chi lo fa, entro quando e cosa deve essere verificato la settimana successiva.</p></div><div className="wm5-actions"><button className="wm5-btn wm5-primary" onClick={openMeeting} disabled={saving}>{meeting ? "Riunione attiva" : "Apri riunione"}</button>{meeting?.status !== "closed" && <button className="wm5-btn" onClick={closeMeeting}>Chiudi e archivia</button>}</div></div>

      <div className="wm5-kpis">
        <div className="wm5-kpi"><small>Incarichi aperti</small><b>{openAssignments.length}</b><span>da portare avanti</span></div>
        <div className="wm5-kpi"><small>Da verificare</small><b>{review.length}</b><span>prossimo lunedì</span></div>
        <div className="wm5-kpi"><small>Decisioni</small><b>{decisions.length}</b><span>registrate</span></div>
        <div className="wm5-kpi"><small>Bloccati</small><b>{blockedTasks.length}</b><span>richiedono intervento</span></div>
        <div className="wm5-kpi"><small>Scaduti</small><b>{overdueTasks.length}</b><span>attività aperte</span></div>
        <div className="wm5-kpi"><small>Riunione</small><b>{meeting ? fmt(meeting.meeting_date) : "—"}</b><span>{meeting?.status === "closed" ? "archiviata" : "in corso"}</span></div>
      </div>

      <section className="wm5-card"><div className="wm5-section-title"><div><h2>1 · Ciclo della riunione</h2><p>Una sola sequenza: verifica → decisione → incarico → controllo.</p></div></div><div className="wm5-flow"><div className="wm5-step"><strong>VERIFICA</strong><div>Si controllano gli incarichi della settimana precedente, scadenze, blocchi e problemi.</div></div><div className="wm5-step"><strong>DECISIONE</strong><div>Per ogni problema si registra cosa è stato deciso e quale progetto riguarda.</div></div><div className="wm5-step"><strong>INCARICO</strong><div>Si assegna un'attività a una persona, con progetto e scadenza.</div></div><div className="wm5-step"><strong>PROSSIMO LUNEDÌ</strong><div>Si verifica se è completata, in corso, bloccata o da riassegnare.</div></div></div></section>

      <section className="wm5-card"><div className="wm5-section-title"><div><h2>2 · Verifica della settimana precedente</h2><p>Qui emerge subito cosa richiede attenzione.</p></div></div>{review.length ? <table className="wm5-table"><thead><tr><th>Incarico</th><th>Progetto</th><th>Responsabile</th><th>Scadenza</th><th>Stato</th></tr></thead><tbody>{review.map(t => { const s=STATUS[t.status]||STATUS.open; return <tr key={t.id}><td><b>{t.title}</b>{t.discussion&&<div className="wm5-muted">{t.discussion}</div>}</td><td>{projectMap.get(t.project_id)||"—"}</td><td>{memberMap.get(t.responsible_id)||"—"}</td><td>{fmt(t.due_date)}</td><td><span className={`wm5-badge wm5-${s.cls}`}>{s.label}</span></td></tr>; })}</tbody></table> : <div className="wm5-empty">Nessun incarico da verificare.</div>}</section>

      <div className="wm5-grid">
        <div>
          <section className="wm5-card"><div className="wm5-section-title"><div><h2>3 · Squadra</h2><p>Clicca una persona per vedere il carico e la storia operativa disponibile.</p></div></div><div className="wm5-team">{people.map(p => { const total=p.own.length, done=p.done; return <div key={p.id} className={`wm5-person ${selectedMember===p.id?"active":""}`} onClick={()=>setSelectedMember(selectedMember===p.id?"":p.id)}><b>{nameOf(p)}</b><div className="wm5-role">{p.role || p.job_title || "Collaboratore"}</div><div className="wm5-stats"><span>Incarichi <strong>{total}</strong></span><span>Chiusi <strong>{done}</strong></span><span>Attività <strong>{p.linked.length}</strong></span>{p.blocked>0&&<span className="wm5-red">Bloccate <strong>{p.blocked}</strong></span>}{p.overdue>0&&<span className="wm5-red">Scadute <strong>{p.overdue}</strong></span>}</div></div>})}</div>{selected&&<div className="wm5-detail"><b>{nameOf(selected)}</b>{selected.own.length?<ul>{selected.own.map(a=><li key={a.id}>{a.title} · {STATUS[a.status]?.label||a.status} · {fmt(a.due_date)}</li>)}</ul>:<div className="wm5-muted">Nessun incarico della riunione.</div>}</div>}</section>

          <section className="wm5-card"><div className="wm5-section-title"><div><h2>4 · Assegnazione del lavoro</h2><p>Gli incarichi creati qui entrano nel ciclo della riunione e restano nello storico.</p></div></div><form className="wm5-form" onSubmit={addTopic}><div className="wm5-formgrid"><input className="wm5-input" placeholder="Cosa deve essere fatto?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="wm5-select" value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Progetto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name||p.project_name||"—"}</option>)}</select><select className="wm5-select" value={form.responsible_id} onChange={e=>setForm({...form,responsible_id:e.target.value})}><option value="">Responsabile</option>{members.map(m=><option key={m.id} value={m.id}>{nameOf(m)}</option>)}</select><input className="wm5-input" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/><textarea className="wm5-textarea wm5-full" placeholder="Nota / risultato atteso" value={form.discussion} onChange={e=>setForm({...form,discussion:e.target.value})}/></div><div className="wm5-actions" style={{marginTop:8}}><button className="wm5-btn wm5-primary" type="submit" disabled={!meeting||saving}>Assegna attività</button></div></form>{!meeting&&<div className="wm5-alert">Prima apri la riunione della settimana.</div>}</section>
        </div>

        <aside>
          <section className="wm5-card"><div className="wm5-section-title"><div><h2>5 · Decisioni prese</h2><p>Le decisioni restano consultabili.</p></div></div>{decisions.length?<div>{decisions.map(d=><div className="wm5-detail" key={d.id}><b>{d.title}</b><div>{d.decision||"Decisione registrata"}</div><div className="wm5-muted">{projectMap.get(d.project_id)||"Nessun progetto"} · {memberMap.get(d.responsible_id)||"Nessun responsabile"}</div></div>)}</div>:<div className="wm5-empty">Nessuna decisione registrata.</div>}</section>
          <section className="wm5-card"><div className="wm5-section-title"><div><h2>6 · Collegamenti operativi</h2><p>La riunione porta direttamente alle altre aree.</p></div></div><div className="wm5-reviewitem"><Link href="/visconti-work/tasks" style={{textDecoration:"none",color:"inherit"}}><b>Attività →</b><div className="wm5-muted">{tasks.length} attività presenti nel controllo operativo.</div></Link></div><div className="wm5-reviewitem" style={{marginTop:8}}><Link href="/visconti-work/projects" style={{textDecoration:"none",color:"inherit"}}><b>Progetti →</b><div className="wm5-muted">Apri il progetto collegato all'incarico.</div></Link></div><div className="wm5-reviewitem" style={{marginTop:8}}><Link href="/visconti-work/connection" style={{textDecoration:"none",color:"inherit"}}><b>Connessioni →</b><div className="wm5-muted">Per temi Terna, PTO, iter e scadenze di connessione.</div></Link></div></section>
        </aside>
      </div>
      {loading&&<div className="wm5-alert">Caricamento riunione…</div>}{message&&<div className="wm5-alert">{message}</div>}
    </section>
  </main>;
}
