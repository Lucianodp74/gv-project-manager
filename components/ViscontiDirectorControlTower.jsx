"use client";

import Link from "next/link";

const stage = { opportunity: "Opportunità", connection: "Connessione", go_decision: "GO / NO-GO", development: "Sviluppo", presentation: "Presentazione", authorization: "Autorizzazione", commercial: "Commerciale", authorized: "Autorizzato", closed: "Chiuso" };

function Badge({ children, tone = "blue" }) {
  return <span className={`vd-badge vd-${tone}`}>{children}</span>;
}

function tone(p) {
  if (p.risk_level === "critical") return "red";
  if (p.risk_level === "attention" || Number(p.blocked_tasks || 0) > 0 || Number(p.pending_decisions || 0) > 0) return "amber";
  return "green";
}

function taskHref(task) {
  const query = new URLSearchParams({ task: task.id });
  if (task.project_id) query.set("project", task.project_id);
  return `/visconti-work/tasks?${query.toString()}`;
}

export default function ViscontiDirectorControlTower({ data = {} }) {
  const projects = data.projects || [];
  const tasks = data.tasks || [];
  const open = tasks.filter((t) => !["done", "cancelled"].includes(t.workflow_status));
  const blocked = tasks.filter((t) => t.workflow_status === "blocked" || t.attention_state === "blocked");
  const overdue = tasks.filter((t) => t.attention_state === "overdue");
  const exceptions = projects
    .filter((p) => p.risk_level !== "normal" || Number(p.blocked_tasks || 0) > 0 || Number(p.pending_decisions || 0) > 0 || Number(p.open_authority_items || 0) > 0)
    .slice(0, 8);
  const focus = [...open]
    .filter((t) => t.attention_state === "overdue" || t.attention_state === "urgent" || t.workflow_status === "blocked")
    .slice(0, 8);

  return <main className="vd-shell"><style>{`.vd-shell{min-height:100vh;background:#f6f7f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.vd-top{background:#fff;border-bottom:1px solid #e7e9ee;padding:14px 34px;display:flex;justify-content:space-between;align-items:center;gap:18px}.vd-brand{font-weight:800}.vd-nav{display:flex;gap:6px;flex-wrap:wrap}.vd-nav a{padding:8px 11px;border-radius:9px;color:#687181;text-decoration:none;font-size:12px;font-weight:750}.vd-nav a.active,.vd-nav a:hover{background:#172033;color:#fff}.vd-main{max-width:1400px;margin:auto;padding:30px 34px 50px}.vd-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#8a92a2;font-weight:750}.vd-title{font-size:31px;letter-spacing:-.04em;margin:5px 0}.vd-desc{font-size:14px;color:#70798a;margin:0 0 22px}.vd-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.vd-card{background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vd-kpi{padding:17px 18px}.vd-label{font-size:11px;color:#7d8594}.vd-value{display:block;font-size:27px;font-weight:800;margin-top:5px}.vd-body{padding:20px}.vd-columns{display:grid;grid-template-columns:1.2fr .8fr;gap:18px}.vd-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.vd-head strong{font-size:15px}.vd-list{display:grid;gap:8px}.vd-row{display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px;border:1px solid #eef0f3;border-radius:10px;text-decoration:none;color:inherit}.vd-name{font-size:12px;font-weight:800}.vd-meta{font-size:10px;color:#7d8594;margin-top:4px;line-height:1.4}.vd-badge{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}.vd-green{background:#eaf8f1;color:#18794e}.vd-amber{background:#fff5df;color:#996400}.vd-red{background:#fff0ef;color:#b43a34}.vd-blue{background:#edf3ff;color:#3d61ad}.vd-muted{color:#7d8594;font-size:11px}.vd-empty{padding:20px 0;color:#7d8594;font-size:12px}.vd-actions{display:flex;gap:8px;margin-top:18px}.vd-action{padding:9px 12px;border:1px solid #dfe3e9;border-radius:9px;text-decoration:none;color:#172033;font-size:11px;font-weight:750;background:#fff}@media(max-width:900px){.vd-grid{grid-template-columns:1fr 1fr}.vd-columns{grid-template-columns:1fr}.vd-main{padding:24px 18px}}@media(max-width:600px){.vd-grid{grid-template-columns:1fr 1fr}.vd-top{padding:14px 18px;align-items:flex-start;flex-direction:column}}`}</style>
    <header className="vd-top"><div className="vd-brand">GRUPPO VISCONTI · CONTROL TOWER</div><nav className="vd-nav"><Link className="active" href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link href="/visconti-work/connection">Connessioni</Link></nav></header>
    <section className="vd-main"><div className="vd-kicker">Direzione</div><h1 className="vd-title">Buongiorno, Antonio</h1><p className="vd-desc">Qui vedi solo ciò che richiede attenzione: blocchi, scadenze, decisioni e prossime azioni.</p>
      <div className="vd-grid"><div className="vd-card vd-kpi"><div className="vd-label">Progetti</div><strong className="vd-value">{projects.length}</strong></div><div className="vd-card vd-kpi"><div className="vd-label">Attività aperte</div><strong className="vd-value">{open.length}</strong></div><div className="vd-card vd-kpi"><div className="vd-label">Blocchi</div><strong className="vd-value">{blocked.length}</strong></div><div className="vd-card vd-kpi"><div className="vd-label">Scadute</div><strong className="vd-value">{overdue.length}</strong></div></div>
      <div className="vd-columns"><section className="vd-card vd-body"><div className="vd-head"><strong>Progetti da seguire</strong><span className="vd-muted">{exceptions.length}</span></div><div className="vd-list">{exceptions.length ? exceptions.map((p) => <Link className="vd-row" key={p.id} href={`/visconti-work/projects?id=${p.id}`}><div><div className="vd-name">{p.name}</div><div className="vd-meta">{stage[p.project_stage] || p.project_stage || "—"} · {p.next_action || "Nessuna prossima azione"}</div></div><Badge tone={tone(p)}>{p.pending_decisions ? `${p.pending_decisions} decisione` : p.blocked_tasks ? `${p.blocked_tasks} blocco` : p.open_authority_items ? `${p.open_authority_items} ente` : p.open_specialists ? `${p.open_specialists} specialisti` : p.risk_level === "critical" ? "Critico" : "Attenzione"}</Badge></Link>) : <div className="vd-empty">Nessun progetto richiede attenzione.</div>}</div></section>
        <aside className="vd-card vd-body"><div className="vd-head"><strong>Da fare adesso</strong><span className="vd-muted">{focus.length}</span></div><div className="vd-list">{focus.length ? focus.map((t) => <Link className="vd-row" key={t.id} href={taskHref(t)}><div><div className="vd-name">{t.title}</div><div className="vd-meta">{t.assignee_name || "Non assegnata"} · {t.project_name || "—"}{t.next_action ? ` · ${t.next_action}` : ""}</div></div><Badge tone={t.workflow_status === "blocked" || t.attention_state === "overdue" ? "red" : "amber"}>{t.due_date || "Urgente"}</Badge></Link>) : <div className="vd-empty">Nessuna attività urgente.</div>}</div><div className="vd-actions"><Link className="vd-action" href="/visconti-work/tasks">Apri attività</Link><Link className="vd-action" href="/visconti-work/connection">Apri connessioni</Link></div></aside></div>
    </section>
  </main>;
}
