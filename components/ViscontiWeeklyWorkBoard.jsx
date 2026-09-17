"use client";

import { useMemo, useState } from "react";

const fmt = (v) => v ? new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString("it-IT") : "—";
const nameOf = (m) => m?.display_name || m?.name || "—";
const statusLabel = { todo:"Da fare", in_progress:"In corso", blocked:"Bloccata", done:"Completata", cancelled:"Annullata" };
const priorityLabel = { low:"Bassa", normal:"Normale", high:"Alta", urgent:"Urgente" };

function weekStart(date = new Date()) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d;
}
function iso(d) { return d.toISOString().slice(0,10); }
function addDays(d,n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function ViscontiWeeklyWorkBoard({ tasks = [], members = [], projects = [] }) {
  const [anchor, setAnchor] = useState(() => weekStart());
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const start = anchor; const end = addDays(start, 6);
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name || p.project_name || "—"])), [projects]);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, nameOf(m)])), [members]);

  const visible = useMemo(() => tasks.filter(t => {
    if (t.workflow_status === "cancelled") return false;
    if (!t.due_date) return false;
    const d = String(t.due_date).slice(0,10);
    if (d < iso(start) || d > iso(end)) return false;
    if (person && (t.responsible_id || t.assignee_person_id) !== person) return false;
    if (status && t.workflow_status !== status) return false;
    return true;
  }).sort((a,b) => String(a.due_date).localeCompare(String(b.due_date))), [tasks,start,end,person,status]);

  const stats = useMemo(() => ({ total:visible.length, open:visible.filter(t=>t.workflow_status!=="done").length, done:visible.filter(t=>t.workflow_status==="done").length, blocked:visible.filter(t=>t.workflow_status==="blocked").length }), [visible]);
  const people = useMemo(() => members.map(m => {
    const mine = visible.filter(t => (t.responsible_id || t.assignee_person_id) === m.id);
    return {...m, count:mine.length, open:mine.filter(t=>t.workflow_status!=="done").length, done:mine.filter(t=>t.workflow_status==="done").length, blocked:mine.filter(t=>t.workflow_status==="blocked").length};
  }).filter(p => p.count || !person), [members,visible,person]);

  async function updateTask(id, patch) {
    setMessage("");
    const r = await fetch("/api/visconti-work/tasks", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,...patch}) });
    const j = await r.json().catch(()=>({}));
    setMessage(r.ok ? "Attività aggiornata." : (j.error || "Impossibile aggiornare l'attività."));
    if (r.ok) window.location.reload();
  }

  return <main className="vwwb"><style>{`
    .vwwb{min-height:100vh;background:#f4f6f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:28px 34px 60px}.vwwb *{box-sizing:border-box}.vwwb-wrap{max-width:1450px;margin:auto}.vwwb-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.vwwb-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.14em;font-weight:850;color:#7d8797}.vwwb h1{font-size:30px;letter-spacing:-.04em;margin:5px 0}.vwwb-sub{font-size:12px;color:#697487;line-height:1.5;margin:0;max-width:900px}.vwwb-nav{display:flex;gap:6px;flex-wrap:wrap}.vwwb-btn,.vwwb-select{border:1px solid #d8dee7;background:#fff;color:#172033;border-radius:9px;padding:9px 11px;font-size:10px;font-weight:800}.vwwb-btn{cursor:pointer}.vwwb-primary{background:#172b4d;color:#fff;border-color:#172b4d}.vwwb-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0 14px}.vwwb-kpi,.vwwb-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px}.vwwb-kpi{padding:13px}.vwwb-kpi small{display:block;font-size:8px;text-transform:uppercase;color:#7d8797;font-weight:850}.vwwb-kpi b{display:block;font-size:23px;margin-top:4px}.vwwb-kpi span{font-size:9px;color:#7d8797}.vwwb-card{padding:18px;margin-top:14px}.vwwb-section{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.vwwb-section h2{font-size:16px;margin:0}.vwwb-section p{font-size:10px;color:#7d8797;margin:4px 0}.vwwb-filters{display:flex;gap:7px;flex-wrap:wrap}.vwwb-people{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vwwb-person{border:1px solid #e1e5eb;border-radius:11px;padding:11px;cursor:pointer;background:#fff}.vwwb-person.active{border-color:#172b4d;box-shadow:0 0 0 1px #172b4d}.vwwb-person b{font-size:11px}.vwwb-role{font-size:8px;color:#7d8797;margin-top:3px}.vwwb-personstats{display:flex;gap:10px;font-size:8px;color:#697487;margin-top:8px}.vwwb-personstats strong{color:#172033}.vwwb-table{width:100%;border-collapse:collapse}.vwwb-table th{text-align:left;text-transform:uppercase;font-size:8px;color:#8992a0;padding:8px;border-bottom:1px solid #e5e8ed}.vwwb-table td{padding:10px 8px;border-bottom:1px solid #eef0f3;font-size:9px;vertical-align:top}.vwwb-title{font-weight:800;color:#172033}.vwwb-meta{font-size:8px;color:#7d8797;margin-top:3px}.vwwb-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:850}.vwwb-open{background:#fff4dc;color:#986400}.vwwb-done{background:#eaf8f1;color:#18794e}.vwwb-blocked{background:#fff0ef;color:#b23c36}.vwwb-action{border:1px solid #d8dee7;background:#fff;border-radius:7px;padding:6px 8px;font-size:8px;font-weight:800;cursor:pointer}.vwwb-empty{padding:24px;text-align:center;border:1px dashed #dce1e8;border-radius:10px;color:#7d8797;font-size:10px}.vwwb-msg{margin-top:10px;padding:9px;border-radius:9px;background:#edf3ff;color:#315ba7;font-size:9px;font-weight:750}@media(max-width:800px){.vwwb{padding:20px 14px 50px}.vwwb-head{flex-direction:column;align-items:flex-start}.vwwb h1{font-size:25px}.vwwb-kpis{grid-template-columns:1fr 1fr}.vwwb-people{grid-template-columns:1fr}.vwwb-table{display:block;overflow:auto;white-space:nowrap}}
  `}</style>
  <div className="vwwb-wrap">
    <div className="vwwb-head"><div><div className="vwwb-kicker">Gruppo Visconti · lavoro della settimana</div><h1>Regia del lavoro</h1><p className="vwwb-sub">Una vista unica degli incarichi con scadenza nella settimana: chi deve fare cosa, su quale progetto, entro quando e cosa è già stato chiuso.</p></div><div className="vwwb-nav"><button className="vwwb-btn" onClick={()=>setAnchor(weekStart(addDays(anchor,-7)))}>← Settimana precedente</button><button className="vwwb-btn vwwb-primary" onClick={()=>setAnchor(weekStart())}>Settimana corrente</button><button className="vwwb-btn" onClick={()=>setAnchor(weekStart(addDays(anchor,7)))}>Settimana successiva →</button></div></div>
    <div className="vwwb-kpis"><div className="vwwb-kpi"><small>Settimana</small><b>{fmt(start)} — {fmt(end)}</b><span>periodo operativo</span></div><div className="vwwb-kpi"><small>Incarichi</small><b>{stats.total}</b><span>con scadenza nella settimana</span></div><div className="vwwb-kpi"><small>Aperti</small><b>{stats.open}</b><span>da portare avanti</span></div><div className="vwwb-kpi"><small>Completati</small><b>{stats.done}</b><span>chiusi</span></div></div>
    <section className="vwwb-card"><div className="vwwb-section"><div><h2>Per collaboratore</h2><p>Seleziona una persona per vedere soltanto il suo lavoro.</p></div><div className="vwwb-filters"><select className="vwwb-select" value={person} onChange={e=>setPerson(e.target.value)}><option value="">Tutta la squadra</option>{members.map(m=><option key={m.id} value={m.id}>{nameOf(m)}</option>)}</select><select className="vwwb-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tutti gli stati</option>{Object.entries(statusLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></div><div className="vwwb-people">{people.map(p=><div key={p.id} className={`vwwb-person ${person===p.id?"active":""}`} onClick={()=>setPerson(person===p.id?"":p.id)}><b>{nameOf(p)}</b><div className="vwwb-role">{p.role || p.job_title || "Collaboratore"}</div><div className="vwwb-personstats"><span>Totale <strong>{p.count}</strong></span><span>Aperti <strong>{p.open}</strong></span><span>Fatti <strong>{p.done}</strong></span><span>Bloccati <strong>{p.blocked}</strong></span></div></div>)}</div></section>
    <section className="vwwb-card"><div className="vwwb-section"><div><h2>Elenco operativo della settimana</h2><p>Le attività usano lo stesso sistema già presente nel portale: non viene creata una seconda anagrafica del lavoro.</p></div></div>{visible.length ? <table className="vwwb-table"><thead><tr><th>Attività</th><th>Progetto</th><th>Responsabile</th><th>Scadenza</th><th>Priorità</th><th>Stato</th><th></th></tr></thead><tbody>{visible.map(t=>{const st=t.workflow_status||"todo";const cls=st==="done"?"vwwb-done":st==="blocked"?"vwwb-blocked":"vwwb-open";return <tr key={t.id}><td><div className="vwwb-title">{t.title}</div><div className="vwwb-meta">{t.category || "generale"}{t.next_action?` · ${t.next_action}`:""}</div></td><td>{projectMap.get(t.project_id)||"—"}</td><td>{memberMap.get(t.responsible_id||t.assignee_person_id)||"—"}</td><td>{fmt(t.due_date)}</td><td>{priorityLabel[t.priority]||t.priority||"Normale"}</td><td><span className={`vwwb-badge ${cls}`}>{statusLabel[st]||st}</span></td><td>{st!=="done"&&st!=="cancelled"&&<button className="vwwb-action" onClick={()=>updateTask(t.id,{workflow_status:"done"})}>Segna completata</button>}</td></tr>})}</tbody></table> : <div className="vwwb-empty">Nessuna attività con scadenza in questa settimana e con i filtri selezionati.</div>}{message&&<div className="vwwb-msg">{message}</div>}</section>
  </div></main>;
}
