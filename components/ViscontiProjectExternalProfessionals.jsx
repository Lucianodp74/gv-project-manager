"use client";

import { useEffect, useMemo, useState } from "react";

export default function ViscontiProjectExternalProfessionals({ projectId }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`/api/visconti-project-detail?projectId=${encodeURIComponent(projectId)}&resource=external-professionals`, { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Lettura professionisti non riuscita");
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (projectId) load().catch((e) => setMessage(e.message || "Lettura professionisti non riuscita"));
  }, [projectId]);

  const assignedCount = useMemo(() => rows.filter((r) => r.assigned).length, [rows]);
  const update = (id, patch) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  async function save(row) {
    setSaving(row.id);
    setMessage("");
    try {
      const rawQuoted = String(row.quoted_price ?? "").trim();
      const normalizedQuoted = rawQuoted
        ? (rawQuoted.includes(",")
          ? Number(rawQuoted.replace(/\./g, "").replace(",", "."))
          : Number(rawQuoted))
        : null;
      if (normalizedQuoted !== null && (!Number.isFinite(normalizedQuoted) || normalizedQuoted < 0)) {
        throw new Error("Importo non valido. Usa ad esempio 4500 oppure 4.500,50.");
      }
      const payload = {
        id: row.id,
        project_id: projectId,
        professional_type: row.professional_type,
        assigned: !!row.assigned,
        professional_name: row.professional_name || null,
        company_name: row.company_name || null,
        quoted_price: normalizedQuoted,
        assigned_at: row.assigned ? (row.assigned_at || new Date().toISOString()) : null,
        notes: row.notes || null
      };
      const r = await fetch("/api/visconti-project-detail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalProfessional: payload })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Salvataggio non riuscito");
      update(row.id, d.externalProfessional || payload);
      setMessage("Professionisti aggiornati.");
    } catch (e) {
      setMessage(e.message || "Salvataggio non riuscito.");
    } finally {
      setSaving("");
    }
  }

  return <section className="pep-card">
    <style>{`.pep-card{background:#fff;border:1px solid #dfe4eb;border-radius:14px;padding:18px 20px;margin:18px 34px 0;box-shadow:0 2px 10px rgba(20,28,45,.04);color:#172b4d}.pep-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.pep-title{color:#172b4d;font-size:16px;font-weight:800}.pep-count{color:#52627a;font-size:12px;font-weight:600}.pep-grid{overflow-x:auto}.pep-head-row,.pep-row{display:grid;grid-template-columns:180px 52px minmax(240px,1fr) minmax(220px,1fr) 120px 72px;gap:10px;align-items:center;min-width:900px}.pep-head-row{background:#f5f7fa;border:1px solid #e5e9ef;border-radius:8px;padding:8px 10px;color:#40516b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.pep-row{padding:10px;border-bottom:1px solid #e9edf2}.pep-type{color:#172b4d;font-size:12px;line-height:1.3;font-weight:800}.pep-check{width:18px;height:18px;accent-color:#1677e8;cursor:pointer}.pep-input{width:100%;box-sizing:border-box;border:1px solid #cfd7e2;border-radius:8px;padding:9px 10px;background:#fff;color:#172b4d;font-size:12px;line-height:1.2}.pep-input::placeholder{color:#78869a;opacity:1}.pep-input:focus{outline:2px solid rgba(22,119,232,.15);border-color:#6b8fc1}.pep-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:8px;min-height:36px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}.pep-btn:disabled{opacity:.55;cursor:default}.pep-msg{margin-top:10px;color:#18794e;font-size:11px;font-weight:700}@media(max-width:900px){.pep-card{margin-left:12px;margin-right:12px;padding:14px}.pep-head-row{display:none}.pep-grid{overflow:visible}.pep-row{min-width:0;grid-template-columns:1fr 40px;gap:8px;padding:12px 0}.pep-type{grid-column:1;grid-row:1}.pep-check{grid-column:2;grid-row:1;justify-self:end}.pep-input:nth-of-type(1),.pep-input:nth-of-type(2){grid-column:1/-1}.pep-btn{grid-column:1/-1;width:100%}}`}</style>
    <div className="pep-head">
      <div className="pep-title">Professionisti esterni</div>
      <div className="pep-count">{assignedCount}/{rows.length} assegnati</div>
    </div>
    <div className="pep-grid">
      <div className="pep-head-row">
        <div>Ruolo</div><div>Attivo</div><div>Nome professionista / studio</div><div>Studio / società</div><div>Compenso (€)</div><div>Azioni</div>
      </div>
      {rows.map((row) => <div className="pep-row" key={row.id}>
        <div className="pep-type">{row.professional_type}</div>
        <input className="pep-check" type="checkbox" checked={!!row.assigned} onChange={(e) => update(row.id, { assigned: e.target.checked })} title="Assegnato" />
        <input className="pep-input" placeholder="Nome professionista" value={row.professional_name || ""} onChange={(e) => update(row.id, { professional_name: e.target.value })} />
        <input className="pep-input" placeholder="Studio / società" value={row.company_name || ""} onChange={(e) => update(row.id, { company_name: e.target.value })} />
        <input className="pep-input" type="text" inputMode="decimal" placeholder="Preventivo €" value={row.quoted_price ?? ""} onChange={(e) => update(row.id, { quoted_price: e.target.value })} />
        <button className="pep-btn" disabled={saving === row.id} onClick={() => save(row)}>{saving === row.id ? "…" : "Salva"}</button>
      </div>)}
    </div>
    {message && <div className="pep-msg">{message}</div>}
  </section>;
}
