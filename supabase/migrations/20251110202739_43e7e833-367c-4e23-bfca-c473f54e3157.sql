-- Create interviews table for interview preparation and scheduling
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  interview_type TEXT,
  interview_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  interviewer_name TEXT,
  interviewer_role TEXT,
  notes TEXT,
  preparation_status TEXT DEFAULT 'pending',
  common_questions JSONB DEFAULT '[]'::jsonb,
  company_research JSONB DEFAULT '{}'::jsonb,
  calendar_event_id TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table for deadline and interview reminders
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  related_interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  sent_via_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create application_events table for tracking application history
CREATE TABLE public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create company_research table for storing AI-generated company insights
CREATE TABLE public.company_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  description TEXT,
  culture TEXT,
  recent_news JSONB DEFAULT '[]'::jsonb,
  key_people JSONB DEFAULT '[]'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  glassdoor_rating NUMERIC,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, company_name)
);

-- Create job_match_scores table for AI-powered job matching
CREATE TABLE public.job_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  skills_score NUMERIC CHECK (skills_score >= 0 AND skills_score <= 100),
  experience_score NUMERIC CHECK (experience_score >= 0 AND experience_score <= 100),
  education_score NUMERIC CHECK (education_score >= 0 AND education_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Create calendar_integrations table for external calendar sync
CREATE TABLE public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on all new tables
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interviews
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews" ON public.interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON public.interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews" ON public.interviews
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for application_events
CREATE POLICY "Users can view own application events" ON public.application_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application events" ON public.application_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for company_research
CREATE POLICY "Users can view own company research" ON public.company_research
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company research" ON public.company_research
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company research" ON public.company_research
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company research" ON public.company_research
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_match_scores
CREATE POLICY "Users can view own job match scores" ON public.job_match_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job match scores" ON public.job_match_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job match scores" ON public.job_match_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for calendar_integrations
CREATE POLICY "Users can view own calendar integrations" ON public.calendar_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar integrations" ON public.calendar_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar integrations" ON public.calendar_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar integrations" ON public.calendar_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX idx_interviews_date ON public.interviews(interview_date);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_application_events_user_id ON public.application_events(user_id);
CREATE INDEX idx_application_events_job_id ON public.application_events(job_id);
CREATE INDEX idx_company_research_user_id ON public.company_research(user_id);
CREATE INDEX idx_job_match_scores_user_id ON public.job_match_scores(user_id);
CREATE INDEX idx_job_match_scores_job_id ON public.job_match_scores(job_id);
CREATE INDEX idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_research_updated_at
  BEFORE UPDATE ON public.company_research
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();