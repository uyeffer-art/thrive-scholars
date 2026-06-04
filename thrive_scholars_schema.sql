-- ============================================================
-- THRIVE SCHOLARS MENTORSHIP PLATFORM
-- Supabase / PostgreSQL Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "vector";          -- pgvector for AI matching


-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('scholar', 'volunteer', 'staff', 'admin');

create type program_type as enum (
  'mentorship_year',    -- long-term assigned relationship
  'coffee_chat',        -- one-off casual conversation
  'mock_interview',     -- one-off interview prep
  'resume_review'       -- one-off document review
);

create type match_status as enum (
  'suggested',          -- AI generated, awaiting PM review
  'pending_approval',   -- PM reviewing
  'approved',           -- PM approved, awaiting volunteer/scholar acceptance
  'active',             -- both parties accepted
  'completed',          -- program concluded successfully
  'declined',           -- one party declined
  'timed_out',          -- no response within timeout window
  'cancelled'           -- cancelled by staff
);

create type interaction_status as enum (
  'scheduled',
  'held',
  'missed',
  'cancelled'
);

create type volunteer_status as enum (
  'active',
  'inactive',           -- auto-set after X days of no activity
  'paused',             -- volunteer-requested pause
  'retired'
);

create type training_status as enum (
  'not_started',
  'in_progress',
  'completed'
);


-- ============================================================
-- CORE USER TABLES
-- ============================================================

