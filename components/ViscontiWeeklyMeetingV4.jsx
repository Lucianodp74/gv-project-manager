"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STATUS = { open:"Da verificare", decided:"Decisa", in_progress:"In corso", closed:"Chiusa" };
const TASK = { todo:"Da iniziare", in_progress:"In corso", blocked:"Bloccata", done:"Completata", cancelled:"Annullata" };
const PEOPLE = ["Dario","Roberto","Carmelo","Francesco"];

const fmt = v => v ? new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString("it-IT") : "—";

export default function ViscontiWeeklyMeetingV4({ data = {} }) {
  const members = data.members || [];
  const projects = data.projects || [];
  const tasks = (data.tasks || []).filter(t => t.workflow_status !== "cancelled");
  const [meeting,setMeeting] = useState(null), [topics,setTopics] = useState([]), [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false), [message,setMessage] = useState("");
  const [selected,setSelected] = useState("");
  const [form,setForm] = useState({ title:"", project_id:"", responsible_id:"", due_date:"", discussion:"" });

  const vincenzo = members.find(m => String(m.display_name || m.name || "").trim().toLowerCase() === "vincenzo");
  const team = useMemo(() => members.filter(m => PEOPLE.some(n => String(m.display_name || m.name || "").toLowerCase().includes(n.toLowerCase()))), [members]);
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name || p.project_name || "—"])), [projects]);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m.display_name || m.name || "—"])), [members]);

  async function load(){
    setLoading(true);
    const r = await fetch("/api/visconti-work/meetings", { cache:"no-store" });
    const j = await r.json().catch(()=>({}));
    if(r.ok){ setMeeting(j.meeting); setTopics(j.topics || []); } else setMessage(j.error || "Errore nel caricamento.");
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function start(){
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"meeting"}) });
    const j = await r.json().catch(()=>({}));
    if(r.ok) setMeeting(j.meeting); else setMessage(j.error || "Impossibile creare la riunione.");
    setSaving(false);
  }

  async function addAssignment(e){
    e.preventDefault();
    if(!meeting || !form.title.trim() || !form.responsible_id) return setMessage("Indica attività e responsabile.");
    setSaving(true); setMessage("");
    const r = await fetch("/api/visconti-work/meetings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
      action:"topic", meeting_id:meeting.id, title:form.title.trim(), topic_type:"activity", project_id:form.project_id || null,
      responsible_id:form.responsible_id, due_date:form.due_date || null, discussion:form.discussion || ""
    })});
    const j = await r.json().catch(()=>({}));
    if(r.ok){ setTopics(x=>[...x,j.topic]); setForm({title:"",project_id:"",responsible_id:"",due_date:"",discussion:""}); }
    else setMessage(j.error || "Impossibile salvare l'incarico.");
    setSaving(false);
  }

  async function updateTopic(id, patch){
    const r = await fetch("/api/visconti-work/meetings", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,...patch}) });
    const j = await r.json().catch(()=>({}));
    if(r.ok) setTopics(xs=>xs.map(x=>x.id===id ? j.topic : x)); else setMessage(j.error || "Impossibile aggiornare.");
  }

  async function updateTask(id, patch){
    const r = await fetch("/api/visconti-work/tasks", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,...patch}) });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) setMessage(j.error || "Impossibile aggiornare l'attività.");
    else window.location.reload();
  }

  const assignments = topics.filter(t => t.topic_type === "activity" && t.responsible_id);
  const week = useMemo(() => team.map(m => {
    const own = assignments.filter(a => a.responsible_id === m.id);
    const done = own.filter(a=>a.status === "closed").length;
    const taskOwn = tasks.filter(t=>t.responsible_id===m.id || t.assignee_person_id===m.id);
    const taskDone = taskOwn.filter(t=>t.workflow_status === "done").length;
    const blocked = taskOwn.filter(t=>t.workflow_status === "blocked").length;
    const overdue = taskOwn.filter(t=>t.attention_state === "overdue").length;
    return {...m, own, done, taskOwn, taskDone, blocked, overdue};
  }), [team,assignments,tasks]);

  const review = useMemo(()=> assignments.filter(a=>a.status!=="closed" || (a.due_date && String(a.due_date).slice(0,10) <= new Date().toISOString().slice(0,10))), [assignments]);
  const blocked = tasks.filter(t=>t.workflow_status === "blocked");
  const overdue = tasks.filter(t=>t.workflow_status !== "done" && t.attention_state === "overdue");
  const externalWait = tasks.filter(t=>t.workflow_status === "blocked" && /terna|ente|estern|attesa/i.test(`${t.blocker_reason||""} ${t.next_action||""}`));
  const currentMember = selected ? week.find(x=>x.id===selected) : null;

  return <main className="wm4"><style>{`
.wm4{min-height:100vh;background:#f4f6f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.wm4 *{box-sizing:border-box}.wm4-head{background:#fff;border-bottom:1px solid #e1e5eb;padding:15px 34px;display:flex;justify-content:space-between;align-items:center}.wm4-brand{font-size:12px;font-weight:850;color:#172b4d}.wm4-nav{display:flex;gap:5px}.wm4-nav a{padding:8px 11px;border-radius:8px;text-decoration:none;color:#687181;font-size:11px;font-weight:800}.wm4-nav a.active,.wm4-nav a:hover{background:#172b4d;color:#fff}.wm4-main{max-width:1450px;margin:auto;padding:28px 34px 60px}.wm4-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.wm4-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;color:#7d8797;font-weight:850}.wm4-title{font-size:30px;letter-spacing:-.04em;margin:5px 0}.wm4-sub{font-size:12px;color:#697487;max-width:1000px;line-height:1.5;margin:0}.wm4-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.wm4-btn{border:1px solid #d9dee7;background:#fff;color:#172033;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:800;cursor:pointer}.wm4-primary{background:#172b4d;color:#fff;border-color:#172b4d}.wm4-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:20px 0 14px}.wm4-kpi{background:#fff;border:1px solid #e1e5eb;border-radius:12px;padding:12px 14px}.wm4-kpi small{display:block;text-transform:uppercase;color:#7d8797;font-size:8px;font-weight:850}.wm4-kpi b{font-size:23px;display:block;margin-top:4px}.wm4-kpi span{font-size:9px;color:#7d8797}.wm4-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(310px,.8fr);gap:14px}.wm4-section{margin-top:14px}.wm4-head2{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.wm4-head2 h2{font-size:16px;margin:0}.wm4-head2 p{font-size:10px;color:#7d8797;margin:4px 0}.wm4-team{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.wm4-person{border:1px solid #e1e5eb;border-radius:11px;padding:13px;background:#fff;cursor:pointer}.wm4-person.active{border-color:#172b4d;box-shadow:0 0 0 1px #172b4d}.wm4-person b{font-size:12px}.wm4-role{font-size:8px;color:#7d8797;margin-top:3px}.wm4-progress{height:7px;background:#edf0f4;border-radius:999px;overflow:hidden;margin:10px 0}.wm4-progress span{display:block;height:100%;background:#2e7d5b}.wm4-stats{display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:#667184}.wm4-stats strong{color:#172033}.wm4-form{background:#f7f8fa;border:1px solid #e2e6ec;border-radius:12px;padding:14px}.wm4-formgrid{display:grid;grid-template-columns:1.4fr 1fr 1fr 150px;gap:8px}.wm4-input,.wm4-select,.wm4-textarea{width:100%;border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:9px 10px;font-size:10px;color:#172033}.wm4-textarea{min-height:48px}.wm4-full{grid-column:1/-1}.wm4-formfoot{display:flex;justify-content:flex-end;margin-top:8px}.wm4-table{width:100%;border-collapse:collapse}.wm4-table th{text-align:left;text-transform:uppercase;font-size:8px;color:#8992a0;padding:8px;border-bottom:1px solid #e5e8ed}.wm4-table td{padding:9px 8px;border-bottom:1px solid #eef0f3;font-size:9px;vertical-align:top}.wm4-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:850}.wm4-green{background:#eaf8f1;color:#18794e}.wm4-red{background:#fff0ef;color:#b23c36}.wm4-gray{background:#eef1f4;color:#5f6978}.wm4-blue{background:#edf3ff;color:#315ba7}.wm4-amber{background:#fff4dc;color:#986400}.wm4-muted{color:#7d8797;font-size:9px}.wm4-review{display:flex;flex-direction:column;gap:8px}.wm4-reviewitem{border:1px solid #e1e5eb;border-radius:9px;padding:10px;background:#fff}.wm4-reviewitem b{font-size:10px}.wm4-meta{font-size:8px;color:#7b8594;margin-top:4px;line-height:1.4}.wm4-alert{border-radius:10px;padding:10px;margin-top:9px;font-size:9px;font-weight:750}.wm4-alert.red{background:#fff0ef;color:#a13b36}.wm4-alert.blue{background:#edf3ff;color:#315ba7}@media(max-width:1050px){.wm4-kpis{grid-template-columns:repeat(3,1fr)}.wm4-grid{grid-template-columns:1fr}.wm4-team{grid-template-columns:repeat(2,1fr)}.wm4-formgrid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.wm4-head{padding:14px 18px}.wm4-main{padding:20px 14px}.wm4-nav{display:none}.wm4-top{align-items:flex-start;flex-direction:column}.wm4-kpis{grid-template-columns:1fr 1fr}.wm4-team{grid-template-columns:1fr}.wm4-formgrid{grid-template-columns:1fr}.wm4-full{grid-column:auto}.wm4-table{display:block;overflow:auto;white-space:nowrap}}
`}</style>

