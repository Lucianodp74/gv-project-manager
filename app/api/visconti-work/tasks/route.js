const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = "visconti_task_board";

function configError() { return new Response(JSON.stringify({ error: "Supabase non configurato" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
async function supabase(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(options.headers || {}) } });
}

const allowed = new Set(["title", "description", "project_id", "assignee_person_id", "priority", "workflow_status", "attention_state", "blocker_reason", "notes", "due_date", "completed_at", "category", "connection_practice_id", "next_action"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const statuses = new Set(["todo", "in_progress", "blocked", "done", "cancelled"]);
const categories = new Set(["general", "connection", "design", "gis", "land", "specialist", "authority", "document", "commercial", "internal"]);

function clean(body, partial = false) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) if (allowed.has(key)) out[key] = value === "" ? null : value;
  if (!partial && !String(out.title || "").trim()) throw new Error("Titolo obbligatorio");
  if (out.title !== undefined) { out.title = String(out.title).trim(); if (!out.title) throw new Error("Titolo obbligatorio"); }
  if (out.priority !== undefined && !priorities.has(out.priority)) throw new Error("Priorità non valida");
  if (out.workflow_status !== undefined && !statuses.has(out.workflow_status)) throw new Error("Stato non valido");
  if (out.category !== undefined && !categories.has(out.category)) throw new Error("Categoria non valida");
  if (out.attention_state !== undefined && !["normal", "soon", "urgent", "overdue", "blocked"].includes(out.attention_state)) throw new Error("Stato attenzione non valido");
  if (out.assignee_person_id !== undefined) { out.responsible_id = out.assignee_person_id; delete out.assignee_person_id; }
  delete out.attention_state;
  return out;
}

function derivedAttention(payload) {
  if (payload.workflow_status === "blocked") return "blocked";
  if (payload.workflow_status === "done" || payload.workflow_status === "cancelled") return "normal";
  if (payload.due_date) {
    const today = new Date().toISOString().slice(0, 10);
    if (payload.due_date < today) return "overdue";
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    if (payload.due_date <= soon.toISOString().slice(0, 10)) return "soon";
  }
  if (payload.priority === "urgent") return "urgent";
  return "normal";
}

export async function POST(request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return configError();
  try {
    const payload = clean(await request.json());
    if (!payload.priority) payload.priority = "normal";
    if (!payload.workflow_status) payload.workflow_status = "todo";
    if (!payload.category) payload.category = "general";
    payload.attention_state = derivedAttention(payload);
    const response = await supabase(TABLE, { method: "POST", body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: data?.message || "Creazione attività fallita" }), { status: response.status, headers: { "Content-Type": "application/json" } });
    return Response.json(data?.[0] || data);
  } catch (error) { return new Response(JSON.stringify({ error: error.message || "Richiesta non valida" }), { status: 400, headers: { "Content-Type": "application/json" } }); }
}

export async function PATCH(request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return configError();
  try {
    const body = await request.json();
    if (!body?.id) throw new Error("ID attività obbligatorio");
    const payload = clean(body, true);
    if (payload.workflow_status === "done" && payload.completed_at === undefined) payload.completed_at = new Date().toISOString();
    if (payload.workflow_status && payload.workflow_status !== "done") payload.completed_at = null;
    payload.attention_state = derivedAttention({ ...body, ...payload });
    const response = await supabase(`${TABLE}?id=eq.${encodeURIComponent(body.id)}`, { method: "PATCH", body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: data?.message || "Aggiornamento attività fallito" }), { status: response.status, headers: { "Content-Type": "application/json" } });
    return Response.json(data?.[0] || data);
  } catch (error) { return new Response(JSON.stringify({ error: error.message || "Richiesta non valida" }), { status: 400, headers: { "Content-Type": "application/json" } }); }
}
