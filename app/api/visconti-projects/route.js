const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) return Response.json({ error: "Il nome del progetto è obbligatorio." }, { status: 400 });

    const payload = {
      name,
      project_code: String(body?.project_code || "").trim() || null,
      region: String(body?.region || "").trim() || null,
      power_mw: body?.power_mw === null || body?.power_mw === "" || body?.power_mw === undefined ? null : Number(body.power_mw),
      responsible_id: body?.responsible_id || null,
      notes: String(body?.notes || "").trim() || null,
      status: "active",
      go_no_go_status: "pending",
      spv_status: "not_started",
      connection_holder: "Gruppo Visconti Srl",
      connection_transfer_status: "not_started",
    };
    if (payload.power_mw !== null && (!Number.isFinite(payload.power_mw) || payload.power_mw < 0)) {
      return Response.json({ error: "La potenza MW non è valida." }, { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    let data = [];
    try { data = text ? JSON.parse(text) : []; } catch (_) {}
    if (!response.ok) return Response.json({ error: data?.message || data?.hint || "Impossibile creare il progetto." }, { status: response.status });
    const project = Array.isArray(data) ? data[0] : data;
    return Response.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    console.error("Project creation failed:", error);
    return Response.json({ error: "Errore durante la creazione del progetto." }, { status: 500 });
  }
}
