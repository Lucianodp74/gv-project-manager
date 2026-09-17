-- ═══════════════════════════════════════════════════════════════════════
-- GRUPPO VISCONTI – VISCONTI WORK V2
-- Operating model: people, responsibilities, workflow, specialists,
-- authorities, decisions and weekly planning.
--
-- This migration extends the existing V1 without replacing it.
-- Run after 01_schema.sql, 02_land.sql and 03_connection.sql.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── TEAM / PEOPLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name    TEXT NOT NULL,
  role_name       TEXT NOT NULL DEFAULT '',
  area            TEXT NOT NULL DEFAULT '',
  engagement_type TEXT NOT NULL DEFAULT 'internal',
  active          BOOLEAN NOT NULL DEFAULT true,
  available_from  DATE,
  available_until DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT team_members_engagement_chk
    CHECK (engagement_type IN ('internal','external','partner'))
);

CREATE INDEX IF NOT EXISTS idx_team_members_area ON team_members(area);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);

-- ─── PROJECT ORGANISATION ───────────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_stage TEXT NOT NULL DEFAULT 'opportunity';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS development_mode TEXT NOT NULL DEFAULT 'internal';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS commercial_path TEXT NOT NULL DEFAULT 'development';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES team_members(id);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES team_members(id);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS next_action TEXT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE projects
  ADD CONSTRAINT projects_stage_chk
  CHECK (project_stage IN (
    'opportunity','connection','go_decision','development',
    'presentation','authorization','commercial','authorized','closed'
  ));

ALTER TABLE projects
  ADD CONSTRAINT projects_development_mode_chk
  CHECK (development_mode IN ('internal','territorial','mixed'));

ALTER TABLE projects
  ADD CONSTRAINT projects_commercial_path_chk
  CHECK (commercial_path IN ('development','co_development','sale','authorization'));

ALTER TABLE projects
  ADD CONSTRAINT projects_risk_level_chk
  CHECK (risk_level IN ('normal','attention','critical'));

CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(project_stage);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);

-- ─── PROJECT TEAM / RESPONSIBILITIES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  responsibility  TEXT NOT NULL DEFAULT 'support',
  active          BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, member_id, responsibility),
  CONSTRAINT project_members_responsibility_chk
    CHECK (responsibility IN ('decision','responsible','executor','supervisor','support'))
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_member ON project_members(member_id);

-- ─── TASK / WORK MANAGEMENT EXTENSIONS ─────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignee_person_id UUID REFERENCES team_members(id);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'todo';

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS blocker_reason TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_priority_chk
  CHECK (priority IN ('low','normal','high','urgent'));

ALTER TABLE tasks
  ADD CONSTRAINT tasks_workflow_status_chk
  CHECK (workflow_status IN ('todo','in_progress','waiting','blocked','done','cancelled'));

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_person ON tasks(assignee_person_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_status ON tasks(workflow_status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- ─── PROJECT ASSETS / TECHNICAL OUTPUTS ─────────────────────────────────
-- Tracks the main technical objects discussed in the Visconti workflow.
CREATE TABLE IF NOT EXISTS project_assets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'planned',
  version         TEXT,
  responsible_id  UUID REFERENCES team_members(id),
  document_url    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT project_assets_type_chk
    CHECK (asset_type IN ('kmz','layout','cavidotto','roads','sse_terna','vincolistica','gis','document')),
  CONSTRAINT project_assets_status_chk
    CHECK (status IN ('planned','in_progress','waiting','verified','approved','superseded'))
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_type ON project_assets(asset_type);

-- ─── SPECIALIST ASSIGNMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS specialist_assignments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  specialist_name TEXT NOT NULL,
  specialist_type TEXT NOT NULL,
  coordinator_id  UUID REFERENCES team_members(id),
  status          TEXT NOT NULL DEFAULT 'to_assign',
  assigned_at     DATE,
  due_date        DATE,
  delivered_at    DATE,
  output_required TEXT,
  document_url    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT specialist_status_chk
    CHECK (status IN ('to_assign','assigned','in_progress','waiting','delivered','verified','revision','closed'))
);

CREATE INDEX IF NOT EXISTS idx_specialists_project ON specialist_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_specialists_due_date ON specialist_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_specialists_status ON specialist_assignments(status);

-- ─── AUTHORITY / ENTITY COMMUNICATIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS authority_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  authority_name      TEXT NOT NULL,
  item_type           TEXT NOT NULL,
  received_date       DATE,
  response_deadline   DATE,
  status              TEXT NOT NULL DEFAULT 'to_review',
  coordinator_id      UUID REFERENCES team_members(id),
  requires_decision   BOOLEAN NOT NULL DEFAULT false,
  source_document_url TEXT,
  response_document_url TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT authority_item_type_chk
    CHECK (item_type IN ('parere','integrazione','osservazione','prescrizione','comunicazione','esito','altro')),
  CONSTRAINT authority_item_status_chk
    CHECK (status IN ('to_review','assigned','in_progress','waiting','ready','sent','closed'))
);

