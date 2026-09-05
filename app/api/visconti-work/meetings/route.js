import { NextResponse } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jyinddvvcnlxesikeggp.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function db(path, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.details || data?.error || `Supabase HTTP ${response.status}`);
  return data;
}

export async function GET() {
  try {
    const meetings = await db("visconti_meetings?select=*&status=in.(draft,in_progress)&order=meeting_date.desc&order=created_at.desc&limit=1");
    const meeting = Array.isArray(meetings) ? meetings[0] : null;
    if (!meeting) return NextResponse.json({ meeting: null, topics: [] });
    const topics = await db(`visconti_meeting_topics?select=*&meeting_id=eq.${encodeURIComponent(meeting.id)}&order=sort_order.asc&order=created_at.asc`);
    return NextResponse.json({ meeting, topics: Array.isArray(topics) ? topics : [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Errore nel caricamento della riunione." }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || "topic";
  try {
    if (action === "meeting") {
      const existing = await db("visconti_meetings?select=*&status=in.(draft,in_progress)&order=meeting_date.desc&limit=1");
      if (Array.isArray(existing) && existing[0]) return NextResponse.json({ meeting: existing[0] });
      const rows = await db("visconti_meetings?select=*", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ title: body.title || "Riunione operativa", meeting_date: body.meeting_date || new Date().toISOString().slice(0, 10), status: "draft" }),
      });
      return NextResponse.json({ meeting: Array.isArray(rows) ? rows[0] : rows });
    }

    const meetingId = body.meeting_id;
    if (!meetingId || !String(body.title || "").trim()) return NextResponse.json({ error: "Riunione e tema sono obbligatori." }, { status: 400 });
    const last = await db(`visconti_meeting_topics?select=sort_order&meeting_id=eq.${encodeURIComponent(meetingId)}&order=sort_order.desc&limit=1`);
    const payload = {
      meeting_id: meetingId,
      project_id: body.project_id || null,
      title: String(body.title).trim(),
      topic_type: body.topic_type || "other",
      discussion: body.discussion || null,
      decision: body.decision || null,
      action: body.action_text || null,
      responsible_id: body.responsible_id || null,
      due_date: body.due_date || null,
      status: body.status || "open",
      sort_order: Number(Array.isArray(last) && last[0]?.sort_order || 0) + 1,
    };
    const rows = await db("visconti_meeting_topics?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ topic: Array.isArray(rows) ? rows[0] : rows });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Errore nel salvataggio." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "ID obbligatorio." }, { status: 400 });
  try {
    if (body.kind === "meeting") {
      const update = {};
      if (body.status) update.status = body.status;
      if (body.notes !== undefined) update.notes = body.notes;
      const rows = await db(`visconti_meetings?id=eq.${encodeURIComponent(body.id)}&select=*`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(update),
      });
      return NextResponse.json({ meeting: Array.isArray(rows) ? rows[0] : rows });
    }
    const allowed = ["project_id", "title", "topic_type", "discussion", "decision", "action_text", "responsible_id", "due_date", "status"];
    const update = Object.fromEntries(allowed.filter((key) => Object.prototype.hasOwnProperty.call(body, key)).map((key) => [key === "action_text" ? "action" : key, body[key] || null]));
    const rows = await db(`visconti_meeting_topics?id=eq.${encodeURIComponent(body.id)}&select=*`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(update),
    });
    return NextResponse.json({ topic: Array.isArray(rows) ? rows[0] : rows });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Errore nel salvataggio." }, { status: 500 });
  }
}
