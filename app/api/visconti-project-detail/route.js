import { revalidatePath } from "next/cache";

const SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, ...(options.headers || {}) }, cache: "no-store" });
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
    if (!projectId || !["project", "tasks", "connections", "external-professionals"].includes(resource)) return Response.json({ error: "Parametri non validi" }, { status: 400 });
    const q = encodeURIComponent(projectId);
    if (resource === "project") return Response.json(await supabase(`projects?id=eq.${q}&select=*`));
    if (resource === "tasks") return Response.json(await supabase(`visconti_task_board?project_id=eq.${q}&select=*&order=due_date.asc.nullslast,created_at.desc`));
    if (resource === "external-professionals") return Response.json(await supabase(`project_external_professionals?project_id=eq.${q}&select=*&order=professional_type.asc`));
    return Response.json(await supabase(`connection_workflow_overview?project_id=eq.${q}&select=*&order=practice_code.asc`));
  } catch (error) { return Response.json({ error: error.message || "Lettura progetto non riuscita." }, { status: 500 }); }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (body?.externalProfessional) {
      const x = body.externalProfessional;
      const id = String(x.id || "");
      if (!id || !x.project_id || !x.professional_type) return Response.json({ error: "Dati professionista non validi." }, { status: 400 });
      const quoted = x.quoted_price === null || x.quoted_price === "" ? null : Number(x.quoted_price);
      if (quoted !== null && (!Number.isFinite(quoted) || quoted < 0)) return Response.json({ error: "Preventivo non valido." }, { status: 400 });
      const payload = { project_id: x.project_id, professional_type: x.professional_type, assigned: !!x.assigned, professional_name: x.professional_name || null, company_name: x.company_name || null, quoted_price: quoted, assigned_at: x.assigned ? (x.assigned_at || new Date().toISOString()) : null, notes: x.notes || null, updated_at: new Date().toISOString() };
      const data = await supabase(`project_external_professionals?id=eq.${encodeURIComponent(id)}&select=*`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
      revalidatePath("/visconti-work/projects");
      return Response.json({ ok: true, externalProfessional: data?.[0] || null });
    }
    const projectId = String(body?.projectId || "");
    const connectionId = String(body?.connectionId || "");
    if (body?.power_mw !== undefined) {
      const power = Number(body.power_mw);
      if (!Number.isFinite(power) || power < 0) return Response.json({ error: "Potenza non valida." }, { status: 400 });
      if (connectionId) {
        const data = await supabase(`connection_practices?id=eq.${encodeURIComponent(connectionId)}&select=*`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ power_mw: power, updated_at: new Date().toISOString() }) });
        revalidatePath("/visconti-work/projects"); return Response.json({ ok: true, connection: data?.[0] || null });
      }
      if (!projectId) return Response.json({ error: "Manca l'identificativo del progetto." }, { status: 400 });
      const data = await supabase(`projects?id=eq.${encodeURIComponent(projectId)}&select=*`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ power_mw: power, updated_at: new Date().toISOString() }) });
      revalidatePath("/visconti-work/projects"); return Response.json({ ok: true, project: data?.[0] || null });
    }
    const status = body?.status;
    if (!projectId || !["archived", "active", "opportunity", "connection", "go_decision", "development", "presentation", "authorization", "commercial", "authorized", "closed"].includes(status)) return Response.json({ error: "Parametri non validi" }, { status: 400 });
    const payload = { status, updated_at: new Date().toISOString() };
    if (status === "archived") payload.archived_from_status = body?.archivedFromStatus || "connection"; else payload.archived_from_status = null;
    const data = await supabase(`projects?id=eq.${encodeURIComponent(projectId)}&select=*`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(payload) });
    revalidatePath("/visconti-work/projects"); return Response.json({ ok: true, project: data?.[0] || null });
  } catch (error) { return Response.json({ error: error.message || "Aggiornamento progetto non riuscito." }, { status: 500 }); }
}
