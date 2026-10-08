-- Add the Acustica role to every existing project that does not already have it.
insert into public.project_external_professionals (project_id, professional_type, assigned)
select p.id, 'Acustica', false
from public.projects p
where not exists (
  select 1
  from public.project_external_professionals e
  where e.project_id = p.id
    and lower(trim(e.professional_type)) = lower('Acustica')
);
