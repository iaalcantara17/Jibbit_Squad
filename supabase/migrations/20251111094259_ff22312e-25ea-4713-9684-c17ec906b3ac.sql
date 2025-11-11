-- Create saved_searches table for UC-039
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies: owner-only
CREATE POLICY "Users can insert own saved searches" 
  ON public.saved_searches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own saved searches" 
  ON public.saved_searches FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches" 
  ON public.saved_searches FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches" 
  ON public.saved_searches FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id);

-- Updated_at trigger
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();