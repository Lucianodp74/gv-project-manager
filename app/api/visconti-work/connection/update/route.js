import { NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const allowed = {
  practice: ["request_date", "pto_received_date", "pto_accepted_date", "pto_validated_date", "iter_start_date", "start_works_validated_date", "sharing_date", "acceptance_date", "next_deadline", "next_deadline_type", "authorization_status", "authorization_outcome", "notes", "responsible_id"],
  step: ["title", "phase", "step_type", "is_optional", "is_not_applicable", "status", "responsible_id", "due_date", "started_date", "completed_at", "notes", "sort_order", "confirmation_required", "confirmation_status", "confirmation_date", "confirmation_document", "confirmation_notes", "blocker_reason", "task_required", "task_id"],
  deadline: ["status", "responsible_id", "due_date", "notes"],
};

const enums = {
  stepStatus: new Set(["pending", "in_progress", "done"]),
  confirmationStatus: new Set(["not_required", "waiting", "confirmed", "validated", "rejected"]),
  deadlineStatus: new Set(["open", "completed", "overdue", "cancelled"]),
  authorizationStatus: new Set(["not_started", "in_progress", "completed", "title_perfected", "suspended", "cancelled"]),
};

const practiceAliases = {
  pto_accepted_date: "pto_accepted_at",
  pto_validated_date: "pto_validated_at",
  iter_start_date: "authorization_start_at",
  start_works_validated_date: "start_works_validated_at",
};

function clean(body, type) {
  const out = {};
  for (const key of allowed[type] || []) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key] === "" ? null : body[key];
    if (type === "practice" && practiceAliases[key]) out[practiceAliases[key]] = value;
    else out[key] = value;
  }
  return out;
}

function validDate(value) { return value == null || /^\d{4}-\d{2}-\d{2}$/.test(value); }

function headers(extra = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}

async function syncLinkedTask(stepId) {
  const stepRes = await fetch(`${URL}/rest/v1/connection_workflow_builder?select=id,practice_id,title,notes,status,is_not_applicable,responsible_id,due_date,confirmation_required,confirmation_status,confirmation_notes,blocker_reason,task_required,task_id&id=eq.${encodeURIComponent(stepId)}&limit=1`, { headers: headers(), cache: "no-store" });
  if (!stepRes.ok) throw new Error("Impossibile leggere la fase aggiornata");
  const rows = await stepRes.json();
  if (!rows.length) return;
  const step = rows[0];
  const mustCreate = Boolean(step.task_required || step.responsible_id || step.due_date || step.confirmation_required || step.task_id);
  if (!mustCreate || step.is_not_applicable) return;

  const practiceRes = await fetch(`${URL}/rest/v1/connection_practices?select=project_id&id=eq.${encodeURIComponent(step.practice_id)}&limit=1`, { headers: headers(), cache: "no-store" });
  if (!practiceRes.ok) throw new Error("Impossibile leggere il progetto della pratica");
  const practices = await practiceRes.json();
  if (!practices.length) throw new Error("Pratica non trovata");

  const existingId = step.task_id;
  const taskQuery = existingId
    ? `?select=id&id=eq.${encodeURIComponent(existingId)}&limit=1`
    : `?select=id&source_connection_step_id=eq.${encodeURIComponent(step.id)}&limit=1`;
  const existingRes = await fetch(`${URL}/rest/v1/visconti_task_board${taskQuery}`, { headers: headers(), cache: "no-store" });
  if (!existingRes.ok) throw new Error("Impossibile verificare l’attività collegata");
  const existing = await existingRes.json();

  const isWaiting = step.confirmation_status === "waiting";
  const isDone = step.status === "done";
  const payload = {
    title: step.title,
    description: step.notes || null,
    project_id: practices[0].project_id,
    connection_practice_id: step.practice_id,
    source_connection_step_id: step.id,
    responsible_id: step.responsible_id || null,
    due_date: step.due_date || null,
    workflow_status: isDone ? "done" : step.status === "in_progress" ? "in_progress" : isWaiting ? "blocked" : "todo",
    priority: isWaiting ? "high" : "normal",
    category: "connection",
    blocker_reason: isWaiting ? "In attesa di conferma esterna" : step.blocker_reason || null,
    next_action: isDone ? null : isWaiting ? "Ottenere la conferma e registrare l’esito" : null,
    notes: step.confirmation_notes || step.notes || null,
    completed_at: isDone ? (step.completed_at || new Date().toISOString()) : null,
  };

  const url = existing.length
    ? `${URL}/rest/v1/visconti_task_board?id=eq.${encodeURIComponent(existing[0].id)}`
    : `${URL}/rest/v1/visconti_task_board`;
  const response = await fetch(url, { method: existing.length ? "PATCH" : "POST", headers: headers({ Prefer: "return=representation" }), body: JSON.stringify(payload) });
  const text = await response.text();
  if (!response.ok) throw new Error(`Impossibile sincronizzare l’attività collegata (${response.status})`);
  const data = text ? JSON.parse(text) : [];
  const task = data[0] || data;
  if (task?.id && step.task_id !== task.id) {
    const attach = await fetch(`${URL}/rest/v1/connection_workflow_builder?id=eq.${encodeURIComponent(step.id)}`, { method: "PATCH", headers: headers({ Prefer: "return=minimal" }), body: JSON.stringify({ task_id: task.id }) });
    if (!attach.ok) throw new Error("Impossibile collegare l’attività alla fase");
  }
}

