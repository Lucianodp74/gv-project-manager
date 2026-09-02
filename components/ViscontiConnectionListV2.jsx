"use client";

import { useMemo, useState } from "react";

const statusLabel = { pending:"Da avviare", active:"Attiva", accepted:"Accettata" };
function Badge({ children, tone="neutral" }) { return <span className={`cl-badge cl-${tone}`}>{children}</span>; }
function stageOf(c) {
  if (c.authorization_outcome) return c.authorization_outcome === "authorized" ? "Autorizzata" : "Esito autorizzativo";
  if (c.authorization_start_at) return "Iter avviato";
  if (c.pto_validated_at) return "PTO validato";
  if (c.accepted_at) return "PTO accettato";
  return statusLabel[c.status] || c.status || "Da avviare";
}
function stageTone(c) {
  if (c.next_deadline && c.next_deadline < new Date().toISOString().slice(0,10)) return "overdue";
  if (c.authorization_outcome === "authorized") return "done";
  if (c.pto_validated_at || c.authorization_start_at) return "normal";
  return "soon";
}
function verificationLabel(c) {
  return c.verification_status === "internally_verified" ? "Verificato internamente" : c.verification_status === "public_verified" ? "Fonte pubblica verificata" : "Da verificare";
}
function verificationTone(c) {
  return c.verification_status === "internally_verified" || c.verification_status === "public_verified" ? "done" : "soon";
}

export default function ViscontiConnectionListV2({ connections = [], connected = false }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => connections.filter(c => `${c.project_name||""} ${c.practice_code||""} ${c.grid_operator||c.operator||""}`.toLowerCase().includes(query.toLowerCase())), [connections, query]);
  return <main className="cl-shell"><style>{`.cl-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.cl-top{background:#fff;border-bottom:1px solid #e6e9ef;padding:15px 34px;display:flex;justify-content:space-between;align-items:center}.cl-brand{font-weight:800;font-size:14px}.cl-back{display:block;color:#697386;text-decoration:none;font-size:11px;margin-bottom:4px}.cl-main{max-width:1320px;margin:auto;padding:30px 34px 50px}.cl-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.cl-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a1;font-weight:800}.cl-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.cl-sub{font-size:13px;color:#737c8c}.cl-actions{display:flex;gap:8px}.cl-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 13px;font-size:11px;font-weight:750;text-decoration:none;color:#172033}.cl-primary{background:#172b4d;color:#fff;border-color:#172b4d}.cl-tools{margin:22px 0 12px;display:flex;justify-content:space-between;gap:12px;align-items:center}.cl-input{width:min(460px,100%);box-sizing:border-box;border:1px solid #dfe3e9;border-radius:9px;background:#fff;padding:9px 11px;font:inherit;font-size:11px}.cl-card{background:#fff;border:1px solid #e6e9ef;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,28,45,.03)}.cl-row{display:grid;grid-template-columns:1.35fr .7fr .45fr 1fr 1.2fr .75fr;gap:12px;padding:14px 16px;border-top:1px solid #edf0f3;align-items:center}.cl-row:first-child{border-top:0}.cl-headrow{background:#fafbfc;color:#9299a6;text-transform:uppercase;letter-spacing:.06em;font-size:9px;font-weight:800}.cl-row:not(.cl-headrow){font-size:11px}.cl-name{font-weight:800;font-size:12px}.cl-muted{color:#7c8493;font-size:10px;margin-top:3px}.cl-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.cl-normal{background:#edf3ff;color:#3d61ad}.cl-soon{background:#fff5df;color:#996400}.cl-overdue{background:#fff0ef;color:#b43a34}.cl-done{background:#e9f8f0;color:#18774e}.cl-neutral{background:#f0f2f5;color:#626b7a}.cl-empty{padding:35px;text-align:center;color:#7c8493;font-size:12px}.cl-note{margin-top:12px;color:#8a92a1;font-size:10px}.cl-summary{font-size:10px;color:#7c8493}.cl-flow{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}.cl-dot{padding:3px 6px;border-radius:999px;background:#f0f2f5;color:#687181;font-size:9px}.cl-dot.done{background:#e9f8f0;color:#18774e}.cl-verify{display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap}.cl-source{font-size:9px;color:#536173;text-decoration:none}.cl-source:hover{text-decoration:underline}@media(max-width:950px){.cl-main{padding:22px 18px}.cl-top{padding:14px 18px}.cl-row{grid-template-columns:1.5fr 1fr .8fr}.cl-headrow{display:none}.cl-row>div:nth-child(n+4){display:none}}`}</style>
    <header className="cl-top"><div><a className="cl-back" href="/visconti-work">← Control Tower</a><div className="cl-brand">GRUPPO VISCONTI · WORK V2</div></div><div className="cl-actions"><a className="cl-btn" href="/visconti-work/projects">Progetti</a></div></header>
    <section className="cl-main"><div className="cl-head"><div><div className="cl-kicker">Connessioni</div><h1 className="cl-title">Pratiche di connessione</h1><p className="cl-sub">Una vista operativa: stato PTO, iter, prossima scadenza, responsabile e verifica della fonte.</p></div><a className="cl-btn cl-primary" href="/visconti-work">Control Tower</a></div>
      <div className="cl-tools"><input className="cl-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca progetto, pratica o operatore…"/><span className="cl-summary">{rows.length} {rows.length === 1 ? "pratica" : "pratiche"}</span></div>
      <div className="cl-card"><div className="cl-row cl-headrow"><div>Progetto</div><div>Operatore</div><div>MW</div><div>Pratica</div><div>Stato operativo</div><div>Prossima scadenza</div></div>{rows.map(c=><a key={c.id} href={`/visconti-work/connection?practice=${encodeURIComponent(c.id)}`} className="cl-row" style={{textDecoration:"none",color:"inherit"}}><div><div className="cl-name">{c.project_name}</div><div className="cl-muted">{c.region||"Regione non indicata"}</div></div><div>{c.grid_operator||c.operator||"—"}</div><div>{c.power_mw||0}</div><div><b>{c.practice_code||"Senza codice"}</b><div className="cl-muted">{c.connection_point||c.station||"Punto di connessione non indicato"}</div><div className="cl-verify"><Badge tone={verificationTone(c)}>{verificationLabel(c)}</Badge>{c.source_url&&<a className="cl-source" href={c.source_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>{c.source_label||"Fonte"}</a>}</div></div><div><Badge tone={stageTone(c)}>{stageOf(c)}</Badge><div className="cl-flow"><span className={`cl-dot ${c.accepted_at?"done":""}`}>PTO accettato</span><span className={`cl-dot ${c.pto_validated_at?"done":""}`}>PTO validato</span><span className={`cl-dot ${c.authorization_start_at?"done":""}`}>Iter avviato</span></div></div><div>{c.next_deadline||"Nessuna"}</div></a>)}{!rows.length&&<div className="cl-empty">{connected?"Nessuna pratica corrisponde alla ricerca.":"Nessun dato Supabase disponibile. Configura il collegamento per vedere le pratiche reali."}</div>}</div>
      <div className="cl-note">{connected ? "Apri una pratica per modificare fasi, conferme e scadenze. Le informazioni provenienti da fonti pubbliche sono marcate separatamente dai dati da verificare internamente." : "Modalità dimostrativa: la struttura è pronta, ma le pratiche reali richiedono Supabase configurato."}</div>
    </section></main>;
}
