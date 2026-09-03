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

function milestoneLabel(connections) {
  if (!connections.length) return "Nessuna pratica collegata";
  if (connections.every(c => c.start_works_validated_at)) return "Avvio lavori validato";
  if (connections.every(c => c.authorization_start_at)) return "Iter autorizzativo avviato";
  if (connections.every(c => c.pto_validated_at)) return "PTO validato";
  if (connections.every(c => c.pto_accepted_at || c.accepted_at)) return "PTO accettato";
  if (connections.every(c => c.pto_received_date)) return "PTO ricevuto";
  return "Verifica PTO / stato connessione";
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
      getRows(`connection_practices?project_id=eq.${q}&select=id,project_id,practice_code,request_date,pto_received_date,pto_accepted_at,pto_validated_at,authorization_start_at,start_works_validated_at,authorization_status,authorization_outcome,verification_status,source_label,source_verified_at&order=practice_code.asc`),
      getRows("team_members?active=eq.true&select=id,display_name&order=display_name.asc"),
    ]).then(([t, c, p, m]) => {
      const byId = new Map(p.map(x => [x.id, x]));
      const merged = c.map(x => ({ ...x, ...(byId.get(x.id) || {}) }));
      setTasks(t); setConnections(merged); setMembers(m);
    }).catch(e => setError(e.message || "Impossibile caricare il quadro operativo."));
  }, [projectId]);

  const memberName = id => members.find(m => m.id === id)?.display_name || "Non assegnato";
  const openTasks = useMemo(() => tasks.filter(t => !["done", "cancelled"].includes(t.workflow_status)), [tasks]);
  const blocked = openTasks.filter(t => t.workflow_status === "blocked");
  const overdue = openTasks.filter(t => t.attention_state === "overdue");
  const nextTask = openTasks.find(t => t.due_date) || openTasks[0];
  const nextConnection = connections.map(c => c.next_deadline).filter(Boolean).sort()[0];
  const nextDeadline = [nextTask?.due_date, nextConnection].filter(Boolean).sort()[0];
  const nextDeadlineSource = nextDeadline && nextConnection && nextDeadline === nextConnection ? "Connessione" : nextDeadline ? "Attività" : null;
  const nextDays = daysTo(nextDeadline);
  const nextAction = blocked[0]?.next_action || blocked[0]?.title || nextTask?.next_action || nextTask?.title || (connections.length ? milestoneLabel(connections) : "Nessuna azione aperta");
  const nextOwner = blocked[0]?.responsible_id || nextTask?.responsible_id;
  const blocker = blocked[0]?.blocker_reason || blocked[0]?.description || "Nessun blocco operativo registrato";
  const unblockRequirement = blocked[0]?.next_action || blocked[0]?.notes || blocked[0]?.description || "Nessun requisito di sblocco registrato";
  const waitingExternal = connections.reduce((sum, c) => sum + Number(c.waiting_terna_confirmations || 0), 0);
  const rejectedExternal = connections.reduce((sum, c) => sum + Number(c.rejected_terna_confirmations || 0), 0);
  const verifiedPto = connections.filter(c => c.pto_validated_at).length;
  const acceptedPto = connections.filter(c => c.pto_accepted_at || c.accepted_at).length;
  const startedAuthorization = connections.filter(c => c.authorization_start_at).length;
  const validatedWorks = connections.filter(c => c.start_works_validated_at).length;

  return <section className="paf-shell"><style>{`.paf-shell{margin:18px 0;background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,28,45,.03);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.paf-title{font-size:14px;font-weight:800;margin-bottom:13px}.paf-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.paf-box{background:#f8f9fb;border-radius:10px;padding:12px}.paf-label{display:block;color:#8a92a1;text-transform:uppercase;font-size:9px;font-weight:800;margin-bottom:5px}.paf-value{font-size:12px;font-weight:750;line-height:1.35}.paf-muted{font-size:10px;color:#7c8493;margin-top:4px;line-height:1.35}.paf-link{display:inline-block;margin:11px 14px 0 0;font-size:10px;font-weight:800;color:#3d61ad;text-decoration:none}.paf-danger{color:#b43a34}.paf-warn{color:#996400}.paf-ok{color:#18794e}.paf-error{font-size:11px;color:#b43a34}.paf-conn{margin-top:10px;padding-top:12px;border-top:1px solid #eef0f3}.paf-conn-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.paf-mini{background:#f8f9fb;border-radius:9px;padding:10px}.paf-mini b{display:block;font-size:16px}.paf-mini span{display:block;color:#7c8493;font-size:9px;margin-top:3px}.paf-source{font-size:10px;color:#687181;margin-top:8px}@media(max-width:1100px){.paf-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.paf-conn-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.paf-grid{grid-template-columns:1fr 1fr}.paf-conn-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.paf-grid,.paf-conn-grid{grid-template-columns:1fr}}`}</style>
    <div className="paf-title">Regia operativa</div>
    {error ? <div className="paf-error">{error}</div> : <>
      <div className="paf-grid">
        <div className="paf-box"><span className="paf-label">Prossima azione</span><div className="paf-value">{nextAction}</div><div className="paf-muted">{nextOwner ? `Responsabile: ${memberName(nextOwner)}` : "Responsabile da assegnare"}</div></div>
        <div className="paf-box"><span className="paf-label">Prossima scadenza</span><div className="paf-value">{fmt(nextDeadline)}</div><div className={`paf-muted ${nextDays !== null && nextDays < 0 ? "paf-danger" : nextDays !== null && nextDays <= 7 ? "paf-warn" : ""}`}>{nextDays === null ? "Nessuna scadenza registrata" : nextDays < 0 ? `${Math.abs(nextDays)} giorni di ritardo` : nextDays === 0 ? "Scade oggi" : `tra ${nextDays} giorni`}</div><div className="paf-source">{nextDeadlineSource ? `Fonte: ${nextDeadlineSource}` : "Nessuna scadenza interna o di connessione"}</div></div>
        <div className="paf-box"><span className="paf-label">Blocco principale</span><div className="paf-value">{blocked.length ? blocker : "Nessun blocco"}</div><div className={`paf-muted ${blocked.length ? "paf-danger" : "paf-ok"}`}>{blocked.length ? `${blocked.length} attività bloccate` : "Operatività sbloccata"}</div></div>
        <div className="paf-box"><span className="paf-label">Per sbloccare</span><div className="paf-value">{blocked.length ? unblockRequirement : "Nessun requisito aperto"}</div><div className="paf-muted">Indicato dall'attività bloccata principale</div></div>
        <div className="paf-box"><span className="paf-label">Controllo scadenze</span><div className="paf-value">{overdue.length ? `${overdue.length} attività scadute` : "Nessuna attività scaduta"}</div><div className="paf-muted">{connections.length} pratiche di connessione collegate</div></div>
      </div>
      <div className="paf-conn"><div className="paf-title">Stato connessione</div><div className="paf-conn-grid">
        <div className="paf-mini"><b>{verifiedPto}/{connections.length}</b><span>PTO validato</span></div>
        <div className="paf-mini"><b>{acceptedPto}/{connections.length}</b><span>PTO accettato</span></div>
        <div className="paf-mini"><b>{startedAuthorization}/{connections.length}</b><span>Iter autorizzativo avviato</span></div>
        <div className="paf-mini"><b>{validatedWorks}/{connections.length}</b><span>Avvio lavori validato</span></div>
      </div><div className="paf-source">{waitingExternal || rejectedExternal ? `${waitingExternal} conferme esterne in attesa · ${rejectedExternal} rifiutate` : milestoneLabel(connections)}</div></div>
    </>}
    <a className="paf-link" href={`/visconti-work/tasks?project=${encodeURIComponent(projectId)}`}>Attività →</a>
    <a className="paf-link" href={`/visconti-work/connection?project=${encodeURIComponent(projectId)}`}>Connessioni →</a>
    <a className="paf-link" href="/visconti-work/meetings">Riunione settimanale →</a>
  </section>;
}
