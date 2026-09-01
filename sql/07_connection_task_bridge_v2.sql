-- GRUPPO VISCONTI – CONNECTION → TASK BRIDGE V2
-- Every operational connection deadline becomes a visible task.
-- Run after 04_visconti_work_v2.sql, 05_connection_workflow_v2.sql and 06_visconti_work_tasks_v2.sql.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source_connection_deadline_id UUID
    REFERENCES connection_deadlines(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tasks_source_connection_deadline
  ON tasks(source_connection_deadline_id)
  WHERE source_connection_deadline_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_connection_source
  ON tasks(source_connection_deadline_id);

CREATE OR REPLACE FUNCTION sync_connection_deadline_task()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_assignee_id UUID;
  v_assignee_name TEXT;
  v_workflow_status TEXT;
  v_priority TEXT;
BEGIN
  SELECT cp.project_id, COALESCE(NEW.responsible_id, cp.responsible_id)
    INTO v_project_id, v_assignee_id
  FROM connection_practices cp
  WHERE cp.id = NEW.practice_id;

  IF v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tm.display_name INTO v_assignee_name
  FROM team_members tm
  WHERE tm.id = v_assignee_id;

  v_workflow_status := CASE NEW.status
    WHEN 'completed' THEN 'done'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'todo'
  END;

  v_priority := CASE
    WHEN NEW.due_date <= CURRENT_DATE + 3 THEN 'urgent'
    WHEN NEW.due_date <= CURRENT_DATE + 7 THEN 'high'
    ELSE 'normal'
  END;

  INSERT INTO tasks (
    project_id,
    title,
    assignee,
    status,
    deadline,
    entity,
    assignee_person_id,
    priority,
    workflow_status,
    due_date,
    category,
    connection_practice_id,
    source_connection_deadline_id,
    next_action,
    notes
  ) VALUES (
    v_project_id,
    'Connessione — ' || NEW.title,
    COALESCE(v_assignee_name, ''),
    CASE WHEN NEW.status = 'completed' THEN 'done'::task_status ELSE 'pending'::task_status END,
    NEW.due_date,
    'Connessione',
    v_assignee_id,
    v_priority,
    v_workflow_status,
    NEW.due_date,
    'connection',
    NEW.practice_id,
    NEW.id,
    'Verificare e chiudere la scadenza della connessione',
    NEW.notes
  )
  ON CONFLICT (source_connection_deadline_id)
  DO UPDATE SET
    project_id = EXCLUDED.project_id,
    title = EXCLUDED.title,
    assignee = EXCLUDED.assignee,
    status = EXCLUDED.status,
    deadline = EXCLUDED.deadline,
    assignee_person_id = EXCLUDED.assignee_person_id,
    priority = EXCLUDED.priority,
    workflow_status = EXCLUDED.workflow_status,
    due_date = EXCLUDED.due_date,
    category = EXCLUDED.category,
    connection_practice_id = EXCLUDED.connection_practice_id,
    next_action = EXCLUDED.next_action,
    notes = EXCLUDED.notes;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_connection_deadline_to_task ON connection_deadlines;
CREATE TRIGGER trg_connection_deadline_to_task
AFTER INSERT OR UPDATE OF title, deadline_type, due_date, status, responsible_id, notes
ON connection_deadlines
FOR EACH ROW
EXECUTE FUNCTION sync_connection_deadline_task();

-- Keep the operational board explicit about the connection source.
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
  t.connection_practice_id,
  t.source_connection_deadline_id,
  CASE
    WHEN t.workflow_status IN ('done','cancelled') THEN 'closed'
    WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.workflow_status = 'blocked' THEN 'blocked'
    WHEN t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + 3 THEN 'urgent'
    ELSE 'normal'
  END AS attention_state
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN team_members tm ON tm.id = t.assignee_person_id;

COMMENT ON COLUMN tasks.source_connection_deadline_id IS 'Links an operational task to its originating connection deadline; prevents duplicate task creation.';
COMMENT ON VIEW visconti_task_board IS 'Operational task board for Visconti Work: owner, status, deadline, attention and source connection deadline.';
