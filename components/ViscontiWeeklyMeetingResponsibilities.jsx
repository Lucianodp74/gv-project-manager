"use client";

import { useMemo } from "react";

const RESPONSIBILITIES = [
  { area: "Connessioni", people: ["Dario"], note: "Gestione operativa delle pratiche di connessione." },
  { area: "Richieste", people: ["Federica"], note: "Gestione e avanzamento delle richieste." },
  { area: "PTO", people: ["Giggi", "Dario"], note: "Gestione congiunta del PTO e delle relative verifiche." },
];

const TEAM = ["Dario", "Roberto", "Carmelo", "Francesco"];

export default function ViscontiWeeklyMeetingResponsibilities({ members = [] }) {
  const names = useMemo(() => members.map(m => String(m.display_name || m.name || "").trim()).filter(Boolean), [members]);
  const find = name => names.find(n => n.toLowerCase() === name.toLowerCase()) || name;

  return <section className="wm-resp">
    <style>{`.wm-resp{max-width:1450px;margin:0 auto;padding:0 34px 14px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.wm-resp *{box-sizing:border-box}.wm-resp-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:16px}.wm-resp-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:12px}.wm-resp-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;color:#7d8797;font-weight:850}.wm-resp-title{font-size:16px;font-weight:850;margin-top:4px;color:#172033}.wm-resp-sub{font-size:10px;color:#697487;margin-top:4px}.wm-resp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.wm-resp-item{border:1px solid #e1e5eb;border-radius:10px;padding:12px;background:#f8f9fb}.wm-resp-area{font-size:11px;font-weight:850;color:#172b4d}.wm-resp-people{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0 5px}.wm-resp-pill{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf3ff;color:#315ba7;font-size:8px;font-weight:850}.wm-resp-note{font-size:9px;color:#737e8e;line-height:1.4}.wm-resp-team{margin-top:11px;padding-top:10px;border-top:1px solid #e9ecf0;display:flex;gap:7px;align-items:center;flex-wrap:wrap;font-size:9px;color:#687385}.wm-resp-team b{color:#172033}.wm-resp-direct{font-size:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:850;color:#8992a0}@media(max-width:800px){.wm-resp{padding:0 14px 12px}.wm-resp-grid{grid-template-columns:1fr}}`}</style>
    <div className="wm-resp-card">
      <div className="wm-resp-head"><div><div className="wm-resp-kicker">Mappa responsabilità</div><div className="wm-resp-title">Chi gestisce cosa</div><div className="wm-resp-sub">Queste responsabilità guidano il controllo di Vincenzo durante la riunione del lunedì.</div></div></div>
      <div className="wm-resp-grid">
        {RESPONSIBILITIES.map(r => <div className="wm-resp-item" key={r.area}><div className="wm-resp-area">{r.area}</div><div className="wm-resp-people">{r.people.map(p => <span className="wm-resp-pill" key={p}>{find(p)}</span>)}</div><div className="wm-resp-note">{r.note}</div></div>)}
      </div>
      <div className="wm-resp-team"><span className="wm-resp-direct">Controllo settimanale Vincenzo</span>{TEAM.map(p => <b key={p}>{find(p)}</b>)}</div>
    </div>
  </section>;
}
