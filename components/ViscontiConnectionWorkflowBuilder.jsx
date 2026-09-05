'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS = { pending: 'Da avviare', in_progress: 'In corso', done: 'Completato' };
const TYPE = { milestone: 'Milestone', deadline: 'Scadenza', document: 'Documento', approval: 'Approvazione', technical: 'Tecnica', authority: 'Ente / parere', custom: 'Personalizzata' };
const CONF = { not_required: '', waiting: 'In attesa Terna', confirmed: 'Confermato da Terna', validated: 'Validato da Terna', rejected: 'Respinto / da verificare' };

const TEMPLATES = {
  standard: { label: 'Connessione standard', items: [['Richiesta connessione', 'milestone', false], ['Invio documenti', 'document', false], ['PTO / STMG ricevuto', 'document', false], ['PTO inviato a Terna — attesa conferma', 'document', true], ['PTO accettato', 'approval', false], ['Avvio iter autorizzativo', 'milestone', false], ['Accettazione / chiusura connessione', 'approval', false]] },
  integrazioni: { label: 'Connessione con integrazioni', items: [['Richiesta connessione', 'milestone', false], ['Invio documenti', 'document', false], ['Richiesta integrazione', 'authority', false], ['Invio integrazione', 'document', false], ['PTO / STMG ricevuto', 'document', false], ['PTO inviato a Terna — attesa conferma', 'document', true], ['PTO accettato', 'approval', false], ['Avvio iter autorizzativo', 'milestone', false]] },
  proroga: { label: 'Proroga / variazione', items: [['Richiesta proroga', 'authority', true], ['Istruttoria proroga', 'technical', false], ['Proroga concessa', 'approval', true], ['Nuova scadenza operativa', 'deadline', false], ['Proroga inizio lavori — attesa conferma Terna', 'deadline', true]] },
  autorizzativo: { label: 'Iter autorizzativo complesso', items: [['Avvio iter autorizzativo', 'milestone', false], ['Richiesta parere ente', 'authority', true], ['Invio integrazioni', 'document', false], ['Conferenza / tavolo tecnico', 'technical', false], ['Parere favorevole', 'approval', false], ['Prescrizioni da recepire', 'authority', true], ['Provvedimento autorizzativo', 'approval', true]] },
};

const DEMO = [
  { id: 'demo-1', title: 'Richiesta connessione', status: 'done', sort_order: 1, step_type: 'milestone' },
  { id: 'demo-2', title: 'PTO ricevuto', status: 'in_progress', sort_order: 2, step_type: 'document' },
  { id: 'demo-3', title: 'PTO inviato — attesa conferma Terna', status: 'in_progress', sort_order: 3, step_type: 'document', confirmation_required: true, confirmation_status: 'waiting' },
];

