import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

export async function POST(request) {
  try {
    const body = await request.json();
    const display_name = String(body?.display_name || "").trim();
    const role = String(body?.role || "").trim() || null;
    if (!display_name) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ display_name, role, active: true }),
      cache: "no-store",
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) {}
    if (!response.ok) return NextResponse.json({ error: data?.message || data?.hint || "Impossibile creare la persona" }, { status: response.status });
    return NextResponse.json({ member: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Errore di creazione" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Persona non valida" }, { status: 400 });
    const payload = {};
    if (body?.display_name !== undefined) payload.display_name = String(body.display_name).trim();
    if (body?.role !== undefined) payload.role = String(body.role || "").trim() || null;
    if (body?.active !== undefined) payload.active = Boolean(body.active);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/team_members?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) {}
    if (!response.ok) return NextResponse.json({ error: data?.message || "Impossibile aggiornare la persona" }, { status: response.status });
    return NextResponse.json({ member: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Errore di aggiornamento" }, { status: 500 });
  }
}
