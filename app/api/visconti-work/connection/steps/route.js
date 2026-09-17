import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = 'connection_workflow_builder';
function headers(extra = {}) { return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...extra }; }
function okConfig() { return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY); }

async function shiftSteps(practiceId, startOrder) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id,sort_order&practice_id=eq.${encodeURIComponent(practiceId)}&sort_order=gte.${startOrder}&order=sort_order.desc,id.desc`, { headers: headers() });
  if (!response.ok) throw new Error('Impossibile leggere le fasi da spostare');
  const rows = await response.json();
  for (const row of rows) {
    const patch = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(row.id)}`, { method: 'PATCH', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify({ sort_order: Number(row.sort_order) + 1 }) });
    if (!patch.ok) throw new Error('Impossibile spostare le fasi successive');
  }
}

async function createLinkedTask(step) {
  const mustCreate = Boolean(step.task_required || step.responsible_id || step.due_date || step.confirmation_required);
  if (!mustCreate || step.status === 'done' || step.is_not_applicable) return null;
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/visconti_task_board?select=id&source_connection_step_id=eq.${encodeURIComponent(step.id)}&limit=1`, { headers: headers() });
  if (!existingRes.ok) throw new Error('Impossibile verificare l’attività collegata');
  const existing = await existingRes.json();
  const payload = { title: step.title, description: step.notes || null, project_id: step.project_id, connection_practice_id: step.practice_id, source_connection_step_id: step.id, responsible_id: step.responsible_id || null, due_date: step.due_date || null, workflow_status: step.status === 'in_progress' ? 'in_progress' : step.confirmation_status === 'waiting' ? 'blocked' : 'todo', priority: step.confirmation_status === 'waiting' ? 'high' : 'normal', category: 'connection', blocker_reason: step.confirmation_status === 'waiting' ? 'In attesa di conferma esterna' : step.blocker_reason || null, next_action: step.confirmation_status === 'waiting' ? 'Ottenere la conferma e registrare l’esito' : null, notes: step.confirmation_notes || null };
  const url = existing.length ? `${SUPABASE_URL}/rest/v1/visconti_task_board?id=eq.${encodeURIComponent(existing[0].id)}` : `${SUPABASE_URL}/rest/v1/visconti_task_board`;
  const response = await fetch(url, { method: existing.length ? 'PATCH' : 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Impossibile sincronizzare l’attività collegata');
  const data = await response.json();
  return data[0] || data;
}

async function attachTaskId(stepId, task) {
  if (!task?.id) return;
  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(stepId)}`, { method: 'PATCH', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify({ task_id: task.id }) });
}

export async function POST(request) {
  if (!okConfig()) return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 });
  try {
    const body = await request.json();
    const practiceId = String(body.practice_id || '').trim();
    const title = String(body.title || '').trim();
    if (!practiceId || !title) return NextResponse.json({ error: 'practice_id e title sono obbligatori' }, { status: 400 });
    if (title.length > 160) return NextResponse.json({ error: 'Titolo troppo lungo' }, { status: 400 });
    const practiceRes = await fetch(`${SUPABASE_URL}/rest/v1/connection_practices?select=id,project_id&id=eq.${encodeURIComponent(practiceId)}&limit=1`, { headers: headers() });
    if (!practiceRes.ok) return NextResponse.json({ error: 'Impossibile verificare la pratica' }, { status: 502 });
    const practices = await practiceRes.json();
    if (!practices.length) return NextResponse.json({ error: 'Pratica non trovata' }, { status: 404 });
    const practice = practices[0];
    const maxRes = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=sort_order&practice_id=eq.${encodeURIComponent(practiceId)}&order=sort_order.desc.nullslast&limit=1`, { headers: headers() });
    if (!maxRes.ok) return NextResponse.json({ error: 'Impossibile leggere l’ordine delle fasi' }, { status: 502 });
    const maxRows = await maxRes.json();
    let nextOrder = Number(maxRows[0]?.sort_order ?? 0) + 1;
    const position = String(body.position || 'after_end');
    const anchorId = String(body.anchor_id || '').trim();
    if (anchorId && ['before', 'after'].includes(position)) {
      const anchorRes = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id,sort_order&practice_id=eq.${encodeURIComponent(practiceId)}&id=eq.${encodeURIComponent(anchorId)}&limit=1`, { headers: headers() });
      if (!anchorRes.ok) return NextResponse.json({ error: 'Impossibile leggere la fase di riferimento' }, { status: 502 });
      const anchors = await anchorRes.json();
      if (!anchors.length) return NextResponse.json({ error: 'Fase di riferimento non trovata' }, { status: 404 });
      nextOrder = Number(anchors[0].sort_order) + (position === 'after' ? 1 : 0);
      await shiftSteps(practiceId, nextOrder);
    }
    const confirmationRequired = Boolean(body.confirmation_required);
    const payload = { practice_id: practiceId, title, phase: body.phase || 'invio_doc', step_type: body.step_type || 'custom', is_optional: Boolean(body.is_optional), is_not_applicable: false, status: ['pending', 'in_progress', 'done'].includes(body.status) ? body.status : 'pending', sort_order: nextOrder, responsible_id: body.responsible_id || null, due_date: body.due_date || null, notes: body.notes || null, confirmation_required: confirmationRequired, confirmation_status: confirmationRequired ? 'waiting' : 'not_required', task_required: Boolean(body.task_required || body.responsible_id || body.due_date || confirmationRequired) };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, { method: 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(payload) });
    const data = await response.json().catch(() => []);
    if (!response.ok) return NextResponse.json({ error: data?.message || data?.hint || 'Creazione fase fallita' }, { status: response.status });
    const step = { ...(data[0] || data), project_id: practice.project_id };
    const task = await createLinkedTask(step);
    if (task) await attachTaskId(step.id, task);
    return NextResponse.json({ ...step, task_id: task?.id || null }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error.message || 'Creazione fase fallita' }, { status: 500 }); }
}

export async function DELETE(request) {
  if (!okConfig()) return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 });
  try {
    const id = String(new URL(request.url).searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 });
    // Workflow steps are operational records: do not physically delete them.
    // Mark them as not applicable so the workflow remains traceable and reversible.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify({ is_not_applicable: true, task_required: false }) });
    const data = await response.json().catch(() => []);
    if (!response.ok) return NextResponse.json({ error: data?.message || 'Disattivazione fase fallita' }, { status: response.status });
    if (!data.length) return NextResponse.json({ error: 'Fase non trovata' }, { status: 404 });
    return NextResponse.json({ ok: true, disabled: data[0] });
  } catch (error) { return NextResponse.json({ error: error.message || 'Disattivazione fase fallita' }, { status: 500 }); }
}
