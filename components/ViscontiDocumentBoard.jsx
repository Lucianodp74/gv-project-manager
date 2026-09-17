"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const statusLabel = { draft: "Bozza", active: "Valido", archived: "Archiviato" };

function fmt(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function ViscontiDocumentBoard({ documents = [], projects = [], connected = false }) {
  const [project, setProject] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");

  const types = useMemo(() => [...new Set(documents.map((d) => d.document_type).filter(Boolean))].sort(), [documents]);
  const filtered = useMemo(() => documents.filter((d) => {
    if (project !== "all" && d.project_id !== project) return false;
    if (type !== "all" && d.document_type !== type) return false;
    const q = search.trim().toLowerCase();
    return !q || `${d.title} ${d.project_name || ""} ${d.document_type || ""} ${d.status || ""}`.toLowerCase().includes(q);
  }), [documents, project, type, search]);

  return <main className="vd-shell"><style>{`.vd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.vd-top{background:#fff;border-bottom:1px solid #e7e9ee;padding:14px 34px;display:flex;justify-content:space-between;align-items:center;gap:18px}.vd-brand{font-weight:800}.vd-nav{display:flex;gap:6px;flex-wrap:wrap}.vd-nav a{padding:8px 11px;border-radius:9px;color:#687181;text-decoration:none;font-size:12px;font-weight:750}.vd-nav a:hover,.vd-nav .active{background:#172033;color:#fff}.vd-main{max-width:1400px;margin:auto;padding:30px 34px 50px}.vd-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a2;font-weight:750}.vd-title{font-size:31px;letter-spacing:-.04em;margin:5px 0}.vd-desc{font-size:14px;color:#70798a;margin:0 0 22px}.vd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vd-tools{padding:14px;display:grid;grid-template-columns:1.7fr 1fr 1fr;gap:8px;margin-bottom:16px}.vd-input,.vd-select{width:100%;box-sizing:border-box;border:1px solid #dfe3e9;border-radius:9px;padding:10px;background:#fff;color:#172033;font:inherit;font-size:12px}.vd-list{overflow:hidden}.vd-table{width:100%;border-collapse:collapse}.vd-table th{padding:11px 13px;text-align:left;color:#98a0ad;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.vd-table td{padding:13px;border-top:1px solid #eef0f3;font-size:12px;vertical-align:middle}.vd-name{font-weight:800}.vd-muted{color:#7d8594;font-size:11px;margin-top:3px}.vd-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800}.vd-green{background:#eaf8f1;color:#18794e}.vd-blue{background:#edf3ff;color:#3d61ad}.vd-amber{background:#fff5df;color:#996400}.vd-gray{background:#eef0f3;color:#687181}.vd-link{color:#3d61ad;text-decoration:none;font-weight:750}.vd-empty{padding:40px;text-align:center;color:#7d8594}.vd-note{margin-top:12px;padding:12px 14px;background:#fff;border:1px solid #e7e9ee;border-radius:10px;color:#7d8594;font-size:11px}@media(max-width:700px){.vd-top{padding:14px 18px;align-items:flex-start;flex-direction:column}.vd-main{padding:22px 16px}.vd-tools{grid-template-columns:1fr}.vd-table th:nth-child(3),.vd-table td:nth-child(3),.vd-table th:nth-child(5),.vd-table td:nth-child(5){display:none}}`}</style>
    <header className="vd-top"><div className="vd-brand">GRUPPO VISCONTI · WORK V2</div><nav className="vd-nav"><Link href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link href="/visconti-work/deadlines">Scadenze</Link><Link href="/visconti-work/connection">Connessioni</Link><Link href="/visconti-work/meetings">Riunioni</Link><Link className="active" href="/visconti-work/documents">Documenti</Link></nav></header>
    <section className="vd-main"><div className="vd-kicker">Archivio operativo</div><h1 className="vd-title">Documenti</h1><p className="vd-desc">Documenti collegati ai progetti, con stato e riferimento diretto. Nessun documento viene inventato: qui compaiono solo quelli realmente registrati.</p>
      <section className="vd-card vd-tools"><input className="vd-input" placeholder="Cerca documento o progetto…" value={search} onChange={(e)=>setSearch(e.target.value)} /><select className="vd-select" value={project} onChange={(e)=>setProject(e.target.value)}><option value="all">Tutti i progetti</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className="vd-select" value={type} onChange={(e)=>setType(e.target.value)}><option value="all">Tutti i tipi</option>{types.map((t)=><option key={t} value={t}>{t}</option>)}</select></section>
      <section className="vd-card vd-list"><table className="vd-table"><thead><tr><th>Documento</th><th>Progetto</th><th>Tipo</th><th>Stato</th><th>Inserito</th></tr></thead><tbody>{filtered.length ? filtered.map((d)=><tr key={d.id}><td><div className="vd-name">{d.url ? <a className="vd-link" href={d.url} target="_blank" rel="noreferrer">{d.title || "Documento"}</a> : (d.title || "Documento")}</div></td><td>{d.project_id ? <Link className="vd-link" href={`/visconti-work/projects?id=${d.project_id}`}>{d.project_name}</Link> : "—"}<div className="vd-muted">{d.project_region}</div></td><td>{d.document_type || "—"}</td><td><span className={`vd-badge ${d.status === "active" ? "vd-green" : d.status === "draft" ? "vd-amber" : d.status === "archived" ? "vd-gray" : "vd-blue"}`}>{statusLabel[d.status] || d.status || "Registrato"}</span></td><td>{fmt(d.created_at)}</td></tr>) : <tr><td colSpan="5" className="vd-empty">{connected ? "Nessun documento registrato." : "Documenti non disponibili."}</td></tr>}</tbody></table></section>
      <div className="vd-note">La sezione è volutamente semplice: il documento resta collegato al progetto e può essere aperto dalla sua fonte. L'inserimento massivo/upload potrà essere aggiunto senza cambiare questa struttura.</div>
    </section>
  </main>;
}
