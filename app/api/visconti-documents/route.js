import { revalidatePath } from "next/cache";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jyinddvvcnlxesikeggp.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ybmz6MfUEIo-gfwB_sqyVQ_wWuFdhUV";

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data = [];
  try { data = text ? JSON.parse(text) : []; } catch {}
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase error ${response.status}`);
  return data;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const projectId = String(body?.project_id || "");
    const title = String(body?.title || "").trim();
    const documentType = String(body?.document_type || "").trim();
    const driveUrl = String(body?.drive_url || "").trim();

    if (!projectId || !title || !driveUrl) {
      return Response.json({ error: "Progetto, nome documento e link Drive sono obbligatori." }, { status: 400 });
    }
    if (!/^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(driveUrl)) {
      return Response.json({ error: "Inserisci un link Google Drive o Google Docs valido." }, { status: 400 });
    }

    const project = await supabase(`projects?id=eq.${encodeURIComponent(projectId)}&select=id`);
    if (!project?.[0]) return Response.json({ error: "Progetto non trovato." }, { status: 404 });

    const data = await supabase("project_documents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        project_id: projectId,
        title,
        document_type: documentType || "Google Drive",
        url: driveUrl,
        drive_url: driveUrl,
        status: "active",
      }),
    });

    revalidatePath("/visconti-work/documents");
    return Response.json({ ok: true, document: data?.[0] || null });
  } catch (error) {
    return Response.json({ error: error.message || "Impossibile collegare il documento." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Documento non specificato." }, { status: 400 });
    await supabase(`project_documents?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    revalidatePath("/visconti-work/documents");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || "Impossibile rimuovere il collegamento." }, { status: 500 });
  }
}
