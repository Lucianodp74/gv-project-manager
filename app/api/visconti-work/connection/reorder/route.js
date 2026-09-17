import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = 'connection_workflow_builder';

function headers(extra = {}) {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...extra };
}
function okConfig() { return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY); }

async function updateStep(id, sort_order) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify({ sort_order }),
  });
  if (!response.ok) throw new Error('Impossibile aggiornare l’ordine delle fasi');
}

export async function POST(request) {
  if (!okConfig()) return NextResponse.json({ error: 'Supabase non configurato' }, { status: 500 });
  try {
    const body = await request.json();
    const practiceId = String(body.practice_id || '').trim();
    const orderedIds = Array.isArray(body.ordered_ids) ? body.ordered_ids.map(String) : [];
    if (!practiceId || !orderedIds.length) return NextResponse.json({ error: 'practice_id e ordered_ids sono obbligatori' }, { status: 400 });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id,practice_id&practice_id=eq.${encodeURIComponent(practiceId)}&order=sort_order.asc,id.asc`, { headers: headers() });
    if (!response.ok) return NextResponse.json({ error: 'Impossibile leggere le fasi' }, { status: 502 });
    const rows = await response.json();
    const existingIds = rows.map((row) => String(row.id));
    if (existingIds.length !== orderedIds.length || existingIds.some((id) => !orderedIds.includes(id))) {
      return NextResponse.json({ error: 'Elenco fasi non coerente con la pratica' }, { status: 409 });
    }

    for (let i = 0; i < orderedIds.length; i += 1) await updateStep(orderedIds[i], 100000 + i);
    for (let i = 0; i < orderedIds.length; i += 1) await updateStep(orderedIds[i], i + 1);
    return NextResponse.json({ ok: true, ordered_ids: orderedIds });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Riordino fallito' }, { status: 500 });
  }
}
