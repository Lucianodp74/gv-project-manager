import { NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const allowed = {
  practice: ["request_date", "pto_received_date", "pto_accepted_date", "iter_start_date", "sharing_date", "acceptance_date", "next_deadline", "next_deadline_type", "notes", "responsible_id"],
  step: ["title", "phase", "step_type", "is_optional", "is_not_applicable", "status", "responsible_id", "due_date", "started_date", "completed_at", "completed_date", "blocker_reason", "notes", "document", "sort_order", "confirmation_required", "confirmation_status", "confirmation_date", "confirmation_document", "confirmation_notes"],
  deadline: ["status", "responsible_id", "due_date", "completed_date", "notes"],
};

const enums = {
  stepStatus: new Set(["pending", "in_progress", "done"]),
  confirmationStatus: new Set(["not_required", "waiting", "confirmed", "validated", "rejected"]),
  deadlineStatus: new Set(["open", "completed", "overdue", "cancelled"]),
};

function clean(body, type) {
  const out = {};
  for (const key of allowed[type] || []) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key] === "" ? null : body[key];
  }
  return out;
}
function validDate(value) { return value == null || /^\d{4}-\d{2}-\d{2}$/.test(value); }

export async function PATCH(request) {
  if (!URL || !KEY) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  try {
    const body = await request.json();
    const { type, id } = body;
    if (!allowed[type] || !id) return NextResponse.json({ error: "type/id mancanti" }, { status: 400 });
    if (type === "step" && body.status && !enums.stepStatus.has(body.status)) return NextResponse.json({ error: "Stato passaggio non valido" }, { status: 400 });
    if (type === "step" && body.confirmation_status && !enums.confirmationStatus.has(body.confirmation_status)) return NextResponse.json({ error: "Stato conferma non valido" }, { status: 400 });
    if (type === "deadline" && body.status && !enums.deadlineStatus.has(body.status)) return NextResponse.json({ error: "Stato scadenza non valido" }, { status: 400 });
    if (type === "step") {
      if (body.title != null && !String(body.title).trim()) return NextResponse.json({ error: "Il nome del passaggio è obbligatorio" }, { status: 400 });
      if (body.is_optional != null && typeof body.is_optional !== "boolean") return NextResponse.json({ error: "is_optional non valido" }, { status: 400 });
      if (body.is_not_applicable != null && typeof body.is_not_applicable !== "boolean") return NextResponse.json({ error: "is_not_applicable non valido" }, { status: 400 });
      if (body.confirmation_required != null && typeof body.confirmation_required !== "boolean") return NextResponse.json({ error: "confirmation_required non valido" }, { status: 400 });
      if (body.sort_order != null && !Number.isInteger(body.sort_order)) return NextResponse.json({ error: "sort_order non valido" }, { status: 400 });
    }
    for (const key of ["request_date", "pto_received_date", "pto_accepted_date", "iter_start_date", "sharing_date", "acceptance_date", "next_deadline", "due_date", "started_date", "completed_date", "confirmation_date"]) {
      if (Object.prototype.hasOwnProperty.call(body, key) && !validDate(body[key] === "" ? null : body[key])) return NextResponse.json({ error: `Data non valida: ${key}` }, { status: 400 });
    }
    const table = type === "practice" ? "connection_practices" : type === "step" ? "connection_steps" : "connection_deadlines";
    const payload = clean(body, type);
    if (!Object.keys(payload).length) return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
    if (type === "step" && payload.status === "done" && !payload.completed_at) payload.completed_at = new Date().toISOString();
    if (type === "step" && payload.confirmation_status && payload.confirmation_status !== "waiting" && payload.confirmation_status !== "not_required" && !payload.confirmation_date) payload.confirmation_date = new Date().toISOString().slice(0, 10);
    if (type === "step" && payload.confirmation_status === "waiting") payload.confirmation_required = true;
    if (type === "deadline" && payload.status === "completed" && !payload.completed_date) payload.completed_date = new Date().toISOString().slice(0, 10);
    const response = await fetch(`${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload), cache: "no-store" });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: `Aggiornamento fallito (${response.status})`, detail: text.slice(0, 300) }, { status: response.status });
    return NextResponse.json({ ok: true, data: text ? JSON.parse(text) : [] });
  } catch (error) {
    console.error("Connection update failed", error);
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }
}
