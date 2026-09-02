const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function supabaseGet(path) {
  if (!hasSupabase) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

export async function getViscontiTaskData() {
  try {
    const [tasks, projects, members, practices, deadlines] = await Promise.all([
      supabaseGet("visconti_task_board?select=*&workflow_status=neq.cancelled&order=due_date.asc.nullslast,priority.desc,created_at.desc&limit=300"),
      supabaseGet("projects?select=id,name,status&order=name.asc&limit=300"),
      supabaseGet("team_members?select=id,display_name,role,active&active=eq.true&order=display_name.asc&limit=200"),
      supabaseGet("connection_practices?select=id,project_id,practice_code,status&status=in.(pending,active,accepted)&order=created_at.desc&limit=300"),
      supabaseGet("connection_deadlines?select=id,practice_id,title,due_date,status,responsible_id&order=due_date.asc.nullslast&limit=500"),
    ]);
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const memberMap = new Map(members.map(m => [m.id, m]));
    const practiceMap = new Map(practices.map(p => [p.id, p]));
    const deadlineMap = new Map(deadlines.map(d => [d.id, d]));
    return {
      tasks: tasks.map(t => {
        const deadline = t.source_connection_deadline_id ? deadlineMap.get(t.source_connection_deadline_id) : null;
        const practice = t.connection_practice_id ? practiceMap.get(t.connection_practice_id) : null;
        return {
          ...t,
          assignee_person_id: t.responsible_id || null,
          project_name: t.project_name || projectMap.get(t.project_id)?.name || "—",
          assignee_name: t.assignee_name || memberMap.get(t.responsible_id)?.display_name || "Non assegnata",
          connection_practice_code: practice?.practice_code || null,
          connection_deadline_title: deadline?.title || null,
          connection_deadline_status: deadline?.status || null,
          is_connection_deadline_task: Boolean(t.source_connection_deadline_id),
          is_terna_confirmation_task: Boolean(t.source_connection_step_id),
        };
      }),
      projects: projects.map(p => ({ ...p, project_stage: p.status })),
      members,
      practices,
      connected: hasSupabase,
    };
  } catch (error) {
    console.error("Visconti task data load failed:", error);
    return { tasks: [], projects: [], members: [], practices: [], connected: false, error: "Attività non disponibili" };
  }
}
