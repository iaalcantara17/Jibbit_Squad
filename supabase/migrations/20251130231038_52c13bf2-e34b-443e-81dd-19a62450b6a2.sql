-- Create practice responses table
CREATE TABLE public.question_practice_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank_items(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  timer_duration INTEGER, -- in minutes, NULL if no timer
  time_taken INTEGER, -- actual time taken in seconds
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI feedback table
CREATE TABLE public.question_practice_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.question_practice_responses(id) ON DELETE CASCADE,
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 10),
  specificity_score INTEGER CHECK (specificity_score >= 0 AND specificity_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 10),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 10),
  overall_score NUMERIC,
  star_adherence JSONB, -- { "situation": true/false, "task": true/false, "action": true/false, "result": true/false, "feedback": "..." }
  weak_language JSONB, -- [{ "phrase": "...", "alternative": "...", "reason": "..." }]
  speaking_time_estimate INTEGER, -- in seconds
  alternative_approaches TEXT[],
  general_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_practice_responses_user ON public.question_practice_responses(user_id);
CREATE INDEX idx_practice_responses_question ON public.question_practice_responses(question_id);
CREATE INDEX idx_practice_responses_user_question ON public.question_practice_responses(user_id, question_id);
CREATE INDEX idx_practice_responses_created ON public.question_practice_responses(created_at DESC);
CREATE INDEX idx_practice_feedback_response ON public.question_practice_feedback(response_id);

-- Enable RLS
ALTER TABLE public.question_practice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_practice_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_practice_responses
CREATE POLICY "Users can view own practice responses"
  ON public.question_practice_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice responses"
  ON public.question_practice_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice responses"
  ON public.question_practice_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice responses"
  ON public.question_practice_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for question_practice_feedback
CREATE POLICY "Users can view feedback for own responses"
  ON public.question_practice_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.question_practice_responses
      WHERE id = question_practice_feedback.response_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for own responses"
  ON public.question_practice_feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.question_practice_responses
      WHERE id = question_practice_feedback.response_id
      AND user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_practice_responses_updated_at
  BEFORE UPDATE ON public.question_practice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();