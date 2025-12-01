-- Goals table for SMART goal tracking
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- applications, interviews, networking, salary, skill_development
  
  -- SMART criteria
  specific TEXT, -- What specifically will be accomplished
  measurable TEXT, -- How progress will be measured
  achievable TEXT, -- Why this goal is achievable
  relevant TEXT, -- Why this goal matters
  time_bound TEXT, -- Time frame for completion
  
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  target_date DATE,
  
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned
  milestones JSONB DEFAULT '[]'::jsonb,
  is_shared BOOLEAN DEFAULT false, -- For mentor/collaboration sharing
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time tracking for activity investment
CREATE TABLE public.time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- resume_writing, job_search, networking, interview_prep, applications, skill_development
  
  -- Optional links to specific entities
  job_id UUID,
  related_entity_id UUID,
  related_entity_type TEXT, -- job, contact, interview, resume, cover_letter
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Custom report templates
CREATE TABLE public.custom_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  metrics JSONB NOT NULL, -- Array of metric names to include
  filters JSONB DEFAULT '{}'::jsonb, -- date_range, companies, roles, industries, statuses
  chart_type TEXT DEFAULT 'table', -- bar, line, pie, table, mixed
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forecasting and prediction tracking
CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  forecast_type TEXT NOT NULL, -- interviews, offers, response_rate, time_to_offer
  
  prediction_value NUMERIC NOT NULL,
  confidence_level TEXT NOT NULL, -- low, medium, high
  based_on_data JSONB NOT NULL, -- Historical data used for prediction
  
  forecast_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL, -- When this prediction is for
  
  actual_value NUMERIC, -- Filled in after target_date passes
  accuracy_score NUMERIC, -- Calculated when actual_value is known
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for time_tracking
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time tracking"
  ON public.time_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time tracking"
  ON public.time_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time tracking"
  ON public.time_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time tracking"
  ON public.time_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for custom_report_templates
ALTER TABLE public.custom_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report templates"
  ON public.custom_report_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report templates"
  ON public.custom_report_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own report templates"
  ON public.custom_report_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own report templates"
  ON public.custom_report_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for forecasts
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own forecasts"
  ON public.forecasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own forecasts"
  ON public.forecasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forecasts"
  ON public.forecasts FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_report_templates_updated_at
  BEFORE UPDATE ON public.custom_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_time_tracking_user_id ON public.time_tracking(user_id);
CREATE INDEX idx_time_tracking_activity_type ON public.time_tracking(activity_type);
CREATE INDEX idx_time_tracking_started_at ON public.time_tracking(started_at);
CREATE INDEX idx_custom_report_templates_user_id ON public.custom_report_templates(user_id);
CREATE INDEX idx_forecasts_user_id ON public.forecasts(user_id);
CREATE INDEX idx_forecasts_target_date ON public.forecasts(target_date);