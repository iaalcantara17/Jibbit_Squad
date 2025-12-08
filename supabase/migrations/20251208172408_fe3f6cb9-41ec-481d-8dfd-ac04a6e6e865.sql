-- =============================================
-- SPRINT 4: DATABASE SCHEMA MIGRATION
-- =============================================

-- =============================================
-- UC-112: Salary Data Integration
-- =============================================
CREATE TABLE IF NOT EXISTS public.salary_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  location TEXT,
  industry TEXT,
  percentile_25 NUMERIC,
  percentile_50 NUMERIC,
  percentile_75 NUMERIC,
  sample_size INTEGER,
  data_source TEXT NOT NULL DEFAULT 'bls',
  source_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_job_title ON public.salary_benchmarks(job_title);
CREATE INDEX IF NOT EXISTS idx_salary_benchmarks_location ON public.salary_benchmarks(location);

-- =============================================
-- UC-114: GitHub Repository Showcase
-- =============================================
CREATE TABLE IF NOT EXISTS public.github_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  public_repos INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.github_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own github integrations"
ON public.github_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.github_repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  github_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  html_url TEXT NOT NULL,
  language TEXT,
  languages JSONB DEFAULT '[]'::jsonb,
  stargazers_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  topics JSONB DEFAULT '[]'::jsonb,
  last_commit_at TIMESTAMP WITH TIME ZONE,
  created_at_github TIMESTAMP WITH TIME ZONE,
  updated_at_github TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, github_id)
);

ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own github repos"
ON public.github_repositories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-115: External Skills Assessment
-- =============================================
CREATE TABLE IF NOT EXISTS public.external_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- hackerrank, leetcode, codecademy, etc.
  platform_username TEXT,
  profile_url TEXT,
  certification_name TEXT NOT NULL,
  certification_url TEXT,
  badge_url TEXT,
  score TEXT,
  rank TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  skills_validated JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.external_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own certifications"
ON public.external_certifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-116: Location and Geo-coding
-- =============================================
CREATE TABLE IF NOT EXISTS public.job_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_type TEXT DEFAULT 'on_site', -- on_site, hybrid, remote
  timezone TEXT,
  geocoded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

ALTER TABLE public.job_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own job locations"
ON public.job_locations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_home_location (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_home_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own home location"
ON public.user_home_location
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-117: API Rate Limiting Dashboard
-- =============================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  api_name TEXT NOT NULL, -- bls, github, gmail, nominatim, etc.
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_name ON public.api_usage_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);

-- Allow service role to insert, users can view their own
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api usage logs"
ON public.api_usage_logs
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow insert api usage logs"
ON public.api_usage_logs
FOR INSERT
WITH CHECK (true);

-- =============================================
-- UC-118: Smart Follow-Up Reminders
-- =============================================
CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- application, interview, offer, custom
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  snoozed_until TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  email_template TEXT,
  auto_generated BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own follow up reminders"
ON public.follow_up_reminders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-119 & UC-120: Application Success Analytics & A/B Testing
-- =============================================
CREATE TABLE IF NOT EXISTS public.application_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  variant_a_id UUID, -- resume or cover letter id
  variant_b_id UUID,
  variant_a_type TEXT NOT NULL, -- resume, cover_letter
  variant_b_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.application_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ab tests"
ON public.application_ab_tests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.application_ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.application_ab_tests(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  variant TEXT NOT NULL, -- a or b
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_received BOOLEAN DEFAULT false,
  response_type TEXT, -- interview, rejection, no_response
  response_at TIMESTAMP WITH TIME ZONE,
  days_to_response INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.application_ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ab test results"
ON public.application_ab_test_results
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.application_ab_tests
  WHERE application_ab_tests.id = application_ab_test_results.test_id
  AND application_ab_tests.user_id = auth.uid()
));

CREATE POLICY "Users can insert own ab test results"
ON public.application_ab_test_results
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.application_ab_tests
  WHERE application_ab_tests.id = application_ab_test_results.test_id
  AND application_ab_tests.user_id = auth.uid()
));

-- =============================================
-- UC-121: Employer Response Time Prediction
-- =============================================
CREATE TABLE IF NOT EXISTS public.response_time_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  predicted_days_min INTEGER,
  predicted_days_max INTEGER,
  predicted_days_avg INTEGER,
  confidence_percent INTEGER,
  factors JSONB DEFAULT '{}'::jsonb,
  suggested_followup_date DATE,
  actual_response_days INTEGER,
  is_overdue BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

ALTER TABLE public.response_time_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own response predictions"
ON public.response_time_predictions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-122: Application Package Quality Scoring
-- =============================================
CREATE TABLE IF NOT EXISTS public.application_quality_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  resume_id UUID,
  cover_letter_id UUID,
  overall_score INTEGER NOT NULL DEFAULT 0,
  keyword_match_score INTEGER DEFAULT 0,
  skills_alignment_score INTEGER DEFAULT 0,
  experience_match_score INTEGER DEFAULT 0,
  formatting_score INTEGER DEFAULT 0,
  consistency_score INTEGER DEFAULT 0,
  missing_keywords JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.application_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quality scores"
