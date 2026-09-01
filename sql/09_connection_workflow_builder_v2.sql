-- GRUPPO VISCONTI — CONNECTION WORKFLOW BUILDER V2
-- Makes connection_steps configurable per practice while preserving legacy phase values.

ALTER TABLE connection_steps
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_not_applicable BOOLEAN NOT NULL DEFAULT false;

UPDATE connection_steps
SET title = CASE phase
  WHEN 'richiesta' THEN 'Richiesta connessione'
  WHEN 'invio_doc' THEN 'Invio documenti'
  WHEN 'pto' THEN 'STMG / PTO ricevuto'
  WHEN 'pto_accepted' THEN 'PTO accettato'
  WHEN 'sharing' THEN 'Sharing / iter autorizzativo'
  WHEN 'accettazione' THEN 'Accettazione'
  ELSE COALESCE(title, 'Passaggio')
END
WHERE title IS NULL OR title = '';

CREATE INDEX IF NOT EXISTS idx_conn_steps_practice_order ON connection_steps(practice_id, sort_order, created_at);

CREATE OR REPLACE VIEW connection_workflow_builder AS
SELECT
  cs.id,
  cs.practice_id,
  cs.phase,
  COALESCE(cs.title, cs.phase::text) AS title,
  cs.step_type,
  cs.status,
  cs.is_optional,
  cs.is_not_applicable,
  cs.responsible_id,
  tm.display_name AS responsible_name,
  cs.due_date,
  cs.started_date,
  cs.completed_at,
  cs.completed_date,
  cs.blocker_reason,
  cs.notes,
  cs.document,
  cs.sort_order,
  CASE
    WHEN cs.is_not_applicable THEN 'not_applicable'
    WHEN cs.status = 'done' THEN 'done'
    WHEN cs.status = 'in_progress' THEN 'in_progress'
    WHEN cs.due_date IS NOT NULL AND cs.due_date < CURRENT_DATE THEN 'overdue'
    WHEN cs.due_date IS NOT NULL AND cs.due_date <= CURRENT_DATE + 7 THEN 'soon'
    ELSE 'normal'
  END AS attention_state
FROM connection_steps cs
LEFT JOIN team_members tm ON tm.id = cs.responsible_id;

COMMENT ON VIEW connection_workflow_builder IS
  'Configurable per-practice connection workflow: custom title, optional/N/A steps, owner, dates and operational status.';
