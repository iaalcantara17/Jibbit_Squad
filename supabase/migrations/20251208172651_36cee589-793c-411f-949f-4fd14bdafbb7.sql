-- Sprint 4 Database Schema Migration (Part 2 - Remaining tables)
-- Using DROP IF EXISTS for policies that may already exist

-- ============================================
-- UC-122: Application Package Quality Scoring
-- ============================================
CREATE TABLE IF NOT EXISTS public.application_quality_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  resume_id UUID,
  cover_letter_id UUID,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  keyword_match_score INTEGER,
  formatting_score INTEGER,
  experience_alignment_score INTEGER,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  missing_keywords JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.application_quality_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own quality assessments" ON public.application_quality_assessments;
CREATE POLICY "Users can manage own quality assessments"
ON public.application_quality_assessments
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- UC-123: Competitive Analysis Updates
-- ============================================
ALTER TABLE public.competitive_analysis
ADD COLUMN IF NOT EXISTS estimated_time_to_fill INTEGER,
ADD COLUMN IF NOT EXISTS application_velocity INTEGER,
ADD COLUMN IF NOT EXISTS unique_qualifications JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- UC-124: Job Application Timing Optimizer Updates
-- ============================================
ALTER TABLE public.application_timing_recommendations
ADD COLUMN IF NOT EXISTS historical_success_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

-- ============================================
-- UC-125: Multi-Platform Application Tracker
-- ============================================
CREATE TABLE IF NOT EXISTS public.platform_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID,
  platform TEXT NOT NULL,
  platform_job_id TEXT,
  external_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'applied',
  last_platform_update TIMESTAMP WITH TIME ZONE,
  raw_email_data JSONB,
  is_duplicate BOOLEAN DEFAULT false,
  merged_with_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own platform applications" ON public.platform_applications;
CREATE POLICY "Users can manage own platform applications"
ON public.platform_applications
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- UC-126: Interview Question Response Library
-- ============================================
CREATE TABLE IF NOT EXISTS public.interview_response_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  tags JSONB DEFAULT '[]'::jsonb,
  skills_demonstrated JSONB DEFAULT '[]'::jsonb,
  companies_used_for JSONB DEFAULT '[]'::jsonb,
  success_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  ai_feedback JSONB,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_response_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own response library" ON public.interview_response_library;
CREATE POLICY "Users can manage own response library"
ON public.interview_response_library
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_response_library_type ON public.interview_response_library(user_id, question_type);

-- ============================================
-- UC-127: Offer Evaluation & Comparison Tool
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  base_salary NUMERIC(12,2),
  bonus NUMERIC(12,2),
  equity_value NUMERIC(12,2),
  signing_bonus NUMERIC(12,2),
  health_insurance_value NUMERIC(12,2),
  retirement_match NUMERIC(12,2),
  pto_days INTEGER,
  remote_policy TEXT,
  location TEXT,
  cost_of_living_index NUMERIC(5,2) DEFAULT 100,
  start_date DATE,
  deadline DATE,
  status TEXT DEFAULT 'pending',
  culture_score INTEGER,
  growth_score INTEGER,
  work_life_balance_score INTEGER,
  notes TEXT,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own job offers" ON public.job_offers;
CREATE POLICY "Users can manage own job offers"
ON public.job_offers
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- UC-128: Career Path Simulation Updates
-- ============================================
ALTER TABLE public.career_simulations
ADD COLUMN IF NOT EXISTS success_probability NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS milestone_projections JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- UC-116: Geocoded Job Locations
-- ============================================
CREATE TABLE IF NOT EXISTS public.geocoded_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_string TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  formatted_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geocoded_locations_string ON public.geocoded_locations(location_string);

-- Add location coordinates to jobs table if not exists
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
ADD COLUMN IF NOT EXISTS commute_distance_miles NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS commute_time_minutes INTEGER;

-- ============================================
-- UC-146: Analytics Implementation
-- ============================================
CREATE TABLE IF NOT EXISTS public.feature_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_properties JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.feature_analytics;
CREATE POLICY "Anyone can insert analytics"
ON public.feature_analytics
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.feature_analytics;
CREATE POLICY "Users can view own analytics"
ON public.feature_analytics
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_feature_analytics_event ON public.feature_analytics(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_feature_analytics_user ON public.feature_analytics(user_id, created_at);