-- GRUPPO VISCONTI – CONNECTION WORKFLOW V2
-- Operational layer for connection monitoring: owners, milestones and deadlines.
-- Run after 04_visconti_work_v2.sql.

ALTER TABLE connection_practices
  ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES team_members(id),
  ADD COLUMN IF NOT EXISTS request_date DATE,
  ADD COLUMN IF NOT EXISTS pto_received_date DATE,
  ADD COLUMN IF NOT EXISTS pto_accepted_date DATE,
  ADD COLUMN IF NOT EXISTS iter_start_date DATE,
  ADD COLUMN IF NOT EXISTS sharing_date DATE,
  ADD COLUMN IF NOT EXISTS acceptance_date DATE,
  ADD COLUMN IF NOT EXISTS next_deadline DATE,
  ADD COLUMN IF NOT EXISTS next_deadline_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_conn_practice_responsible ON connection_practices(responsible_id);
CREATE INDEX IF NOT EXISTS idx_conn_practice_next_deadline ON connection_practices(next_deadline);

ALTER TABLE connection_steps
  ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES team_members(id),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS started_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocker_reason TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_conn_steps_responsible ON connection_steps(responsible_id);
CREATE INDEX IF NOT EXISTS idx_conn_steps_due_date ON connection_steps(due_date);

-- One connection can have many operator/Terna deadlines. This keeps the
-- history instead of overwriting the previous deadline on the practice.
CREATE TABLE IF NOT EXISTS connection_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES connection_practices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline_type TEXT NOT NULL DEFAULT 'other',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  responsible_id UUID REFERENCES team_members(id),
  completed_date DATE,
  source_document TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT connection_deadline_status_chk
    CHECK (status IN ('open','completed','overdue','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_conn_deadlines_practice ON connection_deadlines(practice_id);
CREATE INDEX IF NOT EXISTS idx_conn_deadlines_due_date ON connection_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_conn_deadlines_status ON connection_deadlines(status);

-- Lightweight operational view for dashboards.
CREATE OR REPLACE VIEW connection_workflow_overview AS
SELECT
  cp.id,
  cp.project_id,
  cp.operator,
  cp.practice_code,
  cp.power_mw,
  cp.station,
  cp.status,
  cp.responsible_id,
  cp.request_date,
  cp.pto_received_date,
  cp.pto_accepted_date,
  cp.iter_start_date,
  cp.sharing_date,
  cp.acceptance_date,
  cp.next_deadline,
  cp.next_deadline_type,
  COUNT(cd.id) FILTER (WHERE cd.status IN ('open','overdue')) AS open_deadlines,
  COUNT(cs.id) FILTER (WHERE cs.status <> 'done') AS open_steps,
  COUNT(cs.id) FILTER (WHERE cs.status = 'done') AS completed_steps
FROM connection_practices cp
LEFT JOIN connection_deadlines cd ON cd.practice_id = cp.id
LEFT JOIN connection_steps cs ON cs.practice_id = cp.id
GROUP BY cp.id;
