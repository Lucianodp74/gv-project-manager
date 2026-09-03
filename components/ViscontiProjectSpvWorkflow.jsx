"use client";

import { useEffect, useMemo, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5aW5kZHZ2Y25seGVzaWtlZ2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDk0MTIsImV4cCI6MjEwMzkyNTQxMn0.408iZrkj5i2Ikh0FL91N1a1AuDJFAAIehD0H9q6G9s";

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Operazione non riuscita (${response.status}).`);
  if (response.status === 204) return [];
  return response.json();
}

const spvLabels = { not_started: "Non avviata", to_create: "Da costituire", in_progress: "In corso", created: "Costituita", cancelled: "Annullata" };
const transferLabels = { not_started: "Non avviata", to_request: "Da richiedere", in_progress: "In corso", integrations: "Integrazioni", accepted: "Accettata", completed: "Completata", not_applicable: "Non applicabile" };

export default function ViscontiProjectSpvWorkflow({ projectId }) {
  const [project, setProject] = useState(null), [saving, setSaving] = useState(false), [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    request(`projects?id=eq.${encodeURIComponent(projectId)}&select=id,name,go_no_go_status,go_no_go_date,go_no_go_notes,spv_name,spv_status,spv_vat_number,spv_tax_code,spv_pec,spv_registered_office,spv_incorporation_date,connection_holder,connection_transfer_status,connection_transfer_request_date,connection_transfer_completed_date,connection_transfer_protocol,spv_notes&limit=1`)
      .then(rows => setProject(rows[0] || null)).catch(e => setError(e.message));
  }, [projectId]);

  const go = project?.go_no_go_status || "pending";
  const spvReady = project?.spv_status === "created";
  const transferReady = project?.connection_transfer_status === "completed";
  const nextStep = useMemo(() => {
    if (go === "pending") return "Decidere GO / NO-GO";
    if (go === "no_go") return "Archiviare il progetto";
    if (!spvReady) return "Costituire la società veicolo e completare i dati societari";
    if (!transferReady) return "Richiedere e completare la voltura della connessione";
    return "Voltura completata: la SPV è il soggetto della connessione";
  }, [go, spvReady, transferReady]);

  async function decide(next) {
    if (!project) return;
    if (!window.confirm(next === "go" ? "Confermare GO e avviare il percorso SPV + voltura?" : "Confermare NO-GO? Il progetto potrà essere archiviato.")) return;
    setSaving(true); setError("");
    try {
      const date = new Date().toISOString().slice(0, 10);
      await request(`projects?id=eq.${encodeURIComponent(project.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ go_no_go_status: next, go_no_go_date: date, spv_status: next === "go" ? "to_create" : "cancelled", connection_transfer_status: next === "go" ? "to_request" : "not_applicable", updated_at: new Date().toISOString() }) });
      if (next === "go") {
        const existing = await request(`visconti_task_board?project_id=eq.${encodeURIComponent(project.id)}&select=id,title`);
        const existingTitles = new Set(existing.map(t => t.title));
        const tasks = [
          ["Costituire società veicolo", "Costituire la SPV del progetto dopo la decisione GO.", "general"],
          ["Aprire P.IVA e PEC", "Completare P.IVA, codice fiscale e PEC della SPV.", "general"],
          ["Richiedere voltura della connessione", "Voltura della connessione da Gruppo Visconti Srl alla SPV.", "connection"],
        ].filter(([title]) => !existingTitles.has(title)).map(([title, description, category]) => ({ project_id: project.id, title, description, workflow_status: "todo", attention_state: "normal", priority: "high", category, next_action: description }));
        if (tasks.length) await request("visconti_task_board", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(tasks) });
      }
      setProject(p => ({ ...p, go_no_go_status: next, go_no_go_date: date, spv_status: next === "go" ? "to_create" : "cancelled", connection_transfer_status: next === "go" ? "to_request" : "not_applicable" }));
    } catch (e) { setError(e.message || "Operazione non riuscita."); }
    finally { setSaving(false); }
  }

  async function save(fields) {
    if (!project) return;
    setSaving(true); setError("");
    try {
      await request(`projects?id=eq.${encodeURIComponent(project.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }) });
      setProject(p => ({ ...p, ...fields }));
    } catch (e) { setError(e.message || "Salvataggio non riuscito."); }
    finally { setSaving(false); }
  }

  if (!project) return null;
  return <section className="spv-card"><style>{`.spv-card{margin-top:18px;background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:20px;box-shadow:0 2px 10px rgba(20,28,45,.03);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.spv-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.spv-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a1;font-weight:800}.spv-title{font-size:17px;font-weight:800;margin-top:5px}.spv-next{font-size:11px;color:#687181;margin-top:5px}.spv-actions{display:flex;gap:7px;flex-wrap:wrap}.spv-btn{border:1px solid #dfe3e9;background:#fff;border-radius:9px;padding:8px 11px;font-size:10px;font-weight:800;cursor:pointer}.spv-go{background:#172b4d;color:#fff;border-color:#172b4d}.spv-no{color:#a33;background:#fff6f5}.spv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.spv-box{background:#f8f9fb;border-radius:10px;padding:12px}.spv-box small{display:block;color:#8a92a1;font-size:9px;text-transform:uppercase}.spv-box b{display:block;margin-top:5px;font-size:12px}.spv-form{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.spv-form input{width:100%;box-sizing:border-box;border:1px solid #dfe3e9;border-radius:8px;padding:8px;font-size:11px}.spv-section{margin-top:17px;padding-top:15px;border-top:1px solid #eef0f3}.spv-section h4{margin:0 0 9px;font-size:12px}.spv-error{color:#b43a34;font-size:10px;margin-top:9px}@media(max-width:800px){.spv-grid,.spv-form{grid-template-columns:1fr 1fr}}@media(max-width:560px){.spv-head{display:block}.spv-actions{margin-top:12px}.spv-grid,.spv-form{grid-template-columns:1fr}}`}</style>
    <div className="spv-head"><div><div className="spv-kicker">Percorso societario e voltura</div><div className="spv-title">GO / NO-GO → SPV → voltura connessione</div><div className="spv-next"><b>Prossimo passo:</b> {nextStep}</div></div><div className="spv-actions"><button className="spv-btn spv-go" disabled={saving || go === "go"} onClick={() => decide("go")}>{go === "go" ? "GO confermato" : "Conferma GO"}</button><button className="spv-btn spv-no" disabled={saving || go === "no_go"} onClick={() => decide("no_go")}>{go === "no_go" ? "NO-GO confermato" : "Conferma NO-GO"}</button></div></div>
    <div className="spv-grid"><div className="spv-box"><small>Decisione</small><b>{go === "go" ? "GO" : go === "no_go" ? "NO-GO" : "Da decidere"}</b></div><div className="spv-box"><small>Società veicolo</small><b>{spvLabels[project.spv_status] || project.spv_status}</b></div><div className="spv-box"><small>Voltura connessione</small><b>{transferLabels[project.connection_transfer_status] || project.connection_transfer_status}</b></div></div>
    {go === "go" && <>
      <div className="spv-section"><h4>Società veicolo</h4><div className="spv-form"><input placeholder="Nome SPV" value={project.spv_name || ""} onChange={e => setProject(p => ({...p, spv_name:e.target.value}))} onBlur={e => save({spv_name:e.target.value})}/><input placeholder="P.IVA" value={project.spv_vat_number || ""} onChange={e => setProject(p => ({...p, spv_vat_number:e.target.value}))} onBlur={e => save({spv_vat_number:e.target.value})}/><input placeholder="Codice fiscale" value={project.spv_tax_code || ""} onChange={e => setProject(p => ({...p, spv_tax_code:e.target.value}))} onBlur={e => save({spv_tax_code:e.target.value})}/><input placeholder="PEC" value={project.spv_pec || ""} onChange={e => setProject(p => ({...p, spv_pec:e.target.value}))} onBlur={e => save({spv_pec:e.target.value})}/><input placeholder="Sede" value={project.spv_registered_office || ""} onChange={e => setProject(p => ({...p, spv_registered_office:e.target.value}))} onBlur={e => save({spv_registered_office:e.target.value})}/><input placeholder="Data costituzione YYYY-MM-DD" value={project.spv_incorporation_date || ""} onChange={e => setProject(p => ({...p, spv_incorporation_date:e.target.value}))} onBlur={e => save({spv_incorporation_date:e.target.value || null})}/></div><div className="spv-actions" style={{marginTop:10}}><button className="spv-btn" disabled={saving} onClick={() => save({spv_status: "in_progress"})}>Costituzione in corso</button><button className="spv-btn" disabled={saving} onClick={() => save({spv_status: "created"})}>Segna SPV costituita</button></div></div>
      <div className="spv-section"><h4>Voltura della connessione</h4><div className="spv-form"><input placeholder="Protocollo voltura" value={project.connection_transfer_protocol || ""} onChange={e => setProject(p => ({...p, connection_transfer_protocol:e.target.value}))} onBlur={e => save({connection_transfer_protocol:e.target.value})}/><input placeholder="Data richiesta YYYY-MM-DD" value={project.connection_transfer_request_date || ""} onChange={e => setProject(p => ({...p, connection_transfer_request_date:e.target.value}))} onBlur={e => save({connection_transfer_request_date:e.target.value || null})}/><input placeholder="Data completamento YYYY-MM-DD" value={project.connection_transfer_completed_date || ""} onChange={e => setProject(p => ({...p, connection_transfer_completed_date:e.target.value}))} onBlur={e => save({connection_transfer_completed_date:e.target.value || null})}/></div><div className="spv-actions" style={{marginTop:10}}><button className="spv-btn" disabled={saving} onClick={() => save({connection_transfer_status: "in_progress"})}>Voltura richiesta / in corso</button><button className="spv-btn" disabled={saving || !spvReady} onClick={() => save({connection_transfer_status: "completed", connection_holder: project.spv_name || "SPV"})}>Segna voltura completata</button></div></div>
    </>}
    {error && <div className="spv-error">{error}</div>}
  </section>;
}
