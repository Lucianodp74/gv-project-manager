"use client";

import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stageLabel = { opportunity: "Opportunità", connection: "Connessione", go_decision: "GO / NO-GO", development: "Sviluppo", presentation: "Presentazione", authorization: "Autorizzazione", commercial: "Commerciale", authorized: "Autorizzato", closed: "Chiuso", archived: "Archiviato" };
const statusLabel = { todo: "Da fare", in_progress: "In corso", blocked: "Bloccata", done: "Completata", cancelled: "Annullata" };

async function getRows(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Database error ${response.status}`);
  return response.json();
}

async function updateProjectStatus(projectId, status, archivedFromStatus = null) {
  const body = { status, updated_at: new Date().toISOString() };
  if (status === "archived") body.archived_from_status = archivedFromStatus || "connection";
  else if (archivedFromStatus) body.archived_from_status = null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Impossibile aggiornare il progetto (${response.status}).`);
}

function fmt(v) { return v ? new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString("it-IT") : "—"; }
function Badge({ children, tone = "neutral" }) { return <span className={`pd-badge pd-${tone}`}>{children}</span>; }
function tone(v) { return v === "overdue" ? "red" : v === "blocked" || v === "urgent" ? "amber" : v === "soon" ? "amber" : v === "normal" ? "green" : "blue"; }
function operationalStage(connection, fallback) {
  if (!connection) return fallback || "opportunity";
  if (connection.authorization_outcome || ["completed", "title_perfected"].includes(connection.authorization_status)) return "authorized";
  if (connection.authorization_start_at || ["in_progress", "suspended"].includes(connection.authorization_status)) return "authorization";
  if (connection.pto_validated_at) return "connection";
  return "connection";
}