<header className="wm4-head"><div className="wm4-brand">GRUPPO VISCONTI · WORK V2</div><nav className="wm4-nav"><Link href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link className="active" href="/visconti-work/meetings">Riunioni</Link><Link href="/visconti-work/connection">Connessioni</Link></nav></header>
<section className="wm4-main">
  <div className="wm4-top"><div><div className="wm4-kicker">Riunione del lunedì · piano operativo</div><h1 className="wm4-title">Cosa deve fare la squadra questa settimana</h1><p className="wm4-sub">Vincenzo coordina Dario, Roberto, Carmelo e Francesco. Il lunedì si definiscono gli incarichi della settimana; il lunedì successivo si verifica ogni incarico: completato, da continuare, bloccato o da riassegnare.</p></div><div><button className="wm4-btn wm4-primary" onClick={start} disabled={saving}>{meeting ? "Riunione attiva" : "Apri riunione"}</button></div></div>

  <div className="wm4-kpis">
    <div className="wm4-kpi"><small>Coordinatore</small><b>{vincenzo ? vincenzo.display_name : "Vincenzo"}</b><span>controllo squadra</span></div>
    <div className="wm4-kpi"><small>Incarichi settimana</small><b>{assignments.length}</b><span>attività assegnate</span></div>
    <div className="wm4-kpi"><small>Chiusi</small><b>{assignments.filter(x=>x.status==="closed").length}</b><span>completati</span></div>
    <div className="wm4-kpi"><small>Da verificare</small><b>{review.length}</b><span>per il prossimo lunedì</span></div>
    <div className="wm4-kpi"><small>Bloccati</small><b>{blocked.length}</b><span>richiedono intervento</span></div>
    <div className="wm4-kpi"><small>Attesa esterna</small><b>{externalWait.length}</b><span>non imputare al collaboratore</span></div>
  </div>

  <section className="wm4-card wm4-section"><div className="wm4-head2"><div><h2>1 · Squadra sotto il controllo di Vincenzo</h2><p>Clicca un collaboratore per vedere incarichi e attività aperte.</p></div></div><div className="wm4-team">{week.map(m=>{const total=m.own.length, done=m.done, percent=total?Math.round(done/total*100):0;return <div key={m.id} className={`wm4-person ${selected===m.id?"active":""}`} onClick={()=>setSelected(selected===m.id?"":m.id)}><b>{m.display_name}</b><div className="wm4-role">In carico a Vincenzo</div><div className="wm4-progress"><span style={{width:`${percent}%`}} /></div><div className="wm4-stats"><span>Settimana <strong>{total}</strong></span><span>Chiusi <strong>{done}</strong></span><span>Attività <strong>{m.taskOwn.length}</strong></span>{m.blocked>0&&<span className="wm4-red">Bloccate <strong>{m.blocked}</strong></span>}{m.overdue>0&&<span className="wm4-red">Scadute <strong>{m.overdue}</strong></span>}</div></div>})}</div></section>

  <div className="wm4-grid">
    <div>
      <section className="wm4-card wm4-section"><div className="wm4-head2"><div><h2>2 · Piano operativo della settimana</h2><p>Vincenzo assegna qui cosa deve essere fatto entro il prossimo lunedì.</p></div></div>
        {!meeting ? <div className="wm4-muted">Apri la riunione per iniziare ad assegnare gli incarichi.</div> : <form className="wm4-form" onSubmit={addAssignment}><div className="wm4-formgrid"><input className="wm4-input" placeholder="Cosa deve essere fatto questa settimana?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="wm4-select" value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Progetto (opzionale)</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name||p.project_name}</option>)}</select><select className="wm4-select" value={form.responsible_id} onChange={e=>setForm({...form,responsible_id:e.target.value})}><option value="">Responsabile</option>{team.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select><input className="wm4-input" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/><textarea className="wm4-textarea wm4-full" placeholder="Risultato atteso / note per Vincenzo" value={form.discussion} onChange={e=>setForm({...form,discussion:e.target.value})}/></div><div className="wm4-formfoot"><button className="wm4-btn wm4-primary" disabled={saving}>Assegna incarico</button></div></form>}
        {assignments.length===0 ? <div className="wm4-muted" style={{marginTop:12}}>Nessun incarico settimanale ancora registrato.</div> : <table className="wm4-table" style={{marginTop:12}}><thead><tr><th>Incarico</th><th>Responsabile</th><th>Progetto</th><th>Scadenza</th><th>Stato</th><th>Controllo</th></tr></thead><tbody>{assignments.map(a=><tr key={a.id}><td><b>{a.title}</b><div className="wm4-meta">{a.discussion||""}</div></td><td>{memberMap.get(a.responsible_id)||"—"}</td><td>{projectMap.get(a.project_id)||"—"}</td><td>{fmt(a.due_date)}</td><td><select className="wm4-select" value={a.status||"open"} onChange={e=>updateTopic(a.id,{status:e.target.value})}>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td><td><span className={`wm4-badge ${a.status==="closed"?"wm4-green":"wm4-amber"}`}>{a.status==="closed"?"FATTO":"DA VERIFICARE"}</span></td></tr>)}</tbody></table>}
      </section>

      {currentMember && <section className="wm4-card wm4-section"><div className="wm4-head2"><div><h2>Dettaglio · {currentMember.display_name}</h2><p>Questo è il controllo operativo che Vincenzo fa durante la settimana.</p></div></div><table className="wm4-table"><thead><tr><th>Attività</th><th>Progetto</th><th>Stato</th><th>Scadenza</th><th>Prossima azione</th></tr></thead><tbody>{currentMember.taskOwn.length===0?<tr><td colSpan="5">Nessuna attività assegnata.</td></tr>:currentMember.taskOwn.map(t=><tr key={t.id}><td><b>{t.title}</b></td><td>{t.project_name||projectMap.get(t.project_id)||"—"}</td><td><span className={`wm4-badge ${t.workflow_status==="done"?"wm4-green":t.workflow_status==="blocked"?"wm4-red":"wm4-blue"}`}>{TASK[t.workflow_status]||t.workflow_status}</span></td><td>{fmt(t.due_date)}</td><td>{t.next_action||"—"}</td></tr>)}</tbody></table></section>}
    </div>

    <aside>
      <section className="wm4-card wm4-section"><div className="wm4-head2"><div><h2>3 · Controllo del prossimo lunedì</h2><p>Prima di assegnare nuovi compiti.</p></div></div><div className="wm4-review">{review.length===0?<div className="wm4-muted">Nessun incarico da verificare.</div>:review.map(a=><div className="wm4-reviewitem" key={a.id}><b>{a.title}</b><div className="wm4-meta">{memberMap.get(a.responsible_id)} · {projectMap.get(a.project_id)||"Nessun progetto"} · scadenza {fmt(a.due_date)}</div><select className="wm4-select" style={{marginTop:7}} value={a.status||"open"} onChange={e=>updateTopic(a.id,{status:e.target.value})}>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>)}</div></section>
      <section className="wm4-card wm4-section"><div className="wm4-head2"><div><h2>4 · Eccezioni</h2><p>Vincenzo interviene solo dove serve.</p></div></div>{overdue.length>0&&<div className="wm4-alert red">{overdue.length} attività scadute: verificare motivo e nuova data.</div>}{blocked.length>0&&<div className="wm4-alert red">{blocked.length} attività bloccate: distinguere blocco interno da attesa esterna.</div>}{externalWait.length>0&&<div className="wm4-alert blue">{externalWait.length} attività risultano in attesa di soggetti esterni: non segnalarle automaticamente come ritardo del collaboratore.</div>}{!overdue.length&&!blocked.length&&!externalWait.length&&<div className="wm4-muted">Nessuna eccezione rilevante.</div>}</section>
    </aside>
  </div>

  {message && <div className="wm4-alert red" style={{marginTop:14}}>{message}</div>}
  {loading && <div className="wm4-muted" style={{marginTop:12}}>Caricamento dati…</div>}
</section></main>;
}
