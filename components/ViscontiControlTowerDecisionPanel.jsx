"use client";

import Link from "next/link";
import ViscontiControlTowerDecision from "./ViscontiControlTowerDecision";

export default function ViscontiControlTowerDecisionPanel({ projects = [] }) {
  const pending = projects.filter((p) => (p.go_no_go_status || "pending") === "pending");
  if (!pending.length) return null;

  return <section className="vct-panel"><style>{`.vct-panel{margin:0 auto 18px;max-width:1400px;background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:18px 20px;box-shadow:0 2px 10px rgba(20,28,45,.03);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.vct-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.vct-panel-title{font-size:15px;font-weight:850}.vct-panel-meta{font-size:10px;color:#7d8594}.vct-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.vct-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 11px;border:1px solid #eef0f3;border-radius:10px}.vct-name{font-size:11px;font-weight:800}.vct-meta{font-size:9px;color:#7d8594;margin-top:3px}.vct-link{color:#172033;text-decoration:none}.vct-link:hover{text-decoration:underline}@media(max-width:800px){.vct-list{grid-template-columns:1fr}}`}</style><div className="vct-panel-head"><div><div className="vct-panel-title">Decisioni GO / NO-GO</div><div className="vct-panel-meta">{pending.length} progetti in attesa · la decisione parte solo da un'azione esplicita</div></div></div><div className="vct-list">{pending.map((p) => <div className="vct-row" key={p.project_id}><div><Link className="vct-link vct-name" href={`/visconti-work/projects?id=${p.project_id}`}>{p.project_name}</Link><div className="vct-meta">{p.power_mw ? `${p.power_mw} MW` : ""}{p.responsible_name ? ` · ${p.responsible_name}` : ""}</div></div><ViscontiControlTowerDecision projectId={p.project_id} status={p.go_no_go_status || "pending"} /></div>)}</div></section>;
}
