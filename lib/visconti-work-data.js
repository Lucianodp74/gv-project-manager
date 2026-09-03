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

function isoToday(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function operationalStage(connection) {
  if (!connection) return null;
  if (connection.authorization_outcome || ["completed", "title_perfected"].includes(connection.authorization_status)) return "authorized";
  if (connection.authorization_start_at || ["in_progress", "suspended"].includes(connection.authorization_status)) return "authorization";
  return "connection";
}

export async function getViscontiWorkData() {
  try {
    const [projects, tasks, members, connections] = await Promise.all([
      supabaseGet("project_operational_summary?select=*&order=operational_attention.desc,project_name.asc"),
      supabaseGet("visconti_task_board?select=*&workflow_status=neq.done&workflow_status=neq.cancelled&order=due_date.asc.nullslast&limit=12"),
      supabaseGet("team_members?select=id,display_name&active=eq.true&order=display_name.asc&limit=200"),
      supabaseGet("connection_workflow_overview?select=project_id,accepted_at,pto_validated_at,authorization_start_at,authorization_outcome,authorization_status&status=in.(pending,active,accepted)&limit=500"),
    ]);
    const memberName = new Map(members.map((member) => [member.id, member.display_name]));
    const connectionByProject = new Map();
    for (const connection of connections) {
      const current = connectionByProject.get(connection.project_id);
      if (!current || operationalStage(connection) === "authorized") connectionByProject.set(connection.project_id, connection);
    }
    return {
      projects: projects.map((project) => ({
        ...project,
        project_stage: operationalStage(connectionByProject.get(project.project_id)) || project.project_status,
        responsible_name: memberName.get(project.responsible_id) || "Non assegnato",
      })),
      tasks,
      members,
      connected: hasSupabase,
    };
  } catch (error) {
    console.error("Visconti Work data load failed:", error);
    return { projects: [], tasks: [], members: [], connected: false, error: "Dati non disponibili" };
  }
}

export async function getViscontiConnectionsData() {
  try {
    const practices = await supabaseGet("connection_workflow_overview_named?select=*&status=in.(pending,active,accepted)&order=next_deadline.asc.nullsfirst");
    if (!practices.length) return { connections: [], connected: hasSupabase };
    const [members, rawPractices] = await Promise.all([
      supabaseGet("team_members?select=id,display_name&active=eq.true&order=display_name.asc&limit=200"),
      supabaseGet("connection_practices?select=id,verification_status,source_label,source_url,source_verified_at"),
    ]);
    const memberName = new Map(members.map((member) => [member.id, member.display_name]));
    const verification = new Map(rawPractices.map((p) => [p.id, p]));
    return {
      connections: practices.map((p) => ({
        ...p,
        ...verification.get(p.id),
        responsible_name: memberName.get(p.responsible_id) || "Non assegnato",
        attention_state: p.overdue_deadlines > 0 || (p.next_deadline && p.next_deadline < isoToday()) ? "overdue" : p.next_deadline && p.next_deadline <= isoToday(7) ? "soon" : "normal",
      })),
      connected: hasSupabase,
    };
  } catch (error) {
    console.error("Visconti connections list load failed:", error);
    return { connections: [], connected: false, error: "Dati connessione non disponibili" };
  }
}

export async function getViscontiConnectionData(practiceId = null, projectId = null) {
  try {
    let filter = "status=in.(pending,active,accepted)";
    if (practiceId) filter = `id=eq.${encodeURIComponent(practiceId)}`;
    else if (projectId) filter = `project_id=eq.${encodeURIComponent(projectId)}`;
    const practices = await supabaseGet(`connection_workflow_overview?select=*&${filter}&order=next_deadline.asc.nullsfirst&limit=1`);
    if (!practices.length) return { practice: null, deadlines: [], steps: [], controlTower: [], members: [], connected: hasSupabase };
    const practice = practices[0];
    const [projects, deadlines, steps, members, sourceTasks, controlTower, rawPractice] = await Promise.all([
      supabaseGet(`projects?select=id,name&id=eq.${practice.project_id}&limit=1`),
      supabaseGet(`connection_deadlines?select=*&practice_id=eq.${practice.id}&status=neq.cancelled&order=due_date.asc`),
      supabaseGet(`connection_workflow_builder?select=*&practice_id=eq.${practice.id}&order=sort_order.asc`),
      supabaseGet("team_members?select=id,display_name&active=eq.true&order=display_name.asc&limit=200"),
      supabaseGet(`visconti_task_board?select=id,source_connection_deadline_id,source_connection_step_id,workflow_status,attention_state,next_action&connection_practice_id=eq.${practice.id}`),
      supabaseGet(`terna_connection_control_tower?select=*&practice_id=eq.${practice.id}&limit=1`),
      supabaseGet(`connection_practices?select=id,verification_status,source_label,source_url,source_verified_at&id=eq.${practice.id}&limit=1`),
    ]);
    const memberName = new Map(members.map((member) => [member.id, member.display_name]));
    const taskByDeadline = new Map(sourceTasks.filter((task) => task.source_connection_deadline_id).map((task) => [task.source_connection_deadline_id, task]));
    const taskByStep = new Map(sourceTasks.filter((task) => task.source_connection_step_id).map((task) => [task.source_connection_step_id, task]));
    const project = projects[0];
    const verification = rawPractice[0] || {};
    return {
      practice: { ...practice, ...verification, projectName: project?.name || "Progetto", powerMw: practice.power_mw, practiceCode: practice.practice_code, responsible: memberName.get(practice.responsible_id) || "Non assegnato", coordinator: "" },
      deadlines: deadlines.map((deadline) => ({ ...deadline, responsible_name: memberName.get(deadline.responsible_id) || memberName.get(practice.responsible_id) || "Non assegnato", attention_state: deadline.status === "overdue" || deadline.due_date < isoToday() ? "overdue" : deadline.due_date <= isoToday(3) ? "urgent" : deadline.due_date <= isoToday(7) ? "soon" : "normal", source_task_id: taskByDeadline.get(deadline.id)?.id || null, source_task_status: taskByDeadline.get(deadline.id)?.workflow_status || null })),
      steps: steps.map((step) => { const confirmationTask = taskByStep.get(step.id); return { ...step, responsible_name: step.responsible_name || memberName.get(step.responsible_id) || memberName.get(practice.responsible_id) || "Non assegnato", source_confirmation_task_id: confirmationTask?.id || null, source_confirmation_task_status: confirmationTask?.workflow_status || null, source_confirmation_task_attention: confirmationTask?.attention_state || null, source_confirmation_task_next_action: confirmationTask?.next_action || null }; }),
      members,
      controlTower: controlTower.map((item) => ({ ...item, responsible_name: memberName.get(item.responsible_id) || "Non assegnato" })),
      connected: hasSupabase,
    };
  } catch (error) {
    console.error("Visconti connection data load failed:", error);
    return { practice: null, deadlines: [], steps: [], controlTower: [], members: [], connected: false, error: "Dati connessione non disponibili" };
  }
}
