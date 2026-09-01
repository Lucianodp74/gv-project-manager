"use client";

import React, { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getRows(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Database error ${response.status}`);
  return response.json();
}

const stageLabel = { opportunity: "Opportunità", connection: "Connessione", go_decision: "GO / NO-GO", development: "Sviluppo", presentation: "Presentazione", authorization: "Autorizzazione", commercial: "Commerciale", authorized: "Autorizzato", closed: "Chiuso" };
const statusLabel = { todo: "Da fare", in_progress: "In corso", waiting: "In attesa", blocked: "Bloccata", done: "Completata", cancelled: "Annullata" };

function Badge({ children, tone = "neutral" }) { return <span className={`pd-badge pd-${tone}`}>{children}</span>; }
function fmt(v) { return v ? new Date(`${v}T00:00:00`).toLocaleDateString("it-IT") : "—"; }

export default function ViscontiProjectDetailV2() {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("id");
    async function load() {
      try {
        if (!projectId) { setError("Manca l'identificativo del progetto. Apri la scheda da un progetto della Control Tower."); return; }
        const [projects, taskRows, connRows] = await Promise.all([
          getRows(`projects?id=eq.${encodeURIComponent(projectId)}&select=*`),
          getRows(`visconti_task_board?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=due_date.asc.nullslast`),
          getRows(`connection_workflow_overview?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=practice_code.asc`),
        ]);
        setProject(projects[0] || null); setTasks(taskRows); setConnections(connRows);
        if (connRows[0]) setSelectedConnection(connRows[0]);
        if (!projects[0]) setError("Progetto non trovato.");
      } catch (e) { setError("Impossibile caricare i dati operativi. Verifica la configurazione Supabase."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const openTasks = useMemo(() => tasks.filter(t => !["done", "cancelled"].includes(t.workflow_status)), [tasks]);
  const urgent = openTasks.filter(t => ["overdue", "urgent", "blocked"].includes(t.attention_state));

  if (loading) return <main className="pd-shell"><div className="pd-loading">Caricamento scheda progetto…</div></main>;
  if (error || !project) return <main className="pd-shell"><div className="pd-error"><b>{error || "Progetto non disponibile"}</b><a href="/visconti-work">← Torna alla Control Tower</a></div></main>;

  return <main className="pd-shell"><style>{`.pd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.pd-top{height:68px;background:#fff;border-bottom:1px solid #e7e9ee;display:flex;align-items:center;justify-content:space-between;padding:0 34px}.pd-brand{font-weight:800}.pd-back{color:#687181;text-decoration:none;font-size:12px;display:block;margin-bottom:4px}.pd-main{max-width:1400px;margin:auto;padding:30px 34px 50px}.pd-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.pd-kicker{font-size:11px;color:#8a92a2;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.pd-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.pd-sub{color:#737c8c;font-size:13px;margin:0}.pd-actions{display:flex;gap:7px}.pd-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:750}.pd-primary{background:#172b4d;color:#fff;border-color:#172b4d}.pd-tabs{display:flex;gap:5px;margin:22px 0 16px;background:#eef0f4;padding:4px;border-radius:11px;width:max-content}.pd-tabs button{border:0;background:transparent;padding:8px 12px;border-radius:8px;font-size:11px;font-weight:750;color:#697282}.pd-tabs .on{background:#fff;color:#172033}.pd-grid{display:grid;grid-template-columns:1.6fr .75fr;gap:18px}.pd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:19px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.pd-card+.pd-card{margin-top:18px}.pd-title2{font-size:14px;font-weight:800;margin-bottom:14px}.pd-meta{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.pd-box{background:#f8f9fb;border-radius:10px;padding:11px}.pd-box small{display:block;color:#8a92a1;text-transform:uppercase;font-size:9px}.pd-box strong{display:block;font-size:12px;margin-top:5px}.pd-row{border-top:1px solid #eef0f3;padding:12px 0;display:grid;grid-template-columns:1.5fr .8fr .7fr .8fr;gap:10px;align-items:center;font-size:11px}.pd-row:first-of-type{border-top:0}.pd-muted{color:#7c8493}.pd-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.pd-neutral{background:#f0f2f5;color:#626b7a}.pd-green{background:#eaf8f1;color:#18794e}.pd-amber{background:#fff5df;color:#996400}.pd-red{background:#fff0ef;color:#b43a34}.pd-blue{background:#edf3ff;color:#3d61ad}.pd-alert{border:1px solid #f1dfb8;background:#fff9ee;border-radius:11px;padding:12px;font-size:11px}.pd-conn{border:1px solid #e8ebf0;border-radius:11px;padding:13px;margin-top:9px;cursor:pointer;background:#fff;width:100%;text-align:left}.pd-conn:hover{border-color:#b9c5da}.pd-conn strong{font-size:12px}.pd-conn small{display:block;color:#7c8493;margin-top:4px}.pd-empty{color:#808897;font-size:12px;padding:10px 0}.pd-loading,.pd-error{max-width:800px;margin:80px auto;padding:30px;background:#fff;border:1px solid #e7e9ee;border-radius:14px}.pd-error a{display:block;margin-top:15px;color:#3d61ad;text-decoration:none;font-size:12px}@media(max-width:950px){.pd-grid{grid-template-columns:1fr}.pd-meta{grid-template-columns:repeat(2,1fr)}.pd-main{padding:22px 18px}}@media(max-width:620px){.pd-head{display:block}.pd-actions{margin-top:14px}.pd-row{grid-template-columns:1fr 1fr}.pd-row div:nth-child(4){grid-column:span 2}}`}</style>
    <header className="pd-top"><div><a className="pd-back" href="/visconti-work">← Control Tower</a><div className="pd-brand">GRUPPO VISCONTI · WORK V2</div></div></header>
    <section className="pd-main"><div className="pd-head"><div><div className="pd-kicker">Scheda progetto operativa</div><h1 className="pd-title">{project.name}</h1><p className="pd-sub">{stageLabel[project.project_stage] || project.project_stage} · {project.region || "—"} · {project.mw || 0} MW</p></div><div className="pd-actions"><button className="pd-btn">Stampa</button><a className="pd-btn pd-primary" href={`/visconti-work/connection?project=${encodeURIComponent(project.id)}`}>Apri connessione</a></div></div>
      <div className="pd-tabs">{[["overview","Quadro"],["tasks","Attività"],["connection","Connessione"]].map(([id,label])=><button key={id} className={tab===id?"on":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
      {tab==="overview"&&<div className="pd-grid"><div><section className="pd-card"><div className="pd-title2">Quadro del progetto</div><div className="pd-meta"><div className="pd-box"><small>Fase</small><strong>{stageLabel[project.project_stage] || project.project_stage}</strong></div><div className="pd-box"><small>Avanzamento</small><strong>{project.completion || 0}%</strong></div><div className="pd-box"><small>Modalità</small><strong>{project.development_mode || "—"}</strong></div><div className="pd-box"><small>Commerciale</small><strong>{project.commercial_path || "—"}</strong></div><div className="pd-box"><small>Rischio</small><strong>{project.risk_level || "—"}</strong></div></div></section><section className="pd-card"><div className="pd-title2">Prossime attività</div>{openTasks.slice(0,6).map(t=><div className="pd-row" key={t.id}><div><b>{t.title}</b><div className="pd-muted">{t.assignee_name || "Non assegnata"}</div></div><div>{statusLabel[t.workflow_status] || t.workflow_status}</div><div>{fmt(t.due_date)}</div><div><Badge tone={t.attention_state==="overdue"||t.attention_state==="urgent"?"red":t.attention_state==="blocked"?"amber":"blue"}>{t.attention_state}</Badge></div></div>)}{!openTasks.length&&<div className="pd-empty">Nessuna attività aperta.</div>}</section></div><aside><section className="pd-card"><div className="pd-title2">Controllo</div><div className="pd-alert"><b>{urgent.length ? `${urgent.length} attività richiedono attenzione` : "Progetto in linea"}</b><div className="pd-muted" style={{marginTop:5}}>{project.next_action || "Nessuna prossima azione registrata."}</div></div></section><section className="pd-card"><div className="pd-title2">Connessioni</div>{connections.length ? connections.map(c=><button className="pd-conn" key={c.id} onClick={()=>{setSelectedConnection(c);setTab("connection")}}><strong>{c.operator} · {c.practice_code || "Pratica"}</strong><small>{c.power_mw || project.mw || 0} MW · {c.open_deadlines || 0} scadenze aperte · {c.open_steps || 0} passaggi aperti</small></button>) : <div className="pd-empty">Nessuna pratica di connessione presente.</div>}</section></aside></div>}
      {tab==="tasks"&&<section className="pd-card"> <div className="pd-title2">Attività del progetto</div>{tasks.map(t=><div className="pd-row" key={t.id}><div><b>{t.title}</b><div className="pd-muted">{t.assignee_name || "Non assegnata"}</div></div><div>{statusLabel[t.workflow_status] || t.workflow_status}</div><div>{fmt(t.due_date)}</div><div><Badge tone={t.attention_state==="overdue"||t.attention_state==="urgent"?"red":t.attention_state==="blocked"?"amber":"blue"}>{t.attention_state}</Badge></div></div>)}{!tasks.length&&<div className="pd-empty">Nessuna attività presente.</div>}</section>}
      {tab==="connection"&&<section className="pd-card"><div className="pd-title2">Connessione</div>{selectedConnection ? <><div className="pd-meta"><div className="pd-box"><small>Operatore</small><strong>{selectedConnection.operator}</strong></div><div className="pd-box"><small>Pratica</small><strong>{selectedConnection.practice_code || "—"}</strong></div><div className="pd-box"><small>Potenza</small><strong>{selectedConnection.power_mw || project.mw || 0} MW</strong></div><div className="pd-box"><small>Scadenze</small><strong>{selectedConnection.open_deadlines || 0} aperte</strong></div><div className="pd-box"><small>Passaggi</small><strong>{selectedConnection.open_steps || 0} aperti</strong></div></div><a className="pd-btn pd-primary" style={{display:"inline-block",marginTop:16,textDecoration:"none"}} href={`/visconti-work/connection?practice=${encodeURIComponent(selectedConnection.id)}`}>Apri scheda completa connessione →</a></> : <div className="pd-empty">Seleziona una pratica dalla scheda Quadro.</div>}</section>}
    </section></main>;
}
