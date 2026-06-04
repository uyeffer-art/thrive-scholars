-- ============================================================
-- THRIVE SCHOLARS — PGVECTOR HELPER FUNCTION
-- Run this in Supabase SQL Editor AFTER the main schema.
-- This is the function the matching engine calls via db.rpc().
-- ============================================================

create or replace function public.match_volunteers_by_embedding(
  query_embedding    vector(1536),
  program_type_filter program_type,
  exclude_volunteer_ids uuid[],
  match_count        int default 30
)
returns table (
  -- Volunteer core
  volunteer_id              uuid,
  profile_id                uuid,
  first_name                text,
  last_name                 text,
  email                     text,
  -- Professional
  employer                  text,
  job_title                 text,
  industry                  text,
  -- Partner & status flags
  is_corporate_partner      boolean,
  corporate_partner_name    text,
  is_star_volunteer         boolean,
  total_matches_completed   int,
  available_program_types   program_type[],
  cal_booking_url           text,
  -- Matching fields
  undergrad_institution     text,
  grad_institution          text,
  race_ethnicity            text[],
  gender                    text,
  first_gen                 boolean,
  geographic_preference     text,
  -- Similarity score (cosine, 0-1, higher = more similar)
  similarity                float
)
language sql stable
as $$
  select
    v.id                          as volunteer_id,
    p.id                          as profile_id,
    p.first_name,
    p.last_name,
    p.email,
    v.employer,
    v.job_title,
    v.industry,
    v.is_corporate_partner,
    v.corporate_partner_name,
    v.is_star_volunteer,
    v.total_matches_completed,
    v.available_program_types,
    v.cal_booking_url,
    v.undergrad_institution,
    v.grad_institution,
    v.race_ethnicity,
    v.gender,
    v.first_gen,
    v.geographic_preference,
    -- cosine similarity: 1 - cosine distance
    -- pgvector's <=> operator returns cosine distance (0=identical, 2=opposite)
    1 - (v.embedding <=> query_embedding) as similarity
  from public.volunteers v
  join public.profiles p on p.id = v.profile_id
  where
    -- Must be active
    v.status = 'active'
    -- Must have an embedding (only volunteers who've completed profile)
    and v.embedding is not null
    -- Must offer this program type
    and program_type_filter = any(v.available_program_types)
    -- Exclude volunteers already matched to this scholar in this program
    and v.id <> all(exclude_volunteer_ids)
    -- Must have capacity (not at max concurrent matches)
    and (
      select count(*) from public.matches m
      where m.volunteer_id = v.id
        and m.status in ('approved', 'active')
    ) < v.max_concurrent_matches
  order by v.embedding <=> query_embedding  -- ascending distance = descending similarity
  limit match_count;
$$;

-- ============================================================
-- EMBEDDING REFRESH HELPER
-- Call this when a volunteer updates their profile to
-- regenerate their embedding via the Edge Function.
-- The Edge Function itself handles the OpenAI call;
-- this function just marks embeddings as stale.
-- ============================================================

create or replace function public.mark_volunteer_embedding_stale()
returns trigger
language plpgsql
as $$
begin
  -- Only invalidate if matching-relevant fields changed
  if (
    new.industry          is distinct from old.industry          or
    new.job_title         is distinct from old.job_title         or
    new.employer          is distinct from old.employer          or
    new.undergrad_institution is distinct from old.undergrad_institution or
    new.grad_institution  is distinct from old.grad_institution  or
    new.race_ethnicity    is distinct from old.race_ethnicity    or
    new.gender            is distinct from old.gender            or
    new.geographic_preference is distinct from old.geographic_preference or
    new.first_gen         is distinct from old.first_gen
  ) then
    new.embedding_updated_at = '2000-01-01'::timestamptz;  -- force stale
  end if;
  return new;
end;
$$;

create trigger trg_volunteer_embedding_stale
  before update on public.volunteers
  for each row execute function public.mark_volunteer_embedding_stale();

-- Same for scholars
create or replace function public.mark_scholar_embedding_stale()
returns trigger
language plpgsql
as $$
begin
  if (
    new.career_interests      is distinct from old.career_interests      or
    new.personal_interests    is distinct from old.personal_interests    or
    new.college               is distinct from old.college               or
    new.current_stage         is distinct from old.current_stage         or
    new.race_ethnicity        is distinct from old.race_ethnicity        or
    new.gender                is distinct from old.gender                or
    new.geographic_preference is distinct from old.geographic_preference or
    new.first_gen             is distinct from old.first_gen
  ) then
    new.embedding_updated_at = '2000-01-01'::timestamptz;
  end if;
  return new;
end;
$$;

create trigger trg_scholar_embedding_stale
  before update on public.scholars
  for each row execute function public.mark_scholar_embedding_stale();


-- ============================================================
-- APPROVE MATCH HELPER
-- Called by the PM dashboard when they approve a suggestion.
-- Creates the match record and returns the SF payload
-- that Make.com will pick up to sync to Salesforce.
-- ============================================================

create or replace function public.approve_match(
  p_scholar_id      uuid,
  p_volunteer_id    uuid,
  p_program_id      uuid,
  p_ai_score        numeric,
  p_score_breakdown jsonb,
  p_match_rank      int,
  p_pm_notes        text,
  p_manually_selected boolean,
  p_reviewer_id     uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_match_id        uuid;
  v_program         record;
  v_scholar         record;
  v_volunteer       record;
  v_timeout_at      timestamptz;
  v_result          jsonb;
begin
  -- Fetch program for timeout config
  select * into v_program from public.programs where id = p_program_id;
  select s.*, p.first_name, p.last_name, p.email
    into v_scholar
    from public.scholars s
    join public.profiles p on p.id = s.profile_id
    where s.id = p_scholar_id;
  select v.*, p.first_name, p.last_name, p.email
    into v_volunteer
    from public.volunteers v
    join public.profiles p on p.id = v.profile_id
    where v.id = p_volunteer_id;

  v_timeout_at := now() + (v_program.match_timeout_days || ' days')::interval;

  -- Upsert match record
  insert into public.matches (
    program_id, scholar_id, volunteer_id,
    status, ai_score, score_breakdown, match_rank,
    reviewed_by, reviewed_at, pm_notes, manually_selected,
    timeout_at
  ) values (
    p_program_id, p_scholar_id, p_volunteer_id,
    'approved', p_ai_score, p_score_breakdown, p_match_rank,
    p_reviewer_id, now(), p_pm_notes, p_manually_selected,
    v_timeout_at
  )
  on conflict (program_id, scholar_id, volunteer_id)
  do update set
    status           = 'approved',
    reviewed_by      = p_reviewer_id,
    reviewed_at      = now(),
    pm_notes         = p_pm_notes,
    manually_selected = p_manually_selected,
    timeout_at       = v_timeout_at
  returning id into v_match_id;

  -- Build the payload Make.com will receive via webhook
  -- to send match emails and create the SF record
  v_result := jsonb_build_object(
    'match_id',           v_match_id,
    'program_id',         p_program_id,
    'program_name',       v_program.name,
    'program_type',       v_program.program_type,
    'scholar_id',         p_scholar_id,
    'scholar_name',       v_scholar.first_name || ' ' || v_scholar.last_name,
    'scholar_email',      v_scholar.email,
    'scholar_preferred_email', v_scholar.email,
    'scholar_sf_id',      v_scholar.sf_contact_id,
    'sf_program_enrollment_id', v_scholar.sf_program_enrollment_id,
    'volunteer_id',       p_volunteer_id,
    'volunteer_name',     v_volunteer.first_name || ' ' || v_volunteer.last_name,
    'volunteer_email',    v_volunteer.email,
    'volunteer_sf_id',    v_volunteer.sf_volunteer_id,
    'cal_booking_url',    v_volunteer.cal_booking_url,
    'timeout_at',         v_timeout_at,
    'pm_notes',           p_pm_notes,
    'ai_score',           p_ai_score,
    'event_type',         'match_approved'
  );

  return v_result;
end;
$$;
