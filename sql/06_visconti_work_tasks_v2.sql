-- GRUPPO VISCONTI – VISCONTI WORK V2
-- Task + deadline operating layer
-- Extends the V2 model; does not alter main.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS connection_practice_id UUID REFERENCES connection_practices(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS authority_request_id UUID REFERENCES authority_requests(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocker_since DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES team_members(id) ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_chk;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_chk CHECK (category IN ('general','connection','design','gis','land','specialist','authority','document','commercial','internal'));

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_connection_practice ON tasks(connection_practice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_authority_request ON tasks(authority_request_id);

CREATE OR REPLACE VIEW visconti_task_board AS
SELECT
  t.id,
  t.project_id,
  t.title,
  t.category,
  t.priority,
  t.workflow_status,
  t.due_date,
  t.start_date,
  t.blocker_reason,
  t.next_action,
  t.assignee_person_id,
  tm.display_name AS assignee_name,
  p.name AS project_name,
  p.project_stage,
  p.risk_level,
  CASE
    WHEN t.workflow_status IN ('done','cancelled') THEN 'closed'
    WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + 3 THEN 'urgent'
    WHEN t.workflow_status = 'blocked' THEN 'blocked'
    ELSE 'normal'
  END AS attention_state
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN team_members tm ON tm.id = t.assignee_person_id;

COMMENT ON VIEW visconti_task_board IS 'Operational task board for Visconti Work: owner, status, deadline and attention state.';
