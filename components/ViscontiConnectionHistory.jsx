"use client";

function fmtDateTime(v){
  if(!v) return "—";
  return new Intl.DateTimeFormat("it-IT",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v));
}

function statusLabel(v){
  return ({pending:"Da avviare",in_progress:"In corso",done:"Completato",waiting:"In attesa Terna",confirmed:"Confermato",validated:"Validato",rejected:"Respinto",true:"N/A",false:"Attivo"}[v]||v||"—");
}

export default function ViscontiConnectionHistory({history=[]}){
  if(!history.length) return <section className="vh-card"><style>{`.vh-card{margin-top:18px;background:#fff;border:1px solid #e6e9ef;border-radius:14px;padding:19px;box-shadow:0 2px 10px rgba(20,28,45,.03)}.vh-title{font-size:14px;font-weight:800;margin-bottom:5px}.vh-sub{font-size:10px;color:#7b8493;margin-bottom:15px}.vh-list{display:grid;gap:9px}.vh-row{display:grid;grid-template-columns:120px 1fr auto;gap:12px;padding:11px 0;border-top:1px solid #edf0f3;align-items:start}.vh-date{font-size:10px;color:#7b8493}.vh-main{font-size:11px}.vh-main b{font-size:11px}.vh-detail{margin-top:4px;color:#687283;font-size:10px;line-height:1.45}.vh-pill{display:inline-flex;border-radius:999px;padding:4px 7px;background:#edf3ff;color:#3d61ad;font-size:9px;font-weight:800}.vh-empty{padding:12px;background:#f8f9fb;border-radius:9px;color:#7b8493;font-size:10px}@media(max-width:700px){.vh-row{grid-template-columns:1fr}.vh-date{order:2}}`}</style>
    <div className="vh-title">Timeline operativa</div>
    <div className="vh-sub">Storico delle modifiche al workflow. Le variazioni di stato, conferma Terna, scadenza e N/A restano registrate.</div>
    <div className="vh-list">{history.map(h=>{
      const changed=h.old_status!==h.new_status;
      const conf=h.old_confirmation_status!==h.new_confirmation_status;
      const due=h.old_due_date!==h.new_due_date;
      const na=h.old_is_not_applicable!==h.new_is_not_applicable;
      const parts=[];
      if(h.action==='created') parts.push('Fase creata');
      if(h.action==='deleted') parts.push('Fase eliminata');
      if(changed) parts.push(`Stato: ${statusLabel(h.old_status)} → ${statusLabel(h.new_status)}`);
      if(conf) parts.push(`Terna: ${statusLabel(h.old_confirmation_status)} → ${statusLabel(h.new_confirmation_status)}`);
      if(due) parts.push(`Scadenza: ${h.old_due_date||'—'} → ${h.new_due_date||'—'}`);
      if(na) parts.push(`Fase: ${statusLabel(h.new_is_not_applicable)}`);
      if(!parts.length && h.action==='updated') parts.push('Dati fase aggiornati');
      return <div className="vh-row" key={h.id}><div className="vh-date">{fmtDateTime(h.changed_at)}<br/>{h.changed_by_name||'Sistema'}</div><div className="vh-main"><b>{h.step_title||'Fase workflow'}</b><div className="vh-detail">{parts.join(' · ')}</div></div><span className="vh-pill">{h.action==='created'?'CREATA':h.action==='deleted'?'ELIMINATA':'MODIFICATA'}</span></div>;
    })}</div>
  </section>;
}
