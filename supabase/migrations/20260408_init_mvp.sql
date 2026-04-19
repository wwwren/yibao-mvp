create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'elder',
  display_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.consultation_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  symptom text,
  encounter_status text not null default 'SYMPTOM_INTAKE',
  delegation_mode text not null default 'self',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  role text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  hospital_id text,
  hospital_name text,
  department text,
  doctor_name text,
  appointment_time text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.scene_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  event_type text not null,
  encounter_status text,
  location_zone text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.delegate_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  delegate_type text not null,
  delegate_name text,
  relation text,
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);
