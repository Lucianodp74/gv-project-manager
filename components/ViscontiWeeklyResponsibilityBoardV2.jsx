"use client";

import { useMemo, useState } from "react";

const AREA_RULES = [
  { area: "Connessioni", people: ["Dario"] },
  { area: "Richieste", people: ["Federica"] },
  { area: "PTO", people: ["Giggi", "Dario"] },
];
const REVIEW_TEAM = ["Dario", "Roberto", "Carmelo", "Francesco"];
const norm = v => String(v || "").trim().toLowerCase();

function inferArea(task) {
  const text = `${task?.title || ""} ${task?.description || ""} ${task?.category || ""}`.toLowerCase();
  if (/pto|point.?of.?transfer/.test(text)) return "PTO";
  if (/richiest|request/.test(text)) return "Richieste";
  if (/connession|terna|tica|preventiv|voltura/.test(text) || task?.connection_practice_id) return "Connessioni";
  return "";
}
function statusLabel(task) {
  if (task.workflow_status === "done") return "Fatto";
  if (task.workflow_status === "blocked" || task.attention_state === "blocked") return "Bloccato";
  if (task.workflow_status === "in_progress") return "In corso";
  if (task.due_date && new Date(task.due_date) < new Date(new Date().toISOString().slice(0,10))) return "Scaduto";
  return "Da fare";
}

export default function ViscontiWeeklyResponsibilityBoardV2({ tasks = [], members = [] }) {
  const [area, setArea] = useState("Tutte");
  const visible = useMemo(() => {
    const base = tasks.filter(t => t.workflow_status !== "cancelled");
    return area === "Tutte" ? base : base.filter(t => inferArea(t) === area);
  }, [tasks, area]);
  const byPerson = useMemo(() => REVIEW_TEAM.map(person => ({
    person,
    tasks: visible.filter(t => norm(t.assignee_name) === norm(person)),
  })), [visible]);
  const unassigned = visible.filter(t => !t.assignee_person_id && !t.assignee_name);
  const areaCounts = AREA_RULES.map(r => ({ ...r, count: tasks.filter(t => r.people.some(p => norm(t.assignee_name) === norm(p))).length }));

  return <section className="wm-week-board">
    <style>{`.wm-week-board{max-width:1450px;margin:0 auto;padding:0 34px 22px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172033}.wm-week-board *{box-sizing:border-box}.wm-week-card{border:1px solid #dfe4eb;background:#fff;border-radius:14px;padding:18px}.wm-week-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:14px}.wm-kicker{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#7b8696;font-weight:850}.wm-title{font-size:18px;font-weight:900;margin-top:4px}.wm-sub{font-size:10px;color:#6d7787;margin-top:5px}.wm-filters{display:flex;gap:7px;flex-wrap:wrap}.wm-filter{border:1px solid #d9dee6;background:#fff;border-radius:999px;padding:7px 11px;font-size:9px;font-weight:800;color:#596577;cursor:pointer}.wm-filter.active{background:#172b4d;color:#fff;border-color:#172b4d}.wm-area-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:15px}.wm-area{border:1px solid #e2e6ec;background:#f8f9fb;border-radius:10px;padding:11px}.wm-area-name{font-size:11px;font-weight:900}.wm-area-people{font-size:9px;color:#6c7686;margin-top:4px}.wm-area-count{font-size:20px;font-weight:900;margin-top:7px}.wm-team{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.wm-person{border:1px solid #e0e5eb;border-radius:11px;padding:12px;min-height:145px}.wm-person-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:9px}.wm-person-name{font-size:13px;font-weight:900}.wm-person-count{font-size:9px;color:#748092}.wm-task{border-top:1px solid #edf0f3;padding:8px 0}.wm-task:first-child{border-top:0;padding-top:0}.wm-task-title{font-size:10px;font-weight:800;line-height:1.35}.wm-task-meta{display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:8px;color:#7a8594}.wm-status{font-weight:850}.wm-empty{font-size:9px;color:#8993a0;padding:8px 0}.wm-unassigned{margin-top:12px;padding:10px 12px;background:#fff8ed;border:1px solid #f0dfbd;border-radius:10px;font-size:9px;color:#745d32}.wm-note{margin-top:13px;padding-top:11px;border-top:1px solid #e9edf1;font-size:9px;color:#737e8d}@media(max-width:950px){.wm-team{grid-template-columns:repeat(2,1fr)}.wm-area-grid{grid-template-columns:1fr}}@media(max-width:600px){.wm-week-board{padding:0 14px 18px}.wm-team{grid-template-columns:1fr}}`}</style>
    <div className="wm-week-card">
      <div className="wm-week-head"><div><div className="wm-kicker">Agenda operativa di Vincenzo</div><div className="wm-title">Questa settimana: cosa deve succedere</div><div className="wm-sub">Attività reali, responsabilità e controllo del lunedì. Nessuna riassegnazione automatica.</div></div><div className="wm-filters">{["Tutte", ...AREA_RULES.map(r => r.area)].map(x => <button type="button" className={`wm-filter ${area===x ? "active" : ""}`} onClick={() => setArea(x)} key={x}>{x}</button>)}</div></div>
      <div className="wm-area-grid">{areaCounts.map(r => <div className="wm-area" key={r.area}><div className="wm-area-name">{r.area}</div><div className="wm-area-people">{r.people.join(" + ")}</div><div className="wm-area-count">{r.count}</div></div>)}</div>
      <div className="wm-team">{byPerson.map(({person, tasks: personTasks}) => <div className="wm-person" key={person}><div className="wm-person-head"><div className="wm-person-name">{person}</div><div className="wm-person-count">{personTasks.length} attività</div></div>{personTasks.slice(0,6).map(t => <div className="wm-task" key={t.id}><div className="wm-task-title">{t.title || "Attività senza titolo"}</div><div className="wm-task-meta"><span>{t.project_name || "—"}</span><span className="wm-status">{statusLabel(t)}</span></div></div>)}{!personTasks.length && <div className="wm-empty">Nessuna attività assegnata visibile.</div>}{personTasks.length>6 && <div className="wm-empty">+ {personTasks.length-6} altre attività</div>}</div>)}</div>
      {unassigned.length>0 && <div className="wm-unassigned"><b>{unassigned.length} attività senza responsabile</b> — Vincenzo deve decidere a chi assegnarle durante la riunione.</div>}
      <div className="wm-note"><b>Regola del lunedì:</b> verificare il lavoro precedente, poi decidere per ogni persona: chiudere, continuare, sbloccare/attendere un esterno oppure assegnare un nuovo incarico.</div>
    </div>
  </section>;
}
