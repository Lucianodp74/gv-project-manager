"use client";

import React from "react";

const labels = { accepted: "ACCETTATA", authorization_iter: "ITER AVVIATO", pto_accepted: "PTO ACCETTATO", pto_received: "PTO RICEVUTO", request_sent: "RICHIESTA INVIATA", not_started: "DA AVVIARE" };
function fmt(v) { return v ? new Date(`${v}T00:00:00`).toLocaleDateString("it-IT") : "—"; }
function Badge({ children, tone = "normal" }) { return <span className={`ct-badge ct-${tone}`}>{children}</span>; }
function nextAction(row, waiting, rejected) {
  if (rejected > 0) return "Verificare il riscontro esterno respinto e aggiornare la fase.";
  if (row.blocked_connection_tasks > 0) return "Sbloccare l'attività di connessione indicata e aggiornare il responsabile.";
  if (waiting > 0) return row.next_terna_confirmation ? `Attendere conferma esterna: ${row.next_terna_confirmation}` : "Attendere la conferma / validazione esterna.";
  if (row.overdue_deadlines > 0) return "Gestire subito la scadenza di connessione scaduta.";
  if (row.nearest_open_deadline) return `Prossima azione entro ${fmt(row.nearest_open_deadline)}.`;
  if (row.control_stage === "accepted") return "Connessione accettata: proseguire con lo sviluppo del progetto.";
  return "Aggiornare la prossima milestone della connessione.";
}

export default function ViscontiConnectionControlTower({ data = [] }) {
  if (!data.length) return null;
  const row = data[0];
  const waiting = Number(row.waiting_terna_confirmations ?? 0);
  const rejected = Number(row.rejected_terna_confirmations ?? 0);
  const critical = rejected > 0 || Number(row.blocked_connection_tasks ?? 0) > 0 || Number(row.overdue_deadlines ?? 0) > 0;
  const confirmationTone = rejected > 0 ? "danger" : waiting > 0 ? "warning" : "ok";
  const action = nextAction(row, waiting, rejected);
  return (
    <section className="ct-shell">
      <style>{`.ct-shell{margin:0 auto 18px;max-width:1320px;padding:0 34px}.ct-card{background:#172b4d;color:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 8px 28px rgba(23,43,77,.12)}.ct-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.ct-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;opacity:.65;font-weight:800}.ct-title{font-size:18px;font-weight:850;margin:4px 0}.ct-sub{font-size:10px;opacity:.68}.ct-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:15px}.ct-box{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:10px}.ct-box small{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.07em;opacity:.6}.ct-box strong{display:block;font-size:11px;margin-top:5px}.ct-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:850;white-space:nowrap;background:#fff;color:#172b4d}.ct-warning{background:#ffe7b3;color:#775000}.ct-danger{background:#ffd8d5;color:#8e302b}.ct-ok{background:#d8f3e4;color:#17623f}.ct-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.ct-pill{font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px;background:rgba(255,255,255,.06)}.ct-next{margin-top:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 12px;background:rgba(255,255,255,.08)}.ct-next small{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.08em;opacity:.6}.ct-next strong{display:block;margin-top:4px;font-size:11px}@media(max-width:1050px){.ct-shell{padding:0 18px}.ct-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.ct-grid{grid-template-columns:repeat(2,1fr)}.ct-head{display:block}}`}</style>
      <div className="ct-card">
        <div className="ct-head">
          <div><div className="ct-kicker">Connection · Control Tower</div><div className="ct-title">Controllo operativo della connessione</div><div className="ct-sub">Milestone verificate, scadenze, attività e conferme esterne. Le conferme esterne sono evidenziate ma non sostituiscono lo stato operativo della pratica.</div></div>
          <div className="flex flex-wrap justify-end gap-2"><Badge tone={critical ? "danger" : row.control_stage === "accepted" ? "ok" : "warning"}>{labels[row.control_stage] || row.control_stage_label}</Badge>{waiting > 0 && <Badge tone="warning">{waiting} IN ATTESA ESTERNA</Badge>}{rejected > 0 && <Badge tone="danger">{rejected} DA VERIFICARE</Badge>}</div>
        </div>
        <div className="ct-grid">
          <div className="ct-box"><small>PTO ricevuto</small><strong>{fmt(row.pto_received_date)}</strong></div>
          <div className="ct-box"><small>PTO accettato</small><strong>{fmt(row.pto_accepted_date)}</strong></div>
          <div className="ct-box"><small>Inizio iter</small><strong>{fmt(row.iter_start_date)}</strong></div>
          <div className="ct-box"><small>Accettazione</small><strong>{fmt(row.acceptance_date)}</strong></div>
          <div className="ct-box"><small>Prossima scadenza</small><strong>{fmt(row.nearest_open_deadline || row.next_deadline)}</strong></div>
          <div className="ct-box"><small>Conferme esterne</small><strong>{rejected > 0 ? "Da verificare" : waiting > 0 ? `${waiting} in attesa` : "Nessuna in attesa"}</strong>{waiting > 0 && row.nearest_terna_confirmation_due && <span style={{display:"block",fontSize:8,opacity:.62,marginTop:3}}>entro {fmt(row.nearest_terna_confirmation_due)}</span>}</div>
        </div>
        <div className="ct-next"><small>Prossima azione</small><strong>{action}</strong></div>
        <div className="ct-actions">
          <div className="ct-pill">Scadenze aperte: <b>{row.open_deadlines ?? 0}</b></div>
          <div className="ct-pill">Scadenze scadute: <b>{row.overdue_deadlines ?? 0}</b></div>
          <div className="ct-pill">Attività aperte: <b>{row.open_connection_tasks ?? 0}</b></div>
          <div className="ct-pill"><span style={{fontWeight:800}}>Conferme esterne: {waiting}</span>{rejected > 0 && <span style={{marginLeft:6}}>· {rejected} da verificare</span>}</div>
          <div className="ct-pill">Bloccate: <b>{row.blocked_connection_tasks ?? 0}</b></div>
          <div className="ct-pill">Responsabile: <b>{row.responsible_name || "Non assegnato"}</b></div>
        </div>
      </div>
    </section>
  );
}