export async function PATCH(request) {
  if (!URL || !KEY) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  try {
    const body = await request.json();
    const { type, id } = body;
    if (!allowed[type] || !id) return NextResponse.json({ error: "type/id mancanti" }, { status: 400 });
    if (type === "step" && body.status && !enums.stepStatus.has(body.status)) return NextResponse.json({ error: "Stato passaggio non valido" }, { status: 400 });
    if (type === "step" && body.confirmation_status && !enums.confirmationStatus.has(body.confirmation_status)) return NextResponse.json({ error: "Stato conferma non valido" }, { status: 400 });
    if (type === "deadline" && body.status && !enums.deadlineStatus.has(body.status)) return NextResponse.json({ error: "Stato scadenza non valido" }, { status: 400 });
    if (type === "practice" && body.authorization_status && !enums.authorizationStatus.has(body.authorization_status)) return NextResponse.json({ error: "Stato iter autorizzativo non valido" }, { status: 400 });
    if (type === "step") {
      if (body.title != null && !String(body.title).trim()) return NextResponse.json({ error: "Il nome del passaggio è obbligatorio" }, { status: 400 });
      if (body.is_optional != null && typeof body.is_optional !== "boolean") return NextResponse.json({ error: "is_optional non valido" }, { status: 400 });
      if (body.is_not_applicable != null && typeof body.is_not_applicable !== "boolean") return NextResponse.json({ error: "is_not_applicable non valido" }, { status: 400 });
      if (body.confirmation_required != null && typeof body.confirmation_required !== "boolean") return NextResponse.json({ error: "confirmation_required non valido" }, { status: 400 });
      if (body.task_required != null && typeof body.task_required !== "boolean") return NextResponse.json({ error: "task_required non valido" }, { status: 400 });
      if (body.sort_order != null && !Number.isInteger(body.sort_order)) return NextResponse.json({ error: "sort_order non valido" }, { status: 400 });
    }
    for (const key of ["request_date", "pto_received_date", "pto_accepted_date", "pto_validated_date", "iter_start_date", "start_works_validated_date", "sharing_date", "acceptance_date", "next_deadline", "due_date", "started_date", "confirmation_date"]) {
      if (Object.prototype.hasOwnProperty.call(body, key) && !validDate(body[key] === "" ? null : body[key])) return NextResponse.json({ error: `Data non valida: ${key}` }, { status: 400 });
    }
    const table = type === "practice" ? "connection_practices" : type === "step" ? "connection_workflow_builder" : "connection_deadlines";
    const payload = clean(body, type);
    if (!Object.keys(payload).length) return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
    if (type === "step" && payload.status === "done" && !payload.completed_at) payload.completed_at = new Date().toISOString().slice(0, 10);
    if (type === "step" && payload.confirmation_status && payload.confirmation_status !== "waiting" && payload.confirmation_status !== "not_required" && !payload.confirmation_date) payload.confirmation_date = new Date().toISOString().slice(0, 10);
    if (type === "step" && payload.confirmation_status === "waiting") payload.confirmation_required = true;
    if (type === "deadline" && payload.status === "completed" && !payload.due_date) payload.due_date = new Date().toISOString().slice(0, 10);
    const response = await fetch(`${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: headers({ Prefer: "return=representation" }), body: JSON.stringify(payload), cache: "no-store" });
    const text = await response.text();
    if (!response.ok) return NextResponse.json({ error: `Aggiornamento fallito (${response.status})`, detail: text.slice(0, 300) }, { status: response.status });
    if (type === "step") await syncLinkedTask(id);
    return NextResponse.json({ ok: true, data: text ? JSON.parse(text) : [] });
  } catch (error) {
    console.error("Connection update failed", error);
    return NextResponse.json({ error: error.message || "Richiesta non valida" }, { status: 400 });
  }
}
