-- Create mock_interview_sessions table
CREATE TABLE public.mock_interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NULL,
  target_role TEXT NOT NULL,
  company_name TEXT NULL,
  format TEXT NOT NULL CHECK (format IN ('behavioral', 'technical', 'case')),
  question_count INTEGER NOT NULL CHECK (question_count IN (5, 10, 15)),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mock_interview_responses table
CREATE TABLE public.mock_interview_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank_items(id),
  question_order INTEGER NOT NULL,
  is_followup BOOLEAN NOT NULL DEFAULT false,
  followup_rationale TEXT NULL,
  response_text TEXT NULL,
  time_taken INTEGER NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mock_interview_summaries table
CREATE TABLE public.mock_interview_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  completion_rate NUMERIC NOT NULL,
  avg_response_length NUMERIC NULL,
  strongest_category TEXT NULL,
  weakest_category TEXT NULL,
  top_improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_mock_sessions_user ON public.mock_interview_sessions(user_id);
CREATE INDEX idx_mock_sessions_status ON public.mock_interview_sessions(status);
CREATE INDEX idx_mock_responses_session ON public.mock_interview_responses(session_id);
CREATE INDEX idx_mock_summaries_session ON public.mock_interview_summaries(session_id);

-- Enable RLS
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_interview_sessions
CREATE POLICY "Users can view own mock sessions"
  ON public.mock_interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock sessions"
  ON public.mock_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock sessions"
  ON public.mock_interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mock sessions"
  ON public.mock_interview_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mock_interview_responses
CREATE POLICY "Users can view own mock responses"
  ON public.mock_interview_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mock_interview_sessions
    WHERE mock_interview_sessions.id = mock_interview_responses.session_id
    AND mock_interview_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own mock responses"
  ON public.mock_interview_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mock_interview_sessions
    WHERE mock_interview_sessions.id = mock_interview_responses.session_id
    AND mock_interview_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own mock responses"
  ON public.mock_interview_responses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.mock_interview_sessions
    WHERE mock_interview_sessions.id = mock_interview_responses.session_id
    AND mock_interview_sessions.user_id = auth.uid()
  ));

-- RLS Policies for mock_interview_summaries
CREATE POLICY "Users can view own mock summaries"
  ON public.mock_interview_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mock_interview_sessions
    WHERE mock_interview_sessions.id = mock_interview_summaries.session_id
    AND mock_interview_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own mock summaries"
  ON public.mock_interview_summaries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mock_interview_sessions
    WHERE mock_interview_sessions.id = mock_interview_summaries.session_id
    AND mock_interview_sessions.user_id = auth.uid()
  ));