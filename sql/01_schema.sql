-- ═══════════════════════════════════════════════════════════════════════
-- GRUPPO VISCONTI – PROJECT MANAGEMENT SYSTEM
-- Supabase Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── ENUM TYPES ───
CREATE TYPE project_type AS ENUM ('wind', 'agro-pv', 'storage');
CREATE TYPE project_phase AS ENUM ('land', 'connection', 'aviation', 'authorization', 'design', 'spv', 'accounting');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'done', 'overdue');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');
CREATE TYPE user_role AS ENUM ('admin', 'technical', 'legal', 'administrative');

-- ─── PROJECTS TABLE ───
CREATE TABLE projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  type        project_type NOT NULL,
  mw          NUMERIC(10,2) NOT NULL DEFAULT 0,
  region      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'Terreni',
  phase       project_phase NOT NULL DEFAULT 'land',
  completion  INTEGER NOT NULL DEFAULT 0 CHECK (completion >= 0 AND completion <= 100),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── TASKS TABLE ───
CREATE TABLE tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  assignee    TEXT NOT NULL DEFAULT '',
  status      task_status NOT NULL DEFAULT 'pending',
  deadline    DATE,
  entity      TEXT NOT NULL DEFAULT '',            -- Terreni, Connessione, Aviation, SPV, Contabilità, etc.
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── PAYMENTS TABLE ───
CREATE TABLE payments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  module        TEXT NOT NULL DEFAULT '',           -- Connessione, Terreni, Progettazione, SPV, Contabilità, Aviation
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  method        TEXT NOT NULL DEFAULT 'Bonifico',   -- Bonifico, PagoPA, F24
  status        payment_status NOT NULL DEFAULT 'pending',
  payment_date  DATE,
  receipt_url   TEXT,                               -- Supabase Storage path for receipt
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ───
CREATE INDEX idx_tasks_project     ON tasks(project_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_deadline    ON tasks(deadline);
CREATE INDEX idx_payments_project  ON payments(project_id);
CREATE INDEX idx_payments_status   ON payments(status);
CREATE INDEX idx_projects_type     ON projects(type);
CREATE INDEX idx_projects_phase    ON projects(phase);

-- ─── AUTO-UPDATE updated_at ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── VIEW: projects_with_counts (for dashboard) ───
CREATE OR REPLACE VIEW projects_dashboard AS
SELECT
  p.*,
  COALESCE(t.total_tasks, 0)   AS tasks_count,
  COALESCE(t.delayed_tasks, 0) AS delayed_count
FROM projects p
LEFT JOIN (
  SELECT
    project_id,
    COUNT(*)                                      AS total_tasks,
    COUNT(*) FILTER (WHERE status = 'overdue')    AS delayed_tasks
  FROM tasks
  GROUP BY project_id
) t ON t.project_id = p.id;

-- ─── ROW LEVEL SECURITY ───
-- Enable RLS on all tables (configure auth policies in Supabase dashboard)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust per your auth setup)
CREATE POLICY "Allow all for authenticated" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON tasks    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Also allow anon access for development / prototype usage
CREATE POLICY "Allow anon read" ON projects FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write" ON projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON projects FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON projects FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read" ON tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write" ON tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON tasks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON tasks FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read" ON payments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write" ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON payments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON payments FOR DELETE TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA – Real Gruppo Visconti project examples
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO projects (id, name, type, mw, region, status, phase, completion) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ascoli Wind',       'wind',    48,  'Marche',          'Autorizzazione',  'authorization', 65),
  ('a1000000-0000-0000-0000-000000000002', 'Brindisi BESS',     'storage', 80,  'Puglia',          'Connessione',     'connection',    40),
  ('a1000000-0000-0000-0000-000000000003', 'Corniglio Wind',    'wind',    36,  'Emilia-Romagna',  'VIA',             'authorization', 55),
  ('a1000000-0000-0000-0000-000000000004', 'Genzano 1 Wind',    'wind',    42,  'Basilicata',      'Da Perfezionare', 'land',          25),
  ('a1000000-0000-0000-0000-000000000005', 'Genzano 2 Wind',    'wind',    38,  'Basilicata',      'Da Perfezionare', 'land',          20),
  ('a1000000-0000-0000-0000-000000000006', 'Foggia Agri-PV',    'agro-pv', 120, 'Puglia',          'Progettazione',   'design',        30),
  ('a1000000-0000-0000-0000-000000000007', 'Potenza Wind',      'wind',    54,  'Basilicata',      'SPV Attiva',      'spv',           80),
  ('a1000000-0000-0000-0000-000000000008', 'Taranto BESS',      'storage', 60,  'Puglia',          'Connessione',     'connection',    45),
  ('a1000000-0000-0000-0000-000000000009', 'Avellino Agri-PV',  'agro-pv', 95,  'Campania',        'Terreni',         'land',          15),
  ('a1000000-0000-0000-0000-000000000010', 'Matera Wind',       'wind',    66,  'Basilicata',      'Autorizzazione',  'authorization', 70),
  ('a1000000-0000-0000-0000-000000000011', 'Lecce BESS',        'storage', 100, 'Puglia',          'Progettazione',   'design',        35),
  ('a1000000-0000-0000-0000-000000000012', 'Campobasso Wind',   'wind',    72,  'Molise',          'Aviation',        'aviation',      60);

