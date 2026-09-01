'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_PHASE = 'custom';
const STATUS = { pending: 'Da avviare', in_progress: 'In corso', done: 'Completato' };
const DEMO = [
  { id: 'demo-1', title: 'Richiesta connessione', status: 'done', sort_order: 1, is_optional: false, is_not_applicable: false },
  { id: 'demo-2', title: 'STMG ricevuta', status: 'in_progress', sort_order: 2, is_optional: false, is_not_applicable: false },
  { id: 'demo-3', title: 'Accettazione STMG', status: 'pending', sort_order: 3, is_optional: false, is_not_applicable: false },
  { id: 'demo-4', title: 'Tavolo tecnico', status: 'pending', sort_order: 4, is_optional: true, is_not_applicable: false },
  { id: 'demo-5', title: 'Invio PTO', status: 'pending', sort_order: 5, is_optional: false, is_not_applicable: false },
  { id: 'demo-6', title: 'Validazione PTO', status: 'pending', sort_order: 6, is_optional: false, is_not_applicable: false },
];

export default function ViscontiConnectionWorkflowBuilder({ practice, steps = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const rows = useMemo(() => (steps?.length ? [...steps].sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : DEMO), [steps]);
  const real = Boolean(practice?.id && steps?.length);

  async function patch(id, payload) {
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/visconti-work/connection/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'step', id, ...payload }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Aggiornamento fallito');
      setEditing(null); setMessage('Salvato'); router.refresh();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  }

  async function addStep() {
    setMessage(real ? 'Per aggiungere una nuova fase serve la creazione server-side del passaggio.' : 'Modalità demo');
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div><h2 className="text-base font-semibold text-slate-900">Workflow Builder</h2><p className="mt-1 text-xs text-slate-500">L’iter è configurabile per singola pratica: puoi adattarlo a STMG, PTO, tavoli tecnici e passaggi speciali.</p></div>
      <button onClick={addStep} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">+ Aggiungi fase</button>
    </div>
    <div className="space-y-2">
      {rows.map((step, index) => <div key={step.id || index} className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[32px_1fr_auto_auto] ${step.is_not_applicable ? 'border-dashed bg-slate-50 opacity-60' : 'border-slate-200'}`}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</div>
        <div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{step.title || step.phase || 'Passaggio'}</span>{step.is_optional && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">OPZIONALE</span>}{step.is_not_applicable && <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">NON NECESSARIO</span>}</div><div className="mt-1 text-[11px] text-slate-500">{step.responsible_name || 'Responsabile da assegnare'} · {step.due_date || 'senza scadenza'}{step.blocker_reason ? ` · Blocco: ${step.blocker_reason}` : ''}</div></div>
        <span className={`self-center rounded-full px-2 py-1 text-[10px] font-bold ${step.status === 'done' ? 'bg-emerald-50 text-emerald-700' : step.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{step.is_not_applicable ? 'N/A' : STATUS[step.status] || step.status}</span>
        {real && <div className="flex items-center gap-1"><button className="rounded-lg border px-2 py-1 text-[10px]" onClick={() => setEditing({...step})}>Modifica</button><button className="rounded-lg border px-2 py-1 text-[10px]" onClick={() => patch(step.id, { is_not_applicable: !step.is_not_applicable })}>{step.is_not_applicable ? 'Riattiva' : 'N/A'}</button></div>}
      </div>)}
    </div>
    {message && <div className="mt-3 text-xs text-slate-500">{message}</div>}
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-base font-semibold">Modifica fase</h3><div className="mt-4 space-y-3"><label className="block text-xs font-medium">Nome<input className="mt-1 w-full rounded-lg border p-2 text-sm" value={editing.title || ''} onChange={e => setEditing({...editing,title:e.target.value})}/></label><label className="block text-xs font-medium">Stato<select className="mt-1 w-full rounded-lg border p-2 text-sm" value={editing.status || 'pending'} onChange={e => setEditing({...editing,status:e.target.value})}><option value="pending">Da avviare</option><option value="in_progress">In corso</option><option value="done">Completato</option></select></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(editing.is_optional)} onChange={e => setEditing({...editing,is_optional:e.target.checked})}/> Fase opzionale</label><label className="block text-xs font-medium">Scadenza<input type="date" className="mt-1 w-full rounded-lg border p-2 text-sm" value={editing.due_date || ''} onChange={e => setEditing({...editing,due_date:e.target.value})}/></label><label className="block text-xs font-medium">Blocco<textarea className="mt-1 w-full rounded-lg border p-2 text-sm" value={editing.blocker_reason || ''} onChange={e => setEditing({...editing,blocker_reason:e.target.value})}/></label></div><div className="mt-5 flex justify-end gap-2"><button className="rounded-lg border px-3 py-2 text-xs" onClick={()=>setEditing(null)}>Annulla</button><button disabled={saving} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>patch(editing.id,{title:editing.title,status:editing.status,is_optional:Boolean(editing.is_optional),is_not_applicable:Boolean(editing.is_not_applicable),due_date:editing.due_date||null,blocker_reason:editing.blocker_reason||null})}>{saving?'Salvataggio…':'Salva'}</button></div></div></div>}
  </section>;
}
