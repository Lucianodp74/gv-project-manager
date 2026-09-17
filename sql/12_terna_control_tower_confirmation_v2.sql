-- GRUPPO VISCONTI – TERNA CONTROL TOWER V2
-- Adds confirmation/validation visibility without multiplying deadline/task rows.
-- Run after 10_terna_step_confirmation_v2.sql and 11_terna_confirmation_task_bridge_v2.sql.

CREATE OR REPLACE VIEW terna_connection_control_tower AS
SELECT
  cp.id AS practice_id,
  cp.project_id,
  p.name AS project_name,
  cp.operator,
  cp.practice_code,
  cp.power_mw,
  cp.station,
  cp.status AS practice_status,
  cp.responsible_id,
  cp.request_date,
  cp.pto_received_date,
  cp.pto_accepted_date,
  cp.iter_start_date,
  cp.sharing_date,
  cp.acceptance_date,
  CASE
    WHEN cp.acceptance_date IS NOT NULL OR cp.status = 'accepted' THEN 'accepted'
    WHEN cp.iter_start_date IS NOT NULL THEN 'authorization_iter'
    WHEN cp.pto_accepted_date IS NOT NULL THEN 'pto_accepted'
    WHEN cp.pto_received_date IS NOT NULL THEN 'pto_received'
    WHEN cp.request_date IS NOT NULL THEN 'request_sent'
    ELSE 'not_started'
  END AS control_stage,
  CASE
    WHEN cp.acceptance_date IS NOT NULL OR cp.status = 'accepted' THEN 'Accettata'
    WHEN cp.iter_start_date IS NOT NULL THEN 'Iter autorizzativo avviato'
    WHEN cp.pto_accepted_date IS NOT NULL THEN 'PTO accettato'
    WHEN cp.pto_received_date IS NOT NULL THEN 'PTO ricevuto'
    WHEN cp.request_date IS NOT NULL THEN 'Richiesta inviata'
    ELSE 'Da avviare'
  END AS control_stage_label,
  cp.next_deadline,
  cp.next_deadline_type,
  (SELECT COUNT(*) FROM connection_deadlines cd WHERE cd.practice_id = cp.id AND cd.status IN ('open','overdue')) AS open_deadlines,
  (SELECT COUNT(*) FROM connection_deadlines cd WHERE cd.practice_id = cp.id AND (cd.status = 'overdue' OR (cd.status = 'open' AND cd.due_date < CURRENT_DATE))) AS overdue_deadlines,
  (SELECT COUNT(*) FROM tasks t WHERE t.connection_practice_id = cp.id AND t.category = 'connection' AND t.workflow_status IN ('todo','in_progress','waiting','blocked')) AS open_connection_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE t.connection_practice_id = cp.id AND t.category = 'connection' AND t.workflow_status = 'blocked') AS blocked_connection_tasks,
  (SELECT MIN(cd.due_date) FROM connection_deadlines cd WHERE cd.practice_id = cp.id AND cd.status IN ('open','overdue') AND cd.due_date >= CURRENT_DATE) AS nearest_deadline,
  (SELECT MIN(cd.due_date) FROM connection_deadlines cd WHERE cd.practice_id = cp.id AND cd.status IN ('open','overdue')) AS nearest_open_deadline,
  (SELECT COUNT(*) FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'waiting') AS waiting_terna_confirmations,
  (SELECT COUNT(*) FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'rejected') AS rejected_terna_confirmations,
  (SELECT MIN(cs.due_date) FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'waiting' AND cs.due_date IS NOT NULL) AS nearest_terna_confirmation_due,
  (SELECT cs.title FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'waiting' ORDER BY cs.due_date NULLS LAST, cs.sort_order, cs.created_at LIMIT 1) AS next_terna_confirmation,
  CASE
    WHEN EXISTS (SELECT 1 FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'rejected') THEN 'terna_rejected'
    WHEN EXISTS (SELECT 1 FROM connection_steps cs WHERE cs.practice_id = cp.id AND cs.confirmation_required = true AND cs.confirmation_status = 'waiting') THEN 'waiting_terna'
    WHEN cp.acceptance_date IS NOT NULL OR cp.status = 'accepted' THEN 'clear'
    ELSE 'normal'
  END AS operational_attention
FROM connection_practices cp
JOIN projects p ON p.id = cp.project_id;

COMMENT ON VIEW terna_connection_control_tower IS
  'Terna connection control tower with milestones, deadlines, open tasks and confirmation/validation waits.';
