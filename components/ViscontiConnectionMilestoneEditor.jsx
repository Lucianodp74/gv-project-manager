'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELDS = [
  ['request_date', 'Richiesta inviata'],
  ['pto_received_date', 'PTO ricevuto'],
  ['pto_accepted_date', 'PTO accettato'],
  ['pto_validated_date', 'PTO validato'],
  ['iter_start_date', 'Avvio iter autorizzativo'],
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
    const next = {
      authorization_status: practice?.authorization_status || 'not_started',
      authorization_outcome: practice?.authorization_outcome || '',
      voltage_level: practice?.voltage_level || '',
    };
    FIELDS.forEach(([key]) => {
      next[key] = practice?.[key] || '';
    });
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
        body: JSON.stringify({ type: 'practice', id: practice.id, ...values }),
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Controllo pratica</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-slate-900">Milestone e iter autorizzativo</h2>
            <span className="text-xs text-slate-400">Pratica {practice.practiceCode || practice.practice_code || '—'}</span>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Registra solo eventi verificati. Questi dati alimentano il controllo operativo e le scadenze della pratica.
          </p>
        </div>
        <button type="button" onClick={save} disabled={saving} className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
          {saving ? 'Salvataggio…' : 'Salva aggiornamento'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-900">Iter autorizzativo</div>
          <div className="mt-1 text-xs text-slate-500">Stato e dati principali della fase autorizzativa.</div>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-3">
          <label className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Livello di tensione</span>
            <select value={values.voltage_level || ''} onChange={(e) => set('voltage_level', e.target.value)} className="block h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">
              <option value="">Da definire</option>
              <option value="AT">AT</option>
              <option value="AAT">AAT</option>
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Stato iter</span>
            <select value={values.authorization_status || 'not_started'} onChange={(e) => set('authorization_status', e.target.value)} className="block h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">
              {AUTH_STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Esito autorizzativo</span>
            <input value={values.authorization_outcome || ''} onChange={(e) => set('authorization_outcome', e.target.value)} placeholder="es. PAS perfezionato / autorizzato" className="block h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400" />
          </label>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Date verificate</div>
            <div className="mt-1 text-xs text-slate-500">Inserisci solo date presenti nella documentazione della pratica.</div>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            {FIELDS.filter(([key]) => values[key]).length}/{FIELDS.length} registrate
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1fr)_180px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:grid">
            <span>Milestone</span>
            <span>Data</span>
          </div>
          <div className="divide-y divide-slate-100">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="grid min-w-0 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center sm:gap-4">
                <span className="min-w-0 text-xs font-semibold text-slate-700">{label}</span>
                <input type="date" value={values[key] || ''} onChange={(e) => set(key, e.target.value)} className="block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white" />
              </label>
            ))}
          </div>
        </div>
      </div>

      {practice.verification_status && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <b className="text-slate-700">Fonte</b>
          <span className="text-slate-600">{practice.source_label || 'Non indicata'}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
            {practice.verification_status === 'public_verified' ? 'Fonte pubblica verificata' : practice.verification_status === 'internally_verified' ? 'Verificato internamente' : 'Da verificare'}
          </span>
          {practice.source_verified_at && <span className="text-slate-500">verificata {practice.source_verified_at}</span>}
          {practice.source_url && <a href={practice.source_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 underline">Apri fonte</a>}
        </div>
      )}

      {message && <p className="mt-3 text-xs font-medium text-slate-600">{message}</p>}
    </section>
  );
}
