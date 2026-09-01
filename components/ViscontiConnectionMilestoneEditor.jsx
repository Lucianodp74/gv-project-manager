'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELDS = [
  ['request_date', 'Richiesta inviata'],
  ['pto_received_date', 'PTO ricevuto'],
  ['pto_accepted_date', 'PTO accettato'],
  ['iter_start_date', 'Inizio iter'],
  ['sharing_date', 'Sharing / pubblicazione'],
  ['acceptance_date', 'Accettazione'],
];

export default function ViscontiConnectionMilestoneEditor({ practice }) {
  const router = useRouter();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const next = {};
    FIELDS.forEach(([key]) => { next[key] = practice?.[key] || ''; });
    setValues(next);
  }, [practice]);

  if (!practice) return null;

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
      setMessage('Milestone aggiornate');
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
          <h2 className="text-base font-semibold text-slate-900">Milestone connessione</h2>
          <p className="mt-1 text-xs text-slate-500">Aggiorna le date operative che alimentano la Control Tower Terna.</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Salva milestone'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
            <input
              type="date"
              value={values[key] || ''}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </label>
        ))}
      </div>

      {message && <p className="mt-3 text-xs font-medium text-slate-600">{message}</p>}
    </section>
  );
}
