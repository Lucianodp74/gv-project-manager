const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...(options.headers || {}) },
    cache: "no-store",
  });
  const text = await response.text(); let data = [];
  try { data = text ? JSON.parse(text) : []; } catch (_) {}
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase error ${response.status}`);
  return data;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const resource = searchParams.get("resource");
    if (resource === "members") return Response.json(await supabase("team_members?active=eq.true&select=id,display_name,role&order=display_name.asc"));
    if (!projectId || !["project", "tasks", "connections"].includes(resource)) return Response.json({ error: "Parametri non validi" }, { status: 400 });
    const q = encodeURIComponent(projectId);
    if (resource === "project") return Response.json(await supabase(`projects?id=eq.${q}&select=*`));
    if (resource === "tasks") return Response.json(await supabase(`visconti_task_board?project_id=eq.${q}&select=*&order=due_date.asc.nullslast,created_at.desc`));
    return Response.json(await supabase(`connection_workflow_overview?project_id=eq.${q}&select=*&order=practice_code.asc`));
  } catch (error) {
    return Response.json({ error: error.message || "Lettura progetto non riuscita." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const projectId = String(body?.projectId || "");
    const status = body?.status;
    if (!projectId || !["archived", "active", "opportunity", "connection", "go_decision", "development", "presentation", "authorization", "commercial", "authorized", "closed"].includes(status)) {
      return Response.json({ error: "Parametri non validi" }, { status: 400 });
    }
    const payload = { status, updated_at: new Date().toISOString() };
    if (status === "archived") payload.archived_from_status = body?.archivedFromStatus || "connection";
    else payload.archived_from_status = null;
    const data = await supabase(`projects?id=eq.${encodeURIComponent(projectId)}&select=*`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
    return Response.json({ ok: true, project: data?.[0] || null });
  } catch (error) {
    return Response.json({ error: error.message || "Aggiornamento progetto non riuscito." }, { status: 500 });
  }
}