export default function ViscontiProjectDetailV2() {
  const [project, setProject] = useState(null), [tasks, setTasks] = useState([]), [connections, setConnections] = useState([]), [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [actionError, setActionError] = useState("");

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("id");
    async function load() {
      try {
        if (!projectId) throw new Error("Manca l'identificativo del progetto.");
        const q = encodeURIComponent(projectId);
        const [p, t, c, m] = await Promise.all([
          getRows(`projects?id=eq.${q}&select=*`),
          getRows(`visconti_task_board?project_id=eq.${q}&select=*&order=due_date.asc.nullslast,created_at.desc`),
          getRows(`connection_workflow_overview?project_id=eq.${q}&select=*&order=practice_code.asc`),
          getRows("team_members?active=eq.true&select=id,display_name,role&order=display_name.asc"),
        ]);
        if (!p[0]) throw new Error("Progetto non trovato.");
        setProject(p[0]); setTasks(t); setConnections(c); setMembers(m);
      } catch (e) { setError(e.message || "Impossibile caricare il progetto."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const memberName = (id) => members.find(m => m.id === id)?.display_name || "Non assegnato";
  const openTasks = useMemo(() => tasks.filter(t => !["done", "cancelled"].includes(t.workflow_status)), [tasks]);
  const blocked = openTasks.filter(t => t.workflow_status === "blocked").length;
  const overdue = openTasks.filter(t => t.attention_state === "overdue").length;
  const waitingConfirmations = connections.reduce((sum, c) => sum + Number(c.waiting_terna_confirmations || 0), 0);
  const archived = project?.status === "archived";
  const projectStage = archived ? "archived" : operationalStage(connections[0], project?.status);

  async function toggleArchive() {
    if (!project) return;
    const nextStatus = archived ? (project.archived_from_status || "connection") : "archived";
    const message = archived ? "Ripristinare il progetto nella gestione attiva?" : "Archiviare il progetto? I documenti, le attività e lo storico resteranno conservati.";
    if (!window.confirm(message)) return;
    setSaving(true); setActionError("");
    try {
      await updateProjectStatus(project.id, nextStatus, archived ? project.archived_from_status : project.status);
      setProject(prev => ({ ...prev, status: nextStatus, archived_from_status: archived ? null : prev.status, updated_at: new Date().toISOString() }));
    } catch (e) { setActionError(e.message || "Aggiornamento non riuscito."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="pd-shell"><div className="pd-loading">Caricamento scheda progetto…</div></main>;
  if (error || !project) return <main className="pd-shell"><div className="pd-error"><b>{error || "Progetto non disponibile"}</b><a href="/visconti-work/projects">← Torna ai progetti</a></div></main>;

  return <main className="pd-shell"><style>{`.pd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.pd-top{background:#fff;border-bottom:1px solid #e7e9ee;padding:14px 34px;display:flex;justify-content:space-between;align-items:center}.pd-brand{font-weight:800}.pd-back{display:block;color:#687181;text-decoration:none;font-size:11px;margin-bottom:4px}.pd-main{max-width:1380px;margin:auto;padding:30px 34px 50px}.pd-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.pd-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a1;font-weight:800}.pd-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.pd-sub{font-size:13px;color:#737c8c}.pd-actions{display:flex;gap:8px;flex-wrap:wrap}.pd-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:750;text-decoration:none;color:#172033}.pd-primary{background:#172b4d;color:#fff;border-color:#172b4d}.pd-archive-btn{border-color:#cfd4dc}.pd-grid{display:grid;grid-template-columns:1.5fr .75fr;gap:18px;margin-top:20px}.pd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:19px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.pd-card+.pd-card{margin-top:18px}.pd-title2{font-size:14px;font-weight:800;margin-bottom:14px}.pd-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.pd-kpi{background:#fff;border:1px solid #e7e9ee;border-radius:12px;padding:13px}.pd-kpi small{display:block;color:#8a92a1;font-size:9px;text-transform:uppercase}.pd-kpi b{display:block;font-size:21px;margin-top:5px}.pd-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.pd-box{background:#f8f9fb;border-radius:10px;padding:11px}.pd-box small{display:block;color:#8a92a1;text-transform:uppercase;font-size:9px}.pd-box strong{display:block;font-size:12px;margin-top:5px}.pd-task{display:grid;grid-template-columns:1.6fr .9fr .75fr .65fr;gap:10px;align-items:center;text-decoration:none;color:inherit;border-top:1px solid #eef0f3;padding:12px 0;font-size:11px}.pd-task:first-of-type{border-top:0}.pd-task:hover{background:#fafbfc}.pd-muted{color:#7c8493}.pd-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.pd-neutral{background:#f0f2f5;color:#626b7a}.pd-green{background:#eaf8f1;color:#18794e}.pd-amber{background:#fff5df;color:#996400}.pd-red{background:#fff0ef;color:#b43a34}.pd-blue{background:#edf3ff;color:#3d61ad}.pd-empty{color:#808897;font-size:12px;padding:12px 0}.pd-alert{border:1px solid #f0dcb4;background:#fff9ed;border-radius:11px;padding:13px;font-size:11px}.pd-alert p{font-size:10px;color:#747d8b;line-height:1.45;margin:7px 0 0}.pd-conn{border:1px solid #e8ebf0;border-radius:11px;padding:13px;margin-top:9px;background:#fff;text-decoration:none;color:inherit;display:block}.pd-conn:hover{border-color:#b9c5da}.pd-conn strong{font-size:12px}.pd-conn small{display:block;color:#7c8493;margin-top:4px}.pd-error a{display:block;margin-top:15px;color:#3d61ad;text-decoration:none;font-size:12px}.pd-loading,.pd-error{max-width:800px;margin:80px auto;padding:30px;background:#fff;border:1px solid #e7e9ee;border-radius:14px}.pd-action-error{margin-top:10px;color:#b43a34;font-size:10px}.pd-archived-note{margin-top:18px;border:1px solid #e1e4e8;background:#f4f5f7;border-radius:12px;padding:13px;font-size:11px;color:#626b7a}.pd-archived-note b{color:#172033}@media(max-width:950px){.pd-grid{grid-template-columns:1fr}.pd-meta{grid-template-columns:1fr 1fr}.pd-kpis{grid-template-columns:repeat(3,1fr)}.pd-main{padding:22px 18px}}@media(max-width:620px){.pd-head{display:block}.pd-actions{margin-top:14px}.pd-kpis{grid-template-columns:1fr 1fr}.pd-task{grid-template-columns:1fr 1fr}.pd-task div:nth-child(4){grid-column:span 2}}`}</style>
    <header className="pd-top"><div><a className="pd-back" href="/visconti-work/projects">← Progetti</a><div className="pd-brand">GRUPPO VISCONTI · WORK V2</div></div><div className="pd-actions"><a className="pd-btn" href="/visconti-work/tasks">Attività</a>{connections.length>0&&<a className="pd-btn pd-primary" href={`/visconti-work/connection?project=${encodeURIComponent(project.id)}`}>Connessione</a>}<button className="pd-btn pd-archive-btn" onClick={toggleArchive} disabled={saving}>{saving ? "Salvataggio…" : archived ? "Ripristina progetto" : "Archivia progetto"}</button></div></header>
    <section className="pd-main"><div className="pd-head"><div><div className="pd-kicker">Centro operativo del progetto</div><h1 className="pd-title">{project.name}</h1><p className="pd-sub">{stageLabel[projectStage] || projectStage || "—"} · {project.region || "—"} · {project.power_mw || 0} MW</p></div><Badge tone={archived ? "neutral" : blocked || overdue || waitingConfirmations ? "amber" : "green"}>{archived ? "Archiviato" : blocked ? `${blocked} blocchi` : overdue ? `${overdue} scadenze attività` : waitingConfirmations ? `${waitingConfirmations} conferme in attesa` : "In linea"}</Badge></div>
      {actionError&&<div className="pd-action-error">{actionError}</div>}
      {archived&&<div className="pd-archived-note"><b>Progetto archiviato.</b> I dati storici, i documenti, le attività e le connessioni restano conservati; il progetto non viene più considerato nella regia operativa.</div>}
      <div className="pd-kpis" style={{marginTop:18}}><div className="pd-kpi"><small>Attività aperte</small><b>{openTasks.length}</b></div><div className="pd-kpi"><small>Bloccate</small><b>{blocked}</b></div><div className="pd-kpi"><small>Scadute</small><b>{overdue}</b></div><div className="pd-kpi"><small>Connessioni</small><b>{connections.length}</b></div><div className="pd-kpi"><small>Conferme in attesa</small><b>{waitingConfirmations}</b></div></div>
      <div className="pd-grid"><div><section className="pd-card"><div className="pd-title2">Quadro del progetto</div><div className="pd-meta"><div className="pd-box"><small>Fase</small><strong>{stageLabel[projectStage] || projectStage || "—"}</strong></div><div className="pd-box"><small>Codice</small><strong>{project.project_code || "—"}</strong></div><div className="pd-box"><small>Responsabile</small><strong>{memberName(project.responsible_id)}</strong></div><div className="pd-box"><small>Regione</small><strong>{project.region || "—"}</strong></div></div></section>
      <section className="pd-card"><div className="pd-title2">Da fare ora</div>{openTasks.slice(0,10).map(t=><a className="pd-task" key={t.id} href={`/visconti-work/tasks?task=${encodeURIComponent(t.id)}&project=${encodeURIComponent(project.id)}`}><div><b>{t.title}</b><div className="pd-muted">{t.next_action || "Nessuna prossima azione"}</div></div><div>{memberName(t.responsible_id)}</div><div>{fmt(t.due_date)}</div><div><Badge tone={tone(t.attention_state)}>{statusLabel[t.workflow_status] || t.workflow_status}</Badge></div></a>)}{!openTasks.length&&<div className="pd-empty">Nessuna attività aperta.</div>}</section></div>
      <aside><section className="pd-card"><div className="pd-title2">Controllo</div><div className="pd-alert"><b>{archived ? "Progetto fuori dalla regia operativa." : blocked ? "Ci sono attività bloccate." : overdue ? "Ci sono attività scadute." : waitingConfirmations ? "In attesa di conferme esterne." : "Nessuna criticità rilevata."}</b><p>{archived ? "L'archivio conserva le informazioni senza eliminarle e senza modificare le attività o le connessioni." : "La scheda mostra solo ciò che serve per capire cosa fare, chi è responsabile e dove una connessione richiede attenzione."}</p></div></section>
      <section className="pd-card"><div className="pd-title2">Connessioni</div>{connections.length?connections.map(c=><a className="pd-conn" key={c.id} href={`/visconti-work/connection?practice=${encodeURIComponent(c.id)}`}><strong>{c.grid_operator || "Operatore"} · {c.practice_code || "Pratica"}</strong><small>{c.power_mw || 0} MW · {c.status || "—"} · Prossima scadenza: {fmt(c.next_deadline)}</small></a>):<div className="pd-empty">Nessuna pratica di connessione presente.</div>}</section></aside></div>
    </section></main>;
}
