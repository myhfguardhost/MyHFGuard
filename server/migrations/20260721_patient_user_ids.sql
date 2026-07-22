begin;

alter table public.profiles
  add column if not exists assigned_user_id text,
  add column if not exists profile_completed boolean not null default false,
  add column if not exists baseline_locked boolean not null default false,
  add column if not exists target_steps integer not null default 3000;

alter table public.patients
  add column if not exists assigned_user_id text;

-- Admin-created accounts are allowed to exist before patients complete their profile.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'dob'
  ) then
    execute 'alter table public.patients alter column dob drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'date_of_birth'
  ) then
    execute 'alter table public.patients alter column date_of_birth drop not null';
  end if;
end $$;

create unique index if not exists profiles_assigned_user_id_unique
  on public.profiles (lower(assigned_user_id))
  where assigned_user_id is not null;

create unique index if not exists patients_assigned_user_id_unique
  on public.patients (lower(assigned_user_id))
  where assigned_user_id is not null;

-- Give every existing patient a deterministic login ID without changing passwords.
insert into public.profiles (
  user_id,
  assigned_user_id,
  profile_completed,
  baseline_locked,
  target_steps
)
select
  u.id,
  'patient' || left(replace(u.id::text, '-', ''), 8),
  false,
  false,
  3000
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') = 'patient'
on conflict (user_id) do update
set assigned_user_id = coalesce(
  public.profiles.assigned_user_id,
  excluded.assigned_user_id
);

update public.patients p
set assigned_user_id = pr.assigned_user_id
from public.profiles pr
where pr.user_id = p.patient_id
  and p.assigned_user_id is null;

-- Automatically create pending rows when an administrator creates a patient login.
create or replace function public.handle_new_patient_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_user_id text;
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') <> 'patient' then
    return new;
  end if;

  generated_user_id := lower(split_part(coalesce(new.email, ''), '@', 1));

  if generated_user_id = '' then
    generated_user_id := 'patient' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.profiles (
    user_id,
    assigned_user_id,
    profile_completed,
    baseline_locked,
    target_steps
  )
  values (
    new.id,
    generated_user_id,
    false,
    false,
    3000
  )
  on conflict (user_id) do update
  set assigned_user_id = coalesce(
    public.profiles.assigned_user_id,
    excluded.assigned_user_id
  );

  insert into public.patients (
    patient_id,
    assigned_user_id
  )
  values (
    new.id,
    generated_user_id
  )
  on conflict (patient_id) do update
  set assigned_user_id = coalesce(
    public.patients.assigned_user_id,
    excluded.assigned_user_id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_patient_created on auth.users;

create trigger on_auth_patient_created
after insert on auth.users
for each row
execute function public.handle_new_patient_account();

commit;
