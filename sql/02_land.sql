-- ═══════════════════════════════════════════════════════════════════════
-- GRUPPO VISCONTI – LAND MODULE (Terreni)
-- Migration: land_parcels + land_checks
-- Run this in Supabase SQL Editor AFTER the main schema migration
-- ═══════════════════════════════════════════════════════════════════════

-- ─── ENUM TYPE ───
CREATE TYPE check_type   AS ENUM ('CDU', 'usi_civici', 'aree_fuoco');
CREATE TYPE check_status AS ENUM ('pending', 'in_progress', 'done');

-- ─── LAND PARCELS ───
CREATE TABLE land_parcels (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  foglio      TEXT NOT NULL DEFAULT '',
  particella  TEXT NOT NULL DEFAULT '',
  owner       TEXT NOT NULL DEFAULT '',
  area        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── LAND CHECKS ───
CREATE TABLE land_checks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id      UUID NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
  type           check_type NOT NULL,
  status         check_status NOT NULL DEFAULT 'pending',
  request_date   DATE,
  response_date  DATE,
  payment_proof  TEXT DEFAULT '',          -- description: "Bonifico €35", "PagoPA €16"
  document_url   TEXT DEFAULT '',          -- Supabase Storage path or filename
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ───
CREATE INDEX idx_land_parcels_project ON land_parcels(project_id);
CREATE INDEX idx_land_checks_parcel   ON land_checks(parcel_id);
CREATE INDEX idx_land_checks_type     ON land_checks(type);
CREATE INDEX idx_land_checks_status   ON land_checks(status);

-- ─── AUTO-UPDATE TRIGGERS ───
CREATE TRIGGER trg_land_parcels_updated
  BEFORE UPDATE ON land_parcels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_land_checks_updated
  BEFORE UPDATE ON land_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_checks  ENABLE ROW LEVEL SECURITY;

-- Authenticated access
CREATE POLICY "Allow all for authenticated" ON land_parcels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON land_checks  FOR ALL USING (true) WITH CHECK (true);

-- Anon access (development / prototype)
CREATE POLICY "Allow anon read"   ON land_parcels FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write"  ON land_parcels FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON land_parcels FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON land_parcels FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon read"   ON land_checks FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon write"  ON land_checks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON land_checks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON land_checks FOR DELETE TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA – Parcels for Ascoli Wind (project a1...001)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO land_parcels (id, project_id, foglio, particella, owner, area) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '12', '234', 'Rossi Mario',       '12.500 m²'),
  ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '12', '235', 'Bianchi Anna',      '8.200 m²'),
  ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '13', '101', 'Comune di Ascoli',  '15.800 m²');

-- Parcels for Genzano 1 Wind (project a1...004)
INSERT INTO land_parcels (id, project_id, foglio, particella, owner, area) VALUES
  ('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', '7',  '88',  'De Luca Giuseppe',  '22.000 m²'),
  ('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', '7',  '89',  'Ferrara Lucia',     '9.300 m²');

-- Parcels for Foggia Agri-PV (project a1...006)
INSERT INTO land_parcels (id, project_id, foglio, particella, owner, area) VALUES
  ('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', '22', '401', 'Esposito Paolo',    '45.000 m²'),
  ('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', '22', '402', 'Romano Carla',      '31.500 m²'),
  ('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', '23', '10',  'Demanio Comunale',  '52.000 m²');

-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA – Checks for each parcel
-- ═══════════════════════════════════════════════════════════════════════

-- Ascoli parcel 1 (F.12 P.234) – all checks present, CDU done, usi done, fuoco pending
INSERT INTO land_checks (parcel_id, type, status, request_date, response_date, payment_proof, document_url) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'CDU',         'done',        '2026-01-12', '2026-01-28', 'Bonifico €35,00',  'CDU_F12_P234.pdf'),
  ('b2000000-0000-0000-0000-000000000001', 'usi_civici',  'done',        '2026-01-15', '2026-02-10', 'PagoPA €16,00',    'UsiCivici_F12_P234.pdf'),
  ('b2000000-0000-0000-0000-000000000001', 'aree_fuoco',  'pending',     NULL,         NULL,         '',                 '');

-- Ascoli parcel 2 (F.12 P.235) – CDU done, usi in progress, fuoco done
INSERT INTO land_checks (parcel_id, type, status, request_date, response_date, payment_proof, document_url) VALUES
  ('b2000000-0000-0000-0000-000000000002', 'CDU',         'done',        '2026-01-12', '2026-01-30', 'Bonifico €35,00',  'CDU_F12_P235.pdf'),
  ('b2000000-0000-0000-0000-000000000002', 'usi_civici',  'in_progress', '2026-02-15', NULL,         'PagoPA €16,00',    'Richiesta_UsiCivici.pdf'),
  ('b2000000-0000-0000-0000-000000000002', 'aree_fuoco',  'done',        '2026-01-20', '2026-02-05', '',                 'Fuoco_F12_P235.pdf');

-- Ascoli parcel 3 (F.13 P.101) – CDU in progress, rest pending
INSERT INTO land_checks (parcel_id, type, status, request_date, response_date, payment_proof, document_url) VALUES
  ('b2000000-0000-0000-0000-000000000003', 'CDU',         'in_progress', '2026-02-20', NULL,         'Bonifico €35,00',  ''),
  ('b2000000-0000-0000-0000-000000000003', 'usi_civici',  'pending',     NULL,         NULL,         '',                 ''),
  ('b2000000-0000-0000-0000-000000000003', 'aree_fuoco',  'pending',     NULL,         NULL,         '',                 '');

-- Genzano parcel 1 – some checks
INSERT INTO land_checks (parcel_id, type, status, request_date, response_date, payment_proof, document_url) VALUES
  ('b2000000-0000-0000-0000-000000000004', 'CDU',         'done',        '2025-11-10', '2025-12-01', 'Bonifico €35,00',  'CDU_F7_P88.pdf'),
  ('b2000000-0000-0000-0000-000000000004', 'usi_civici',  'pending',     NULL,         NULL,         '',                 ''),
  ('b2000000-0000-0000-0000-000000000004', 'aree_fuoco',  'pending',     NULL,         NULL,         '',                 '');

-- Foggia parcel 1 – usi civici in progress
INSERT INTO land_checks (parcel_id, type, status, request_date, response_date, payment_proof, document_url) VALUES
  ('b2000000-0000-0000-0000-000000000006', 'CDU',         'done',        '2025-12-05', '2025-12-20', 'Bonifico €35,00',  'CDU_F22_P401.pdf'),
  ('b2000000-0000-0000-0000-000000000006', 'usi_civici',  'in_progress', '2026-01-10', NULL,         'PagoPA €16,00',    ''),
  ('b2000000-0000-0000-0000-000000000006', 'aree_fuoco',  'done',        '2025-12-10', '2026-01-05', '',                 'Fuoco_F22_P401.pdf');
