import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jyinddvvcnlxesikeggp.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function GET() {
  const { data: meeting, error: meetingError } = await supabase
    .from("visconti_meetings")
    .select("*")
    .in("status", ["draft", "in_progress"])
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (meetingError) return NextResponse.json({ error: meetingError.message }, { status: 500 });
  if (!meeting) return NextResponse.json({ meeting: null, topics: [] });
  const { data: topics, error: topicsError } = await supabase
    .from("visconti_meeting_topics")
    .select("*")
    .eq("meeting_id", meeting.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (topicsError) return NextResponse.json({ error: topicsError.message }, { status: 500 });
  return NextResponse.json({ meeting, topics: topics || [] });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || "topic";
  if (action === "meeting") {
    const { data: existing } = await supabase.from("visconti_meetings").select("*").in("status", ["draft", "in_progress"]).order("meeting_date", { ascending: false }).limit(1).maybeSingle();
    if (existing) return NextResponse.json({ meeting: existing });
    const { data, error } = await supabase.from("visconti_meetings").insert({ title: body.title || "Riunione operativa", meeting_date: body.meeting_date || new Date().toISOString().slice(0, 10), status: "draft" }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meeting: data });
  }
  const meetingId = body.meeting_id;
  if (!meetingId || !String(body.title || "").trim()) return NextResponse.json({ error: "Riunione e tema sono obbligatori." }, { status: 400 });
  const { data: last } = await supabase.from("visconti_meeting_topics").select("sort_order").eq("meeting_id", meetingId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
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
    sort_order: Number(last?.sort_order || 0) + 1,
  };
  const { data, error } = await supabase.from("visconti_meeting_topics").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  if (body.kind === "meeting") {
    const { data, error } = await supabase.from("visconti_meetings").update({ ...(body.status ? { status: body.status } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}) }).eq("id", body.id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meeting: data });
  }
  const allowed = ["project_id", "title", "topic_type", "discussion", "decision", "action_text", "responsible_id", "due_date", "status"];
  const update = Object.fromEntries(allowed.filter((key) => Object.prototype.hasOwnProperty.call(body, key)).map((key) => [key === "action_text" ? "action" : key, body[key] || null]));
  const { data, error } = await supabase.from("visconti_meeting_topics").update(update).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}
