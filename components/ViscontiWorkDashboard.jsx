"use client";

import React from "react";

const projects = [
  { name: "Progetto Eolico Sicilia", type: "Eolico", stage: "Sviluppo", progress: 68, risk: "In linea", next: "Controllo vincolistica" },
  { name: "Progetto FV Lucera", type: "Fotovoltaico", stage: "Connessione", progress: 46, risk: "Attenzione", next: "Attesa PTO" },
  { name: "Progetto Eolico L'Aquila", type: "Eolico", stage: "Sviluppo", progress: 74, risk: "In linea", next: "Elaborati specialistici" },
  { name: "Progetto FV Sicilia 02", type: "Fotovoltaico", stage: "Autorizzazione", progress: 82, risk: "Critico", next: "Risposta integrazione ente" },
];

const tasks = [
  { title: "Verificare PTO e scadenze Terna", project: "Progetto FV Lucera", owner: "Dario", due: "Oggi", state: "urgent" },
  { title: "Controllo elaborati GIS", project: "Progetto Eolico Sicilia", owner: "Roberto", due: "Domani", state: "todo" },
  { title: "Richiesta integrazione geologica", project: "Progetto FV Sicilia 02", owner: "Vincenzo", due: "03/09", state: "urgent" },
  { title: "Coordinamento professionisti", project: "Progetto Eolico L'Aquila", owner: "Vincenzo", due: "05/09", state: "todo" },
];

const team = [
  ["Antonio", "Direzione"],
  ["Luciano", "Coordinamento / controllo"],
  ["Federica", "Operations / connessioni"],
  ["Vincenzo", "Project coordination / Sicilia"],
  ["Roberto", "GIS / QGIS"],
  ["Dario", "PTO / Terna / elettrico"],
];

function Badge({ children, tone = "neutral" }) {
  return <span className={`vw-badge vw-${tone}`}>{children}</span>;
}

