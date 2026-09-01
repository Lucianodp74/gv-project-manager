import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function okConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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

    const maxRes = await fetch(`${SUPABASE_URL}/rest/v1/connection_steps?select=sort_order&practice_id=eq.${encodeURIComponent(practiceId)}&order=sort_order.desc.nullslast&limit=1`, { headers: headers() });
    if (!maxRes.ok) return NextResponse.json({ error: 'Impossibile leggere l’ordine delle fasi' }, { status: 502 });
    const maxRows = await maxRes.json();
    const nextOrder = Number.isInteger(body.sort_order) ? body.sort_order : ((maxRows[0]?.sort_order ?? 0) + 1);

    const payload = {
      practice_id: practiceId,
      title,
      phase: body.phase || 'invio_doc',
      step_type: body.step_type || 'custom',
      is_optional: Boolean(body.is_optional),
      is_not_applicable: false,
      status: ['pending', 'in_progress', 'done'].includes(body.status) ? body.status : 'pending',
      sort_order: nextOrder,
      responsible_id: body.responsible_id || null,
      due_date: body.due_date || null,
      notes: body.notes || null,
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/connection_steps`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) return NextResponse.json({ error: data?.message || data?.hint || 'Creazione fase fallita' }, { status: response.status });
    return NextResponse.json(data[0] || data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Creazione fase fallita' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!okConfig()) return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 });
  try {
    const id = String(new URL(request.url).searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/connection_steps?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: headers({ Prefer: 'return=representation' }),
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) return NextResponse.json({ error: data?.message || 'Eliminazione fase fallita' }, { status: response.status });
    if (!data.length) return NextResponse.json({ error: 'Fase non trovata' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Eliminazione fase fallita' }, { status: 500 });
  }
}
