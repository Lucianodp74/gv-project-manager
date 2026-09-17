-- Visconti Work V2 — conferma/validazione Terna per fasi operative
-- Eseguire dopo 09_connection_workflow_builder_v2.sql

ALTER TABLE connection_steps
  ADD COLUMN IF NOT EXISTS confirmation_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS confirmation_date DATE,
  ADD COLUMN IF NOT EXISTS confirmation_document TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

ALTER TABLE connection_steps
  DROP CONSTRAINT IF EXISTS connection_steps_confirmation_status_check;

ALTER TABLE connection_steps
  ADD CONSTRAINT connection_steps_confirmation_status_check
  CHECK (confirmation_status IN ('not_required','waiting','confirmed','validated','rejected'));

CREATE INDEX IF NOT EXISTS idx_connection_steps_confirmation
  ON connection_steps (practice_id, confirmation_required, confirmation_status);

-- Fasi storiche tipicamente soggette a conferma Terna possono essere marcate manualmente;
-- non imponiamo automaticamente il flag sui dati esistenti per evitare falsi positivi.

CREATE OR REPLACE VIEW connection_workflow_builder AS
SELECT
  cs.id,
  cs.practice_id,
  cs.phase,
  cs.title,
  cs.step_type,
  cs.is_optional,
  cs.is_not_applicable,
  cs.status,
  cs.responsible_id,
  tm.display_name AS responsible_name,
  cs.due_date,
  cs.started_date,
  cs.completed_at,
  cs.blocker_reason,
  cs.notes,
  cs.document,
  cs.sort_order,
  cs.confirmation_required,
  cs.confirmation_status,
  cs.confirmation_date,
  cs.confirmation_document,
  cs.confirmation_notes,
  CASE
    WHEN cs.is_not_applicable THEN 'not_applicable'
    WHEN cs.confirmation_required AND cs.confirmation_status IN ('waiting','rejected') THEN 'awaiting_confirmation'
    WHEN cs.status = 'done' THEN 'done'
    WHEN cs.due_date IS NOT NULL AND cs.due_date < CURRENT_DATE THEN 'overdue'
    WHEN cs.status = 'in_progress' THEN 'in_progress'
    WHEN cs.due_date IS NOT NULL AND cs.due_date <= CURRENT_DATE + 7 THEN 'soon'
    ELSE 'normal'
  END AS attention_state
FROM connection_steps cs
LEFT JOIN team_members tm ON tm.id = cs.responsible_id;
