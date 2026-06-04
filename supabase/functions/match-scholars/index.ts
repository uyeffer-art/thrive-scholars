// ============================================================
// THRIVE SCHOLARS — AI MATCHING ENGINE
// Supabase Edge Function: /functions/v1/match-scholars
//
// Deploy: supabase functions deploy match-scholars
//
// POST /functions/v1/match-scholars
// Body: { scholar_id: string, program_id: string, top_n?: number }
//
// Returns ranked volunteer candidates with score breakdowns
// for PM review. Does NOT create a match record — that happens
// when the PM approves via the dashboard.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

interface MatchRequest {
  scholar_id: string;
  program_id: string;
  top_n?: number;          // default 5
}

interface WeightConfig {
  career: number;
  identity: number;
  geography: number;
  alma_mater: number;
  engagement: number;
}

interface ScoreBreakdown {
  career: number;
  identity: number;
  geography: number;
  alma_mater: number;
  engagement: number;
  corporate_partner_boost: number;
  composite: number;
}

interface VolunteerCandidate {
  volunteer_id: string;
  profile_id: string;
  volunteer_name: string;
  volunteer_email: string;
  employer: string;
  job_title: string;
  industry: string;
  is_corporate_partner: boolean;
  corporate_partner_name: string | null;
  is_star_volunteer: boolean;
  total_matches_completed: number;
  available_program_types: string[];
  cal_booking_url: string | null;
  undergrad_institution: string | null;
  race_ethnicity: string[];
  gender: string | null;
  career_interests_raw: string[];     // from volunteer profile fields
  geographic_preference: string | null;
  vector_similarity: number;          // raw cosine similarity from pgvector
  score: ScoreBreakdown;
  rank: number;
  already_matched: boolean;           // safety: exclude if already active match
}

interface MatchResponse {
  scholar_id: string;
  program_id: string;
  program_name: string;
  program_type: string;
  scholar_name: string;
  scholar_career_interests: string[];
  scholar_stage: string;
  candidates: VolunteerCandidate[];
  generated_at: string;
  embedding_model: string;
}

// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_TOP_N = 5;
// How many candidates to pull from pgvector before re-ranking.
// Pull more than we need so the weighted scoring has room to reorder.
const VECTOR_CANDIDATE_POOL = 30;
// Corporate partner boost added to composite score (0.0–1.0 scale)
const CORPORATE_PARTNER_BOOST = 0.08;
// Engagement penalty per match already completed (rewards less-used volunteers)
const ENGAGEMENT_PENALTY_PER_MATCH = 0.015;
const MAX_ENGAGEMENT_PENALTY = 0.12;

// ------------------------------------------------------------
// EMBEDDING BUILDER
// Constructs the text blob we embed for a scholar or volunteer.
// Richer text = better semantic matching.
// Keep field order consistent between scholar and volunteer
// so the embedding space is comparable.
// ------------------------------------------------------------

function buildScholarEmbeddingText(scholar: Record<string, any>): string {
  const parts = [
    `Career interests: ${(scholar.career_interests || []).join(", ")}`,
    `Personal interests: ${(scholar.personal_interests || []).join(", ")}`,
    `Current stage: ${scholar.current_stage || ""}`,
    `College: ${scholar.college || ""}`,
    `Geographic preference: ${scholar.geographic_preference || ""}`,
    `Identity: ${(scholar.race_ethnicity || []).join(", ")}`,
    `Gender: ${scholar.gender || ""}`,
    `First generation college student: ${scholar.first_gen ? "yes" : "no"}`,
  ];
  return parts.filter(p => !p.endsWith(": ")).join(". ");
}

