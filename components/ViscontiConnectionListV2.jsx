"use client";

import { useMemo, useState } from "react";

const statusLabel = { pending:"Da avviare", active:"Attiva", accepted:"Accettata" };
const milestones = [
  ["request_date", "Richiesta"],
  ["pto_received_date", "PTO ricevuto"],
  ["accepted_at", "PTO accettato"],
  ["pto_validated_at", "PTO validato"],
  ["authorization_start_at", "Iter avviato"],
  ["authorization_outcome", "Esito"],
  ["start_works_validated_at", "Avvio lavori"],
];
function Badge({ children, tone="neutral" }) { return <span className={`cl-badge cl-${tone}`}>{children}</span>; }
function stageOf(c) {
  if (c.authorization_outcome) return c.authorization_outcome === "authorized" ? "Autorizzata" : "Esito autorizzativo";
  if (c.authorization_start_at) return "Iter autorizzativo avviato";
  if (c.pto_validated_at) return "PTO validato";
  if (c.accepted_at) return "PTO accettato";
  if (c.pto_received_date) return "PTO ricevuto";
  if (c.request_date) return "Richiesta inviata";
  return statusLabel[c.status] || c.status || "Da avviare";
}
function stageTone(c) {
  if (c.attention_state === "overdue" || c.overdue_deadlines > 0) return "overdue";
  if (c.attention_state === "soon") return "soon";
  if (c.authorization_outcome) return "done";
  return "normal";
}
function verificationLabel(c) {
  return c.verification_status === "internally_verified" ? "Verificato internamente" : c.verification_status === "public_verified" ? "Fonte pubblica verificata" : "Da verificare";
}
function verificationTone(c) { return c.verification_status === "internally_verified" || c.verification_status === "public_verified" ? "done" : "soon"; }
function completedCount(c) { return milestones.filter(([key]) => Boolean(c[key])).length; }
function nextMissing(c) { const item = milestones.find(([key]) => !c[key]); return item?.[1] || "Tutto registrato"; }
function daysTo(date) { if (!date) return null; return Math.ceil((new Date(`${date}T00:00:00`) - new Date(`${new Date().toISOString().slice(0,10)}T00:00:00`)) / 86400000); }
function deadlineText(c) {
  const date = c.nearest_open_deadline || c.next_deadline || null;
  if (!date) return { date:"Nessuna", days:null };
  return { date, days: daysTo(date) };
}
function actionText(c) {
  if (c.blocked_connection_tasks > 0) return "Sbloccare attività di connessione";
  if (c.open_connection_tasks > 0) return "Eseguire attività di connessione";
  if (c.control_stage === "request_sent") return "Controllare ricezione / preventivo PTO";
  if (c.control_stage === "pto_received") return "Verificare e preparare accettazione PTO";
  if (c.control_stage === "pto_accepted") return "Predisporre il progetto / prossimo invio";
  if (c.control_stage === "authorization_iter") return "Seguire iter autorizzativo e comunicazioni";
  if (c.control_stage === "accepted") return "Gestire il prossimo adempimento operativo";
  return nextMissing(c);
}

