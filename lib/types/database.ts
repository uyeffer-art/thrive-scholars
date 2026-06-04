export type UserRole = 'scholar' | 'volunteer' | 'staff' | 'admin'
export type ProgramType = 'mentorship_year' | 'coffee_chat' | 'mock_interview' | 'resume_review'
export type MatchStatus =
  | 'suggested'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'completed'
  | 'declined'
  | 'timed_out'
  | 'cancelled'
export type InteractionStatus = 'scheduled' | 'held' | 'missed' | 'cancelled'
export type VolunteerStatus = 'active' | 'inactive' | 'paused' | 'retired'
export type TrainingStatus = 'not_started' | 'in_progress' | 'completed'

export interface Profile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string | null
  preferred_email: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  timezone: string
  sf_contact_id: string | null
  created_at: string
  updated_at: string
}

export interface Scholar {
  id: string
  profile_id: string
  cohort_year: number
  high_school: string | null
  college: string | null
  college_grad_year: number | null
  grad_school: string | null
  current_stage: string | null
  first_gen: boolean
  race_ethnicity: string[]
  gender: string | null
  career_interests: string[]
  personal_interests: string[]
  geographic_preference: string | null
  embedding_updated_at: string | null
  sf_program_enrollment_id: string | null
  created_at: string
  updated_at: string
}

export interface Volunteer {
  id: string
  profile_id: string
  employer: string | null
  job_title: string | null
  industry: string | null
  years_experience: number | null
  linkedin_url: string | null
  is_corporate_partner: boolean
  corporate_partner_name: string | null
  corporate_partner_priority: number
  undergrad_institution: string | null
  grad_institution: string | null
  race_ethnicity: string[]
  gender: string | null
  first_gen: boolean
  status: VolunteerStatus
  max_concurrent_matches: number
  available_program_types: ProgramType[]
  geographic_preference: string | null
  cal_booking_url: string | null
  total_matches_completed: number
  last_active_at: string | null
  is_star_volunteer: boolean
  star_notes: string | null
  embedding_updated_at: string | null
  sf_volunteer_id: string | null
  created_at: string
  updated_at: string
}

export interface Program {
  id: string
  name: string
  program_type: ProgramType
  description: string | null
  is_active: boolean
  matching_weights: {
    career: number
    identity: number
    geography: number
    alma_mater: number
    engagement: number
  }
  match_timeout_days: number
  partner_slot_limits: Record<string, number>
  start_date: string | null
  end_date: string | null
  sf_program_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  program_id: string
  scholar_id: string
  volunteer_id: string
  status: MatchStatus
  ai_score: number | null
  score_breakdown: ScoreBreakdown | null
  match_rank: number | null
  reviewed_by: string | null
  reviewed_at: string | null
  pm_notes: string | null
  manually_selected: boolean
  scholar_request: string | null
  request_criteria: Record<string, string> | null
  match_email_sent_at: string | null
  volunteer_accepted_at: string | null
  scholar_accepted_at: string | null
  timeout_at: string | null
  completed_at: string | null
  completion_notes: string | null
  sf_match_record_id: string | null
  sf_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface ScoreBreakdown {
  career: number
  identity: number
  geography: number
  alma_mater: number
  engagement: number
  corporate_partner_boost: number
  composite: number
}

export interface Interaction {
  id: string
  match_id: string
  scholar_id: string
  volunteer_id: string
  program_type: ProgramType
  status: InteractionStatus
  scheduled_at: string | null
  duration_minutes: number | null
  meeting_url: string | null
  cal_booking_uid: string | null
  held_at: string | null
  confirmed_by: string | null
  scholar_notes: string | null
  volunteer_notes: string | null
  scholar_rating: number | null
  volunteer_rating: number | null
  feedback_form_sent_at: string | null
  sf_interaction_id: string | null
  sf_case_id: string | null
  sf_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingModule {
  id: string
  title: string
  description: string | null
  audience: UserRole
  program_types: ProgramType[]
  content_url: string | null
  content_type: string | null
  is_required: boolean
  order_index: number
  quiz_questions: unknown | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TrainingCompletion {
  id: string
  profile_id: string
  module_id: string
  status: TrainingStatus
  started_at: string | null
  completed_at: string | null
  quiz_score: number | null
  quiz_passed: boolean | null
  created_at: string
  updated_at: string
}

// ---- View shapes ----

export interface ActiveMatchView {
  match_id: string
  status: MatchStatus
  ai_score: number | null
  pm_notes: string | null
  manually_selected: boolean
  match_email_sent_at: string | null
  timeout_at: string | null
  sf_match_record_id: string | null
  program_name: string
  program_type: ProgramType
  scholar_name: string
  scholar_email: string
  cohort_year: number
  current_stage: string | null
  career_interests: string[]
  volunteer_name: string
  volunteer_email: string
  employer: string | null
  job_title: string | null
  is_corporate_partner: boolean
  corporate_partner_name: string | null
  is_star_volunteer: boolean
  total_matches_completed: number
  reviewed_by_name: string | null
  reviewed_at: string | null
  created_at: string
}

// ---- Supabase DB type map (used with createClient generic) ----

export type Database = {
  public: {
    Tables: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profiles: { Row: Profile; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scholars: { Row: Scholar; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      volunteers: { Row: Volunteer; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      programs: { Row: Program; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matches: { Row: Match; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interactions: { Row: Interaction; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      training_modules: { Row: TrainingModule; Insert: any; Update: any }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      training_completions: { Row: TrainingCompletion; Insert: any; Update: any }
    }
    Views: {
      v_active_matches: { Row: ActiveMatchView }
    }
    Functions: {
      match_volunteers_by_embedding: {
        Args: {
          query_embedding: string
          program_type_filter: ProgramType
          exclude_volunteer_ids: string[]
          match_count: number
        }
        Returns: unknown[]
      }
      approve_match: {
        Args: {
          p_scholar_id: string
          p_volunteer_id: string
          p_program_id: string
          p_ai_score: number
          p_score_breakdown: ScoreBreakdown
          p_match_rank: number
          p_pm_notes: string
          p_manually_selected: boolean
          p_reviewer_id: string
        }
        Returns: Record<string, unknown>
      }
      is_staff: { Args: Record<never, never>; Returns: boolean }
      current_user_role: { Args: Record<never, never>; Returns: UserRole }
    }
    Enums: {
      user_role: UserRole
      program_type: ProgramType
      match_status: MatchStatus
      interaction_status: InteractionStatus
      volunteer_status: VolunteerStatus
      training_status: TrainingStatus
    }
  }
}
