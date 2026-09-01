"use client";

import React from "react";

const phases = [
  ["Scouting", "Completato", "green"],
  ["Connessione", "In corso", "blue"],
  ["Sviluppo", "In corso", "blue"],
  ["Specialisti", "In corso", "amber"],
  ["Presentazione", "Da avviare", "neutral"],
  ["Autorizzazione", "Da avviare", "neutral"],
];

const activities = [
  ["Verificare PTO e prossime scadenze Terna", "Dario", "Oggi", "red"],
  ["Aggiornare layout e cavidotto", "Roberto", "03/09", "blue"],
  ["Richiedere relazione geologica", "Vincenzo", "05/09", "amber"],
  ["Coordinare monitoraggio fauna", "Vincenzo", "10/09", "blue"],
];

const specialists = [
  ["Geologo", "Incarico da verificare", "amber"],
  ["Archeologo", "In corso", "blue"],
  ["Acustico", "In corso", "blue"],
  ["VINCA", "Da avviare", "neutral"],
  ["Monitoraggio fauna", "In corso", "blue"],
];

function Badge({ children, tone = "neutral" }) {
  return <span className={`vp-badge vp-${tone}`}>{children}</span>;
}

export default function ViscontiProjectDetailV2() {
  return (
    <main className="vp-shell">
      <style>{`
        .vp-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .vp-top{background:#fff;border-bottom:1px solid #e7e9ee;padding:16px 34px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}.vp-brand{font-weight:800}.vp-back{font-size:12px;color:#657087;text-decoration:none;margin-bottom:5px;display:block}.vp-btn{border:1px solid #e1e4ea;background:#fff;border-radius:9px;padding:9px 13px;font-size:12px;font-weight:700;color:#263044}
        .vp-main{max-width:1440px;margin:auto;padding:28px 34px 50px}.vp-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#8991a1;font-weight:750}.vp-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.vp-sub{font-size:13px;color:#70798a}.vp-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.vp-status{display:flex;gap:8px;align-items:center}.vp-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.75fr);gap:18px}.vp-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03);padding:19px}.vp-card+.vp-card{margin-top:18px}.vp-title2{font-size:14px;font-weight:800;margin-bottom:14px}.vp-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.vp-meta-box{background:#f8f9fb;border-radius:10px;padding:12px}.vp-meta-box small{display:block;font-size:10px;color:#8a92a1;text-transform:uppercase;letter-spacing:.06em}.vp-meta-box strong{display:block;font-size:13px;margin-top:5px}.vp-phases{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.vp-phase{border:1px solid #edf0f3;border-radius:10px;padding:10px}.vp-phase b{display:block;font-size:11px}.vp-phase span{display:block;font-size:10px;color:#7f8796;margin-top:5px}.vp-table{width:100%;border-collapse:collapse}.vp-table th{text-align:left;color:#9aa1ae;font-size:10px;text-transform:uppercase;letter-spacing:.07em;padding-bottom:9px}.vp-table td{border-top:1px solid #eef0f3;padding:12px 5px;font-size:12px}.vp-muted{color:#7b8392}.vp-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.vp-green{background:#eaf8f1;color:#18794e}.vp-blue{background:#edf3ff;color:#3d61ad}.vp-amber{background:#fff5df;color:#996400}.vp-red{background:#fff0ef;color:#b43a34}.vp-neutral{background:#f0f2f5;color:#626b7b}.vp-list{display:grid;gap:8px}.vp-row{display:flex;justify-content:space-between;align-items:center;border:1px solid #edf0f3;border-radius:10px;padding:11px 12px}.vp-row strong{font-size:12px}.vp-row span{font-size:10px;color:#7d8592;display:block;margin-top:3px}.vp-alert{background:#fff9ee;border:1px solid #f1dfb8;border-radius:11px;padding:12px;margin-top:14px}.vp-alert b{font-size:11px}.vp-alert p{font-size:11px;color:#747d8b;margin:4px 0 0;line-height:1.45}.vp-timeline{border-left:2px solid #e9edf2;padding-left:15px;display:grid;gap:14px}.vp-event{position:relative}.vp-event:before{content:"";position:absolute;left:-21px;top:3px;width:8px;height:8px;border-radius:50%;background:#4769b8}.vp-event b{font-size:11px}.vp-event span{display:block;font-size:11px;color:#7d8592;margin-top:3px}
        @media(max-width:950px){.vp-grid{grid-template-columns:1fr}.vp-phases{grid-template-columns:repeat(3,1fr)}.vp-meta{grid-template-columns:repeat(2,1fr)}.vp-main{padding:22px 18px}.vp-top{padding:14px 18px}}
      `}</style>
      <header className="vp-top"><div><a href="/visconti-work" className="vp-back">← Control Tower</a><div className="vp-brand">GRUPPO VISCONTI · WORK V2</div></div><button className="vp-btn">Modifica progetto</button></header>
      <section className="vp-main">
        <div className="vp-head"><div><div className="vp-kicker">Scheda progetto</div><h1 className="vp-title">Progetto Eolico Sicilia</h1><p className="vp-sub">Eolico · Sicilia · Coordinatore: Vincenzo · Sviluppo interno</p></div><div className="vp-status"><Badge tone="green">IN LINEA</Badge><Badge tone="blue">68%</Badge></div></div>
        <div className="vp-card">
          <div className="vp-title2">Situazione del progetto</div>
          <div className="vp-meta"><div className="vp-meta-box"><small>Responsabile</small><strong>Vincenzo</strong></div><div className="vp-meta-box"><small>Supervisione</small><strong>Luciano</strong></div><div className="vp-meta-box"><small>Modalità</small><strong>Interno</strong></div><div className="vp-meta-box"><small>Destinazione</small><strong>Da decidere</strong></div></div>
          <div className="vp-phases">{phases.map(([a,b,t])=><div className="vp-phase" key={a}><b>{a}</b><span><Badge tone={t}>{b}</Badge></span></div>)}</div>
        </div>
        <div className="vp-grid">
          <div>
            <section className="vp-card"><div className="vp-title2">Connessione</div><div className="vp-meta"><div className="vp-meta-box"><small>Pratica</small><strong>In corso</strong></div><div className="vp-meta-box"><small>PTO</small><strong>Da verificare</strong></div><div className="vp-meta-box"><small>Terna</small><strong>Iter attivo</strong></div><div className="vp-meta-box"><small>Prossima scadenza</small><strong>03/09/2026</strong></div></div><div className="vp-alert"><b>⚠ Attenzione alla connessione</b><p>Dario deve verificare PTO e prossime scadenze. Questa informazione deve diventare automatica quando collegheremo il database reale.</p></div></section>
            <section className="vp-card"><div className="vp-title2">Sviluppo tecnico</div><table className="vp-table"><thead><tr><th>Componente</th><th>Responsabile</th><th>Stato</th></tr></thead><tbody>{[["Layout impianto","Roberto","In corso"],["KMZ / GIS","Roberto","In corso"],["Cavidotto","Vincenzo","In corso"],["Strade","Team progetto","In corso"],["SSE Terna","Dario","Da verificare"],["Seconda vincolistica","Vincenzo","Da controllare"]].map(x=><tr key={x[0]}><td><b>{x[0]}</b></td><td className="vp-muted">{x[1]}</td><td><Badge tone={x[2]==="Da verificare"||x[2]==="Da controllare"?"amber":"blue"}>{x[2]}</Badge></td></tr>)}</tbody></table></section>
            <section className="vp-card"><div className="vp-title2">Attività e prossimi passi</div><table className="vp-table"><thead><tr><th>Attività</th><th>Responsabile</th><th>Scadenza</th></tr></thead><tbody>{activities.map(x=><tr key={x[0]}><td><b>{x[0]}</b></td><td className="vp-muted">{x[1]}</td><td><Badge tone={x[3]}>{x[2]}</Badge></td></tr>)}</tbody></table></section>
          </div>
          <aside>
            <section className="vp-card"><div className="vp-title2">Specialisti</div><div className="vp-list">{specialists.map(x=><div className="vp-row" key={x[0]}><div><strong>{x[0]}</strong><span>Professionista esterno</span></div><Badge tone={x[2]}>{x[1]}</Badge></div>)}</div></section>
            <section className="vp-card"><div className="vp-title2">Enti e autorizzazioni</div><div className="vp-list"><div className="vp-row"><div><strong>Pareri</strong><span>Nessuna richiesta critica registrata</span></div><Badge tone="green">OK</Badge></div><div className="vp-row"><div><strong>Integrazioni</strong><span>Da collegare al registro enti</span></div><Badge tone="neutral">0</Badge></div></div></section>
            <section className="vp-card"><div className="vp-title2">Cronologia</div><div className="vp-timeline"><div className="vp-event"><b>01/09/2026</b><span>Controllo progetto V2</span></div><div className="vp-event"><b>31/08/2026</b><span>Connessione in gestione</span></div><div className="vp-event"><b>28/08/2026</b><span>Layout preliminare aggiornato</span></div></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
