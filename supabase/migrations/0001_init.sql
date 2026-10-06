-- Sabiwela 0001: tables, row-level security, signup trigger, audio bucket

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  parent_topic_id uuid references public.topics(id) on delete set null,
  name text not null,
  sort_order int not null default 0,
  expected_concepts jsonb not null default '[]'::jsonb,
  understanding_level int check (understanding_level between 0 and 100),
  status text not null default 'not_studied',
  first_studied_at timestamptz,
  last_studied_at timestamptz,
  next_review_at timestamptz,
  review_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int
);

create table public.explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  study_session_id uuid references public.study_sessions(id) on delete set null,
  kind text not null default 'initial' check (kind in ('initial','review','followup')),
  input_mode text not null default 'voice' check (input_mode in ('voice','text')),
  audio_path text,
  transcript text,
  edited_transcript text,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table public.ai_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  explanation_id uuid not null references public.explanations(id) on delete cascade,
  score int not null check (score between 0 and 100),
  strengths jsonb not null default '[]'::jsonb,
  missing_concepts jsonb not null default '[]'::jsonb,
  misconceptions jsonb not null default '[]'::jsonb,
  feedback text,
  revisit text,
  followups jsonb not null default '[]'::jsonb,
  recommended_action text,
  next_review_at timestamptz,
  provider text,
  model text,
  prompt_version text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kp_total int not null default 0,
  streak_current int not null default 0,
  streak_best int not null default 0,
  freezes_left int not null default 2,
  freeze_month text,
  last_active_date date
);

create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.ai_assessments(id) on delete set null,
  kp int not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  house_sessions_used int not null default 0,
  primary key (user_id, usage_date)
);

create table public.user_ai_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  key_ciphertext text not null,
  key_last4 text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create index topics_course_idx on public.topics (course_id);
create index topics_review_idx on public.topics (user_id, next_review_at);
create index explanations_topic_idx on public.explanations (topic_id);
create index assessments_explanation_idx on public.ai_assessments (explanation_id);

-- Row-level security: every user sees only their own rows
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['courses','topics','study_sessions','explanations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
  -- Written only by the server (secret key), readable by their owner
  foreach t in array array['ai_assessments','user_stats','point_events','usage_daily'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read own rows" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- No policies: only the server's secret key can read or write stored AI keys
alter table public.user_ai_keys enable row level security;

-- Create a profile and stats row when someone signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private bucket for voice recordings; each user can only touch their own folder
insert into storage.buckets (id, name, public) values ('explanations', 'explanations', false)
  on conflict (id) do nothing;

create policy "own audio read" on storage.objects for select to authenticated
  using (bucket_id = 'explanations' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own audio insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'explanations' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own audio delete" on storage.objects for delete to authenticated
  using (bucket_id = 'explanations' and (storage.foldername(name))[1] = (select auth.uid())::text);
