"use client";

import { useEffect, useMemo, useState } from "react";

export default function ViscontiProjectExternalProfessionals({ projectId }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(projectId)}&resource=external-professionals`, { cache: "no-store" });
    const data = await r.json();
    if (r.ok) setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => { if (projectId) load().catch(() => {}); }, [projectId]);
  const assignedCount = useMemo(() => rows.filter(r => r.assigned).length, [rows]);
  const update = (id, patch) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  async function save(row) {
    setSaving(row.id); setMessage("");
    try {
      const payload = { id: row.id, project_id: projectId, professional_type: row.professional_type, assigned: !!row.assigned, professional_name: row.professional_name || null, company_name: row.company_name || null, quoted_price: row.quoted_price === "" || row.quoted_price == null ? null : Number(row.quoted_price), assigned_at: row.assigned ? (row.assigned_at || new Date().toISOString()) : null, notes: row.notes || null };
      const r = await fetch("/api/visconti-project-detail", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ externalProfessional: payload }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Salvataggio non riuscito");
      update(row.id, d.externalProfessional || payload); setMessage("Professionisti aggiornati.");
    } catch (e) { setMessage(e.message || "Salvataggio non riuscito."); } finally { setSaving(""); }
  }

  return <section className="pep-card"><style>{`.pep-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:18px;margin:18px 34px 0;box-shadow:0 2px 10px rgba(20,28,45,.03)}.pep-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.pep-title{font-size:14px;font-weight:800}.pep-count{font-size:10px;color:#687181}.pep-row{display:grid;grid-template-columns:180px 40px 1fr 1fr 120px 70px;gap:8px;align-items:center;padding:10px 0;border-top:1px solid #edf0f3}.pep-type{font-size:11px;font-weight:700}.pep-input{width:100%;box-sizing:border-box;border:1px solid #dfe3e9;border-radius:7px;padding:7px 8px;font-size:10px}.pep-check{width:18px;height:18px}.pep-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:7px;padding:7px 9px;font-size:9px;font-weight:800;cursor:pointer}.pep-btn:disabled{opacity:.55}.pep-msg{margin-top:10px;font-size:10px;color:#18794e}@media(max-width:900px){.pep-row{grid-template-columns:1fr 40px 1fr 1fr}.pep-type{grid-column:1/3}}`}</style>
    <div className="pep-head"><div className="pep-title">Professionisti esterni</div><div className="pep-count">{assignedCount}/{rows.length} assegnati</div></div>
    {rows.map(row => <div className="pep-row" key={row.id}>
      <div className="pep-type">{row.professional_type}</div>
      <input className="pep-check" type="checkbox" checked={!!row.assigned} onChange={e => update(row.id, { assigned: e.target.checked })} title="Assegnato" />
      <input className="pep-input" placeholder="Nome professionista" value={row.professional_name || ""} onChange={e => update(row.id, { professional_name: e.target.value })} />
      <input className="pep-input" placeholder="Studio / società" value={row.company_name || ""} onChange={e => update(row.id, { company_name: e.target.value })} />
      <input className="pep-input" type="number" min="0" step="0.01" placeholder="Preventivo €" value={row.quoted_price ?? ""} onChange={e => update(row.id, { quoted_price: e.target.value })} />
      <button className="pep-btn" disabled={saving===row.id} onClick={() => save(row)}>{saving===row.id ? "…" : "Salva"}</button>
    </div>)}
    {message && <div className="pep-msg">{message}</div>}
  </section>;
}
