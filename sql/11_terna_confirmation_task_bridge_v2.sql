-- Visconti Work V2
-- Bridge Terna confirmation waits into the operational task board.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source_connection_step_id UUID REFERENCES connection_steps(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tasks_source_connection_step
  ON tasks(source_connection_step_id)
  WHERE source_connection_step_id IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_connection_step_confirmation_task()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id UUID;
  v_assignee UUID;
  v_priority TEXT;
  v_workflow_status TEXT;
  v_next_action TEXT;
BEGIN
  SELECT project_id INTO v_project_id
  FROM connection_practices
  WHERE id = NEW.practice_id;

  v_assignee := NEW.responsible_id;
  v_priority := CASE
    WHEN NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN 'urgent'
    WHEN NEW.due_date IS NOT NULL AND NEW.due_date <= CURRENT_DATE + 3 THEN 'high'
    ELSE 'normal'
  END;

  IF NEW.confirmation_required AND NEW.confirmation_status = 'waiting' THEN
    v_workflow_status := 'in_progress';
    v_next_action := 'Attendere risposta Terna e registrare conferma/validazione';

    INSERT INTO tasks (
      title, description, project_id, assignee_person_id, priority,
      workflow_status, blocker_reason, notes, due_date, category,
      connection_practice_id, next_action, source_connection_step_id
    ) VALUES (
      'Terna — Conferma: ' || COALESCE(NEW.title, 'Fase connessione'),
      'Attesa della conferma o validazione Terna associata alla fase di connessione.',
      v_project_id, v_assignee, v_priority,
      v_workflow_status, NULL,
      NEW.confirmation_notes, NEW.due_date, 'connection',
      NEW.practice_id, v_next_action, NEW.id
    )
    ON CONFLICT (source_connection_step_id) DO UPDATE SET
      title = EXCLUDED.title,
      project_id = EXCLUDED.project_id,
      assignee_person_id = EXCLUDED.assignee_person_id,
      priority = EXCLUDED.priority,
      workflow_status = EXCLUDED.workflow_status,
      due_date = EXCLUDED.due_date,
      notes = EXCLUDED.notes,
      next_action = EXCLUDED.next_action,
      connection_practice_id = EXCLUDED.connection_practice_id;

  ELSIF NEW.confirmation_status IN ('confirmed','validated') THEN
    UPDATE tasks
       SET workflow_status = 'done',
           completed_at = COALESCE(completed_at, CURRENT_DATE),
           blocker_reason = NULL,
           next_action = CASE
             WHEN NEW.confirmation_status = 'validated' THEN 'Conferma validata: procedere con la fase successiva'
             ELSE 'Conferma Terna registrata: procedere con la fase successiva'
           END
     WHERE source_connection_step_id = NEW.id;

  ELSIF NEW.confirmation_status = 'rejected' THEN
    UPDATE tasks
       SET workflow_status = 'blocked',
           completed_at = NULL,
           blocker_reason = 'Risposta Terna respinta: verificare e gestire la fase',
           next_action = 'Verificare il rigetto Terna e decidere il nuovo passo'
     WHERE source_connection_step_id = NEW.id;

  ELSIF NEW.confirmation_status = 'not_required' THEN
    UPDATE tasks
       SET workflow_status = 'done',
           completed_at = COALESCE(completed_at, CURRENT_DATE),
           blocker_reason = NULL,
           next_action = 'Conferma non richiesta'
     WHERE source_connection_step_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_connection_step_confirmation_task ON connection_steps;
CREATE TRIGGER trg_sync_connection_step_confirmation_task
AFTER INSERT OR UPDATE OF confirmation_required, confirmation_status, title, responsible_id, due_date, confirmation_notes
ON connection_steps
FOR EACH ROW
EXECUTE FUNCTION sync_connection_step_confirmation_task();

-- Backfill only phases that are currently waiting for Terna.
INSERT INTO tasks (
  title, description, project_id, assignee_person_id, priority,
  workflow_status, notes, due_date, category,
  connection_practice_id, next_action, source_connection_step_id
)
SELECT
  'Terna — Conferma: ' || COALESCE(cs.title, 'Fase connessione'),
  'Attesa della conferma o validazione Terna associata alla fase di connessione.',
  cp.project_id,
  cs.responsible_id,
  CASE
    WHEN cs.due_date IS NOT NULL AND cs.due_date < CURRENT_DATE THEN 'urgent'
    WHEN cs.due_date IS NOT NULL AND cs.due_date <= CURRENT_DATE + 3 THEN 'high'
    ELSE 'normal'
  END,
  'in_progress',
  cs.confirmation_notes,
  cs.due_date,
  'connection',
  cs.practice_id,
  'Attendere risposta Terna e registrare conferma/validazione',
  cs.id
FROM connection_steps cs
JOIN connection_practices cp ON cp.id = cs.practice_id
WHERE cs.confirmation_required = true
  AND cs.confirmation_status = 'waiting'
ON CONFLICT (source_connection_step_id) DO NOTHING;

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
  t.connection_practice_id,
  t.source_connection_deadline_id,
  t.source_connection_step_id,
  p.name AS project_name,
  p.project_stage,
  p.risk_level,
  CASE
    WHEN t.workflow_status = 'blocked' THEN 'blocked'
    WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.workflow_status <> 'done' THEN 'overdue'
    WHEN t.due_date IS NOT NULL AND t.due_date <= CURRENT_DATE + 3 AND t.workflow_status <> 'done' THEN 'soon'
    ELSE 'normal'
  END AS attention_state
FROM tasks t
LEFT JOIN team_members tm ON tm.id = t.assignee_person_id
LEFT JOIN projects p ON p.id = t.project_id;
