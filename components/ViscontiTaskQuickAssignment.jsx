"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export default function ViscontiTaskQuickAssignment({ tasks = [], members = [] }) {
  const router = useRouter();
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [project, setProject] = useState("all");
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const projects = useMemo(() => Array.from(new Map(tasks.filter(t => t.project_id).map(t => [t.project_id, t.project_name || "Progetto"])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [tasks]);
  const rows = useMemo(() => tasks.filter(t => {
    if (["done", "cancelled"].includes(t.workflow_status)) return false;
    if (onlyUnassigned && t.assignee_person_id) return false;
    if (project !== "all" && t.project_id !== project) return false;
    return true;
  }), [tasks, onlyUnassigned, project]);

  async function assign(taskId, responsibleId) {
    setSavingId(taskId); setError("");
    try {
      const response = await fetch("/api/visconti-work/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, assignee_person_id: responsibleId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Assegnazione non riuscita");
      router.refresh();
    } catch (e) {
      setError(e.message || "Assegnazione non riuscita");
    } finally {
      setSavingId("");
    }
  }

  return <section className="vqa-card">
    <style>{`.vqa-card{margin:0 auto 18px;max-width:1440px;background:#fff;border:1px solid #e5e8ed;border-radius:14px;box-shadow:0 2px 10px rgba(20,28,45,.03);overflow:hidden}.vqa-head{padding:17px 20px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;justify-content:space-between;gap:16px}.vqa-title{font-size:16px;font-weight:800;color:#172033}.vqa-sub{font-size:11px;color:#7d8594;margin-top:3px}.vqa-count{font-size:11px;font-weight:800;padding:7px 10px;border-radius:999px;background:#fff5df;color:#996400}.vqa-tools{padding:12px 20px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #eef0f3}.vqa-select{border:1px solid #dfe3e9;background:#fff;border-radius:8px;padding:8px 10px;font-size:11px;color:#172033}.vqa-check{display:flex;align-items:center;gap:7px;font-size:11px;color:#596273;font-weight:700}.vqa-table{width:100%;border-collapse:collapse}.vqa-table th{padding:9px 20px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#98a0ad}.vqa-table td{padding:10px 20px;border-top:1px solid #f0f1f4;font-size:11px;color:#273044}.vqa-task{font-weight:750}.vqa-muted{color:#7d8594}.vqa-person{min-width:170px;border:1px solid #dfe3e9;background:#fff;border-radius:8px;padding:7px 9px;font-size:11px;color:#172033}.vqa-person:disabled{opacity:.55}.vqa-empty{padding:22px 20px;color:#7d8594;font-size:11px}.vqa-error{padding:10px 20px;background:#fff0ef;color:#b43a34;font-size:11px}@media(max-width:800px){.vqa-head{align-items:flex-start}.vqa-tools{flex-wrap:wrap}.vqa-table{min-width:680px}.vqa-card{overflow:auto}.vqa-head,.vqa-tools,.vqa-error{min-width:680px}}`}</style>
    <div className="vqa-head"><div><div className="vqa-title">Assegnazione attività</div><div className="vqa-sub">Assegna rapidamente le attività al collaboratore corretto senza aprire ogni scheda.</div></div><span className="vqa-count">{rows.length} da assegnare</span></div>
    <div className="vqa-tools"><label className="vqa-check"><input type="checkbox" checked={onlyUnassigned} onChange={e => setOnlyUnassigned(e.target.checked)} /> Solo non assegnate</label><select className="vqa-select" value={project} onChange={e => setProject(e.target.value)}><option value="all">Tutti i progetti</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
    {error && <div className="vqa-error">{error}</div>}
    {rows.length ? <table className="vqa-table"><thead><tr><th>Attività</th><th>Progetto</th><th>Scadenza</th><th>Responsabile</th></tr></thead><tbody>{rows.map(task => <tr key={task.id}><td><div className="vqa-task">{task.title}</div><div className="vqa-muted">{task.category || "Generale"}</div></td><td className="vqa-muted">{task.project_name || "—"}</td><td className="vqa-muted">{fmt(task.due_date)}</td><td><select className="vqa-person" value={task.assignee_person_id || ""} disabled={savingId === task.id} onChange={e => assign(task.id, e.target.value)}><option value="">Non assegnata</option>{members.map(member => <option key={member.id} value={member.id}>{member.display_name}</option>)}</select></td></tr>)}</tbody></table> : <div className="vqa-empty">Nessuna attività corrisponde ai filtri.</div>}
  </section>;
}
