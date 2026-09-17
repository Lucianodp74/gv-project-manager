'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ViscontiTeamMembersPanel({ members = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function addMember() {
    if (!name.trim()) return setMessage('Inserisci il nome della persona.');
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/visconti-work/team-members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim(), role: role.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Impossibile aggiungere la persona');
      setName(''); setRole(''); setOpen(false); setMessage('Persona aggiunta.');
      router.refresh();
    } catch (e) { setMessage(e.message || 'Errore'); }
    finally { setSaving(false); }
  }

  return (
    <section className="vmp-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="vmp-head">
        <div><h2>Persone e assegnazioni</h2><p>Le persone attive sono disponibili per assegnare attività, scadenze e fasi del workflow.</p></div>
        <button type="button" className="vmp-primary" onClick={() => { setOpen(true); setMessage(''); }}>+ Aggiungi persona</button>
      </div>
      <div className="vmp-list">
        {members.length ? members.map((m) => <div className="vmp-person" key={m.id}><span className="vmp-avatar">{(m.display_name || '?').slice(0,1).toUpperCase()}</span><div><strong>{m.display_name}</strong><small>{m.role || 'Ruolo non indicato'}</small></div></div>) : <div className="vmp-empty">Nessuna persona attiva configurata.</div>}
      </div>
      {message && !open && <div className="vmp-message">{message}</div>}
      {open && <div className="vmp-modal-backdrop"><div className="vmp-modal"><h3>Aggiungi persona</h3><p>La persona sarà subito disponibile nei campi “Responsabile”.</p><label>Nome<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="es. Mario Rossi" /></label><label>Ruolo<input value={role} onChange={e => setRole(e.target.value)} placeholder="es. Project Manager" /></label>{message && <div className="vmp-error">{message}</div>}<div className="vmp-actions"><button type="button" onClick={() => setOpen(false)}>Annulla</button><button type="button" className="vmp-primary" disabled={saving} onClick={addMember}>{saving ? 'Salvataggio…' : 'Aggiungi'}</button></div></div></div>}
      <style jsx>{`.vmp-panel{color:#172033}.vmp-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.vmp-head h2{margin:0;font-size:16px;font-weight:800}.vmp-head p{margin:4px 0 0;color:#737c8c;font-size:12px}.vmp-primary{border:1px solid #172b4d;border-radius:9px;padding:9px 12px;background:#172b4d;color:#fff;font-size:11px;font-weight:800;cursor:pointer}.vmp-primary:disabled{opacity:.55}.vmp-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.vmp-person{display:flex;align-items:center;gap:9px;min-width:190px;padding:10px 12px;border:1px solid #e6e9ef;border-radius:11px;background:#f8f9fb}.vmp-avatar{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#e9eef8;color:#172b4d;font-size:11px;font-weight:800}.vmp-person strong{display:block;font-size:12px}.vmp-person small{display:block;margin-top:2px;color:#737c8c;font-size:10px}.vmp-empty{color:#737c8c;font-size:12px}.vmp-message{margin-top:10px;font-size:11px;color:#18774e}.vmp-modal-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:rgba(23,32,51,.3)}.vmp-modal{width:min(440px,100%);padding:20px;border-radius:14px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.18)}.vmp-modal h3{margin:0;font-size:16px}.vmp-modal p{margin:5px 0 16px;color:#737c8c;font-size:11px}.vmp-modal label{display:block;margin-top:12px;color:#667085;font-size:11px;font-weight:700}.vmp-modal input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #dfe3e9;border-radius:9px;font-size:12px}.vmp-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.vmp-actions button{border:1px solid #dfe3e9;border-radius:9px;padding:9px 12px;background:#fff;font-size:11px;font-weight:700}.vmp-error{margin-top:10px;color:#b43a34;font-size:11px}`}</style>
    </section>
  );
}
