"use client";

import React from "react";

const steps = [
  ["Richiesta", "05/06/2026", "done"],
  ["Documenti", "20/06/2026", "done"],
  ["PTO", "15/07/2026", "done"],
  ["PTO accettato", "Da verificare", "attention"],
  ["Inizio iter", "Da avviare", "pending"],
  ["Terna / iter", "Da avviare", "pending"],
  ["Accettazione", "Da avviare", "pending"],
];

const deadlines = [
  ["Verifica PTO", "03/09/2026", "Dario", "urgent"],
  ["Preparazione documenti iter", "10/09/2026", "Federica", "soon"],
  ["Controllo tecnico", "15/09/2026", "Vincenzo", "normal"],
];

function Badge({ children, tone = "neutral" }) {
  return <span className={`cw-badge cw-${tone}`}>{children}</span>;
}

export default function ViscontiConnectionV2() {
  return (
    <main className="cw-shell">
      <style>{`
        .cw-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.cw-top{background:#fff;border-bottom:1px solid #e6e9ef;padding:15px 34px;display:flex;justify-content:space-between;align-items:center}.cw-brand{font-weight:800;font-size:14px}.cw-back{display:block;color:#697386;text-decoration:none;font-size:11px;margin-bottom:4px}.cw-main{max-width:1320px;margin:auto;padding:28px 34px 50px}.cw-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.cw-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a1;font-weight:800}.cw-title{font-size:29px;letter-spacing:-.04em;margin:5px 0}.cw-sub{font-size:13px;color:#737c8c}.cw-actions{display:flex;gap:8px}.cw-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 13px;font-size:11px;font-weight:750}.cw-primary{background:#172b4d;color:#fff;border-color:#172b4d}.cw-card{background:#fff;border:1px solid #e6e9ef;border-radius:14px;padding:19px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.cw-grid{display:grid;grid-template-columns:1.55fr .75fr;gap:18px}.cw-card+.cw-card{margin-top:18px}.cw-section{font-size:14px;font-weight:800;margin-bottom:14px}.cw-meta{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.cw-box{background:#f8f9fb;border-radius:10px;padding:11px}.cw-box small{display:block;color:#8992a1;text-transform:uppercase;font-size:9px;letter-spacing:.06em}.cw-box strong{display:block;font-size:12px;margin-top:5px}.cw-flow{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}.cw-step{position:relative;border:1px solid #e9edf2;border-radius:10px;padding:11px;min-height:76px}.cw-step b{display:block;font-size:11px}.cw-step small{display:block;color:#818998;font-size:9px;margin-top:7px}.cw-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;white-space:nowrap}.cw-done{background:#e9f8f0;color:#18774e}.cw-attention,.cw-urgent{background:#fff0ee;color:#b33b34}.cw-pending,.cw-neutral{background:#f0f2f5;color:#626b7a}.cw-soon{background:#fff5df;color:#996400}.cw-normal{background:#edf3ff;color:#3d61ad}.cw-table{width:100%;border-collapse:collapse}.cw-table th{text-align:left;color:#9aa1ad;font-size:9px;text-transform:uppercase;letter-spacing:.07em;padding-bottom:9px}.cw-table td{border-top:1px solid #edf0f3;padding:12px 5px;font-size:11px}.cw-muted{color:#788191}.cw-alert{border:1px solid #f0dcb4;background:#fff9ed;border-radius:11px;padding:13px}.cw-alert b{font-size:11px}.cw-alert p{font-size:10px;color:#747d8b;line-height:1.45;margin:5px 0 0}.cw-mini{display:grid;gap:8px}.cw-minirow{display:flex;justify-content:space-between;align-items:center;border:1px solid #edf0f3;border-radius:10px;padding:10px}.cw-minirow strong{font-size:11px}.cw-minirow span{display:block;font-size:9px;color:#818998;margin-top:3px}@media(max-width:950px){.cw-grid{grid-template-columns:1fr}.cw-flow{grid-template-columns:repeat(3,1fr)}.cw-meta{grid-template-columns:repeat(2,1fr)}.cw-main{padding:22px 18px}.cw-top{padding:14px 18px}}
      `}</style>
      <header className="cw-top"><div><a href="/visconti-work/projects" className="cw-back">← Progetti</a><div className="cw-brand">GRUPPO VISCONTI · WORK V2</div></div><div className="cw-actions"><button className="cw-btn">Stampa</button><button className="cw-btn cw-primary">Aggiorna stato</button></div></header>
      <section className="cw-main">
        <div className="cw-head"><div><div className="cw-kicker">Connessione · scheda operativa</div><h1 className="cw-title">Progetto Eolico Sicilia</h1><p className="cw-sub">Terna · 48 MW · SE Sicilia · Responsabile operativo: Dario · Coordinamento: Vincenzo</p></div><Badge tone="attention">ATTENZIONE</Badge></div>
        <div className="cw-card"><div className="cw-section">Quadro della connessione</div><div className="cw-meta"><div className="cw-box"><small>Operatore</small><strong>Terna</strong></div><div className="cw-box"><small>Pratica</small><strong>Da assegnare</strong></div><div className="cw-box"><small>PTO</small><strong>Ricevuto</strong></div><div className="cw-box"><small>Accettazione</small><strong>Non completata</strong></div><div className="cw-box"><small>Prossima scadenza</small><strong>03/09/2026</strong></div></div></div>
        <div className="cw-card"><div className="cw-section">Percorso della connessione</div><div className="cw-flow">{steps.map(([name,date,status])=><div className="cw-step" key={name}><b>{name}</b><small>{date}</small><span style={{display:"block",marginTop:7}}><Badge tone={status}>{status==="done"?"Completato":status==="attention"?"Da verificare":"Da avviare"}</Badge></span></div>)}</div></div>
        <div className="cw-grid">
          <div>
            <section className="cw-card"><div className="cw-section">Scadenze operative</div><table className="cw-table"><thead><tr><th>Scadenza</th><th>Data</th><th>Responsabile</th><th>Stato</th></tr></thead><tbody>{deadlines.map(([a,b,c,d])=><tr key={a}><td><b>{a}</b></td><td>{b}</td><td className="cw-muted">{c}</td><td><Badge tone={d}>{d==="urgent"?"Urgente":d==="soon"?"Prossima":"In programma"}</Badge></td></tr>)}</tbody></table></section>
            <section className="cw-card"><div className="cw-section">Controlli necessari</div><div className="cw-mini"><div className="cw-minirow"><div><strong>PTO e condizioni</strong><span>Verifica tecnica e documentale</span></div><Badge tone="urgent">Dario</Badge></div><div className="cw-minirow"><div><strong>Inizio iter</strong><span>Preparare il passaggio successivo</span></div><Badge tone="soon">Federica</Badge></div><div className="cw-minirow"><div><strong>Supervisione</strong><span>Controllo complessivo del percorso</span></div><Badge tone="normal">Vincenzo</Badge></div></div></section>
          </div>
          <aside>
            <section className="cw-card"><div className="cw-section">⚠ Punto di attenzione</div><div className="cw-alert"><b>PTO accettato / inizio iter</b><p>Il sistema deve evidenziare automaticamente quando una fase è completata ma il passaggio successivo non è ancora avviato.</p></div></section>
            <section className="cw-card"><div className="cw-section">Regola di controllo</div><p className="cw-sub" style={{lineHeight:1.6}}>Ogni fase deve avere un responsabile, una data e uno stato. Se manca uno dei tre elementi, la pratica viene segnalata.</p></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
