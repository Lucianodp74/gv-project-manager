"use client";

import React from "react";

const labels = {
  accepted: "ACCETTATA",
  authorization_iter: "ITER AVVIATO",
  pto_accepted: "PTO ACCETTATO",
  pto_received: "PTO RICEVUTO",
  request_sent: "RICHIESTA INVIATA",
  not_started: "DA AVVIARE",
};

function fmt(v) {
  return v ? new Date(`${v}T00:00:00`).toLocaleDateString("it-IT") : "—";
}

function Badge({ children, tone = "normal" }) {
  return <span className={`ct-badge ct-${tone}`}>{children}</span>;
}

export default function ViscontiConnectionControlTower({ data = [] }) {
  if (!data.length) return null;
  return (
    <section className="ct-shell">
      <style>{` .ct-shell{margin:0 auto 18px;max-width:1320px;padding:0 34px}.ct-card{background:#172b4d;color:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 8px 28px rgba(23,43,77,.12)}.ct-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.ct-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;opacity:.65;font-weight:800}.ct-title{font-size:18px;font-weight:850;margin:4px 0}.ct-sub{font-size:10px;opacity:.68}.ct-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:15px}.ct-box{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:10px}.ct-box small{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.07em;opacity:.6}.ct-box strong{display:block;font-size:11px;margin-top:5px}.ct-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:850;white-space:nowrap;background:#fff;color:#172b4d}.ct-warning{background:#ffe7b3;color:#775000}.ct-danger{background:#ffd8d5;color:#8e302b}.ct-ok{background:#d8f3e4;color:#17623f}.ct-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.ct-pill{font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:7px 9px;background:rgba(255,255,255,.06)}@media(max-width:950px){.ct-shell{padding:0 18px}.ct-grid{grid-template-columns:repeat(2,1fr)}.ct-head{display:block}} `}</style>
      <div className="ct-card">
        <div className="ct-head">
          <div><div className="ct-kicker">Terna · Control Tower</div><div className="ct-title">Stato connessione</div><div className="ct-sub">La pratica viene letta come una sequenza di milestone: richiesta → PTO → PTO accettato → avvio iter → accettazione.</div></div>
          <Badge tone={data[0].control_stage === "accepted" ? "ok" : data[0].overdue_deadlines > 0 ? "danger" : "warning"}>{labels[data[0].control_stage] || data[0].control_stage_label}</Badge>
        </div>
        <div className="ct-grid">
          <div className="ct-box"><small>PTO ricevuto</small><strong>{fmt(data[0].pto_received_date)}</strong></div>
          <div className="ct-box"><small>PTO accettato</small><strong>{fmt(data[0].pto_accepted_date)}</strong></div>
          <div className="ct-box"><small>Inizio iter</small><strong>{fmt(data[0].iter_start_date)}</strong></div>
          <div className="ct-box"><small>Accettazione</small><strong>{fmt(data[0].acceptance_date)}</strong></div>
          <div className="ct-box"><small>Prossima scadenza</small><strong>{fmt(data[0].nearest_open_deadline || data[0].next_deadline)}</strong></div>
        </div>
        <div className="ct-actions">
          <div className="ct-pill">Scadenze aperte: <b>{data[0].open_deadlines ?? 0}</b></div>
          <div className="ct-pill">Scadenze scadute: <b>{data[0].overdue_deadlines ?? 0}</b></div>
          <div className="ct-pill">Attività connessione: <b>{data[0].open_connection_tasks ?? 0}</b></div>
          <div className="ct-pill">Bloccate: <b>{data[0].blocked_connection_tasks ?? 0}</b></div>
          <div className="ct-pill">Responsabile: <b>{data[0].responsible_name}</b></div>
        </div>
      </div>
    </section>
  );
}
