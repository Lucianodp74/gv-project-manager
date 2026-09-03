"use client";

import { useState } from "react";

const initialForm = { name: "", project_code: "", region: "", power_mw: "", notes: "" };

export default function ViscontiNewProject({ members = [] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Inserisci il nome del progetto."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/visconti-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), project_code: form.project_code.trim(), region: form.region.trim(), notes: form.notes.trim(), power_mw: form.power_mw === "" ? null : Number(form.power_mw) }),
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}
      if (!response.ok) throw new Error(data.error || `Creazione non riuscita (${response.status}).`);
      window.location.href = `/visconti-work/projects?id=${encodeURIComponent(data.project.id)}`;
    } catch (err) {
      setError(err.message || "Creazione non riuscita.");
      setSaving(false);
    }
  }

  return <>
    <style>{`.np-btn{border:1px solid #172b4d;background:#172b4d;color:#fff;border-radius:9px;padding:9px 13px;font-size:11px;font-weight:800;cursor:pointer}.np-overlay{position:fixed;inset:0;background:rgba(15,23,42,.34);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}.np-modal{width:min(620px,100%);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(15,23,42,.22);padding:22px}.np-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.np-title{font-size:20px;font-weight:850;color:#172033}.np-sub{font-size:11px;color:#737c8c;margin-top:4px}.np-close{border:0;background:#f3f5f7;border-radius:8px;width:32px;height:32px;cursor:pointer}.np-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.np-field{display:flex;flex-direction:column;gap:5px}.np-field.full{grid-column:1/-1}.np-label{font-size:10px;font-weight:800;color:#697386}.np-input,.np-select,.np-textarea{border:1px solid #dfe3e9;border-radius:9px;padding:10px;font:inherit;font-size:11px;outline:none}.np-textarea{min-height:78px;resize:vertical}.np-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.np-cancel{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:9px 13px;font-size:11px;font-weight:750;cursor:pointer}.np-error{margin-top:12px;padding:9px;border-radius:8px;background:#fff0ef;color:#b43a34;font-size:10px}@media(max-width:620px){.np-grid{grid-template-columns:1fr}.np-field.full{grid-column:auto}}`}</style>
    <button className="np-btn" onClick={() => { setOpen(true); setError(""); }}>+ Nuovo progetto</button>
    {open && <div className="np-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setOpen(false); }}>
      <form className="np-modal" onSubmit={submit}>
        <div className="np-head"><div><div className="np-title">Nuovo progetto</div><div className="np-sub">Il progetto parte come attivo, fase Opportunità e GO / NO-GO da decidere.</div></div><button type="button" className="np-close" onClick={() => !saving && setOpen(false)}>×</button></div>
        <div className="np-grid">
          <label className="np-field full"><span className="np-label">Nome progetto *</span><input autoFocus className="np-input" value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Es. Impianto fotovoltaico Casamassima" /></label>
          <label className="np-field"><span className="np-label">Codice progetto</span><input className="np-input" value={form.project_code} onChange={(e) => change("project_code", e.target.value)} placeholder="Es. H028" /></label>
          <label className="np-field"><span className="np-label">Regione / località</span><input className="np-input" value={form.region} onChange={(e) => change("region", e.target.value)} placeholder="Es. Puglia · Bari" /></label>
          <label className="np-field"><span className="np-label">Potenza MW</span><input className="np-input" type="number" min="0" step="0.01" value={form.power_mw} onChange={(e) => change("power_mw", e.target.value)} placeholder="0" /></label>
          <label className="np-field"><span className="np-label">Responsabile</span><select className="np-select" value={form.responsible_id || ""} onChange={(e) => change("responsible_id", e.target.value)}><option value="">Non assegnato</option>{members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}</select></label>
          <label className="np-field full"><span className="np-label">Note</span><textarea className="np-textarea" value={form.notes} onChange={(e) => change("notes", e.target.value)} placeholder="Informazioni iniziali utili al progetto…" /></label>
        </div>
        {error && <div className="np-error">{error}</div>}
        <div className="np-footer"><button type="button" className="np-cancel" disabled={saving} onClick={() => setOpen(false)}>Annulla</button><button type="submit" className="np-btn" disabled={saving}>{saving ? "Creazione…" : "Crea progetto"}</button></div>
      </form>
    </div>}
  </>;
}