-- All authenticated users land here (linked to Supabase auth.users)
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                user_role not null,
  first_name          text not null,
  last_name           text not null,
  email               text not null unique,
  phone               text,
  preferred_email     text,             -- for corporate volunteers who need personal email
  avatar_url          text,
  city                text,
  state               text,
  timezone            text default 'America/New_York',
  sf_contact_id       text unique,      -- Salesforce Contact record ID
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---- SCHOLARS ----
create table public.scholars (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null unique references public.profiles(id) on delete cascade,

  -- Academic / program info
  cohort_year         int not null,           -- year they entered Thrive (defines their 6-yr arc)
  high_school         text,
  college             text,
  college_grad_year   int,
  grad_school         text,
  current_stage       text,                   -- 'pre-college', 'college-1', ..., 'post-grad'

  -- Identity & interests (used in matching)
  first_gen           boolean default false,
  race_ethnicity      text[],                 -- multi-select array
  gender              text,
  career_interests    text[],
  personal_interests  text[],
  geographic_preference text,                 -- city/region they want to connect in

  -- AI matching
  embedding           vector(1536),           -- OpenAI text-embedding-3-small output
  embedding_updated_at timestamptz,

  -- SF
  sf_program_enrollment_id text,              -- SF Program Enrollment record

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---- VOLUNTEERS ----
create table public.volunteers (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null unique references public.profiles(id) on delete cascade,

  -- Employment
  employer            text,
  job_title           text,
  industry            text,
  years_experience    int,
  linkedin_url        text,

  -- Corporate partner info
  is_corporate_partner      boolean default false,
  corporate_partner_name    text,
  corporate_partner_priority int default 0,  -- higher = more preferred in matching

  -- Alma mater (used in matching)
  undergrad_institution text,
  grad_institution      text,

  -- Identity (used in matching)
  race_ethnicity        text[],
  gender                text,
  first_gen             boolean default false,

  -- Availability & capacity
  status                volunteer_status not null default 'active',
  max_concurrent_matches int default 2,
  available_program_types program_type[],    -- which programs they'll do
  geographic_preference   text,
  cal_booking_url         text,              -- Cal.com or Calendly link

  -- Engagement tracking
  total_matches_completed int default 0,
  last_active_at          timestamptz,
  inactivity_nudge_sent_at timestamptz,
  is_star_volunteer       boolean default false,
  star_notes              text,

  -- AI matching
  embedding               vector(1536),
  embedding_updated_at    timestamptz,

  -- SF
  sf_volunteer_id         text,              -- SF custom volunteer record if applicable

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);


-- ============================================================
-- PROGRAMS
-- A program is a structured offering (e.g. "Mentorship Year 2025-26")
-- that contains many matches of a given type.
-- ============================================================

create table public.programs (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  program_type        program_type not null,
  description         text,
  is_active           boolean default true,

  -- Matching config: weights used by the AI scorer for this program
  -- Stored as JSONB so staff can tune without a deploy
  -- e.g. {"career": 0.4, "identity": 0.2, "geography": 0.2, "alma_mater": 0.1, "engagement": 0.1}
  matching_weights    jsonb not null default '{
    "career": 0.35,
    "identity": 0.20,
    "geography": 0.15,
    "alma_mater": 0.15,
    "engagement": 0.15
  }'::jsonb,

  -- Timeout: days before an unanswered match suggestion escalates
  match_timeout_days  int default 5,

  -- Corporate partner slot limits (per partner per program cycle)
  -- e.g. {"Deloitte": 10, "McKinsey": 5}
  partner_slot_limits jsonb default '{}'::jsonb,

  start_date          date,
  end_date            date,

  -- SF
  sf_program_id       text,               -- SF Program record ID

  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- MATCHES
-- The core object. One match = one scholar <-> one volunteer
-- within one program.
-- ============================================================

create table public.matches (
  id                  uuid primary key default uuid_generate_v4(),
  program_id          uuid not null references public.programs(id),
  scholar_id          uuid not null references public.scholars(id),
  volunteer_id        uuid not null references public.volunteers(id),

  status              match_status not null default 'suggested',

  -- AI scoring (snapshot at time of suggestion)
  ai_score            numeric(5,4),       -- 0.0000–1.0000 composite weighted score
  score_breakdown     jsonb,              -- {"career": 0.82, "identity": 0.61, ...}
  match_rank          int,               -- rank among suggestions for this scholar (1 = top)

  -- PM review
  reviewed_by         uuid references public.profiles(id),
  reviewed_at         timestamptz,
  pm_notes            text,              -- why PM made this call
  manually_selected   boolean default false,  -- true if PM overrode AI suggestion

  -- Scholar request context (what they asked for)
  scholar_request     text,
  request_criteria    jsonb,             -- {"priority": "career", "secondary": "identity"}

  -- Communication tracking
  match_email_sent_at     timestamptz,
  volunteer_accepted_at   timestamptz,
  scholar_accepted_at     timestamptz,
  timeout_at              timestamptz,   -- computed: match_email_sent_at + timeout_days

  -- Completion
  completed_at        timestamptz,
  completion_notes    text,

  -- SF sync
  sf_match_record_id  text unique,       -- Salesforce Mentorship_Match__c ID
  sf_synced_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- A scholar can only have one active match per program
  unique (program_id, scholar_id, volunteer_id)
);

-- Index for common PM queries
create index idx_matches_status on public.matches(status);
create index idx_matches_scholar on public.matches(scholar_id);
create index idx_matches_volunteer on public.matches(volunteer_id);
create index idx_matches_program on public.matches(program_id);


-- ============================================================
-- INTERACTIONS
-- Every meeting, conversation, or touchpoint between a matched
-- scholar and volunteer. This is the primary record that syncs
-- to Salesforce against the scholar's case plan.
-- ============================================================

create table public.interactions (
  id                  uuid primary key default uuid_generate_v4(),
  match_id            uuid not null references public.matches(id),
  scholar_id          uuid not null references public.scholars(id),
  volunteer_id        uuid not null references public.volunteers(id),
  program_type        program_type not null,

  status              interaction_status not null default 'scheduled',

  -- Scheduling (populated from Cal.com webhook)
  scheduled_at        timestamptz,
  duration_minutes    int,
  meeting_url         text,              -- Zoom/Meet link from Cal.com
  cal_booking_uid     text unique,       -- Cal.com booking reference

  -- Confirmation
  held_at             timestamptz,       -- set when Cal.com fires "meeting ended" or PM confirms
  confirmed_by        text,              -- 'cal_webhook' | 'scholar' | 'volunteer' | 'staff'

  -- Notes & feedback
  scholar_notes       text,
  volunteer_notes     text,
  scholar_rating      int check (scholar_rating between 1 and 5),
  volunteer_rating    int check (volunteer_rating between 1 and 5),
  feedback_form_sent_at timestamptz,

  -- SF sync (one record per interaction -> SF Interaction__c linked to scholar Case)
  sf_interaction_id   text unique,
  sf_case_id          text,              -- SF Case plan record this links to
  sf_synced_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_interactions_match on public.interactions(match_id);
create index idx_interactions_scholar on public.interactions(scholar_id);
create index idx_interactions_volunteer on public.interactions(volunteer_id);
create index idx_interactions_status on public.interactions(status);
create index idx_interactions_held_at on public.interactions(held_at);


-- ============================================================
-- TRAINING MODULES
-- Thrive-managed content library. Modules are tagged by
-- program_type and audience so the platform can auto-serve
-- the right prep before a match interaction.
-- ============================================================

create table public.training_modules (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  description         text,
  audience            user_role not null,         -- 'volunteer' or 'scholar'
  program_types       program_type[],             -- which interaction types this applies to
  content_url         text,                       -- Supabase Storage URL or external link
  content_type        text,                       -- 'video' | 'article' | 'pdf' | 'quiz'
  is_required         boolean default true,
  order_index         int default 0,              -- display order
  quiz_questions      jsonb,                      -- optional comprehension check
  is_active           boolean default true,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Tracks each user's progress through each module
create table public.training_completions (
  id                  uuid primary key default uuid_generate_v4(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  module_id           uuid not null references public.training_modules(id),
  status              training_status not null default 'not_started',
  started_at          timestamptz,
  completed_at        timestamptz,
  quiz_score          int,                        -- 0–100
  quiz_passed         boolean,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (profile_id, module_id)
);


-- ============================================================
-- AUTOMATION LOG
-- Tracks every automated event (emails sent, nudges, SF syncs,
-- timeouts) for debugging and audit. Make.com scenarios write
-- here via a webhook endpoint.
-- ============================================================

create table public.automation_log (
  id                  uuid primary key default uuid_generate_v4(),
  event_type          text not null,              -- 'match_email_sent' | 'nudge_sent' | 'sf_sync' | 'timeout_triggered' | etc.
  entity_type         text,                       -- 'match' | 'interaction' | 'volunteer'
  entity_id           uuid,
  triggered_by        text,                       -- 'make_scenario' | 'system' | 'staff'
  payload             jsonb,                      -- full event data for debugging
  success             boolean not null default true,
  error_message       text,
  created_at          timestamptz not null default now()
);

create index idx_automation_log_entity on public.automation_log(entity_type, entity_id);
create index idx_automation_log_event on public.automation_log(event_type);
create index idx_automation_log_created on public.automation_log(created_at desc);


-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Active matches with full scholar + volunteer + program context
create view public.v_active_matches as
select
  m.id                        as match_id,
  m.status,
  m.ai_score,
  m.pm_notes,
  m.manually_selected,
  m.match_email_sent_at,
  m.timeout_at,
  m.sf_match_record_id,
  p.name                      as program_name,
  p.program_type,
  -- Scholar
  sp.first_name || ' ' || sp.last_name  as scholar_name,
  sp.email                    as scholar_email,
  s.cohort_year,
  s.current_stage,
  s.career_interests,
  -- Volunteer
  vp.first_name || ' ' || vp.last_name  as volunteer_name,
  vp.email                    as volunteer_email,
  v.employer,
  v.job_title,
  v.is_corporate_partner,
  v.corporate_partner_name,
  v.is_star_volunteer,
  v.total_matches_completed,
  -- Reviewer
  rp.first_name || ' ' || rp.last_name  as reviewed_by_name,
  m.reviewed_at,
  m.created_at
from public.matches m
join public.programs p           on p.id = m.program_id
join public.scholars s           on s.id = m.scholar_id
join public.profiles sp          on sp.id = s.profile_id
join public.volunteers v         on v.id = m.volunteer_id
join public.profiles vp          on vp.id = v.profile_id
left join public.profiles rp     on rp.id = m.reviewed_by
where m.status in ('suggested', 'pending_approval', 'approved', 'active');

-- Volunteer activity dashboard view
create view public.v_volunteer_activity as
select
  v.id                        as volunteer_id,
  p.first_name || ' ' || p.last_name  as volunteer_name,
  p.email,
  v.employer,
  v.corporate_partner_name,
  v.is_corporate_partner,
  v.is_star_volunteer,
  v.status,
  v.max_concurrent_matches,
  v.total_matches_completed,
  v.last_active_at,
  v.available_program_types,
  count(m.id) filter (where m.status = 'active')      as active_matches,
  count(m.id) filter (where m.status = 'completed')   as completed_matches,
  count(i.id) filter (where i.status = 'held')        as total_meetings_held,
  max(i.held_at)                                      as last_meeting_held_at
from public.volunteers v
join public.profiles p           on p.id = v.profile_id
left join public.matches m       on m.volunteer_id = v.id
left join public.interactions i  on i.volunteer_id = v.id
group by v.id, p.first_name, p.last_name, p.email,
         v.employer, v.corporate_partner_name, v.is_corporate_partner,
         v.is_star_volunteer, v.status, v.max_concurrent_matches,
         v.total_matches_completed, v.last_active_at, v.available_program_types;

-- Scholar journey view — full 6-year arc
create view public.v_scholar_journey as
select
  s.id                        as scholar_id,
  p.first_name || ' ' || p.last_name  as scholar_name,
  p.email,
  s.cohort_year,
  s.current_stage,
  s.college,
  s.career_interests,
  count(distinct m.id)                                as total_matches,
  count(distinct m.id) filter (where m.status = 'completed') as completed_matches,
  count(distinct i.id) filter (where i.status = 'held')      as total_meetings_held,
  array_agg(distinct prog.program_type)               as program_types_experienced,
  max(i.held_at)                                      as last_interaction_at,
  s.sf_program_enrollment_id,
  s.created_at                as enrolled_at
from public.scholars s
join public.profiles p           on p.id = s.profile_id
left join public.matches m       on m.scholar_id = s.id
left join public.programs prog   on prog.id = m.program_id
left join public.interactions i  on i.scholar_id = s.id
group by s.id, p.first_name, p.last_name, p.email,
         s.cohort_year, s.current_stage, s.college,
         s.career_interests, s.sf_program_enrollment_id, s.created_at;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all sensitive tables
alter table public.profiles           enable row level security;
alter table public.scholars           enable row level security;
alter table public.volunteers         enable row level security;
alter table public.programs           enable row level security;
alter table public.matches            enable row level security;
alter table public.interactions       enable row level security;
alter table public.training_modules   enable row level security;
alter table public.training_completions enable row level security;
alter table public.automation_log     enable row level security;

-- Helper: get role of current user
create or replace function public.current_user_role()
returns user_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: is current user staff or admin
create or replace function public.is_staff()
returns boolean
language sql stable
as $$
  select role in ('staff', 'admin') from public.profiles where id = auth.uid();
$$;

-- ---- PROFILES ----
-- Users can read and update their own profile.
-- Staff/admin can read all profiles.
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles: staff insert"
  on public.profiles for insert
  with check (public.is_staff() or id = auth.uid());

-- ---- SCHOLARS ----
-- Scholars can only see their own record.
-- Volunteers cannot see scholar records at all (they see match context only).
-- Staff/admin can see all.
create policy "scholars: own read"
  on public.scholars for select
  using (profile_id = auth.uid() or public.is_staff());

create policy "scholars: own update"
  on public.scholars for update
  using (profile_id = auth.uid());

create policy "scholars: staff insert"
  on public.scholars for insert
  with check (public.is_staff());

-- ---- VOLUNTEERS ----
-- Volunteers can see and update their own record.
-- Staff/admin can see all.
-- Scholars cannot see volunteer records directly.
create policy "volunteers: own read"
  on public.volunteers for select
  using (profile_id = auth.uid() or public.is_staff());

create policy "volunteers: own update"
  on public.volunteers for update
  using (profile_id = auth.uid());

create policy "volunteers: staff insert"
  on public.volunteers for insert
  with check (public.is_staff());

-- ---- MATCHES ----
-- A user can see matches they are a party to, or if they are staff.
create policy "matches: parties and staff read"
  on public.matches for select
  using (
    public.is_staff()
    or scholar_id in (select id from public.scholars where profile_id = auth.uid())
    or volunteer_id in (select id from public.volunteers where profile_id = auth.uid())
  );

create policy "matches: staff write"
  on public.matches for all
  using (public.is_staff());

-- ---- INTERACTIONS ----
-- Same pattern as matches.
create policy "interactions: parties and staff read"
  on public.interactions for select
  using (
    public.is_staff()
    or scholar_id in (select id from public.scholars where profile_id = auth.uid())
    or volunteer_id in (select id from public.volunteers where profile_id = auth.uid())
  );

create policy "interactions: staff write"
  on public.interactions for all
  using (public.is_staff());

-- ---- TRAINING ----
-- Anyone can read active modules.
-- Users can only see their own completions.
-- Staff can see all.
create policy "training_modules: all read active"
  on public.training_modules for select
  using (is_active = true or public.is_staff());

create policy "training_modules: staff write"
  on public.training_modules for all
  using (public.is_staff());

create policy "training_completions: own read"
  on public.training_completions for select
  using (profile_id = auth.uid() or public.is_staff());

create policy "training_completions: own write"
  on public.training_completions for insert
  with check (profile_id = auth.uid());

create policy "training_completions: own update"
  on public.training_completions for update
  using (profile_id = auth.uid());

-- ---- AUTOMATION LOG ----
-- Staff only.
create policy "automation_log: staff only"
  on public.automation_log for all
  using (public.is_staff());

-- ---- PROGRAMS ----
-- All authenticated users can read programs.
-- Only staff can write.
create policy "programs: all read"
  on public.programs for select
  using (auth.uid() is not null);

create policy "programs: staff write"
  on public.programs for all
  using (public.is_staff());


-- ============================================================
-- UPDATED_AT TRIGGER
-- Auto-updates the updated_at column on any row change.
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_scholars_updated_at
  before update on public.scholars
  for each row execute function public.handle_updated_at();

create trigger trg_volunteers_updated_at
  before update on public.volunteers
  for each row execute function public.handle_updated_at();

create trigger trg_programs_updated_at
  before update on public.programs
  for each row execute function public.handle_updated_at();

create trigger trg_matches_updated_at
  before update on public.matches
  for each row execute function public.handle_updated_at();

create trigger trg_interactions_updated_at
  before update on public.interactions
  for each row execute function public.handle_updated_at();

create trigger trg_training_modules_updated_at
  before update on public.training_modules
  for each row execute function public.handle_updated_at();

create trigger trg_training_completions_updated_at
  before update on public.training_completions
  for each row execute function public.handle_updated_at();


-- ============================================================
-- SEED DATA — dev/staging only, delete before production
-- ============================================================

-- Seed program types
insert into public.programs (name, program_type, description, matching_weights, match_timeout_days) values
(
  'Mentorship Year 2025–26',
  'mentorship_year',
  'Year-long 1:1 mentoring relationship for Thrive scholars',
  '{"career": 0.35, "identity": 0.20, "geography": 0.15, "alma_mater": 0.15, "engagement": 0.15}',
  7
),
(
  'Coffee Chats — Fall 2025',
  'coffee_chat',
  'One-off 30-min casual conversations with professionals',
  '{"career": 0.40, "identity": 0.15, "geography": 0.25, "alma_mater": 0.10, "engagement": 0.10}',
  5
),
(
  'Mock Interviews — Fall 2025',
  'mock_interview',
  'One-off 45-min mock interview prep sessions',
  '{"career": 0.50, "identity": 0.10, "geography": 0.15, "alma_mater": 0.10, "engagement": 0.15}',
  5
),
(
  'Resume Reviews — Fall 2025',
  'resume_review',
  'One-off resume review and feedback sessions',
  '{"career": 0.55, "identity": 0.05, "geography": 0.10, "alma_mater": 0.10, "engagement": 0.20}',
  5
);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
