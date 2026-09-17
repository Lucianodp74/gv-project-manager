-- GRUPPO VISCONTI – TERNA DEADLINES V3
-- Corrects the authorization-start deadline to use working days and
-- the acceptance date as the legal base date for AT/AAT connections.
-- Applied to Supabase production before committing this migration.

CREATE OR REPLACE FUNCTION public.add_working_days(start_date date, working_days integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result_date date := start_date;
  remaining integer := GREATEST(COALESCE(working_days, 0), 0);
BEGIN
  WHILE remaining > 0 LOOP
    result_date := result_date + 1;
    IF EXTRACT(ISODOW FROM result_date) BETWEEN 1 AND 5 THEN
      remaining := remaining - 1;
    END IF;
  END LOOP;
  RETURN result_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_terna_connection_deadlines()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.request_date IS NOT NULL THEN
    INSERT INTO public.connection_deadlines(practice_id,title,due_date,status,notes,auto_generated,rule_key,base_date)
    VALUES (NEW.id,'Elaborazione preventivo STMG',NEW.request_date + 90,'open',
      'Termine di riferimento di 90 giorni; verificare sempre la documentazione della pratica e le eventuali sospensioni/integrazioni.',
      true,'terna_stmg_processing',NEW.request_date)
    ON CONFLICT (practice_id,rule_key) DO UPDATE
      SET due_date=EXCLUDED.due_date,base_date=EXCLUDED.base_date,title=EXCLUDED.title,notes=EXCLUDED.notes,auto_generated=true
      WHERE public.connection_deadlines.status NOT IN ('done','completed','cancelled');
  END IF;

  IF NEW.pto_received_date IS NOT NULL THEN
    INSERT INTO public.connection_deadlines(practice_id,title,due_date,status,notes,auto_generated,rule_key,base_date)
    VALUES (NEW.id,'Accettazione preventivo STMG',NEW.pto_received_date + 120,'open',
      'Terna indica l’accettazione del preventivo entro 120 giorni dalla data di ricevimento; verificare sempre la data effettiva e le condizioni della pratica.',
      true,'terna_stmg_acceptance',NEW.pto_received_date)
    ON CONFLICT (practice_id,rule_key) DO UPDATE
      SET due_date=EXCLUDED.due_date,base_date=EXCLUDED.base_date,title=EXCLUDED.title,notes=EXCLUDED.notes,auto_generated=true
      WHERE public.connection_deadlines.status NOT IN ('done','completed','cancelled');
  END IF;

  IF NEW.accepted_at IS NOT NULL AND NEW.voltage_level IN ('AT','AAT') THEN
    INSERT INTO public.connection_deadlines(practice_id,title,due_date,status,notes,auto_generated,rule_key,base_date)
    VALUES (
      NEW.id,
      'Avvio procedimento autorizzativo',
      public.add_working_days(NEW.accepted_at, CASE WHEN NEW.voltage_level='AAT' THEN 180 ELSE 120 END),
      'open',
      CASE WHEN NEW.voltage_level='AAT'
        THEN 'Termine di riferimento: 180 giorni lavorativi dalla data di accettazione del preventivo per connessioni AAT.'
        ELSE 'Termine di riferimento: 120 giorni lavorativi dalla data di accettazione del preventivo per connessioni AT.'
      END,
      true,
      'terna_authorization_start_'||lower(NEW.voltage_level),
      NEW.accepted_at
    )
    ON CONFLICT (practice_id,rule_key) DO UPDATE
      SET due_date=EXCLUDED.due_date,base_date=EXCLUDED.base_date,title=EXCLUDED.title,notes=EXCLUDED.notes,auto_generated=true
      WHERE public.connection_deadlines.status NOT IN ('done','completed','cancelled');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_terna_connection_deadlines_delete_invalid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.voltage_level IS NULL THEN
    UPDATE public.connection_deadlines
    SET status='cancelled'
    WHERE practice_id=NEW.id
      AND rule_key IN ('terna_authorization_start_at','terna_authorization_start_aat','terna_authorization_at','terna_authorization_aat')
      AND status NOT IN ('done','completed','cancelled');
  END IF;
  RETURN NEW;
END;
$$;
