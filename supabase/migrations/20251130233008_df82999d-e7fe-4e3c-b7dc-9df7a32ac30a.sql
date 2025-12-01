-- Create interview success predictions table
CREATE TABLE IF NOT EXISTS public.interview_success_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  predicted_score NUMERIC NOT NULL CHECK (predicted_score >= 0 AND predicted_score <= 100),
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('low', 'medium', 'high')),
  score_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actual_outcome TEXT,
  prediction_accuracy NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome_recorded_at TIMESTAMPTZ,
  UNIQUE(interview_id, created_at)
);

-- Add index for faster lookups
CREATE INDEX idx_predictions_user_id ON public.interview_success_predictions(user_id);
CREATE INDEX idx_predictions_interview_id ON public.interview_success_predictions(interview_id);

-- Enable RLS
ALTER TABLE public.interview_success_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own predictions"
  ON public.interview_success_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON public.interview_success_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
  ON public.interview_success_predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
  ON public.interview_success_predictions FOR DELETE
  USING (auth.uid() = user_id);