"use client";

import { useEffect, useState } from "react";

export default function ViscontiProjectPowerEditor() {
  const [projectId, setProjectId] = useState("");
  const [projectPower, setProjectPower] = useState("");
  const [connections, setConnections] = useState([]);
  const [connectionPowers, setConnectionPowers] = useState({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    setProjectId(id);
    Promise.all([
      fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(id)}&resource=project`, { cache:"no-store" }).then(r=>r.json()),
      fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(id)}&resource=connections`, { cache:"no-store" }).then(r=>r.json()),
    ]).then(([p,c]) => {
      const project = Array.isArray(p) ? p[0] : null;
      const rows = Array.isArray(c) ? c : [];
      setProjectPower(project?.power_mw ?? "");
      setConnections(rows);
      setConnectionPowers(Object.fromEntries(rows.map(x=>[x.id, x.power_mw ?? ""])));
    }).catch(()=>{});
  }, []);

  async function save(payload, key, success) {
    setSaving(key); setMessage("");
    try { const r=await fetch("/api/visconti-project-detail",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Salvataggio non riuscito"); setMessage(success); }
    catch(e){setMessage(e.message||"Salvataggio non riuscito.");} finally{setSaving("");}
  }
  if (!projectId) return null;

  return <section className="ppe-card"><style>{`.ppe-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,28,45,.03);margin:18px 34px 0}.ppe-title{font-size:14px;font-weight:800;margin-bottom:4px}.ppe-sub{font-size:10px;color:#7c8493;margin-bottom:14px}.ppe-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ppe-item{border:1px solid #edf0f3;border-radius:11px;padding:12px;background:#fafbfc}.ppe-label{font-size:9px;text-transform:uppercase;color:#8a92a1;font-weight:800}.ppe-row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}.ppe-input{width:120px;border:1px solid #dfe3e9;border-radius:8px;background:#fff;padding:8px 9px;font-size:12px}.ppe-unit{font-size:10px;color:#687181}.ppe-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}.ppe-btn:disabled{opacity:.55}.ppe-msg{margin-top:12px;font-size:10px;color:#18794e}@media(max-width:700px){.ppe-card{margin:14px 18px 0}.ppe-grid{grid-template-columns:1fr}}`}</style>
    <div className="ppe-title">Potenze</div>
    <div className="ppe-sub">Modifica separatamente la potenza del progetto e quella richiesta nella pratica di connessione. Le due potenze non vengono sincronizzate automaticamente.</div>
    <div className="ppe-grid">
      <div className="ppe-item"><div className="ppe-label">Potenza progetto</div><div className="ppe-row"><input className="ppe-input" type="number" min="0" step="0.01" value={projectPower} onChange={e=>setProjectPower(e.target.value)}/><span className="ppe-unit">MW</span><button className="ppe-btn" onClick={()=>save({projectId,power_mw:projectPower},"project","Potenza progetto aggiornata.")} disabled={!!saving}>{saving==="project"?"Salvo…":"Salva"}</button></div></div>
      {connections.map(c=><div className="ppe-item" key={c.id}><div className="ppe-label">Potenza richiesta · {c.practice_code||"Pratica"}</div><div className="ppe-row"><input className="ppe-input" type="number" min="0" step="0.01" value={connectionPowers[c.id]??""} onChange={e=>setConnectionPowers(prev=>({...prev,[c.id]:e.target.value}))}/><span className="ppe-unit">MW</span><button className="ppe-btn" onClick={()=>save({connectionId:c.id,power_mw:connectionPowers[c.id]},c.id,"Potenza richiesta di connessione aggiornata.")} disabled={!!saving}>{saving===c.id?"Salvo…":"Salva"}</button></div></div>)}
    </div>
    {message&&<div className="ppe-msg">{message}</div>}
  </section>;
}