export default function ViscontiConnectionListV2({ connections = [], connected = false }) {
  const [query, setQuery] = useState("");
  const [onlyAttention, setOnlyAttention] = useState(false);
  const rows = useMemo(() => connections.filter(c => {
    const text = `${c.project_name||""} ${c.practice_code||""} ${c.grid_operator||c.operator||""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!onlyAttention || ["overdue","soon"].includes(c.attention_state) || c.overdue_deadlines > 0 || c.blocked_connection_tasks > 0);
  }), [connections, query, onlyAttention]);
  const counts = useMemo(() => ({ risk: connections.filter(c => c.attention_state === "overdue" || c.overdue_deadlines > 0).length, action: connections.filter(c => c.open_connection_tasks > 0).length, blocked: connections.filter(c => c.blocked_connection_tasks > 0).length }), [connections]);
  return <main className="cl-shell"><style>{`.cl-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.cl-top{background:#fff;border-bottom:1px solid #e6e9ef;padding:15px 34px;display:flex;justify-content:space-between;align-items:center}.cl-brand{font-weight:800;font-size:14px}.cl-back{display:block;color:#697386;text-decoration:none;font-size:11px;margin-bottom:4px}.cl-main{max-width:1320px;margin:auto;padding:30px 34px 50px}.cl-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.cl-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a1;font-weight:800}.cl-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.cl-sub{font-size:13px;color:#737c8c;max-width:760px}.cl-actions{display:flex;gap:8px}.cl-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 13px;font-size:11px;font-weight:750;text-decoration:none;color:#172033}.cl-primary{background:#172b4d;color:#fff;border-color:#172b4d}.cl-summarybar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:20px 0 12px}.cl-kpi{background:#fff;border:1px solid #e6e9ef;border-radius:12px;padding:12px 14px}.cl-kpi b{display:block;font-size:18px;letter-spacing:-.03em}.cl-kpi span{font-size:9px;color:#7c8493;text-transform:uppercase;letter-spacing:.06em}.cl-kpi-risk b{color:#b43a34}.cl-tools{margin:14px 0 12px;display:flex;justify-content:space-between;gap:12px;align-items:center}.cl-toolgroup{display:flex;gap:8px;align-items:center;flex:1}.cl-input{width:min(460px,100%);box-sizing:border-box;border:1px solid #dfe3e9;border-radius:9px;background:#fff;padding:9px 11px;font:inherit;font-size:11px}.cl-filter{cursor:pointer}.cl-filter.active{background:#172b4d;color:#fff;border-color:#172b4d}.cl-card{background:#fff;border:1px solid #e6e9ef;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,28,45,.03)}.cl-row{display:grid;grid-template-columns:1.25fr .65fr .42fr .95fr 1.45fr 1.15fr;gap:12px;padding:14px 16px;border-top:1px solid #edf0f3;align-items:center}.cl-row:first-child{border-top:0}.cl-headrow{background:#fafbfc;color:#9299a6;text-transform:uppercase;letter-spacing:.06em;font-size:9px;font-weight:800}.cl-row:not(.cl-headrow){font-size:11px}.cl-name{font-weight:800;font-size:12px}.cl-muted{color:#7c8493;font-size:10px;margin-top:3px}.cl-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.cl-normal{background:#edf3ff;color:#3d61ad}.cl-soon{background:#fff5df;color:#996400}.cl-overdue{background:#fff0ef;color:#b43a34}.cl-done{background:#e9f8f0;color:#18774e}.cl-neutral{background:#f0f2f5;color:#626b7a}.cl-empty{padding:35px;text-align:center;color:#7c8493;font-size:12px}.cl-note{margin-top:12px;color:#8a92a1;font-size:10px}.cl-summary{font-size:10px;color:#7c8493}.cl-flow{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.cl-dot{padding:3px 6px;border-radius:999px;background:#f0f2f5;color:#687181;font-size:9px}.cl-dot.done{background:#e9f8f0;color:#18774e}.cl-verify{display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap}.cl-source{font-size:9px;color:#536173}.cl-source a{color:inherit;text-decoration:none}.cl-progress{margin-top:6px;font-size:9px;color:#667085}.cl-next{margin-top:5px;font-size:9px;color:#996400;font-weight:750}.cl-action{font-weight:750;font-size:10px}.cl-owner{margin-top:5px;color:#7c8493;font-size:9px}.cl-deadline{font-weight:800}.cl-deadline small{display:block;font-weight:500;color:#7c8493;margin-top:3px}.cl-days{display:inline-block;margin-top:5px;font-size:9px;font-weight:800}.cl-days.negative{color:#b43a34}.cl-days.warning{color:#996400}.cl-days.ok{color:#18774e}@media(max-width:950px){.cl-main{padding:22px 18px}.cl-top{padding:14px 18px}.cl-summarybar{grid-template-columns:repeat(3,1fr)}.cl-row{grid-template-columns:1.25fr 1fr}.cl-headrow{display:none}.cl-row>div:nth-child(n+3){display:none}.cl-row{padding:13px 12px}.cl-title{font-size:24px}.cl-sub{font-size:12px}.cl-tools{align-items:stretch;flex-direction:column}.cl-toolgroup{width:100%}.cl-input{width:100%}}@media(max-width:560px){.cl-summarybar{grid-template-columns:1fr 1fr 1fr;gap:6px}.cl-kpi{padding:10px}.cl-kpi b{font-size:15px}.cl-kpi span{font-size:8px}.cl-head .cl-actions{display:none}.cl-row{grid-template-columns:1fr .95fr}.cl-name{font-size:11px}}`}</style>
    <header className="cl-top"><div><a className="cl-back" href="/visconti-work">← Control Tower</a><div className="cl-brand">GRUPPO VISCONTI · WORK V2</div></div><div className="cl-actions"><a className="cl-btn" href="/visconti-work/projects">Progetti</a></div></header>
    <section className="cl-main"><div className="cl-head"><div><div className="cl-kicker">Connessioni · Regia operativa</div><h1 className="cl-title">Pratiche di connessione</h1><p className="cl-sub">Qui non guardiamo solo lo stato: individuiamo cosa richiede attenzione, entro quando, chi lo deve gestire e quale passaggio viene dopo.</p></div><a className="cl-btn cl-primary" href="/visconti-work">Control Tower</a></div>
      <div className="cl-summarybar"><div className="cl-kpi cl-kpi-risk"><b>{counts.risk}</b><span>Scadenze a rischio</span></div><div className="cl-kpi"><b>{counts.action}</b><span>Pratiche con attività</span></div><div className="cl-kpi"><b>{counts.blocked}</b><span>Attività bloccate</span></div></div>
      <div className="cl-tools"><div className="cl-toolgroup"><input className="cl-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca progetto, pratica o operatore…"/><button type="button" className={`cl-btn cl-filter ${onlyAttention?"active":""}`} onClick={()=>setOnlyAttention(v=>!v)}>{onlyAttention?"Tutte le pratiche":"Solo attenzione"}</button></div><span className="cl-summary">{rows.length} {rows.length === 1 ? "pratica" : "pratiche"}</span></div>
      <div className="cl-card"><div className="cl-row cl-headrow"><div>Progetto</div><div>Operatore</div><div>MW</div><div>Fase</div><div>Azione richiesta</div><div>Scadenza</div></div>{rows.map(c=>{ const d=deadlineText(c); const tone=stageTone(c); const daysClass=d.days==null?"":d.days<0?"negative":d.days<=7?"warning":"ok"; return <a key={c.id} href={`/visconti-work/connection?practice=${encodeURIComponent(c.id)}`} className="cl-row" style={{textDecoration:"none",color:"inherit"}}><div><div className="cl-name">{c.project_name}</div><div className="cl-muted">{c.region||c.station||"Punto di connessione non indicato"}</div><div className="cl-verify"><Badge tone={verificationTone(c)}>{verificationLabel(c)}</Badge></div></div><div>{c.grid_operator||c.operator||"—"}</div><div>{c.power_mw||0}</div><div><Badge tone={tone}>{c.control_stage_label||stageOf(c)}</Badge><div className="cl-flow">{milestones.slice(1,6).map(([key,label])=><span key={key} className={`cl-dot ${c[key]?"done":""}`}>{label}</span>)}</div></div><div><div className="cl-action">{actionText(c)}</div><div className="cl-owner">Responsabile: {c.responsible_name||"Non assegnato"}</div>{c.blocked_connection_tasks>0&&<Badge tone="overdue">Bloccata</Badge>}</div><div><div className="cl-deadline">{d.date}</div>{c.next_deadline_type&&<small>{c.next_deadline_type}</small>}{d.days!=null&&<span className={`cl-days ${daysClass}`}>{d.days<0?`${Math.abs(d.days)} giorni oltre`:`${d.days} giorni residui`}</span>}</div></a>})}{!rows.length&&<div className="cl-empty">{connected?"Nessuna pratica corrisponde ai filtri selezionati.":"Nessun dato Supabase disponibile. Configura il collegamento per vedere le pratiche reali."}</div>}</div>
      <div className="cl-note">Le scadenze mostrate sono quelle operative già presenti nei dati della pratica. Il dettaglio della pratica contiene workflow, attività, conferme e comunicazioni.</div>
    </section></main>;
}
