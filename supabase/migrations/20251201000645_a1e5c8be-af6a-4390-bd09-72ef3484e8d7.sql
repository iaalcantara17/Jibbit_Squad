-- Market notes for user-curated intelligence
CREATE TABLE public.market_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  industry TEXT,
  location TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User-defined benchmarks
CREATE TABLE public.user_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- e.g., 'applications_per_week', 'response_rate', 'interview_conversion'
  target_value NUMERIC NOT NULL,
  period TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for market_notes
CREATE POLICY "Users can view own market notes"
  ON public.market_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market notes"
  ON public.market_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market notes"
  ON public.market_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own market notes"
  ON public.market_notes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_benchmarks
CREATE POLICY "Users can view own benchmarks"
  ON public.user_benchmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own benchmarks"
  ON public.user_benchmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own benchmarks"
  ON public.user_benchmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own benchmarks"
  ON public.user_benchmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_market_notes_updated_at
  BEFORE UPDATE ON public.market_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_benchmarks_updated_at
  BEFORE UPDATE ON public.user_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_market_notes_user_id ON public.market_notes(user_id);
CREATE INDEX idx_market_notes_tags ON public.market_notes USING GIN(tags);
CREATE INDEX idx_market_notes_skills ON public.market_notes USING GIN(skills);
CREATE INDEX idx_user_benchmarks_user_id ON public.user_benchmarks(user_id);