export default function ViscontiWorkDashboard() {
  return (
    <main className="vw-shell">
      <style>{`
        .vw-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .vw-top{height:68px;background:#fff;border-bottom:1px solid #e7e9ee;display:flex;align-items:center;justify-content:space-between;padding:0 34px;position:sticky;top:0;z-index:10}
        .vw-brand{display:flex;align-items:center;gap:12px;font-weight:750;letter-spacing:-.02em}.vw-mark{width:34px;height:34px;border-radius:10px;background:#172033;color:#fff;display:grid;place-items:center;font-size:13px}.vw-sub{font-size:12px;color:#8a92a2;font-weight:500;margin-left:2px}
        .vw-actions{display:flex;gap:10px;align-items:center}.vw-date{font-size:13px;color:#7a8291}.vw-btn{border:1px solid #e1e4ea;background:#fff;border-radius:9px;padding:9px 13px;font-size:13px;font-weight:650;color:#263044}
        .vw-main{max-width:1440px;margin:0 auto;padding:30px 34px 48px}.vw-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px}.vw-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a2;font-weight:700}.vw-title{font-size:30px;line-height:1.1;margin:5px 0 7px;letter-spacing:-.04em}.vw-desc{color:#70798a;font-size:14px;margin:0}
        .vw-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}.vw-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vw-kpi{padding:18px 20px}.vw-kpi-label{font-size:12px;color:#7c8494;font-weight:650}.vw-kpi-value{font-size:29px;font-weight:760;letter-spacing:-.04em;margin-top:6px}.vw-kpi-foot{font-size:12px;color:#8b93a2;margin-top:4px}
        .vw-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(320px,.8fr);gap:18px}.vw-panel{padding:20px}.vw-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.vw-panel-title{font-size:15px;font-weight:750;letter-spacing:-.01em}.vw-link{font-size:12px;color:#4769b8;font-weight:700}.vw-table{width:100%;border-collapse:collapse}.vw-table th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9aa1ae;text-align:left;padding:0 10px 10px}.vw-table td{padding:14px 10px;border-top:1px solid #eef0f3;font-size:13px;vertical-align:middle}.vw-project{font-weight:700}.vw-muted{color:#7b8392}.vw-progress{width:92px;height:6px;background:#edf0f4;border-radius:99px;overflow:hidden}.vw-progress i{display:block;height:100%;background:#4769b8;border-radius:99px}.vw-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:750;white-space:nowrap}.vw-neutral{background:#f0f2f5;color:#626b7b}.vw-green{background:#eaf8f1;color:#18794e}.vw-amber{background:#fff5df;color:#996400}.vw-red{background:#fff0ef;color:#b43a34}.vw-blue{background:#edf3ff;color:#3d61ad}
        .vw-side{display:flex;flex-direction:column;gap:18px}.vw-task{padding:13px 0;border-top:1px solid #eef0f3}.vw-task:first-child{border-top:0;padding-top:0}.vw-task-title{font-size:13px;font-weight:700;line-height:1.35}.vw-task-meta{font-size:11px;color:#818998;margin-top:5px;display:flex;justify-content:space-between;gap:10px}.vw-team{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vw-person{border:1px solid #edf0f3;border-radius:10px;padding:10px}.vw-person strong{display:block;font-size:12px}.vw-person span{display:block;font-size:10px;color:#838b99;margin-top:3px;line-height:1.3}
        .vw-alert{background:#fff9ee;border:1px solid #f1dfb8;border-radius:12px;padding:14px;margin-top:16px}.vw-alert strong{font-size:12px}.vw-alert p{font-size:12px;color:#737b89;line-height:1.45;margin:5px 0 0}.vw-week{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.vw-day{border:1px solid #edf0f3;border-radius:10px;padding:10px}.vw-day small{color:#9097a4;font-size:10px}.vw-day b{display:block;font-size:18px;margin-top:4px}.vw-day span{font-size:10px;color:#7d8592}
        @media(max-width:1000px){.vw-kpis{grid-template-columns:repeat(2,1fr)}.vw-grid{grid-template-columns:1fr}.vw-main{padding:22px 18px}.vw-top{padding:0 18px}.vw-date{display:none}}
        @media(max-width:620px){.vw-kpis{grid-template-columns:1fr 1fr}.vw-heading{display:block}.vw-actions{margin-top:15px}.vw-table th:nth-child(3),.vw-table td:nth-child(3),.vw-table th:nth-child(5),.vw-table td:nth-child(5){display:none}.vw-week{grid-template-columns:1fr 1fr}}
      `}</style>

      <header className="vw-top">
        <div className="vw-brand"><div className="vw-mark">GV</div><div>GRUPPO VISCONTI <span className="vw-sub">WORK V2</span></div></div>
        <div className="vw-actions"><span className="vw-date">Dashboard direzione · settimana corrente</span><button className="vw-btn">+ Nuova attività</button></div>
      </header>

      <section className="vw-main">
        <div className="vw-heading">
          <div><div className="vw-kicker">Control tower</div><h1 className="vw-title">Buongiorno, Antonio</h1><p className="vw-desc">La situazione in un colpo d'occhio. Intervieni solo dove serve.</p></div>
          <Badge tone="green">Sistema operativo V2 · bozza</Badge>
        </div>

        <div className="vw-kpis">
          <div className="vw-card vw-kpi"><div className="vw-kpi-label">Progetti</div><div className="vw-kpi-value">17</div><div className="vw-kpi-foot">12 in linea · 4 attenzione · 1 critico</div></div>
          <div className="vw-card vw-kpi"><div className="vw-kpi-label">Attività aperte</div><div className="vw-kpi-value">42</div><div className="vw-kpi-foot">6 con scadenza entro 7 giorni</div></div>
          <div className="vw-card vw-kpi"><div className="vw-kpi-label">Richieste enti</div><div className="vw-kpi-value">8</div><div className="vw-kpi-foot">2 richiedono attenzione</div></div>
          <div className="vw-card vw-kpi"><div className="vw-kpi-label">Decisioni</div><div className="vw-kpi-value">3</div><div className="vw-kpi-foot">GO/NO-GO e questioni strategiche</div></div>
        </div>

        <div className="vw-grid">
          <div className="vw-side">
            <section className="vw-card vw-panel">
              <div className="vw-panel-head"><div className="vw-panel-title">Portafoglio progetti</div><span className="vw-link">Vedi tutti →</span></div>
              <table className="vw-table"><thead><tr><th>Progetto</th><th>Fase</th><th>Avanz.</th><th>Stato</th><th>Prossimo passo</th></tr></thead><tbody>
                {projects.map((p) => <tr key={p.name}><td><div className="vw-project">{p.name}</div><div className="vw-muted">{p.type}</div></td><td>{p.stage}</td><td><div className="vw-progress"><i style={{width:`${p.progress}%`}} /></div><div className="vw-muted" style={{marginTop:4,fontSize:10}}>{p.progress}%</div></td><td><Badge tone={p.risk === "Critico" ? "red" : p.risk === "Attenzione" ? "amber" : "green"}>{p.risk}</Badge></td><td className="vw-muted">{p.next}</td></tr>)}
              </tbody></table>
              <div className="vw-alert"><strong>⚠ 1 progetto richiede decisione</strong><p>Progetto FV Sicilia 02 · risposta a integrazione ente. Il coordinatore ha richiesto una valutazione normativa.</p></div>
            </section>

            <section className="vw-card vw-panel">
              <div className="vw-panel-head"><div className="vw-panel-title">Settimana</div><span className="vw-link">Riunione settimanale →</span></div>
              <div className="vw-week">{[["Lun","6","attività"],["Mar","9","attività"],["Mer","7","attività"],["Gio","5","attività"],["Ven","8","attività"]].map(d=><div className="vw-day" key={d[0]}><small>{d[0]}</small><b>{d[1]}</b><span>{d[2]}</span></div>)}</div>
            </section>
          </div>

          <aside className="vw-side">
            <section className="vw-card vw-panel"><div className="vw-panel-head"><div className="vw-panel-title">Da seguire oggi</div><span className="vw-link">Tutte →</span></div>{tasks.map(t=><div className="vw-task" key={t.title}><div className="vw-task-title">{t.title}</div><div className="vw-task-meta"><span>{t.owner} · {t.project}</span><Badge tone={t.state === "urgent" ? "red" : "blue"}>{t.due}</Badge></div></div>)}</section>
            <section className="vw-card vw-panel"><div className="vw-panel-head"><div className="vw-panel-title">Coordinamento</div></div><div className="vw-team">{team.map(([name,role])=><div className="vw-person" key={name}><strong>{name}</strong><span>{role}</span></div>)}</div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