ON public.application_quality_scores
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-123: Competitive Analysis
-- =============================================
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  competitive_score INTEGER DEFAULT 0,
  estimated_applicants INTEGER,
  likelihood_interview TEXT, -- low, medium, high
  likelihood_percent INTEGER,
  advantages JSONB DEFAULT '[]'::jsonb,
  disadvantages JSONB DEFAULT '[]'::jsonb,
  differentiation_strategies JSONB DEFAULT '[]'::jsonb,
  market_position TEXT, -- below_average, average, above_average, top_tier
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own competitive analysis"
ON public.competitive_analysis
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-124: Job Application Timing Optimizer
-- =============================================
CREATE TABLE IF NOT EXISTS public.application_timing_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  recommended_day TEXT, -- monday, tuesday, etc.
  recommended_time_start TIME,
  recommended_time_end TIME,
  recommended_timezone TEXT DEFAULT 'America/New_York',
  scheduled_submit_at TIMESTAMP WITH TIME ZONE,
  actual_submit_at TIMESTAMP WITH TIME ZONE,
  timing_score INTEGER,
  factors JSONB DEFAULT '{}'::jsonb,
  recommendation_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

ALTER TABLE public.application_timing_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timing recommendations"
ON public.application_timing_recommendations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-125: Multi-Platform Application Tracker
-- =============================================
CREATE TABLE IF NOT EXISTS public.platform_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- linkedin, indeed, glassdoor, company_site, other
  platform_job_id TEXT,
  platform_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  detected_from TEXT, -- email, extension, manual
  status_on_platform TEXT,
  last_platform_update TIMESTAMP WITH TIME ZONE,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of_id UUID,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own platform applications"
ON public.platform_applications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-126: Interview Question Response Library
-- =============================================
CREATE TABLE IF NOT EXISTS public.interview_response_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_type TEXT NOT NULL, -- behavioral, technical, situational, general
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  skills_demonstrated JSONB DEFAULT '[]'::jsonb,
  experiences_referenced JSONB DEFAULT '[]'::jsonb,
  companies_used_for JSONB DEFAULT '[]'::jsonb,
  times_used INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0, -- led to next round or offer
  ai_feedback_score INTEGER,
  ai_feedback TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_response_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own response library"
ON public.interview_response_library
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-127: Offer Evaluation & Comparison
-- =============================================
CREATE TABLE IF NOT EXISTS public.offer_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Offer Comparison',
  offer_ids JSONB DEFAULT '[]'::jsonb, -- array of offer IDs from offers table
  comparison_weights JSONB DEFAULT '{"salary": 30, "benefits": 20, "culture": 15, "growth": 15, "location": 10, "balance": 10}'::jsonb,
  winner_offer_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own offer comparisons"
ON public.offer_comparisons
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add additional fields to offers table for comprehensive comparison
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS health_insurance_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS retirement_match_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pto_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signing_bonus NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS relocation_bonus NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remote_policy TEXT,
ADD COLUMN IF NOT EXISTS commute_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS growth_opportunities_score INTEGER,
ADD COLUMN IF NOT EXISTS culture_fit_score INTEGER,
ADD COLUMN IF NOT EXISTS work_life_balance_score INTEGER,
ADD COLUMN IF NOT EXISTS total_compensation NUMERIC,
ADD COLUMN IF NOT EXISTS adjusted_compensation NUMERIC, -- adjusted for cost of living
ADD COLUMN IF NOT EXISTS cost_of_living_index NUMERIC;

-- =============================================
-- UC-128: Career Path Simulation
-- =============================================
CREATE TABLE IF NOT EXISTS public.career_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  simulation_name TEXT NOT NULL,
  starting_role TEXT NOT NULL,
  starting_salary NUMERIC,
  target_role TEXT,
  target_salary NUMERIC,
  time_horizon_years INTEGER DEFAULT 5,
  paths JSONB DEFAULT '[]'::jsonb, -- array of career paths with milestones
  selected_path_index INTEGER,
  assumptions JSONB DEFAULT '{}'::jsonb,
  success_criteria JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.career_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career simulations"
ON public.career_simulations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UC-133: Production Monitoring and Logging
-- =============================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'error', -- info, warning, error, critical
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert error logs"
ON public.error_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own error logs"
ON public.error_logs
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- UC-146: Analytics Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_properties JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- =============================================
-- Add updated_at trigger for new tables
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers to new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY[
      'salary_benchmarks', 'github_integrations', 'github_repositories',
      'external_certifications', 'job_locations', 'user_home_location',
      'follow_up_reminders', 'application_ab_tests', 'response_time_predictions',
      'application_quality_scores', 'competitive_analysis', 
      'application_timing_recommendations', 'platform_applications',
      'interview_response_library', 'offer_comparisons', 'career_simulations'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_updated_at();
    ', t, t);
  END LOOP;
END;
$$;