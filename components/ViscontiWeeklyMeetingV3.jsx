"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const TYPE_LABELS={decision:"Decisione",blocker:"Problema / blocco",connection:"Connessione",authorization:"Autorizzazioni",activity:"Attività",other:"Altro"};
const TYPE_TONE={decision:"amber",blocker:"red",connection:"blue",authorization:"purple",activity:"green",other:"gray"};
const STATUS_LABELS={todo:"Da iniziare",in_progress:"In corso",blocked:"Bloccata",done:"Completata",cancelled:"Annullata"};
const STATUS_TONE={todo:"gray",in_progress:"blue",blocked:"red",done:"green",cancelled:"gray"};
const ATTENTION_LABELS={overdue:"Scaduta",blocked:"Bloccata",urgent:"Urgente",soon:"In scadenza",normal:"Normale"};

function date(v){return v?new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString("it-IT"):"—";}
function activeTasks(tasks){return tasks.filter(t=>t.workflow_status!=="cancelled");}
function pct(done,total){return total?Math.round((done/total)*100):0;}

export default function ViscontiWeeklyMeetingV3({data={}}){
  const projects=data.projects||[], members=data.members||[], tasks=activeTasks(data.tasks||[]);
  const [meeting,setMeeting]=useState(null),[topics,setTopics]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
  const [selectedMember,setSelectedMember]=useState("");
  const [form,setForm]=useState({title:"",topic_type:"decision",project_id:"",discussion:""});
  const projectMap=useMemo(()=>new Map(projects.map(p=>[p.id,p.name||p.project_name||"—"])),[projects]);
  const projectOptions=useMemo(()=>projects.map(p=>({id:p.id||p.project_id,name:p.name||p.project_name})).filter(p=>p.id&&p.name),[projects]);
  const memberMap=useMemo(()=>new Map(members.map(m=>[m.id,m.display_name||m.name||"—"])),[members]);

  async function load(){
    setLoading(true);
    const r=await fetch("/api/visconti-work/meetings",{cache:"no-store"});
    const j=await r.json().catch(()=>({}));
    if(r.ok){setMeeting(j.meeting);setTopics(j.topics||[]);}else setMessage(j.error||"Errore nel caricamento della riunione.");
    setLoading(false);
  }
  useEffect(()=>{load();},[]);

  async function startMeeting(){
    setSaving(true);setMessage("");
    const r=await fetch("/api/visconti-work/meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"meeting"})});
    const j=await r.json().catch(()=>({}));
    if(r.ok)setMeeting(j.meeting);else setMessage(j.error||"Impossibile avviare la riunione.");
    setSaving(false);
  }
  async function addTopic(e){
    e.preventDefault();if(!meeting||!form.title.trim())return;
    setSaving(true);setMessage("");
    const r=await fetch("/api/visconti-work/meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"topic",meeting_id:meeting.id,...form})});
    const j=await r.json().catch(()=>({}));
    if(r.ok){setTopics(x=>[...x,j.topic]);setForm({title:"",topic_type:"decision",project_id:"",discussion:""});}else setMessage(j.error||"Impossibile aggiungere il tema.");
    setSaving(false);
  }
  async function updateTopic(id,patch){
    const r=await fetch("/api/visconti-work/meetings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...patch})});
    const j=await r.json().catch(()=>({}));
    if(r.ok)setTopics(items=>items.map(t=>t.id===id?j.topic:t));else setMessage(j.error||"Impossibile salvare.");
  }
  async function closeMeeting(){
    if(!meeting||!window.confirm("Chiudere la riunione? I temi aperti resteranno disponibili per la prossima riunione."))return;
    setSaving(true);
    const r=await fetch("/api/visconti-work/meetings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"meeting",id:meeting.id,status:"closed"})});
    const j=await r.json().catch(()=>({}));
    if(r.ok)setMeeting(j.meeting);else setMessage(j.error||"Impossibile chiudere la riunione.");
    setSaving(false);
  }

  const team=useMemo(()=>members.map(m=>{
    const mine=tasks.filter(t=>t.responsible_id===m.id||t.assignee_person_id===m.id);
    const done=mine.filter(t=>t.workflow_status==="done").length;
    const inProgress=mine.filter(t=>t.workflow_status==="in_progress").length;
    const blocked=mine.filter(t=>t.workflow_status==="blocked").length;
    const overdue=mine.filter(t=>t.attention_state==="overdue").length;
    const soon=mine.filter(t=>t.attention_state==="soon").length;
    return {...m,tasks:mine,done,inProgress,blocked,overdue,soon,progress:pct(done,mine.length)};
  }).filter(x=>x.tasks.length||x.active!==false),[members,tasks]);

  const unassigned=tasks.filter(t=>!t.responsible_id&&!t.assignee_person_id);
  const overdue=tasks.filter(t=>t.workflow_status!=="done"&&(t.attention_state==="overdue"||t.due_date&&String(t.due_date).slice(0,10)<new Date().toISOString().slice(0,10)));
  const blocked=tasks.filter(t=>t.workflow_status==="blocked");
  const inProgress=tasks.filter(t=>t.workflow_status==="in_progress");
  const done=tasks.filter(t=>t.workflow_status==="done");
  const soon=tasks.filter(t=>t.workflow_status!=="done"&&t.attention_state==="soon");
  const controlTasks=useMemo(()=>{
    const seen=new Set();
    return [...blocked,...overdue,...soon,...unassigned].filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true;}).slice(0,12);
  },[blocked,overdue,soon,unassigned]);
  const selected=selectedMember?team.find(x=>x.id===selectedMember):null;
  const selectedTasks=selected?.tasks||[];
  const openTopics=topics.filter(t=>t.status!=="closed").length;

  return <main className="wm3"><style>{`
.wm3{min-height:100vh;background:#f4f6f9;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.wm3 *{box-sizing:border-box}.wm3-head{background:#fff;border-bottom:1px solid #e1e5eb;padding:15px 34px;display:flex;justify-content:space-between;align-items:center}.wm3-brand{font-size:12px;font-weight:850;color:#172b4d}.wm3-nav{display:flex;gap:5px}.wm3-nav a{padding:8px 11px;border-radius:8px;text-decoration:none;color:#687181;font-size:11px;font-weight:800}.wm3-nav a.active,.wm3-nav a:hover{background:#172b4d;color:#fff}.wm3-main{max-width:1420px;margin:auto;padding:28px 34px 60px}.wm3-top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.wm3-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.13em;color:#7d8797;font-weight:850}.wm3-title{font-size:30px;letter-spacing:-.04em;margin:5px 0 3px}.wm3-sub{font-size:12px;color:#697487;max-width:980px;line-height:1.5;margin:0}.wm3-actions{display:flex;gap:8px}.wm3-btn{border:1px solid #d9dee7;background:#fff;color:#172033;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:800;cursor:pointer;text-decoration:none}.wm3-primary{background:#172b4d;border-color:#172b4d;color:#fff}.wm3-danger{color:#a33;border-color:#efc9c6}.wm3-card{background:#fff;border:1px solid #e1e5eb;border-radius:14px;padding:18px}.wm3-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:20px 0 14px}.wm3-kpi{background:#fff;border:1px solid #e1e5eb;border-radius:12px;padding:12px 14px}.wm3-kpi small{display:block;text-transform:uppercase;color:#7d8797;font-size:8px;font-weight:850}.wm3-kpi b{font-size:23px;display:block;margin-top:4px}.wm3-kpi span{font-size:9px;color:#7d8797}.wm3-section{margin-top:14px}.wm3-sectionhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.wm3-sectionhead h2{font-size:16px;margin:0}.wm3-sectionhead p{font-size:10px;color:#7d8797;margin:4px 0 0}.wm3-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,.9fr);gap:14px}.wm3-team{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.wm3-person{border:1px solid #e2e6ec;border-radius:11px;padding:12px;background:#fff;cursor:pointer}.wm3-person:hover{border-color:#aeb8c7}.wm3-person.active{border-color:#172b4d;box-shadow:0 0 0 1px #172b4d}.wm3-personhead{display:flex;justify-content:space-between;gap:8px;align-items:center}.wm3-personname{font-size:11px;font-weight:850}.wm3-count{font-size:9px;color:#7d8797}.wm3-progress{height:7px;background:#edf0f4;border-radius:999px;overflow:hidden;margin:10px 0 7px}.wm3-progress>span{display:block;height:100%;background:#2e7d5b;border-radius:999px}.wm3-stats{display:flex;gap:9px;flex-wrap:wrap;font-size:9px;color:#6f7988}.wm3-stat b{color:#172033}.wm3-warning{color:#a13b36}.wm3-side{border:1px solid #e1e5eb;border-radius:11px;padding:13px;background:#fbfcfd}.wm3-side h3{font-size:12px;margin:0 0 8px}.wm3-list{display:flex;flex-direction:column;gap:7px}.wm3-task{border:1px solid #e3e7ed;border-radius:9px;padding:9px;background:#fff}.wm3-tasktop{display:flex;justify-content:space-between;gap:8px}.wm3-tasktitle{font-size:10px;font-weight:800;line-height:1.35}.wm3-taskmeta{font-size:8px;color:#7b8594;margin-top:4px;line-height:1.4}.wm3-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:850;white-space:nowrap}.wm3-badge.red{background:#fff0ef;color:#b23c36}.wm3-badge.blue{background:#edf3ff;color:#315ba7}.wm3-badge.green{background:#eaf8f1;color:#18794e}.wm3-badge.gray{background:#eef1f4;color:#5f6978}.wm3-badge.amber{background:#fff4dc;color:#986400}.wm3-badge.purple{background:#f2edff;color:#6546a5}.wm3-select{border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:8px 10px;font-size:10px;color:#172033}.wm3-table{width:100%;border-collapse:collapse}.wm3-table th{text-align:left;text-transform:uppercase;font-size:8px;color:#8992a0;padding:7px;border-bottom:1px solid #e5e8ed}.wm3-table td{padding:9px 7px;border-bottom:1px solid #eef0f3;font-size:9px;vertical-align:top}.wm3-form{background:#f7f8fa;border:1px solid #e2e6ec;border-radius:12px;padding:14px;margin-bottom:14px}.wm3-formgrid{display:grid;grid-template-columns:minmax(0,1fr) 150px 220px;gap:8px}.wm3-input,.wm3-formselect,.wm3-textarea{width:100%;border:1px solid #d8dee7;background:#fff;border-radius:8px;padding:9px 10px;font-size:10px;color:#172033}.wm3-textarea{min-height:58px;resize:vertical}.wm3-full{grid-column:1/-1}.wm3-formbottom{display:flex;justify-content:flex-end;margin-top:8px}.wm3-topic{border:1px solid #e0e5ec;border-radius:11px;margin-bottom:8px;overflow:hidden}.wm3-topicmain{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;padding:11px}.wm3-num{width:26px;height:26px;border-radius:7px;background:#edf1f5;display:grid;place-items:center;font-size:9px;font-weight:900;color:#586477}.wm3-topic h3{margin:0;font-size:11px}.wm3-meta{font-size:9px;color:#788394;margin-top:4px;line-height:1.4}.wm3-detail{border-top:1px solid #eef0f3;padding:10px 12px 12px 51px;display:grid;grid-template-columns:1fr 1fr;gap:9px;background:#fcfcfd}.wm3-field label{display:block;text-transform:uppercase;font-size:8px;color:#8a93a0;font-weight:850;margin-bottom:4px}.wm3-field textarea,.wm3-field select,.wm3-field input{width:100%;border:1px solid #dfe4eb;border-radius:7px;padding:7px;font-size:9px;background:#fff}.wm3-error{margin:10px 0;color:#b43a34;font-size:10px}.wm3-empty{padding:20px;text-align:center;color:#7c8796;font-size:10px}.wm3-closed{padding:10px;background:#edf8f2;border:1px solid #cfe9dc;border-radius:10px;color:#21724d;font-size:9px;font-weight:750;margin:14px 0}.wm3-muted{color:#7d8797;font-size:9px}@media(max-width:1050px){.wm3-kpis{grid-template-columns:repeat(3,1fr)}.wm3-grid{grid-template-columns:1fr}.wm3-team{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.wm3-head{padding:14px 18px}.wm3-main{padding:20px 14px}.wm3-nav{display:none}.wm3-top{align-items:flex-start;flex-direction:column}.wm3-kpis{grid-template-columns:1fr 1fr}.wm3-team{grid-template-columns:1fr}.wm3-formgrid{grid-template-columns:1fr}.wm3-full{grid-column:auto}.wm3-detail{padding-left:12px;grid-template-columns:1fr}.wm3-topicmain{grid-template-columns:28px 1fr}.wm3-topicmain>.wm3-badge{grid-column:2}}
`}</style>

    <header className="wm3-head"><div className="wm3-brand">GRUPPO VISCONTI · WORK V2</div><nav className="wm3-nav"><Link href="/visconti-work">Control Tower</Link><Link href="/visconti-work/projects">Progetti</Link><Link href="/visconti-work/tasks">Attività</Link><Link className="active" href="/visconti-work/meetings">Riunioni</Link><Link href="/visconti-work/connection">Connessioni</Link></nav></header>
    <section className="wm3-main">
      <div className="wm3-top"><div><div className="wm3-kicker">Cabina di regia · controllo lavoro interno</div><h1 className="wm3-title">Riunione settimanale</h1><p className="wm3-sub">La riunione legge direttamente le attività dei collaboratori: cosa è stato completato, cosa è in corso, cosa è bloccato e dove serve intervenire.</p></div><div className="wm3-actions"><button className="wm3-btn" onClick={()=>window.print()}>Stampa</button>{meeting&&meeting.status!=="closed"&&<button className="wm3-btn wm3-danger" disabled={saving} onClick={closeMeeting}>Chiudi riunione</button>}</div></div>
      {message&&<div className="wm3-error">{message}</div>}

      <div className="wm3-kpis">
        <div className="wm3-kpi"><small>Attività totali</small><b>{tasks.length}</b><span>attive</span></div>
        <div className="wm3-kpi"><small>In corso</small><b>{inProgress.length}</b><span>lavoro attuale</span></div>
        <div className="wm3-kpi"><small>Completate</small><b>{done.length}</b><span>lavoro chiuso</span></div>
        <div className="wm3-kpi"><small>Bloccate</small><b>{blocked.length}</b><span>richiedono intervento</span></div>
        <div className="wm3-kpi"><small>Scadute</small><b>{overdue.length}</b><span>da recuperare</span></div>
        <div className="wm3-kpi"><small>Senza responsabile</small><b>{unassigned.length}</b><span>da organizzare</span></div>
      </div>

      <section className="wm3-card wm3-section"><div className="wm3-sectionhead"><div><h2>1 · Controllo avanzamento collaboratori</h2><p>Il progresso è calcolato sulle attività completate rispetto alle attività attive assegnate. Le attività bloccate e scadute restano evidenziate separatamente.</p></div><select className="wm3-select" value={selectedMember} onChange={e=>setSelectedMember(e.target.value)}><option value="">Tutti i collaboratori</option>{team.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select></div>
        <div className="wm3-team">{team.map(m=><button key={m.id} className={`wm3-person ${selectedMember===m.id?"active":""}`} onClick={()=>setSelectedMember(selectedMember===m.id?"":m.id)}><div className="wm3-personhead"><span className="wm3-personname">{m.display_name}</span><span className="wm3-count">{m.tasks.length} attività</span></div><div className="wm3-progress"><span style={{width:`${m.progress}%`}}/></div><div className="wm3-stats"><span><b>{m.progress}%</b> completato</span><span><b>{m.inProgress}</b> in corso</span><span className={m.blocked?"wm3-warning":""}><b>{m.blocked}</b> bloccate</span><span className={m.overdue?"wm3-warning":""}><b>{m.overdue}</b> scadute</span></div></button>)}</div>
        {selected&&<div style={{marginTop:14}}><div className="wm3-sectionhead"><div><h2>Attività di {selected.display_name}</h2><p>Stato e scadenza delle attività assegnate.</p></div></div><table className="wm3-table"><thead><tr><th>Attività</th><th>Progetto</th><th>Stato</th><th>Scadenza</th><th>Controllo</th></tr></thead><tbody>{selectedTasks.map(t=><tr key={t.id}><td><b>{t.title}</b>{t.next_action&&<div className="wm3-muted">Prossima azione: {t.next_action}</div>}</td><td>{t.project_name||projectMap.get(t.project_id)||"—"}</td><td><span className={`wm3-badge ${STATUS_TONE[t.workflow_status]||"gray"}`}>{STATUS_LABELS[t.workflow_status]||t.workflow_status||"—"}</span></td><td>{date(t.due_date)}</td><td>{t.blocker_reason?<span className="wm3-badge red">Blocco</span>:t.attention_state&&t.attention_state!=="normal"?<span className={`wm3-badge ${t.attention_state==="overdue"?"red":"amber"}`}>{ATTENTION_LABELS[t.attention_state]}</span>:<span className="wm3-muted">OK</span>}</td></tr>)}</tbody></table></div>}
      </section>

      <div className="wm3-grid wm3-section"><section className="wm3-card"><div className="wm3-sectionhead"><div><h2>2 · Cose da controllare nella riunione</h2><p>Il sistema porta automaticamente all'attenzione blocchi, ritardi, scadenze e attività ancora da assegnare.</p></div><span className="wm3-badge red">{controlTasks.length} attenzioni</span></div>{controlTasks.length?<div className="wm3-list">{controlTasks.map(t=><div className="wm3-task" key={t.id}><div className="wm3-tasktop"><span className="wm3-tasktitle">{t.title}</span><span className={`wm3-badge ${t.workflow_status==="blocked"||t.attention_state==="overdue"?"red":!t.responsible_id?"amber":"blue"}`}>{t.workflow_status==="blocked"?"Bloccata":t.attention_state==="overdue"?"Scaduta":!t.responsible_id?"Da assegnare":"Da controllare"}</span></div><div className="wm3-taskmeta">{t.project_name||projectMap.get(t.project_id)||"Nessun progetto"} · {t.assignee_name||"Non assegnata"} · scadenza {date(t.due_date)}{t.blocker_reason?` · ${t.blocker_reason}`:""}</div></div>)}</div>:<div className="wm3-empty">Nessuna attenzione critica rilevata sulle attività.</div>}</section>
        <aside className="wm3-side"><h3>Riepilogo del lavoro</h3><div className="wm3-list"><div className="wm3-task"><b style={{fontSize:11}}>{pct(done.length,tasks.length)}%</b><div className="wm3-taskmeta">avanzamento complessivo del lavoro attivo</div></div><div className="wm3-task"><b style={{fontSize:11}}>{inProgress.length}</b><div className="wm3-taskmeta">attività attualmente in corso dai collaboratori</div></div><div className="wm3-task"><b style={{fontSize:11}}>{soon.length}</b><div className="wm3-taskmeta">in scadenza nei prossimi giorni</div></div><div className="wm3-task"><b style={{fontSize:11}}>{unassigned.length}</b><div className="wm3-taskmeta">attività senza responsabile da organizzare</div></div></div></aside></div>

      {!meeting?<section className="wm3-card wm3-section" style={{textAlign:"center",padding:38}}><h2 style={{margin:"0 0 7px",fontSize:18}}>Inizia la riunione</h2><p className="wm3-muted" style={{margin:"0 0 16px"}}>Il controllo del lavoro è già disponibile. Avvia la riunione per registrare decisioni, azioni e scadenze.</p><button className="wm3-btn wm3-primary" disabled={saving||loading} onClick={startMeeting}>+ Inizia nuova riunione</button></section>:<>
        {meeting.status==="closed"&&<div className="wm3-closed">Riunione chiusa il {date(meeting.meeting_date)}. I temi non chiusi restano consultabili e possono essere ripresi nella prossima riunione.</div>}
        <section className="wm3-card wm3-section"><div className="wm3-sectionhead"><div><h2>3 · Agenda e decisioni</h2><p>Durante la riunione trasformiamo problemi e controlli in decisioni, responsabili, azioni e scadenze.</p></div><span className="wm3-badge blue">{openTopics} aperti</span></div>
          {meeting.status!=="closed"&&<form className="wm3-form" onSubmit={addTopic}><div className="wm3-formgrid"><input className="wm3-input" placeholder="Cosa dobbiamo discutere o decidere?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="wm3-formselect" value={form.topic_type} onChange={e=>setForm({...form,topic_type:e.target.value})}>{Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select className="wm3-formselect" value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Collega progetto…</option>{projectOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><textarea className="wm3-textarea wm3-full" placeholder="Contesto / cosa va verificato" value={form.discussion} onChange={e=>setForm({...form,discussion:e.target.value})}/></div><div className="wm3-formbottom"><button className="wm3-btn wm3-primary" disabled={saving}>+ Aggiungi tema</button></div></form>}
          {loading?<div className="wm3-empty">Caricamento…</div>:topics.length?topics.map((t,i)=><div className="wm3-topic" key={t.id}><div className="wm3-topicmain"><div className="wm3-num">{i+1}</div><div><h3>{t.title}</h3><div className="wm3-meta">{t.project_id?`Progetto: ${projectMap.get(t.project_id)||"collegato"}`:"Nessun progetto collegato"}{t.discussion?` · ${t.discussion}`:""}</div></div><span className={`wm3-badge ${TYPE_TONE[t.topic_type]||"gray"}`}>{TYPE_LABELS[t.topic_type]||"Altro"}</span></div><div className="wm3-detail"><div className="wm3-field"><label>Decisione</label><textarea defaultValue={t.decision||""} placeholder="Cosa decidiamo?" onBlur={e=>updateTopic(t.id,{decision:e.target.value})}/></div><div className="wm3-field"><label>Azione</label><textarea defaultValue={t.action||""} placeholder="Qual è il prossimo passo?" onBlur={e=>updateTopic(t.id,{action_text:e.target.value})}/></div><div className="wm3-field"><label>Responsabile</label><select value={t.responsible_id||""} onChange={e=>updateTopic(t.id,{responsible_id:e.target.value||null})}><option value="">Da assegnare</option>{members.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select></div><div className="wm3-field"><label>Scadenza</label><input type="date" defaultValue={t.due_date||""} onBlur={e=>updateTopic(t.id,{due_date:e.target.value||null})}/></div><div className="wm3-field"><label>Stato</label><select value={t.status||"open"} onChange={e=>updateTopic(t.id,{status:e.target.value})}><option value="open">Da discutere</option><option value="decided">Deciso</option><option value="in_progress">In corso</option><option value="closed">Chiuso</option></select></div></div></div>):<div className="wm3-empty">Nessun tema inserito. Le attenzioni sopra restano comunque il punto di partenza della riunione.</div>}
        </section>
      </>}
    </section>
  </main>;
}
