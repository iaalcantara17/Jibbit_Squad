-- Create missing tables and fix RLS issues

-- ============================================
-- UC-117: API Rate Limiting and Error Handling
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL UNIQUE,
  daily_limit INTEGER NOT NULL,
  current_usage INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 day'),
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  average_response_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view api rate limits"
ON public.api_rate_limits
FOR SELECT USING (true);

-- Insert default API configurations
INSERT INTO public.api_rate_limits (api_name, daily_limit) VALUES
  ('bls_salary', 500),
  ('github', 5000),
  ('openstreetmap', 1000),
  ('lovable_ai', 100)
ON CONFLICT (api_name) DO NOTHING;

-- Fix geocoded_locations RLS
ALTER TABLE public.geocoded_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view geocoded locations" ON public.geocoded_locations;
CREATE POLICY "Anyone can view geocoded locations"
ON public.geocoded_locations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert geocoded locations" ON public.geocoded_locations;
CREATE POLICY "Authenticated users can insert geocoded locations"
ON public.geocoded_locations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');