-- Create offers table linked to jobs
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  base_salary NUMERIC,
  bonus NUMERIC,
  equity TEXT,
  location TEXT,
  level TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  market_data JSONB DEFAULT '{"min": null, "max": null, "sources": []}'::jsonb,
  confidence_checklist JSONB DEFAULT '{"researched_market": false, "practiced_scripts": false, "identified_leverage": false, "set_walkaway": false, "prepared_questions": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_offers_job_id ON public.offers(job_id);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own offers"
  ON public.offers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON public.offers FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();