const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function supabaseGet(path) {
  if (!hasSupabase) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

export async function getViscontiDocumentData() {
  try {
    const [documents, projects] = await Promise.all([
      supabaseGet("project_documents?select=*&order=created_at.desc&limit=1000"),
      supabaseGet("projects?select=id,name,region&order=name.asc&limit=300"),
    ]);
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return {
      documents: documents.map((d) => ({ ...d, project_name: projectMap.get(d.project_id)?.name || "—", project_region: projectMap.get(d.project_id)?.region || "—" })),
      projects,
      connected: hasSupabase,
    };
  } catch (error) {
    console.error("Visconti document data load failed:", error);
    return { documents: [], projects: [], connected: false, error: "Documenti non disponibili" };
  }
}
