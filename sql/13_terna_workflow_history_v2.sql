-- V2: immutable operational history for Terna connection workflow changes.
-- Apply after sql/10 and sql/11. This migration is intentionally additive.

CREATE TABLE IF NOT EXISTS connection_step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID,
  practice_id UUID NOT NULL REFERENCES connection_practices(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created','updated','deleted')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  old_state JSONB,
  new_state JSONB
);

CREATE INDEX IF NOT EXISTS idx_connection_step_history_practice
  ON connection_step_history(practice_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_connection_step_history_step
  ON connection_step_history(step_id, changed_at DESC);

CREATE OR REPLACE FUNCTION snapshot_connection_step(p_step connection_steps)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'id', p_step.id,
    'practice_id', p_step.practice_id,
    'phase', p_step.phase,
    'title', p_step.title,
    'step_type', p_step.step_type,
    'status', p_step.status,
    'is_optional', p_step.is_optional,
    'is_not_applicable', p_step.is_not_applicable,
    'responsible_id', p_step.responsible_id,
    'due_date', p_step.due_date,
    'started_date', p_step.started_date,
    'completed_at', p_step.completed_at,
    'completed_date', p_step.completed_date,
    'blocker_reason', p_step.blocker_reason,
    'notes', p_step.notes,
    'document', p_step.document,
    'sort_order', p_step.sort_order,
    'confirmation_required', p_step.confirmation_required,
    'confirmation_status', p_step.confirmation_status,
    'confirmation_date', p_step.confirmation_date,
    'confirmation_document', p_step.confirmation_document,
    'confirmation_notes', p_step.confirmation_notes
  );
$$;

CREATE OR REPLACE FUNCTION audit_connection_step_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO connection_step_history(step_id, practice_id, action, new_state)
    VALUES (NEW.id, NEW.practice_id, 'created', snapshot_connection_step(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO connection_step_history(step_id, practice_id, action, old_state, new_state)
    VALUES (NEW.id, NEW.practice_id, 'updated', snapshot_connection_step(OLD), snapshot_connection_step(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO connection_step_history(step_id, practice_id, action, old_state)
    VALUES (OLD.id, OLD.practice_id, 'deleted', snapshot_connection_step(OLD));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_connection_step_change ON connection_steps;
CREATE TRIGGER trg_audit_connection_step_change
AFTER INSERT OR UPDATE OR DELETE ON connection_steps
FOR EACH ROW EXECUTE FUNCTION audit_connection_step_change();

CREATE OR REPLACE VIEW connection_workflow_history AS
SELECT
  h.id,
  h.practice_id,
  h.step_id,
  h.action,
  h.changed_at,
  h.changed_by,
  tm.display_name AS changed_by_name,
  COALESCE(h.new_state->>'title', h.old_state->>'title', h.new_state->>'phase', h.old_state->>'phase') AS step_title,
  h.old_state->>'status' AS old_status,
  h.new_state->>'status' AS new_status,
  h.old_state->>'confirmation_status' AS old_confirmation_status,
  h.new_state->>'confirmation_status' AS new_confirmation_status,
  h.old_state->>'due_date' AS old_due_date,
  h.new_state->>'due_date' AS new_due_date,
  h.old_state->>'is_not_applicable' AS old_is_not_applicable,
  h.new_state->>'is_not_applicable' AS new_is_not_applicable,
  h.old_state,
  h.new_state
FROM connection_step_history h
LEFT JOIN team_members tm ON tm.id = h.changed_by;

COMMENT ON TABLE connection_step_history IS 'Audit trail immutabile delle modifiche al workflow di connessione Terna.';
COMMENT ON VIEW connection_workflow_history IS 'Timeline operativa delle modifiche alle fasi di una pratica.';
