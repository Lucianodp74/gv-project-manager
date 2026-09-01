-- GRUPPO VISCONTI – TERNA CONNECTION CONTROL TOWER V2
-- Single operational view for the connection milestones the team must control.
-- Run after 05_connection_workflow_v2.sql and 07_connection_task_bridge_v2.sql.

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
  COUNT(cd.id) FILTER (WHERE cd.status IN ('open','overdue')) AS open_deadlines,
  COUNT(cd.id) FILTER (WHERE cd.status = 'overdue' OR (cd.status = 'open' AND cd.due_date < CURRENT_DATE)) AS overdue_deadlines,
  COUNT(t.id) FILTER (WHERE t.workflow_status IN ('todo','in_progress','waiting','blocked')) AS open_connection_tasks,
  COUNT(t.id) FILTER (WHERE t.workflow_status = 'blocked') AS blocked_connection_tasks,
  MIN(cd.due_date) FILTER (WHERE cd.status IN ('open','overdue') AND cd.due_date >= CURRENT_DATE) AS nearest_deadline,
  MIN(cd.due_date) FILTER (WHERE cd.status IN ('open','overdue')) AS nearest_open_deadline
FROM connection_practices cp
JOIN projects p ON p.id = cp.project_id
LEFT JOIN connection_deadlines cd ON cd.practice_id = cp.id
LEFT JOIN tasks t ON t.connection_practice_id = cp.id AND t.category = 'connection'
GROUP BY
  cp.id, p.name, cp.project_id, cp.operator, cp.practice_code, cp.power_mw,
  cp.station, cp.status, cp.responsible_id, cp.request_date,
  cp.pto_received_date, cp.pto_accepted_date, cp.iter_start_date,
  cp.sharing_date, cp.acceptance_date, cp.next_deadline, cp.next_deadline_type;

COMMENT ON VIEW terna_connection_control_tower IS
  'Control tower for connection practices: PTO, PTO acceptance, authorization start, acceptance and deadlines.';
