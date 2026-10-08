"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ViscontiGoogleDrivePicker from "@/components/ViscontiGoogleDrivePicker";

const statusLabel = { draft: "Bozza", active: "Valido", archived: "Archiviato" };

function fmt(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function ViscontiDocumentBoard({ documents = [], projects = [], connected = false }) {
  const [project, setProject] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project_id: "", title: "", document_type: "", drive_url: "", drive_file_id: "", drive_mime_type: "", drive_size_bytes: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const types = useMemo(() => [...new Set(documents.map((d) => d.document_type).filter(Boolean))].sort(), [documents]);
  const filtered = useMemo(() => documents.filter((d) => {
    if (project !== "all" && d.project_id !== project) return false;
    if (type !== "all" && d.document_type !== type) return false;
    const q = search.trim().toLowerCase();
    return !q || `${d.title} ${d.project_name || ""} ${d.document_type || ""} ${d.status || ""}`.toLowerCase().includes(q);
  }), [documents, project, type, search]);

  async function addDriveDocument(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/visconti-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Collegamento non riuscito.");
      setMessage("Documento Drive collegato.");
      setForm({ project_id: "", title: "", document_type: "", drive_url: "", drive_file_id: "", drive_mime_type: "", drive_size_bytes: null });
      setShowForm(false);
      window.location.reload();
    } catch (error) {
      setMessage(error.message || "Collegamento non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="vd-shell">
    <style>{`.vd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.vd-top{background:#fff;border-bottom:1px solid #e7e9ee;padding:14px 34px;display:flex;justify-content:space-between;align-items:center;gap:18px}.vd-brand{font-weight:800}.vd-nav{display:flex;gap:6px;flex-wrap:wrap}.vd-nav a{padding:8px 11px;border-radius:9px;color:#687181;text-decoration:none;font-size:12px;font-weight:750}.vd-nav a:hover,.vd-nav .active{background:#172033;color:#fff}.vd-main{max-width:1400px;margin:auto;padding:30px 34px 50px}.vd-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a2;font-weight:750}.vd-title{font-size:31px;letter-spacing:-.04em;margin:5px 0}.vd-desc{font-size:14px;color:#70798a;margin:0 0 16px}.vd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vd-tools{padding:14px;display:grid;grid-template-columns:1.7fr 1fr 1fr auto;gap:8px;margin-bottom:16px}.vd-input,.vd-select{width:100%;box-sizing:border-box;border:1px solid #dfe3e9;border-radius:9px;padding:10px;background:#fff;color:#172033;font:inherit;font-size:12px}.vd-btn{border:1px solid #172033;background:#172033;color:#fff;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer}.vd-form{padding:14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.vd-form .full{grid-column:1/-1}.vd-drive-row{grid-column:1/-1;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.vd-drive-or{font-size:11px;color:#7d8594}.vd-picker-error{margin-top:7px;color:#b42318;font-size:11px;font-weight:700}.vd-help{font-size:11px;color:#7d8594;line-height:1.45}.vd-list{overflow:hidden}.vd-table{width:100%;border-collapse:collapse}.vd-table th{padding:11px 13px;text-align:left;color:#98a0ad;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.vd-table td{padding:13px;border-top:1px solid #eef0f3;font-size:12px;vertical-align:middle}.vd-name{font-weight:800}.vd-muted{color:#7d8594;font-size:11px;margin-top:3px}.vd-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800}.vd-green{background:#eaf8f1;color:#18794e}.vd-amber{background:#fff5df;color:#996400}.vd-gray{background:#eef0f3;color:#687181}.vd-link{color:#3d61ad;text-decoration:none;font-weight:750}.vd-empty{padding:40px;text-align:center;color:#7d8594}.vd-note{margin-top:12px;padding:12px 14px;background:#fff;border:1px solid #e7e9ee;border-radius:10px;color:#7d8594;font-size:11px}.vd-msg{margin-bottom:12px;padding:10px 12px;border-radius:9px;background:#eaf8f1;color:#18794e;font-size:11px;font-weight:700}@media(max-width:900px){.vd-tools{grid-template-columns:1fr}.vd-form{grid-template-columns:1fr}.vd-form .full{grid-column:auto}}@media(max-width:700px){.vd-top{padding:14px 18px;align-items:flex-start;flex-direction:column}.vd-main{padding:22px 16px}.vd-table th:nth-child(3),.vd-table td:nth-child(3),.vd-table th:nth-child(5),.vd-table td:nth-child(5){display:none}}`}</style>
    <header className="vd-top"><div className="vd-brand">GRUPPO VISCONTI · WORK V2</div><nav className="vd-nav"><Link href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link href="/visconti-work/deadlines">Scadenze</Link><Link href="/visconti-work/connection">Connessioni</Link><Link href="/visconti-work/meetings">Riunioni</Link><Link className="active" href="/visconti-work/documents">Documenti</Link></nav></header>
    <section className="vd-main">
      <div className="vd-kicker">Archivio operativo</div><h1 className="vd-title">Documenti</h1>
      <p className="vd-desc">I file restano su Google Drive. Gruppo Visconti conserva solo il collegamento e i dati operativi del documento: nessuna copia pesante nel portale.</p>
      {message && <div className="vd-msg">{message}</div>}
      <section className="vd-card vd-tools">
        <input className="vd-input" placeholder="Cerca documento o progetto…" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="vd-select" value={project} onChange={(e)=>setProject(e.target.value)}><option value="all">Tutti i progetti</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className="vd-select" value={type} onChange={(e)=>setType(e.target.value)}><option value="all">Tutti i tipi</option>{types.map((t)=><option key={t} value={t}>{t}</option>)}</select>
        <button className="vd-btn" onClick={()=>setShowForm((v)=>!v)}>{showForm ? "Chiudi" : "+ Collega da Drive"}</button>
      </section>
      {showForm && <form className="vd-card vd-form" onSubmit={addDriveDocument}>
        <select className="vd-select" required value={form.project_id} onChange={(e)=>setForm({...form,project_id:e.target.value})}><option value="">Seleziona progetto</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className="vd-input" required placeholder="Nome documento" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
        <input className="vd-input" placeholder="Tipo documento (es. Terna, Tecnico, Autorizzazione)" value={form.document_type} onChange={(e)=>setForm({...form,document_type:e.target.value})}/>
        <div className="vd-drive-row">
          <ViscontiGoogleDrivePicker onPicked={(file) => setForm((prev) => ({
            ...prev,
            title: file.name || prev.title,
            drive_url: file.url || prev.drive_url,
            drive_file_id: file.id || "",
            drive_mime_type: file.mimeType || "",
            drive_size_bytes: file.sizeBytes || null,
          }))} />
          <span className="vd-drive-or">oppure incolla il link</span>
          <input className="vd-input" required type="url" placeholder="https://drive.google.com/…" value={form.drive_url} onChange={(e)=>setForm({...form,drive_url:e.target.value})}/>
        </div>
        <div className="vd-help full">Il file non viene copiato nel portale. Inseriamo solo il riferimento al file che resta nel vostro Drive.</div>
        <div className="full"><button className="vd-btn" disabled={saving}>{saving ? "Salvataggio…" : "Salva collegamento Drive"}</button></div>
      </form>}
      <section className="vd-card vd-list"><table className="vd-table"><thead><tr><th>Documento</th><th>Progetto</th><th>Tipo</th><th>Stato</th><th>Inserito</th></tr></thead><tbody>{filtered.length ? filtered.map((d)=><tr key={d.id}><td><div className="vd-name">{(d.drive_url || d.url) ? <a className="vd-link" href={d.drive_url || d.url} target="_blank" rel="noreferrer">{d.title || "Documento"}</a> : (d.title || "Documento")}</div><div className="vd-muted">{d.drive_url ? "Google Drive" : "Fonte registrata"}</div></td><td>{d.project_id ? <Link className="vd-link" href={`/visconti-work/projects?id=${d.project_id}`}>{d.project_name}</Link> : "—"}<div className="vd-muted">{d.project_region}</div></td><td>{d.document_type || "—"}</td><td><span className={`vd-badge ${d.status === "active" ? "vd-green" : d.status === "draft" ? "vd-amber" : "vd-gray"}`}>{statusLabel[d.status] || d.status || "Registrato"}</span></td><td>{fmt(d.created_at)}</td></tr>) : <tr><td colSpan="5" className="vd-empty">{connected ? "Nessun documento registrato." : "Documenti non disponibili."}</td></tr>}</tbody></table></section>
      <div className="vd-note">I documenti pesanti restano su Drive e non vengono duplicati nel portale. L'accesso resta quello previsto dal vostro Google Drive.</div>
    </section>
  </main>;
}