CREATE INDEX IF NOT EXISTS idx_authority_project ON authority_items(project_id);
CREATE INDEX IF NOT EXISTS idx_authority_deadline ON authority_items(response_deadline);
CREATE INDEX IF NOT EXISTS idx_authority_status ON authority_items(status);

-- Individual points inside an authority request. One letter can contain
-- several independent pieces of work for different people.
CREATE TABLE IF NOT EXISTS authority_requests (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  authority_item_id   UUID NOT NULL REFERENCES authority_items(id) ON DELETE CASCADE,
  request_number      INTEGER NOT NULL,
  description         TEXT NOT NULL,
  assignee_id         UUID REFERENCES team_members(id),
  deadline            DATE,
  status              TEXT NOT NULL DEFAULT 'todo',
  response_document_url TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(authority_item_id, request_number),
  CONSTRAINT authority_request_status_chk
    CHECK (status IN ('todo','in_progress','waiting','blocked','done'))
);

CREATE INDEX IF NOT EXISTS idx_authority_requests_item ON authority_requests(authority_item_id);
CREATE INDEX IF NOT EXISTS idx_authority_requests_assignee ON authority_requests(assignee_id);

-- ─── DECISIONS / GO-NO-GO / MANAGEMENT ─────────────────────────────────
CREATE TABLE IF NOT EXISTS project_decisions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  decision_type   TEXT NOT NULL,
  decision_status TEXT NOT NULL DEFAULT 'pending',
  requested_by    UUID REFERENCES team_members(id),
  decided_by      UUID REFERENCES team_members(id),
  requested_at    TIMESTAMPTZ DEFAULT now(),
  decided_at      TIMESTAMPTZ,
  decision_value  TEXT,
  reason          TEXT,
  notes           TEXT,
  CONSTRAINT decision_type_chk
    CHECK (decision_type IN ('go_no_go','development_mode','commercial_path','project_priority','strategic','authority_response','other')),
  CONSTRAINT decision_status_chk
    CHECK (decision_status IN ('pending','approved','rejected','deferred'))
);

CREATE INDEX IF NOT EXISTS idx_decisions_project ON project_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON project_decisions(decision_status);

-- ─── WEEKLY MEETINGS / PLANNING ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_meetings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date  DATE NOT NULL,
  title         TEXT NOT NULL DEFAULT 'Riunione settimanale',
  status        TEXT NOT NULL DEFAULT 'planned',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT weekly_meeting_status_chk
    CHECK (status IN ('planned','completed','cancelled'))
);

CREATE TABLE IF NOT EXISTS weekly_meeting_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id      UUID NOT NULL REFERENCES weekly_meetings(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  member_id       UUID REFERENCES team_members(id),
  item_type       TEXT NOT NULL,
  description     TEXT NOT NULL,
  outcome         TEXT,
  next_action     TEXT,
  due_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT meeting_item_type_chk
    CHECK (item_type IN ('review','problem','decision','plan','follow_up'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_items_meeting ON weekly_meeting_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_items_project ON weekly_meeting_items(project_id);

-- ─── SHARED UPDATED_AT TRIGGERS ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_team_members_updated ON team_members;
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON team_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_project_assets_updated ON project_assets;
CREATE TRIGGER trg_project_assets_updated BEFORE UPDATE ON project_assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_specialist_assignments_updated ON specialist_assignments;
CREATE TRIGGER trg_specialist_assignments_updated BEFORE UPDATE ON specialist_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_authority_items_updated ON authority_items;
CREATE TRIGGER trg_authority_items_updated BEFORE UPDATE ON authority_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_authority_requests_updated ON authority_requests;
CREATE TRIGGER trg_authority_requests_updated BEFORE UPDATE ON authority_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_weekly_meetings_updated ON weekly_meetings;
CREATE TRIGGER trg_weekly_meetings_updated BEFORE UPDATE ON weekly_meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── V2 CONTROL-TOWER VIEW ──────────────────────────────────────────────
CREATE OR REPLACE VIEW visconti_control_tower AS
SELECT
  p.id,
  p.name,
  p.type,
  p.mw,
  p.region,
  p.project_stage,
  p.development_mode,
  p.commercial_path,
  p.completion,
  p.risk_level,
  p.next_action,
  COUNT(DISTINCT t.id) FILTER (WHERE t.workflow_status IN ('todo','in_progress','waiting','blocked')) AS open_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.workflow_status = 'blocked') AS blocked_tasks,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status NOT IN ('closed','sent')) AS open_authority_items,
  COUNT(DISTINCT d.id) FILTER (WHERE d.decision_status = 'pending') AS pending_decisions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('assigned','in_progress','waiting','revision')) AS open_specialists
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN authority_items a ON a.project_id = p.id
LEFT JOIN project_decisions d ON d.project_id = p.id
LEFT JOIN specialist_assignments s ON s.project_id = p.id
GROUP BY p.id;

-- ═══════════════════════════════════════════════════════════════════════
-- NOTE: No team members are seeded here because the repository is public.
-- Production seed data should be inserted privately in Supabase.
-- ═══════════════════════════════════════════════════════════════════════
