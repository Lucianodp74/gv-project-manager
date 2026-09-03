const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

export async function POST(request) {
  try {
    const body = await request.json();
    const projectId = String(body?.projectId || "");
    const fields = body?.fields;
    if (!projectId || !fields || typeof fields !== "object" || Array.isArray(fields)) {
      return Response.json({ error: "Parametri non validi" }, { status: 400 });
    }
    const allowed = [
      "spv_name", "spv_vat_number", "spv_tax_code", "spv_pec",
      "spv_registered_office", "spv_incorporation_date", "spv_status",
      "connection_transfer_protocol", "connection_transfer_request_date",
      "connection_transfer_completed_date", "connection_transfer_status",
      "connection_holder", "spv_notes"
    ];
    const clean = Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(clean).length) return Response.json({ error: "Nessun campo valido" }, { status: 400 });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/visconti_project_spv_update`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_project_id: projectId, p_fields: clean }),
      cache: "no-store",
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    if (!response.ok) {
      throw new Error(data?.message || data?.error || data?.hint || `Supabase ${response.status}`);
    }
    return Response.json(data ?? { ok: true }, { status: 200 });
  } catch (error) {
    console.error("visconti-project-spv", error);
    return Response.json({ error: error instanceof Error ? error.message : "Operazione non riuscita" }, { status: 500 });
  }
}
