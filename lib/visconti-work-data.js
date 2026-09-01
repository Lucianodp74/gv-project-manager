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

function isoToday(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
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

export async function getViscontiConnectionData(practiceId = null, projectId = null) {
  try {
    let filter = "status=eq.active";
    if (practiceId) filter = `id=eq.${encodeURIComponent(practiceId)}`;
    else if (projectId) filter = `project_id=eq.${encodeURIComponent(projectId)}`;

    const practices = await supabaseGet(`connection_workflow_overview?select=*&${filter}&order=next_deadline.asc.nullslast&limit=1`);
    if (!practices.length) return { practice: null, deadlines: [], steps: [], connected: true };

    const practice = practices[0];
    const [projects, deadlines, steps, members] = await Promise.all([
      supabaseGet(`projects?select=id,name&id=eq.${practice.project_id}&limit=1`),
      supabaseGet(`connection_deadlines?select=*&practice_id=eq.${practice.id}&status=neq.cancelled&order=due_date.asc`),
      supabaseGet(`connection_steps?select=*&practice_id=eq.${practice.id}&order=sort_order.asc`),
      supabaseGet("team_members?select=id,display_name&active=eq.true&limit=200"),
    ]);

    const memberName = new Map(members.map(member => [member.id, member.display_name]));
    const project = projects[0];

    return {
      practice: {
        ...practice,
        projectName: project?.name || "Progetto",
        powerMw: practice.power_mw,
        practiceCode: practice.practice_code,
        responsible: memberName.get(practice.responsible_id) || "Non assegnato",
        coordinator: "",
      },
      deadlines: deadlines.map(deadline => ({
        ...deadline,
        responsible_name: memberName.get(deadline.responsible_id) || memberName.get(practice.responsible_id) || "Non assegnato",
        attention_state: deadline.status === "overdue" || deadline.due_date < isoToday()
          ? "overdue"
          : deadline.due_date <= isoToday(3)
            ? "urgent"
            : deadline.due_date <= isoToday(7)
              ? "soon"
              : "normal",
      })),
      steps: steps.map(step => ({
        ...step,
        responsible_name: memberName.get(step.responsible_id) || memberName.get(practice.responsible_id) || "Non assegnato",
        attention_state: step.status === "done"
          ? "done"
          : step.due_date && step.due_date < isoToday()
            ? "overdue"
            : step.due_date && step.due_date <= isoToday(3)
              ? "urgent"
              : step.status === "in_progress"
                ? "soon"
                : "normal",
      })),
      connected: true,
    };
  } catch (error) {
    console.error("Visconti connection data load failed:", error);
    return { practice: null, deadlines: [], steps: [], connected: false, error: "Dati connessione non disponibili" };
  }
}
