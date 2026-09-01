const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseGet(path) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

export async function getViscontiWorkData() {
  try {
    const [projects, tasks] = await Promise.all([
      supabaseGet("visconti_control_tower?select=*&order=risk_level.desc,name.asc"),
      supabaseGet("visconti_task_board?select=*&workflow_status=neq.done&workflow_status=neq.cancelled&order=due_date.asc.nullslast&limit=12"),
    ]);

    return { projects, tasks, connected: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) };
  } catch (error) {
    console.error("Visconti Work data load failed:", error);
    return { projects: [], tasks: [], connected: false, error: "Dati non disponibili" };
  }
}
