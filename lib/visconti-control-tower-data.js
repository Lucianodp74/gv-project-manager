const DEFAULT_SUPABASE_URL = "https://jyinddvvcnlxesikeggp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5aW5kZHZ2Y25seXNrZ2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDk0MTIsImV4cCI6MjEwMzkyNTQxMn0.408iZ2rkj5i2Ikh0FL91N1a1AuDJFAAIehD0H9q6G9s";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

async function get(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return response.json();
}
async function safe(path, fallback = []) { try { return await get(path); } catch (error) { console.error(`Control Tower data: ${path}`, error); return fallback; } }
function stageFromConnection(c) { if (!c) return null; if (c.authorization_outcome || ["completed", "title_perfected"].includes(c.authorization_status)) return "authorized"; if (c.authorization_start_at || ["in_progress", "suspended"].includes(c.authorization_status)) return "authorization"; return "connection"; }
function spvAttention(p) { if (p.go_no_go_status === "go" && p.connection_transfer_status !== "completed") return p.spv_status === "created" ? "Voltura da completare" : "SPV da completare"; return null; }

export async function getViscontiControlTowerData() {
  const [projects, tasks, members, connections, summaries] = await Promise.all([
    safe("projects?select=id,name,region,status,power_mw,project_code,responsible_id,go_no_go_status,go_no_go_date,spv_name,spv_status,connection_holder,connection_transfer_status,connection_transfer_request_date,connection_transfer_completed_date&order=name.asc"),
    safe("visconti_task_board?select=*&workflow_status=neq.done&workflow_status=neq.cancelled&order=due_date.asc.nullslast,created_at.desc&limit=500"),
    safe("team_members?select=id,display_name&active=eq.true&order=display_name.asc&limit=200"),
    safe("connection_practices?select=project_id,authorization_status,authorization_outcome,authorization_start_at&order=updated_at.desc&limit=500"),
    safe("project_operational_summary?select=project_id,open_tasks,blockers,overdue_tasks,next_connection_deadline,waiting_terna_confirmations,rejected_terna_confirmations,operational_attention"),
  ]);
  const visibleProjects = projects.filter((p) => p.status !== "archived");
  const ids = new Set(visibleProjects.map((p) => p.id));
  const visibleTasks = tasks.filter((t) => !t.project_id || ids.has(t.project_id));
  const memberName = new Map(members.map((m) => [m.id, m.display_name]));
  const summaryById = new Map(summaries.map((s) => [s.project_id, s]));
  const connectionByProject = new Map();
  for (const c of connections) { if (!ids.has(c.project_id)) continue; const current = connectionByProject.get(c.project_id); if (!current || stageFromConnection(c) === "authorized") connectionByProject.set(c.project_id, c); }
  const tasksByProject = new Map();
  for (const t of visibleTasks) { if (!t.project_id) continue; const list = tasksByProject.get(t.project_id) || []; list.push(t); tasksByProject.set(t.project_id, list); }
  return {
    projects: visibleProjects.map((p) => { const summary = summaryById.get(p.id) || {}; const projectTasks = tasksByProject.get(p.id) || []; const nextTask = projectTasks[0] || null; return { ...summary, ...p, project_id: p.id, project_name: p.name, project_status: p.status, project_stage: stageFromConnection(connectionByProject.get(p.id)) || p.status, responsible_name: memberName.get(p.responsible_id) || "Non assegnato", open_tasks: summary.open_tasks ?? projectTasks.length, blockers: summary.blockers ?? projectTasks.filter((t) => t.workflow_status === "blocked" || t.attention_state === "blocked").length, overdue_tasks: summary.overdue_tasks ?? projectTasks.filter((t) => t.attention_state === "overdue").length, next_action: nextTask?.next_action || nextTask?.title || null, next_action_task_id: nextTask?.id || null, next_action_due_date: nextTask?.due_date || null, next_action_responsible_name: nextTask ? (memberName.get(nextTask.responsible_id) || "Non assegnato") : null, next_action_blocker: nextTask?.workflow_status === "blocked" ? (nextTask.blocker_reason || nextTask.description || null) : null, spv_attention: spvAttention(p) }; }),
    tasks: visibleTasks, members, connected: true,
  };
}
