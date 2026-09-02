"use client";

import React, { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getRows(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Database error ${response.status}`);
  return response.json();
}

const stageLabel = { opportunity: "Opportunità", connection: "Connessione", go_decision: "GO / NO-GO", development: "Sviluppo", presentation: "Presentazione", authorization: "Autorizzazione", commercial: "Commerciale", authorized: "Autorizzato", closed: "Chiuso" };
const statusLabel = { todo: "Da fare", in_progress: "In corso", waiting: "In attesa", blocked: "Bloccata", done: "Completata", cancelled: "Annullata" };
const specialistStatus = { planned: "Da avviare", active: "In corso", waiting: "In attesa", done: "Completato", cancelled: "Annullato" };
function Badge({ children, tone = "neutral" }) { return <span className={`pd-badge pd-${tone}`}>{children}</span>; }
function fmt(v) { return v ? new Date(`${v}T00:00:00`).toLocaleDateString("it-IT") : "—"; }
function attentionTone(v) { return ["overdue", "urgent"].includes(v) ? "red" : v === "blocked" ? "amber" : "blue"; }

export default function ViscontiProjectDetailV2() {
  const [project, setProject] = useState(null), [tasks, setTasks] = useState([]), [connections, setConnections] = useState([]);
  const [specialists, setSpecialists] = useState([]), [authorities, setAuthorities] = useState([]), [decisions, setDecisions] = useState([]), [assets, setAssets] = useState([]), [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [tab, setTab] = useState("overview"), [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("id");
    async function load() {
      try {
        if (!projectId) { setError("Manca l'identificativo del progetto. Apri la scheda da un progetto della Control Tower."); return; }
        const q = encodeURIComponent(projectId);
        const [p, t, c, s, a, d, x, m] = await Promise.all([
          getRows(`projects?id=eq.${q}&select=*`),
          getRows(`visconti_task_board?project_id=eq.${q}&select=*&order=due_date.asc.nullslast`),
          getRows(`connection_workflow_overview?project_id=eq.${q}&select=*&order=practice_code.asc`),
          getRows(`specialist_assignments?project_id=eq.${q}&select=*&order=due_date.asc.nullslast`),
          getRows(`authority_items?project_id=eq.${q}&select=*&order=response_deadline.asc.nullslast`),
          getRows(`project_decisions?project_id=eq.${q}&select=*&order=created_at.desc`),
          getRows(`project_assets?project_id=eq.${q}&select=*&order=created_at.desc`),
          getRows(`team_members?active=eq.true&select=id,display_name,role_name`),
        ]);
        setProject(p[0] || null); setTasks(t); setConnections(c); setSpecialists(s); setAuthorities(a); setDecisions(d); setAssets(x); setMembers(m);
        if (c[0]) setSelectedConnection(c[0]);
        if (!p[0]) setError("Progetto non trovato.");
      } catch (e) { setError("Impossibile caricare i dati operativi. Verifica la configurazione Supabase."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const memberName = (id) => members.find(m => m.id === id)?.display_name || "—";
  const openTasks = useMemo(() => tasks.filter(t => !["done", "cancelled"].includes(t.workflow_status)), [tasks]);
  const urgent = openTasks.filter(t => ["overdue", "urgent", "blocked"].includes(t.attention_state));
  const blocked = openTasks.filter(t => t.workflow_status === "blocked").length;
  const openSpecialists = specialists.filter(s => !["done", "cancelled"].includes(s.status)).length;
  const openAuthorities = authorities.filter(a => !["closed", "resolved", "cancelled"].includes(a.status)).length;
  const taskHref = (taskId) => `/visconti-work/tasks?task=${encodeURIComponent(taskId)}&project=${encodeURIComponent(project.id)}`;

  if (loading) return <main className="pd-shell"><div className="pd-loading">Caricamento scheda progetto…</div></main>;
  if (error || !project) return <main className="pd-shell"><div className="pd-error"><b>{error || "Progetto non disponibile"}</b><a href="/visconti-work">← Torna alla Control Tower</a></div></main>;

  return <main className="pd-shell"><style>{`.pd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.pd-top{height:68px;background:#fff;border-bottom:1px solid #e7e9ee;display:flex;align-items:center;padding:0 34px}.pd-brand{font-weight:800}.pd-back{color:#687181;text-decoration:none;font-size:12px;display:block;margin-bottom:4px}.pd-main{max-width:1400px;margin:auto;padding:30px 34px 50px}.pd-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.pd-kicker{font-size:11px;color:#8a92a2;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.pd-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.pd-sub{color:#737c8c;font-size:13px;margin:0}.pd-actions{display:flex;gap:7px}.pd-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:750;text-decoration:none;color:#172033}.pd-primary{background:#172b4d;color:#fff;border-color:#172b4d}.pd-tabs{display:flex;gap:5px;margin:22px 0 16px;background:#eef0f4;padding:4px;border-radius:11px;width:max-content}.pd-tabs button{border:0;background:transparent;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:750;color:#697282}.pd-tabs .on{background:#fff;color:#172033}.pd-grid{display:grid;grid-template-columns:1.6fr .75fr;gap:18px}.pd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:19px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.pd-card+.pd-card{margin-top:18px}.pd-title2{font-size:14px;font-weight:800;margin-bottom:14px}.pd-meta{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.pd-box{background:#f8f9fb;border-radius:10px;padding:11px}.pd-box small{display:block;color:#8a92a1;text-transform:uppercase;font-size:9px}.pd-box strong{display:block;font-size:12px;margin-top:5px}.pd-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-bottom:18px}.pd-kpi{background:#fff;border:1px solid #e7e9ee;border-radius:12px;padding:13px}.pd-kpi small{display:block;color:#8a92a1;font-size:9px;text-transform:uppercase}.pd-kpi b{display:block;font-size:21px;margin-top:5px}.pd-row{border-top:1px solid #eef0f3;padding:12px 0;display:grid;grid-template-columns:1.5fr .8fr .7fr .8fr;gap:10px;align-items:center;font-size:11px}.pd-row:first-of-type{border-top:0}.pd-task{display:grid;grid-template-columns:1.5fr .8fr .7fr .8fr;gap:10px;align-items:center;text-decoration:none;color:inherit;border-top:1px solid #eef0f3;padding:12px 0}.pd-task:first-of-type{border-top:0}.pd-task:hover{background:#fafbfc}.pd-muted{color:#7c8493}.pd-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.pd-neutral{background:#f0f2f5;color:#626b7a}.pd-green{background:#eaf8f1;color:#18794e}.pd-amber{background:#fff5df;color:#996400}.pd-red{background:#fff0ef;color:#b43a34}.pd-blue{background:#edf3ff;color:#3d61ad}.pd-alert{border:1px solid #f1dfb8;background:#fff9ee;border-radius:11px;padding:12px;font-size:11px}.pd-conn{border:1px solid #e8ebf0;border-radius:11px;padding:13px;margin-top:9px;cursor:pointer;background:#fff;width:100%;text-align:left}.pd-conn:hover{border-color:#b9c5da}.pd-conn strong{font-size:12px}.pd-conn small{display:block;color:#7c8493;margin-top:4px}.pd-list{display:flex;flex-direction:column;gap:8px}.pd-mini{border:1px solid #eef0f3;border-radius:10px;padding:11px;font-size:11px}.pd-mini b{display:block;margin-bottom:4px}.pd-empty{color:#808897;font-size:12px;padding:10px 0}.pd-loading,.pd-error{max-width:800px;margin:80px auto;padding:30px;background:#fff;border:1px solid #e7e9ee;border-radius:14px}.pd-error a{display:block;margin-top:15px;color:#3d61ad;text-decoration:none;font-size:12px}@media(max-width:1100px){.pd-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:950px){.pd-grid{grid-template-columns:1fr}.pd-meta{grid-template-columns:repeat(2,1fr)}.pd-main{padding:22px 18px}}@media(max-width:620px){.pd-head{display:block}.pd-actions{margin-top:14px}.pd-row,.pd-task{grid-template-columns:1fr 1fr}.pd-row div:nth-child(4),.pd-task div:nth-child(4){grid-column:span 2}.pd-kpis{grid-template-columns:repeat(2,1fr)}}`}</style>
    <header className="pd-top"><div><a className="pd-back" href="/visconti-work">← Control Tower</a><div className="pd-brand">GRUPPO VISCONTI · WORK V2</div></div></header>
    <section className="pd-main">
      <div className="pd-head"><div><div className="pd-kicker">Centro operativo del progetto</div><h1 className="pd-title">{project.name}</h1><p className="pd-sub">{stageLabel[project.project_stage] || project.project_stage} · {project.region || "—"} · {project.mw || 0} MW</p></div><div className="pd-actions"><a className="pd-btn" href="/visconti-work/tasks">Attività</a>{connections.length > 0 && <a className="pd-btn pd-primary" href={`/visconti-work/connection?project=${encodeURIComponent(project.id)}`}>Apri connessione</a>}</div></div>
      <div className="pd-tabs">{[["overview","Quadro operativo"],["tasks","Attività"],["connection","Connessione"]].map(([id,label])=><button key={id} className={tab===id?"on":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
      {tab==="overview"&&<>
        <div className="pd-kpis"><div className="pd-kpi"><small>Attività aperte</small><b>{openTasks.length}</b></div><div className="pd-kpi"><small>Bloccate</small><b>{blocked}</b></div><div className="pd-kpi"><small>Connessioni</small><b>{connections.length}</b></div><div className="pd-kpi"><small>Specialisti aperti</small><b>{openSpecialists}</b></div><div className="pd-kpi"><small>Questioni autorità</small><b>{openAuthorities}</b></div><div className="pd-kpi"><small>Decisioni</small><b>{decisions.length}</b></div></div>
        <div className="pd-grid"><div>
          <section className="pd-card"><div className="pd-title2">Quadro del progetto</div><div className="pd-meta"><div className="pd-box"><small>Fase</small><strong>{stageLabel[project.project_stage] || project.project_stage}</strong></div><div className="pd-box"><small>Avanzamento</small><strong>{project.completion || 0}%</strong></div><div className="pd-box"><small>Responsabile</small><strong>{memberName(project.project_manager_id)}</strong></div><div className="pd-box"><small>Supervisore</small><strong>{memberName(project.supervisor_id)}</strong></div><div className="pd-box"><small>Rischio</small><strong>{project.risk_level || "—"}</strong></div></div></section>
          <section className="pd-card"><div className="pd-title2">Da fare ora</div>{openTasks.slice(0,6).map(t=><a className="pd-task" key={t.id} href={taskHref(t.id)} title="Apri attività"><div><b>{t.title}</b><div className="pd-muted">{t.assignee_name || "Non assegnata"}{t.next_action ? ` · ${t.next_action}` : ""}</div></div><div>{statusLabel[t.workflow_status] || t.workflow_status}</div><div>{fmt(t.due_date)}</div><div><Badge tone={attentionTone(t.attention_state)}>{t.attention_state || "normal"}</Badge></div></a>)}{!openTasks.length&&<div className="pd-empty">Nessuna attività aperta.</div>}</section>
          <section className="pd-card"><div className="pd-title2">Specialisti e autorità</div><div className="pd-list">{specialists.slice(0,4).map(s=><div className="pd-mini" key={s.id}><b>{s.specialist_name || s.specialist_type || "Specialista"}</b><span>{specialistStatus[s.status] || s.status || "—"} · scadenza {fmt(s.due_date)}</span></div>)}{authorities.slice(0,4).map(a=><div className="pd-mini" key={a.id}><b>{a.authority || "Autorità"}</b><span>{a.type || "Richiesta"} · {a.status || "—"} · termine {fmt(a.response_deadline)}</span></div>)}{!specialists.length&&!authorities.length&&<div className="pd-empty">Nessun incarico o richiesta registrata.</div>}</div></section>
        </div><aside>
          <section className="pd-card"><div className="pd-title2">Controllo</div><div className="pd-alert"><b>{urgent.length ? `${urgent.length} elementi richiedono attenzione` : "Progetto in linea"}</b><div className="pd-muted" style={{marginTop:5}}>{project.next_action || "Nessuna prossima azione registrata."}</div></div></section>
          <section className="pd-card"><div className="pd-title2">Connessioni</div>{connections.length ? connections.map(c=><button className="pd-conn" key={c.id} onClick={()=>{setSelectedConnection(c);setTab("connection")}}><strong>{c.operator} · {c.practice_code || "Pratica"}</strong><small>{c.power_mw || project.mw || 0} MW · {c.open_deadlines || 0} scadenze aperte · {c.open_steps || 0} passaggi aperti</small></button>) : <div className="pd-empty">Nessuna pratica di connessione presente.</div>}</section>
          <section className="pd-card"><div className="pd-title2">Documenti / asset</div>{assets.slice(0,5).map(a=><div className="pd-mini" key={a.id}><b>{a.title || a.asset_type || "Documento"}</b><span>{a.asset_type || "Asset"}</span></div>)}{!assets.length&&<div className="pd-empty">Nessun documento o asset collegato.</div>}</section>
          <section className="pd-card"><div className="pd-title2">Ultima decisione</div>{decisions[0] ? <div className="pd-mini"><b>{decisions[0].title || "Decisione"}</b><span>{decisions[0].decision || decisions[0].status || "Registrata"}</span></div> : <div className="pd-empty">Nessuna decisione registrata.</div>}</section>
        </aside></div></>}
      {tab==="tasks"&&<section className="pd-card"><div className="pd-title2">Attività del progetto</div>{tasks.map(t=><a className="pd-task" key={t.id} href={taskHref(t.id)} title="Apri attività"><div><b>{t.title}</b><div className="pd-muted">{t.assignee_name || "Non assegnata"}{t.next_action ? ` · ${t.next_action}` : ""}</div></div><div>{statusLabel[t.workflow_status] || t.workflow_status}</div><div>{fmt(t.due_date)}</div><div><Badge tone={attentionTone(t.attention_state)}>{t.attention_state || "normal"}</Badge></div></a>)}{!tasks.length&&<div className="pd-empty">Nessuna attività presente.</div>}</section>}
      {tab==="connection"&&<section className="pd-card"><div className="pd-title2">Connessione</div>{selectedConnection ? <><div className="pd-meta"><div className="pd-box"><small>Operatore</small><strong>{selectedConnection.operator}</strong></div><div className="pd-box"><small>Pratica</small><strong>{selectedConnection.practice_code || "—"}</strong></div><div className="pd-box"><small>Potenza</small><strong>{selectedConnection.power_mw || project.mw || 0} MW</strong></div><div className="pd-box"><small>Scadenze</small><strong>{selectedConnection.open_deadlines || 0} aperte</strong></div><div className="pd-box"><small>Passaggi</small><strong>{selectedConnection.open_steps || 0} aperti</strong></div></div><a className="pd-btn pd-primary" style={{display:"inline-block",marginTop:16}} href={`/visconti-work/connection?practice=${encodeURIComponent(selectedConnection.id)}`}>Apri scheda completa connessione →</a></> : <div className="pd-empty">Seleziona una pratica dalla scheda Quadro.</div>}</section>}
    </section></main>;
}
