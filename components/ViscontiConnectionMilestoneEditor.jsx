'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELDS = [
  ['request_date', 'Richiesta inviata'],
  ['pto_received_date', 'PTO ricevuto'],
  ['pto_accepted_date', 'PTO accettato'],
  ['pto_validated_date', 'PTO validato'],
  ['iter_start_date', 'Inizio iter autorizzativo'],
  ['start_works_validated_date', 'Avvio lavori validato'],
  ['sharing_date', 'Sharing / pubblicazione'],
];

const AUTH_STATUS = [
  ['not_started', 'Non avviato'],
  ['in_progress', 'In corso'],
  ['completed', 'Completato'],
  ['title_perfected', 'Titolo perfezionato'],
  ['suspended', 'Sospeso'],
  ['cancelled', 'Annullato'],
];

export default function ViscontiConnectionMilestoneEditor({ practice }) {
  const router = useRouter();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const next = { authorization_status: practice?.authorization_status || 'not_started', authorization_outcome: practice?.authorization_outcome || '' };
    FIELDS.forEach(([key]) => { next[key] = practice?.[key] || ''; });
    setValues(next);
  }, [practice]);

  if (!practice) return null;

  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/visconti-work/connection/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'practice', id: practice.id, payload: values }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Salvataggio non riuscito');
      setMessage('Aggiornamento salvato');
      router.refresh();
    } catch (error) {
      setMessage(error.message || 'Errore di salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Controllo milestone</h2>
          <p className="mt-1 text-xs text-slate-500">Registra gli eventi effettivamente verificati: PTO, validazioni, avvio iter e avvio lavori.</p>
        </div>
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Salvataggio…' : 'Salva aggiornamento'}
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Iter autorizzativo</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">Stato iter</span><select value={values.authorization_status || 'not_started'} onChange={(e) => set('authorization_status', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">{AUTH_STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">Esito autorizzativo</span><input value={values.authorization_outcome || ''} onChange={(e) => set('authorization_outcome', e.target.value)} placeholder="es. PAS perfezionato / autorizzato" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" /></label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span><input type="date" value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400" /></label>
        ))}
      </div>

      {practice.verification_status && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs"><b>Fonte:</b><span>{practice.source_label || 'Non indicata'}</span><span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{practice.verification_status === 'public_verified' ? 'Fonte pubblica verificata' : practice.verification_status === 'internally_verified' ? 'Verificato internamente' : 'Da verificare'}</span>{practice.source_verified_at && <span className="text-slate-500">verificata {practice.source_verified_at}</span>}{practice.source_url && <a href={practice.source_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 underline">Apri fonte</a>}</div>}
      {message && <p className="mt-3 text-xs font-medium text-slate-600">{message}</p>}
    </section>
  );
}