export default function ViscontiConnectionWorkflowBuilder({ practice, steps = [], members = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [insertAnchor, setInsertAnchor] = useState(null);
  const [insertPosition, setInsertPosition] = useState('after');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('custom');
  const [newOptional, setNewOptional] = useState(false);
  const [newConfirmation, setNewConfirmation] = useState(false);
  const [newResponsible, setNewResponsible] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const rows = useMemo(() => steps?.length ? [...steps].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : DEMO, [steps]);
  const real = Boolean(practice?.id);

  async function request(url, options) {
    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Operazione fallita');
    return json;
  }

  async function patch(id, payload) {
    setSaving(true); setMessage('');
    try {
      await request('/api/visconti-work/connection/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'step', id, ...payload }) });
      setEditing(null); setMessage('Modifica salvata'); router.refresh();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  }

  function openAdd(anchor = null, position = 'after') {
    setInsertAnchor(anchor); setInsertPosition(position); setAdding(true); setMessage('');
  }

  function resetAdd() {
    setAdding(false); setInsertAnchor(null); setInsertPosition('after'); setNewTitle(''); setNewType('custom'); setNewOptional(false); setNewConfirmation(false); setNewResponsible(''); setNewDueDate('');
  }

  async function addStep() {
    if (!real) return;
    if (!newTitle.trim()) return setMessage('Inserisci il nome della fase');
    setSaving(true); setMessage('');
    try {
      await request('/api/visconti-work/connection/steps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ practice_id: practice.id, title: newTitle.trim(), step_type: newType, is_optional: newOptional, responsible_id: newResponsible || null, due_date: newDueDate || null, confirmation_required: newConfirmation, confirmation_status: newConfirmation ? 'waiting' : 'not_required', position: insertAnchor ? insertPosition : 'after_end', anchor_id: insertAnchor || null }) });
      resetAdd(); setMessage('Fase aggiunta'); router.refresh();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  }

  async function applyTemplate(key) {
    if (!real) return;
    const template = TEMPLATES[key];
    if (rows.length && !window.confirm(`Aggiungere il modello “${template.label}” alle fasi esistenti?`)) return;
    setSaving(true); setMessage('');
    try {
      for (const [title, step_type, confirmation_required] of template.items) {
        await request('/api/visconti-work/connection/steps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ practice_id: practice.id, title, step_type, is_optional: false, confirmation_required, confirmation_status: confirmation_required ? 'waiting' : 'not_required', position: 'after_end' }) });
      }
      setMessage(`Modello “${template.label}” applicato`); router.refresh();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  }

  async function moveStep(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rows.length || !real) return;
    const orderedIds = rows.map((row, i) => i === index ? rows[targetIndex].id : i === targetIndex ? rows[index].id : row.id);
    setSaving(true); setMessage('');
    try {
      await request('/api/visconti-work/connection/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ practice_id: practice.id, ordered_ids: orderedIds }) });
      setMessage('Ordine aggiornato'); router.refresh();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  }

  function confirmationActions(step) {
    if (!step.confirmation_required) return null;
    const state = step.confirmation_status || 'waiting';
    return <div className={`gv-confirmation gv-confirmation-${state}`}>
      <span className="gv-confirmation-label">Terna: {CONF[state] || 'In attesa Terna'}</span>
      <div className="gv-confirmation-actions">
        {state !== 'confirmed' && <button disabled={saving} onClick={() => patch(step.id, { confirmation_status: 'confirmed' })}>✓ Confermato</button>}
        {state !== 'validated' && <button disabled={saving} onClick={() => patch(step.id, { confirmation_status: 'validated' })}>✓ Validato</button>}
        {state !== 'rejected' && <button disabled={saving} className="gv-danger" onClick={() => patch(step.id, { confirmation_status: 'rejected' })}>Respinto</button>}
      </div>
    </div>;
  }

  return <section className="gv-workflow-builder">
    <div className="gv-workflow-head">
      <div>
        <div className="gv-workflow-kicker">ITER DELLA PRATICA</div>
        <h2>Workflow di connessione</h2>
        <p>Qui si vede, in ordine, cosa deve succedere per portare avanti la pratica. Le fasi Terna restano in attesa finché non vengono realmente confermate o validate.</p>
      </div>
      <div className="gv-workflow-actions">
        <select disabled={!real || saving} defaultValue="" onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ''; }} aria-label="Applica modello workflow">
          <option value="">Applica modello…</option>
          {Object.entries(TEMPLATES).map(([key, template]) => <option key={key} value={key}>{template.label}</option>)}
        </select>
        <button className="gv-primary" disabled={!real || saving} onClick={() => openAdd()}>+ Aggiungi fase</button>
      </div>
    </div>

    <div className="gv-workflow-summary">
      <div><strong>{rows.length}</strong><span>fasi</span></div>
      <div><strong>{rows.filter(r => r.status === 'done').length}</strong><span>completate</span></div>
      <div><strong>{rows.filter(r => r.status === 'in_progress').length}</strong><span>in corso</span></div>
      <div><strong>{rows.filter(r => r.confirmation_required && (r.confirmation_status || 'waiting') === 'waiting').length}</strong><span>in attesa Terna</span></div>
    </div>

    <div className="gv-workflow-list">
      {rows.map((step, index) => {
        const status = step.is_not_applicable ? 'N/A' : (STATUS[step.status] || step.status || 'Da avviare');
        const statusClass = step.is_not_applicable ? 'na' : step.status === 'done' ? 'done' : step.status === 'in_progress' ? 'progress' : 'pending';
        return <article key={step.id || index} className={`gv-workflow-step ${step.is_not_applicable ? 'is-na' : ''}`}>
          <div className="gv-step-index">{index + 1}</div>
          <div className="gv-step-main">
            <div className="gv-step-title-row">
              <h3>{step.title || step.phase || 'Passaggio'}</h3>
              <span className="gv-type">{TYPE[step.step_type] || step.step_type || 'Fase'}</span>
              {step.is_optional && <span className="gv-optional">OPZIONALE</span>}
            </div>
            <div className="gv-step-meta">
              <span><b>Responsabile</b> {step.responsible_name || 'Da assegnare'}</span>
              <span><b>Scadenza</b> {step.due_date || '—'}</span>
              {step.blocker_reason && <span className="gv-blocker"><b>Blocco</b> {step.blocker_reason}</span>}
            </div>
            {confirmationActions(step)}
            {real && <div className="gv-step-actions">
              <button disabled={saving || index === 0} onClick={() => moveStep(index, -1)} title="Sposta sopra">↑</button>
              <button disabled={saving || index === rows.length - 1} onClick={() => moveStep(index, 1)} title="Sposta sotto">↓</button>
              <button disabled={saving} onClick={() => setEditing({ ...step })}>Modifica</button>
              <button disabled={saving} onClick={() => patch(step.id, { is_not_applicable: !step.is_not_applicable })}>{step.is_not_applicable ? 'Riattiva' : 'N/A'}</button>
              <span className="gv-insert-menu">
                <button disabled={saving} onClick={() => openAdd(step.id, 'before')}>+ Prima</button>
                <button disabled={saving} onClick={() => openAdd(step.id, 'after')}>+ Dopo</button>
              </span>
            </div>}
          </div>
          <div className={`gv-step-status ${statusClass}`}>{status}</div>
        </article>;
      })}
    </div>

    {message && <div className="gv-workflow-message">{message}</div>}

    {adding && <div className="gv-modal-backdrop"><div className="gv-modal"><div className="gv-modal-head"><div><span className="gv-workflow-kicker">NUOVA FASE</span><h3>{insertAnchor ? 'Inserisci una fase' : 'Aggiungi una fase'}</h3>{insertAnchor && <p>La nuova fase verrà inserita {insertPosition === 'before' ? 'prima' : 'dopo'} della fase selezionata.</p>}</div><button onClick={resetAdd}>×</button></div><div className="gv-form-grid"><label>Nome<input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="es. PTO inviato a Terna" /></label><label>Tipo<select value={newType} onChange={e => setNewType(e.target.value)}>{Object.entries(TYPE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Responsabile<select value={newResponsible} onChange={e => setNewResponsible(e.target.value || '')}><option value="">Da assegnare</option>{members.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}</select></label><label>Scadenza<input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></label></div><div className="gv-checks"><label><input type="checkbox" checked={newOptional} onChange={e => setNewOptional(e.target.checked)} /> Fase opzionale</label><label><input type="checkbox" checked={newConfirmation} onChange={e => setNewConfirmation(e.target.checked)} /> Richiede conferma / validazione Terna</label></div><div className="gv-modal-footer"><button onClick={resetAdd}>Annulla</button><button className="gv-primary" disabled={saving} onClick={addStep}>{saving ? 'Creazione…' : 'Aggiungi fase'}</button></div></div></div>}

    {editing && <div className="gv-modal-backdrop"><div className="gv-modal"><div className="gv-modal-head"><div><span className="gv-workflow-kicker">MODIFICA</span><h3>Modifica fase</h3></div><button onClick={() => setEditing(null)}>×</button></div><div className="gv-form-grid"><label>Nome<input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label><label>Tipo<select value={editing.step_type || 'custom'} onChange={e => setEditing({ ...editing, step_type: e.target.value })}>{Object.entries(TYPE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Responsabile<select value={editing.responsible_id || ''} onChange={e => setEditing({ ...editing, responsible_id: e.target.value || null })}><option value="">Da assegnare</option>{members.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}</select></label><label>Stato<select value={editing.status || 'pending'} onChange={e => setEditing({ ...editing, status: e.target.value })}>{Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Scadenza<input type="date" value={editing.due_date || ''} onChange={e => setEditing({ ...editing, due_date: e.target.value || null })} /></label><label className="gv-full">Blocco / nota operativa<input value={editing.blocker_reason || ''} onChange={e => setEditing({ ...editing, blocker_reason: e.target.value })} /></label></div><div className="gv-modal-footer"><button onClick={() => setEditing(null)}>Annulla</button><button className="gv-primary" disabled={saving} onClick={() => patch(editing.id, { title: editing.title, step_type: editing.step_type, responsible_id: editing.responsible_id, status: editing.status, due_date: editing.due_date, blocker_reason: editing.blocker_reason })}>{saving ? 'Salvataggio…' : 'Salva modifiche'}</button></div></div></div>}
  </section>;
}
