import { NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const allowed = {
  practice: ["request_date", "pto_received_date", "pto_accepted_date", "iter_start_date", "sharing_date", "acceptance_date", "next_deadline", "next_deadline_type", "notes", "responsible_id"],
  step: ["status", "responsible_id", "due_date", "started_date", "completed_at", "blocker_reason", "notes"],
  deadline: ["status", "responsible_id", "due_date", "completed_date", "notes"],
};

function clean(body, type) {
  const out = {};
  for (const key of allowed[type] || []) if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key] === "" ? null : body[key];
  return out;
}

export async function PATCH(request) {
  if (!URL || !KEY) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  try {
    const body = await request.json();
    const { type, id } = body;
    if (!allowed[type] || !id) return NextResponse.json({ error: "type/id mancanti" }, { status: 400 });
    const table = type === "practice" ? "connection_practices" : type === "step" ? "connection_steps" : "connection_deadlines";
    const payload = clean(body, type);
    const response = await fetch(`${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: `Aggiornamento fallito (${response.status})` }, { status: response.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Connection update failed", error);
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }
}
