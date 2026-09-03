const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

export async function POST(request) {
  try {
    const body = await request.json();
    const projectId = String(body?.projectId || "");
    const decision = body?.decision;
    if (!projectId || !["go", "no_go"].includes(decision)) {
      return Response.json({ error: "Parametri non validi" }, { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/visconti_control_tower_decide`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_project_id: projectId, p_decision: decision }),
      cache: "no-store",
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (!response.ok) {
      const message = data?.message || data?.error || data?.hint || `Supabase ${response.status}`;
      throw new Error(message);
    }

    return Response.json(data ?? { ok: true, projectId, decision }, { status: 200 });
  } catch (error) {
    console.error("visconti-control-tower-decision", error);
    return Response.json({ error: error instanceof Error ? error.message : "Operazione non riuscita" }, { status: 500 });
  }
}
