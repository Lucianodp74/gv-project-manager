"use client";

import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getRows(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Database error ${r.status}`);
  return r.json();
}

function fmt(v) {
  return v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString("it-IT") : "—";
}

function daysTo(v) {
  if (!v) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return Math.round((d - today) / 86400000);
}

export default function ViscontiProjectActionFrame({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    const q = encodeURIComponent(projectId);
    Promise.all([
      getRows(`visconti_task_board?project_id=eq.${q}&select=*&order=due_date.asc.nullslast,created_at.desc`),
      getRows(`connection_workflow_overview?project_id=eq.${q}&select=*`),
      getRows("team_members?active=eq.true&select=id,display_name&order=display_name.asc"),
    ]).then(([t, c, m]) => { setTasks(t); setConnections(c); setMembers(m); }).catch(e => setError(e.message || "Impossibile caricare il quadro operativo."));
  }, [projectId]);

  const memberName = id => members.find(m => m.id === id)?.display_name || "Non assegnato";
  const openTasks = useMemo(() => tasks.filter(t => !["done", "cancelled"].includes(t.workflow_status)), [tasks]);
  const blocked = openTasks.filter(t => t.workflow_status === "blocked");
  const overdue = openTasks.filter(t => t.attention_state === "overdue");
  const nextTask = openTasks.find(t => t.due_date) || openTasks[0];
  const nextConnection = connections.map(c => c.next_deadline).filter(Boolean).sort()[0];
  const nextDeadline = [nextTask?.due_date, nextConnection].filter(Boolean).sort()[0];
  const nextDays = daysTo(nextDeadline);
  const nextAction = blocked[0]?.next_action || blocked[0]?.title || nextTask?.next_action || nextTask?.title || "Nessuna azione aperta";
  const nextOwner = blocked[0]?.responsible_id || nextTask?.responsible_id;
  const blocker = blocked[0]?.blocker_reason || blocked[0]?.description || "Nessun blocco operativo registrato";

  return <section className="paf-shell"><style>{`.paf-shell{margin:18px 0;background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,28,45,.03);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.paf-title{font-size:14px;font-weight:800;margin-bottom:13px}.paf-grid{display:grid;grid-template-columns:1.25fr .9fr .9fr .9fr;gap:9px}.paf-box{background:#f8f9fb;border-radius:10px;padding:12px}.paf-label{display:block;color:#8a92a1;text-transform:uppercase;font-size:9px;font-weight:800;margin-bottom:5px}.paf-value{font-size:12px;font-weight:750;line-height:1.35}.paf-muted{font-size:10px;color:#7c8493;margin-top:4px;line-height:1.35}.paf-link{display:inline-block;margin-top:11px;font-size:10px;font-weight:800;color:#3d61ad;text-decoration:none}.paf-danger{color:#b43a34}.paf-warn{color:#996400}.paf-ok{color:#18794e}.paf-error{font-size:11px;color:#b43a34}@media(max-width:900px){.paf-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.paf-grid{grid-template-columns:1fr}}`}</style>
    <div className="paf-title">Regia operativa</div>
    {error ? <div className="paf-error">{error}</div> : <div className="paf-grid">
      <div className="paf-box"><span className="paf-label">Prossima azione</span><div className="paf-value">{nextAction}</div><div className="paf-muted">{nextOwner ? `Responsabile: ${memberName(nextOwner)}` : "Responsabile da assegnare"}</div></div>
      <div className="paf-box"><span className="paf-label">Prossima scadenza</span><div className="paf-value">{fmt(nextDeadline)}</div><div className={`paf-muted ${nextDays !== null && nextDays < 0 ? "paf-danger" : nextDays !== null && nextDays <= 7 ? "paf-warn" : ""}`}>{nextDays === null ? "Nessuna scadenza registrata" : nextDays < 0 ? `${Math.abs(nextDays)} giorni di ritardo` : nextDays === 0 ? "Scade oggi" : `tra ${nextDays} giorni`}</div></div>
      <div className="paf-box"><span className="paf-label">Blocco principale</span><div className="paf-value">{blocked.length ? blocker : "Nessun blocco"}</div><div className={`paf-muted ${blocked.length ? "paf-danger" : "paf-ok"}`}>{blocked.length ? `${blocked.length} attività bloccate` : "Operatività sbloccata"}</div></div>
      <div className="paf-box"><span className="paf-label">Controllo scadenze</span><div className="paf-value">{overdue.length ? `${overdue.length} attività scadute` : "Nessuna attività scaduta"}</div><div className="paf-muted">{connections.length} pratiche di connessione collegate</div></div>
    </div>}
    <a className="paf-link" href={`/visconti-work/tasks?project=${encodeURIComponent(projectId)}`}>Apri tutte le attività del progetto →</a>
  </section>;
}