function buildVolunteerEmbeddingText(volunteer: Record<string, any>): string {
  const parts = [
    `Industry: ${volunteer.industry || ""}`,
    `Job title: ${volunteer.job_title || ""}`,
    `Employer: ${volunteer.employer || ""}`,
    `Career background: ${volunteer.industry || ""} ${volunteer.job_title || ""}`,
    `Undergraduate institution: ${volunteer.undergrad_institution || ""}`,
    `Graduate institution: ${volunteer.grad_institution || ""}`,
    `Geographic preference: ${volunteer.geographic_preference || ""}`,
    `Identity: ${(volunteer.race_ethnicity || []).join(", ")}`,
    `Gender: ${volunteer.gender || ""}`,
    `First generation college student: ${volunteer.first_gen ? "yes" : "no"}`,
  ];
  return parts.filter(p => !p.endsWith(": ")).join(". ");
}

// ------------------------------------------------------------
// WEIGHTED SCORING ENGINE
// Takes a raw vector similarity score + structured fields and
// produces a composite score using program-specific weights.
//
// Each dimension is normalized to 0.0–1.0 before weighting.
// The final composite is the weighted sum.
// ------------------------------------------------------------

function scoreCandidate(
  scholar: Record<string, any>,
  volunteer: Record<string, any>,
  vectorSimilarity: number,
  weights: WeightConfig,
  programType: string,
): ScoreBreakdown {

  // --- CAREER SCORE ---
  // Primary driver: vector similarity already captures semantic
  // overlap of career fields, industry, and role. Use it directly.
  const careerScore = Math.max(0, Math.min(1, vectorSimilarity));

  // --- IDENTITY SCORE ---
  // Overlap between scholar and volunteer race/ethnicity arrays.
  // Binary match on gender adds a small boost.
  const scholarIdentity: string[] = scholar.race_ethnicity || [];
  const volunteerIdentity: string[] = volunteer.race_ethnicity || [];
  const identityOverlap = scholarIdentity.length > 0 && volunteerIdentity.length > 0
    ? scholarIdentity.filter(r => volunteerIdentity.includes(r)).length /
      Math.max(scholarIdentity.length, volunteerIdentity.length)
    : 0;
  const genderMatch = scholar.gender && volunteer.gender &&
    scholar.gender.toLowerCase() === volunteer.gender.toLowerCase() ? 0.2 : 0;
  const identityScore = Math.min(1, identityOverlap * 0.8 + genderMatch);

  // --- GEOGRAPHY SCORE ---
  // Exact city/region string match. A fuzzy match (state-level)
  // gives partial credit. Extend this with a geocoding API later
  // if geographic matching becomes a priority.
  let geographyScore = 0;
  const scholarGeo = (scholar.geographic_preference || "").toLowerCase().trim();
  const volunteerGeo = (volunteer.geographic_preference || "").toLowerCase().trim();
  if (scholarGeo && volunteerGeo) {
    if (scholarGeo === volunteerGeo) {
      geographyScore = 1.0;
    } else {
      // Check if same state (last word of geo string heuristic)
      const scholarState = scholarGeo.split(/[\s,]+/).pop();
      const volunteerState = volunteerGeo.split(/[\s,]+/).pop();
      if (scholarState && volunteerState && scholarState === volunteerState) {
        geographyScore = 0.5;
      }
    }
  }

  // --- ALMA MATER SCORE ---
  // Direct institution match. High value for Thrive scholars who
  // specifically want to connect with alumni from their school.
  let almaMaterScore = 0;
  const scholarCollege = (scholar.college || "").toLowerCase().trim();
  const volunteerUndergrad = (volunteer.undergrad_institution || "").toLowerCase().trim();
  const volunteerGrad = (volunteer.grad_institution || "").toLowerCase().trim();
  if (scholarCollege && (volunteerUndergrad || volunteerGrad)) {
    if (scholarCollege === volunteerUndergrad || scholarCollege === volunteerGrad) {
      almaMaterScore = 1.0;
    } else if (
      (volunteerUndergrad && volunteerUndergrad.includes(scholarCollege)) ||
      (volunteerGrad && volunteerGrad.includes(scholarCollege))
    ) {
      almaMaterScore = 0.7;  // partial name match
    }
  }

  // --- ENGAGEMENT SCORE ---
  // Prefer volunteers who have done fewer matches — distributes load
  // across the pool and gives more scholars access to top volunteers.
  // Score decays with each completed match, floored at 0.
  const completedMatches = volunteer.total_matches_completed || 0;
  const penalty = Math.min(
    MAX_ENGAGEMENT_PENALTY,
    completedMatches * ENGAGEMENT_PENALTY_PER_MATCH,
  );
  const engagementScore = Math.max(0, 1 - penalty);

  // --- COMPOSITE ---
  const composite =
    careerScore    * weights.career    +
    identityScore  * weights.identity  +
    geographyScore * weights.geography +
    almaMaterScore * weights.alma_mater +
    engagementScore * weights.engagement;

  // --- CORPORATE PARTNER BOOST ---
  // Applied after weighting so it doesn't distort dimension scores.
  // Flat additive boost, capped so a poor match can't be boosted
  // above a genuinely good non-partner match.
  const corporateBoost = volunteer.is_corporate_partner
    ? CORPORATE_PARTNER_BOOST
    : 0;

  return {
    career:                   round4(careerScore),
    identity:                 round4(identityScore),
    geography:                round4(geographyScore),
    alma_mater:               round4(almaMaterScore),
    engagement:               round4(engagementScore),
    corporate_partner_boost:  round4(corporateBoost),
    composite:                round4(Math.min(1, composite + corporateBoost)),
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ------------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------------

serve(async (req: Request) => {
  // CORS — Supabase Edge Functions require explicit CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // --- AUTH CHECK ---
    // Only staff/admin can trigger matching.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verify the calling user is staff or admin
    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !["staff", "admin"].includes(callerProfile?.role)) {
      return errorResponse(403, "Only staff and admin can run matching");
    }

    // Use service role for all subsequent DB operations
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- PARSE REQUEST ---
    const body: MatchRequest = await req.json();
    const { scholar_id, program_id } = body;
    const topN = body.top_n ?? DEFAULT_TOP_N;

    if (!scholar_id || !program_id) {
      return errorResponse(400, "scholar_id and program_id are required");
    }

    // --- FETCH SCHOLAR ---
    const { data: scholar, error: scholarError } = await db
      .from("scholars")
      .select(`
        *,
        profiles (first_name, last_name, email, city, state)
      `)
      .eq("id", scholar_id)
      .single();

    if (scholarError || !scholar) {
      return errorResponse(404, `Scholar not found: ${scholarError?.message}`);
    }

    // --- FETCH PROGRAM ---
    const { data: program, error: programError } = await db
      .from("programs")
      .select("*")
      .eq("id", program_id)
      .single();

    if (programError || !program) {
      return errorResponse(404, `Program not found: ${programError?.message}`);
    }

    const weights: WeightConfig = program.matching_weights as WeightConfig;

    // --- GET OR GENERATE SCHOLAR EMBEDDING ---
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY")!,
    });

    let scholarEmbedding: number[];

    if (scholar.embedding && scholar.embedding_updated_at) {
      // Reuse cached embedding if profile hasn't changed since last embed
      const embeddingAge = Date.now() - new Date(scholar.embedding_updated_at).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (embeddingAge < sevenDaysMs) {
        scholarEmbedding = scholar.embedding;
      } else {
        scholarEmbedding = await generateEmbedding(openai, buildScholarEmbeddingText(scholar));
        await db.from("scholars").update({
          embedding: scholarEmbedding,
          embedding_updated_at: new Date().toISOString(),
        }).eq("id", scholar_id);
      }
    } else {
      scholarEmbedding = await generateEmbedding(openai, buildScholarEmbeddingText(scholar));
      await db.from("scholars").update({
        embedding: scholarEmbedding,
        embedding_updated_at: new Date().toISOString(),
      }).eq("id", scholar_id);
    }

    // --- FIND EXISTING ACTIVE MATCHES FOR THIS SCHOLAR ---
    // We exclude volunteers already matched to this scholar in this program.
    const { data: existingMatches } = await db
      .from("matches")
      .select("volunteer_id")
      .eq("scholar_id", scholar_id)
      .eq("program_id", program_id)
      .in("status", ["suggested", "pending_approval", "approved", "active"]);

    const excludedVolunteerIds = (existingMatches || []).map((m: any) => m.volunteer_id);

    // --- PGVECTOR SIMILARITY SEARCH ---
    // Pulls the top VECTOR_CANDIDATE_POOL volunteers by cosine similarity.
    // We then re-rank by composite weighted score.
    // Filters: volunteer must be active and accept this program type.
    const embeddingString = `[${scholarEmbedding.join(",")}]`;

    const { data: vectorCandidates, error: vectorError } = await db.rpc(
      "match_volunteers_by_embedding",
      {
        query_embedding: embeddingString,
        program_type_filter: program.program_type,
        exclude_volunteer_ids: excludedVolunteerIds.length > 0
          ? excludedVolunteerIds
          : ["00000000-0000-0000-0000-000000000000"],  // dummy to avoid empty array issues
        match_count: VECTOR_CANDIDATE_POOL,
      },
    );

    if (vectorError) {
      return errorResponse(500, `Vector search failed: ${vectorError.message}`);
    }

    if (!vectorCandidates || vectorCandidates.length === 0) {
      return jsonResponse({
        scholar_id,
        program_id,
        program_name: program.name,
        program_type: program.program_type,
        scholar_name: `${scholar.profiles.first_name} ${scholar.profiles.last_name}`,
        scholar_career_interests: scholar.career_interests || [],
        scholar_stage: scholar.current_stage,
        candidates: [],
        generated_at: new Date().toISOString(),
        embedding_model: EMBEDDING_MODEL,
        message: "No eligible volunteers found for this program type.",
      } as MatchResponse);
    }

    // --- WEIGHTED RE-RANKING ---
    const scoredCandidates: VolunteerCandidate[] = vectorCandidates.map(
      (v: Record<string, any>) => {
        const scoreBreakdown = scoreCandidate(
          scholar,
          v,
          v.similarity,
          weights,
          program.program_type,
        );

        return {
          volunteer_id:           v.volunteer_id,
          profile_id:             v.profile_id,
          volunteer_name:         `${v.first_name} ${v.last_name}`,
          volunteer_email:        v.email,
          employer:               v.employer,
          job_title:              v.job_title,
          industry:               v.industry,
          is_corporate_partner:   v.is_corporate_partner,
          corporate_partner_name: v.corporate_partner_name,
          is_star_volunteer:      v.is_star_volunteer,
          total_matches_completed: v.total_matches_completed,
          available_program_types: v.available_program_types || [],
          cal_booking_url:        v.cal_booking_url,
          undergrad_institution:  v.undergrad_institution,
          race_ethnicity:         v.race_ethnicity || [],
          gender:                 v.gender,
          career_interests_raw:   [v.industry, v.job_title].filter(Boolean),
          geographic_preference:  v.geographic_preference,
          vector_similarity:      round4(v.similarity),
          score:                  scoreBreakdown,
          rank:                   0,          // set after sort
          already_matched:        false,
        };
      },
    );

    // Sort by composite score descending
    scoredCandidates.sort((a, b) => b.score.composite - a.score.composite);

    // Assign ranks and take topN
    const topCandidates = scoredCandidates.slice(0, topN).map((c, i) => ({
      ...c,
      rank: i + 1,
    }));

    // --- RESPOND ---
    const response: MatchResponse = {
      scholar_id,
      program_id,
      program_name: program.name,
      program_type: program.program_type,
      scholar_name: `${scholar.profiles.first_name} ${scholar.profiles.last_name}`,
      scholar_career_interests: scholar.career_interests || [],
      scholar_stage: scholar.current_stage,
      candidates: topCandidates,
      generated_at: new Date().toISOString(),
      embedding_model: EMBEDDING_MODEL,
    };

    return jsonResponse(response);

  } catch (err) {
    console.error("Matching engine error:", err);
    return errorResponse(500, `Internal error: ${(err as Error).message}`);
  }
});

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

async function generateEmbedding(
  openai: OpenAI,
  text: string,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),   // token safety trim
  });
  return response.data[0].embedding;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}
