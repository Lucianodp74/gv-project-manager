const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

async function db(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase ${response.status}`);
  return data ?? [];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const projectId = String(body?.projectId || "");
    const decision = body?.decision;
    if (!projectId || !["go", "no_go"].includes(decision)) {
      return Response.json({ error: "Parametri non validi" }, { status: 400 });
    }

    const projects = await db(`projects?id=eq.${encodeURIComponent(projectId)}&select=id,go_no_go_status`);
    if (!projects.length) return Response.json({ error: "Progetto non trovato" }, { status: 404 });
    if (projects[0].go_no_go_status && projects[0].go_no_go_status !== "pending") {
      return Response.json({ error: "Decisione gia registrata" }, { status: 409 });
    }

    const now = new Date().toISOString();
    await db(`projects?id=eq.${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        go_no_go_status: decision,
        go_no_go_date: now.slice(0, 10),
        go_no_go_notes: decision === "go" ? "GO registrato dal Control Tower" : "NO-GO registrato dal Control Tower",
        spv_status: decision === "go" ? "to_create" : "cancelled",
        connection_transfer_status: decision === "go" ? "to_request" : "not_applicable",
        updated_at: now,
      }),
    });

    if (decision === "go") {
      const definitions = [
        { title: "Costituire società veicolo", description: "Costituire la SPV del progetto dopo la decisione GO.", category: "general" },
        { title: "Aprire P.IVA e PEC", description: "Completare P.IVA, codice fiscale e PEC della SPV.", category: "general" },
        { title: "Richiedere voltura della connessione", description: "Voltura della connessione da Gruppo Visconti Srl alla SPV.", category: "connection" },
      ];
      const existing = await db(`visconti_task_board?project_id=eq.${encodeURIComponent(projectId)}&select=id,title`);
      const existingTitles = new Set(existing.map((task) => task.title));
      const tasks = definitions.filter((task) => !existingTitles.has(task.title)).map((task) => ({
        project_id: projectId,
        title: task.title,
        description: task.description,
        workflow_status: "todo",
        attention_state: "normal",
        priority: "high",
        category: task.category,
        next_action: task.description,
      }));
      if (tasks.length) await db("visconti_task_board", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(tasks),
      });
    }

    return Response.json({ ok: true, projectId, decision }, { status: 200 });
  } catch (error) {
    console.error("visconti-control-tower-decision", error);
    return Response.json({ error: error instanceof Error ? error.message : "Operazione non riuscita" }, { status: 500 });
  }
}
