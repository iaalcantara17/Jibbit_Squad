-- Create technical_challenges table
CREATE TABLE public.technical_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  problem_statement TEXT NOT NULL,
  solution_framework TEXT NULL,
  best_practices TEXT NULL,
  hints JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create technical_practice_attempts table
CREATE TABLE public.technical_practice_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.technical_challenges(id) ON DELETE CASCADE,
  solution_code TEXT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  time_taken INTEGER NULL,
  timer_duration INTEGER NULL,
  rubric_checklist JSONB NOT NULL DEFAULT '{
    "correctness": false,
    "complexity": false,
    "edge_cases": false,
    "explanation": false
  }'::jsonb,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_technical_challenges_category ON public.technical_challenges(category);
CREATE INDEX idx_technical_challenges_difficulty ON public.technical_challenges(difficulty);
CREATE INDEX idx_technical_practice_user ON public.technical_practice_attempts(user_id);
CREATE INDEX idx_technical_practice_challenge ON public.technical_practice_attempts(challenge_id);

-- Enable RLS
ALTER TABLE public.technical_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_practice_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technical_challenges (public read)
CREATE POLICY "Anyone can view technical challenges"
  ON public.technical_challenges FOR SELECT
  USING (true);

-- RLS Policies for technical_practice_attempts
CREATE POLICY "Users can view own practice attempts"
  ON public.technical_practice_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice attempts"
  ON public.technical_practice_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice attempts"
  ON public.technical_practice_attempts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice attempts"
  ON public.technical_practice_attempts FOR DELETE
  USING (auth.uid() = user_id);