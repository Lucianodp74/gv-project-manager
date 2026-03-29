-- ═══════════════════════════════════════════════════════════════════════
-- GRUPPO VISCONTI – CONNECTION MODULE (Connessione)
-- Migration: connection_practices + connection_steps
-- Run this in Supabase SQL Editor AFTER the main schema + land migration
-- ═══════════════════════════════════════════════════════════════════════

-- ─── ENUM TYPES ───
CREATE TYPE conn_operator AS ENUM ('terna', 'e-distribuzione');
CREATE TYPE conn_practice_status AS ENUM ('pending', 'active', 'accepted');
CREATE TYPE conn_step_phase AS ENUM ('richiesta', 'invio_doc', 'pto', 'pto_accepted', 'sharing', 'accettazione');
CREATE TYPE conn_step_status AS ENUM ('pending', 'in_progress', 'done');

-- ─── CONNECTION PRACTICES ───
CREATE TABLE connection_practices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  operator      conn_operator NOT NULL DEFAULT 'terna',
  practice_code TEXT NOT NULL DEFAULT '',
  power_mw      NUMERIC(10,2) NOT NULL DEFAULT 0,
  station       TEXT NOT NULL DEFAULT '',
  status        conn_practice_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── CONNECTION STEPS ───
CREATE TABLE connection_steps (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id    UUID NOT NULL REFERENCES connection_practices(id) ON DELETE CASCADE,
  phase          conn_step_phase NOT NULL,
  status         conn_step_status NOT NULL DEFAULT 'pending',
  completed_date DATE,
  document       TEXT DEFAULT '',
  payment_proof  TEXT DEFAULT '',
  notes          TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ───
CREATE INDEX idx_conn_practices_project ON connection_practices(project_id);
CREATE INDEX idx_conn_steps_practice    ON connection_steps(practice_id);
CREATE INDEX idx_conn_steps_phase       ON connection_steps(phase);
CREATE INDEX idx_conn_steps_status      ON connection_steps(status);

-- ─── AUTO-UPDATE TRIGGERS ───
CREATE TRIGGER trg_conn_practices_updated
  BEFORE UPDATE ON connection_practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conn_steps_updated
  BEFORE UPDATE ON connection_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE connection_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_steps     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON connection_practices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON connection_steps     FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read"   ON connection_practices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write"  ON connection_practices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON connection_practices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON connection_practices FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read"   ON connection_steps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write"  ON connection_steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON connection_steps FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON connection_steps FOR DELETE TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════

-- Ascoli Wind – Terna practice, 4 steps done, 2 pending
INSERT INTO connection_practices (id, project_id, operator, practice_code, power_mw, station, status) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'terna', '202400832', 48, 'SE Ascoli 150kV', 'active');

INSERT INTO connection_steps (practice_id, phase, status, completed_date, document, payment_proof, notes) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'richiesta',     'done',        '2025-06-05', 'Richiesta_Terna.pdf',       'Bonifico €5.000',  'Istanza inviata via portale Terna'),
  ('c3000000-0000-0000-0000-000000000001', 'invio_doc',     'done',        '2025-07-20', 'Progetto_Preliminare.pdf',  '',                 'Planimetria + relazione tecnica'),
  ('c3000000-0000-0000-0000-000000000001', 'pto',           'done',        '2025-09-15', 'STMG_Ascoli.pdf',           '',                 'Preventivo STMG ricevuto'),
  ('c3000000-0000-0000-0000-000000000001', 'pto_accepted',  'in_progress', NULL,          '',                          '',                 'In attesa approvazione PTO'),
  ('c3000000-0000-0000-0000-000000000001', 'sharing',       'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000001', 'accettazione',  'pending',     NULL,          '',                          '',                 '');

-- Brindisi BESS – Terna practice, 2 steps done
INSERT INTO connection_practices (id, project_id, operator, practice_code, power_mw, station, status) VALUES
  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'terna', '202401156', 80, 'SE Brindisi 380kV', 'active');

INSERT INTO connection_steps (practice_id, phase, status, completed_date, document, payment_proof, notes) VALUES
  ('c3000000-0000-0000-0000-000000000002', 'richiesta',     'done',        '2025-04-10', 'Richiesta_Terna_BR.pdf',    'Bonifico €8.000',  ''),
  ('c3000000-0000-0000-0000-000000000002', 'invio_doc',     'done',        '2025-06-01', 'Progetto_BESS_BR.pdf',      '',                 'Documentazione BESS completa'),
  ('c3000000-0000-0000-0000-000000000002', 'pto',           'in_progress', NULL,          '',                          '',                 'In attesa STMG'),
  ('c3000000-0000-0000-0000-000000000002', 'pto_accepted',  'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000002', 'sharing',       'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000002', 'accettazione',  'pending',     NULL,          '',                          '',                 '');

-- Taranto BESS – e-distribuzione practice, early stage
INSERT INTO connection_practices (id, project_id, operator, practice_code, power_mw, station, status) VALUES
  ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008', 'e-distribuzione', 'ED-2025-07823', 60, 'CP Taranto Nord MT', 'pending');

INSERT INTO connection_steps (practice_id, phase, status, completed_date, document, payment_proof, notes) VALUES
  ('c3000000-0000-0000-0000-000000000003', 'richiesta',     'done',        '2025-08-20', 'Richiesta_ED_TA.pdf',       'Bonifico €2.500',  ''),
  ('c3000000-0000-0000-0000-000000000003', 'invio_doc',     'in_progress', NULL,          '',                          '',                 'Documentazione in preparazione'),
  ('c3000000-0000-0000-0000-000000000003', 'pto',           'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000003', 'pto_accepted',  'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000003', 'sharing',       'pending',     NULL,          '',                          '',                 ''),
  ('c3000000-0000-0000-0000-000000000003', 'accettazione',  'pending',     NULL,          '',                          '',                 '');

-- Corniglio Wind – Terna, all 6 steps done = accepted
INSERT INTO connection_practices (id, project_id, operator, practice_code, power_mw, station, status) VALUES
  ('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'terna', '202300412', 36, 'SE Parma 132kV', 'accepted');

INSERT INTO connection_steps (practice_id, phase, status, completed_date, document, payment_proof, notes) VALUES
  ('c3000000-0000-0000-0000-000000000004', 'richiesta',     'done', '2024-11-05', 'Richiesta_COR.pdf',  'Bonifico €4.000',  ''),
  ('c3000000-0000-0000-0000-000000000004', 'invio_doc',     'done', '2025-01-15', 'Progetto_COR.pdf',   '',                 ''),
  ('c3000000-0000-0000-0000-000000000004', 'pto',           'done', '2025-04-20', 'STMG_COR.pdf',       '',                 ''),
  ('c3000000-0000-0000-0000-000000000004', 'pto_accepted',  'done', '2025-06-10', 'PTO_Approv_COR.pdf', 'Bonifico €12.000', ''),
  ('c3000000-0000-0000-0000-000000000004', 'sharing',       'done', '2025-08-22', 'Sharing_COR.pdf',    '',                 ''),
  ('c3000000-0000-0000-0000-000000000004', 'accettazione',  'done', '2025-10-01', 'Accettazione_COR.pdf','',                'Pratica completata');
