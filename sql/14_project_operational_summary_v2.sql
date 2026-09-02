-- GRUPPO VISCONTI – PROJECT OPERATIONAL SUMMARY V2
-- One compact operational view for the project control center.
-- Run after the existing V2 project, task, authority, specialist and connection views.

CREATE OR REPLACE VIEW project_operational_summary AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.project_stage,
  p.completion,
  p.project_manager_id,
  p.supervisor_id,
  p.next_action,
  p.risk_level,
  (SELECT COUNT(*)
     FROM tasks t
    WHERE t.project_id = p.id
      AND t.workflow_status IN ('todo','in_progress','waiting','blocked')) AS open_tasks,
  (SELECT COUNT(*)
     FROM tasks t
    WHERE t.project_id = p.id
      AND t.workflow_status = 'blocked') AS blocked_tasks,
  (SELECT COUNT(*)
     FROM tasks t
    WHERE t.project_id = p.id
      AND t.workflow_status IN ('todo','in_progress','waiting','blocked')
      AND (t.due_date < CURRENT_DATE OR t.attention_state IN ('overdue','urgent'))) AS urgent_tasks,
  (SELECT COUNT(*)
     FROM specialist_assignments s
    WHERE s.project_id = p.id
      AND s.status IN ('planned','active','waiting')) AS open_specialists,
  (SELECT COUNT(*)
     FROM authority_items a
    WHERE a.project_id = p.id
      AND a.status NOT IN ('closed','resolved','cancelled')) AS open_authority_items,
  (SELECT COUNT(*)
     FROM project_decisions d
    WHERE d.project_id = p.id) AS decisions_count,
  (SELECT COUNT(*)
     FROM connection_practices cp
    WHERE cp.project_id = p.id) AS connection_count,
  (SELECT COUNT(*)
     FROM connection_steps cs
     JOIN connection_practices cp ON cp.id = cs.practice_id
    WHERE cp.project_id = p.id
      AND cs.confirmation_required = true
      AND cs.confirmation_status = 'waiting') AS waiting_terna_confirmations,
  (SELECT COUNT(*)
     FROM connection_steps cs
     JOIN connection_practices cp ON cp.id = cs.practice_id
    WHERE cp.project_id = p.id
      AND cs.confirmation_required = true
      AND cs.confirmation_status = 'rejected') AS rejected_terna_confirmations,
  (SELECT MIN(cs.due_date)
     FROM connection_steps cs
     JOIN connection_practices cp ON cp.id = cs.practice_id
    WHERE cp.project_id = p.id
      AND cs.confirmation_required = true
      AND cs.confirmation_status = 'waiting'
      AND cs.due_date IS NOT NULL) AS nearest_terna_confirmation_due,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM tasks t
       WHERE t.project_id = p.id
         AND t.workflow_status = 'blocked'
    ) THEN 'blocked'
    WHEN EXISTS (
      SELECT 1 FROM connection_steps cs
      JOIN connection_practices cp ON cp.id = cs.practice_id
       WHERE cp.project_id = p.id
         AND cs.confirmation_required = true
         AND cs.confirmation_status = 'rejected'
    ) THEN 'terna_rejected'
    WHEN EXISTS (
      SELECT 1 FROM tasks t
       WHERE t.project_id = p.id
         AND t.workflow_status IN ('todo','in_progress','waiting','blocked')
         AND (t.due_date < CURRENT_DATE OR t.attention_state IN ('overdue','urgent'))
    ) THEN 'urgent'
    WHEN EXISTS (
      SELECT 1 FROM connection_steps cs
      JOIN connection_practices cp ON cp.id = cs.practice_id
       WHERE cp.project_id = p.id
         AND cs.confirmation_required = true
         AND cs.confirmation_status = 'waiting'
    ) THEN 'waiting_terna'
    WHEN p.risk_level = 'critical' THEN 'critical'
    WHEN p.risk_level = 'attention' THEN 'attention'
    ELSE 'normal'
  END AS operational_attention
FROM projects p;

COMMENT ON VIEW project_operational_summary IS
  'Compact project-level operational summary for Control Tower and project detail.';