INSERT INTO tasks (project_id, title, assignee, status, deadline, entity) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Richiedere CDU Comune di Ascoli',       'Federica M.', 'overdue',     '2026-03-15', 'Terreni'),
  ('a1000000-0000-0000-0000-000000000003', 'Inviare documentazione Terna STMG',     'Vincenzo M.', 'overdue',     '2026-03-20', 'Connessione'),
  ('a1000000-0000-0000-0000-000000000012', 'Preparare elaborati ENAC',              'Dario R.',    'overdue',     '2026-03-22', 'Aviation'),
  ('a1000000-0000-0000-0000-000000000006', 'Verifica usi civici Foggia',            'Federica M.', 'in_progress', '2026-04-05', 'Terreni'),
  ('a1000000-0000-0000-0000-000000000007', 'Apertura P.IVA SPV Potenza',            'Admin',       'done',        '2026-03-10', 'SPV'),
  ('a1000000-0000-0000-0000-000000000007', 'Upload fatture commercialista Q1',      'Admin',       'in_progress', '2026-04-01', 'Contabilità'),
  ('a1000000-0000-0000-0000-000000000012', 'Richiesta nulla osta ENAV',             'Dario R.',    'in_progress', '2026-04-10', 'Aviation'),
  ('a1000000-0000-0000-0000-000000000002', 'Pagamento diritti Terna Brindisi',      'Admin',       'pending',     '2026-04-15', 'Connessione');

INSERT INTO payments (project_id, description, module, amount, method, status, payment_date) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Diritti connessione Terna – Ascoli',      'Connessione',   5000.00,  'Bonifico', 'paid',    '2025-06-05'),
  ('a1000000-0000-0000-0000-000000000001', 'CDU Comune – F.12 P.234',                 'Terreni',       35.00,    'Bonifico', 'paid',    '2026-01-12'),
  ('a1000000-0000-0000-0000-000000000001', 'Usi Civici – PagoPA',                     'Terreni',       16.00,    'PagoPA',   'paid',    '2026-02-15'),
  ('a1000000-0000-0000-0000-000000000001', 'Acconto Ing. Verdi – SIA',                'Progettazione', 22500.00, 'Bonifico', 'paid',    '2026-01-20'),
  ('a1000000-0000-0000-0000-000000000001', 'Saldo Ing. Verdi – SIA',                  'Progettazione', 22500.00, 'Bonifico', 'paid',    '2026-03-05'),
  ('a1000000-0000-0000-0000-000000000001', 'Acconto Studio Neri – Progetto Def.',     'Progettazione', 36000.00, 'Bonifico', 'paid',    '2026-02-15'),
  ('a1000000-0000-0000-0000-000000000007', 'Notaio – Costituzione SPV',               'SPV',           3200.00,  'Bonifico', 'paid',    '2025-11-25'),
  ('a1000000-0000-0000-0000-000000000007', 'F24 IVA Febbraio',                        'Contabilità',   3200.00,  'F24',      'paid',    '2026-03-16'),
  ('a1000000-0000-0000-0000-000000000007', 'Voltura Terna – SPV',                     'SPV',           500.00,   'Bonifico', 'pending', NULL),
  ('a1000000-0000-0000-0000-000000000012', 'Diritti ENAC',                            'Aviation',      1200.00,  'Bonifico', 'pending', NULL);

-- ═══════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET (run separately or via Supabase dashboard)
-- Create a bucket named 'documents' for receipts and file uploads
-- ═══════════════════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
