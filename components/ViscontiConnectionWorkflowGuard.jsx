'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ViscontiConnectionWorkflowBuilder from './ViscontiConnectionWorkflowBuilder';

const STANDARD = [
  ['Richiesta di connessione presentata', 'milestone', false],
  ['Elaborazione / ricezione preventivo STMG', 'deadline', false],
  ['Verifica PTO / soluzione di connessione', 'technical', false],
  ['Accettazione preventivo STMG', 'approval', false],
  ['Predisposizione e invio progetto', 'document', false],
  ['Rilascio benestare tecnico', 'approval', false],
  ['Avvio iter autorizzativo', 'milestone', false],
  ['Avanzamento iter autorizzativo', 'authority', false],
  ['Conseguimento autorizzazione', 'approval', false],
  ['Richiesta / elaborazione STMD', 'technical', false],
  ['Accettazione STMD', 'approval', false],
  ['Stipula contratto di connessione', 'approval', false],
  ['Avvio lavori / comunicazione avvio', 'milestone', false],
  ['Fine lavori / documentazione finale', 'document', false],
  ['Entrata in esercizio / attivazione', 'milestone', false],
];

export default function ViscontiConnectionWorkflowGuard({ practice, steps = [], members = [] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  if (!practice?.id || steps.length > 0) {
    return <ViscontiConnectionWorkflowBuilder practice={practice} steps={steps} members={members} />;
  }

  async function createStandardWorkflow() {
    setCreating(true);
    setMessage('');
    try {
      for (const [title, step_type, confirmation_required] of STANDARD) {
        const res = await fetch('/api/visconti-work/connection/steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            practice_id: practice.id,
            title,
            step_type,
            is_optional: false,
            confirmation_required,
            confirmation_status: confirmation_required ? 'waiting' : 'not_required',
            position: 'after_end',
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Impossibile creare il workflow');
      }
      router.refresh();
    } catch (error) {
      setMessage(error.message || 'Impossibile creare il workflow');
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="gv-workflow-builder">
      <div className="gv-workflow-head">
        <div>
          <div className="gv-workflow-kicker">ITER DELLA PRATICA</div>
          <h2>Workflow di connessione</h2>
          <p>Questa pratica non ha ancora fasi operative registrate. Non mostriamo dati dimostrativi: crea il workflow reale della pratica con 15 fasi operative.</p>
        </div>
        <button className="gv-primary" disabled={creating} onClick={createStandardWorkflow}>
          {creating ? 'Creazione…' : 'Crea workflow standard'}
        </button>
      </div>
      <div className="gv-workflow-summary">
        <div><strong>0</strong><span>fasi reali</span></div>
        <div><strong>—</strong><span>stato</span></div>
        <div><strong>—</strong><span>Terna</span></div>
      </div>
      {message && <div className="gv-workflow-message">{message}</div>}
    </section>
  );
}