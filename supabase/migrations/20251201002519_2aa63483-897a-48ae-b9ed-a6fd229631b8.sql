-- Table for progress sharing with privacy scopes
CREATE TABLE public.progress_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('kpi_summary', 'goals_only', 'full_progress')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ,
  shared_with_name TEXT,
  notes TEXT
);

-- Table for tracking share access
CREATE TABLE public.progress_share_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES public.progress_shares(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.progress_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_share_access_log ENABLE ROW LEVEL SECURITY;

-- Policies for progress_shares
CREATE POLICY "ps_sel"
ON public.progress_shares FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "ps_ins"
ON public.progress_shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ps_upd"
ON public.progress_shares FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "ps_del"
ON public.progress_shares FOR DELETE
USING (auth.uid() = user_id);

-- Policies for access log
CREATE POLICY "psal_sel"
ON public.progress_share_access_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.progress_shares
    WHERE id = progress_share_access_log.share_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "psal_ins"
ON public.progress_share_access_log FOR INSERT
WITH CHECK (true); -- Anyone with a valid share link can log access

-- Index for fast token lookup
CREATE INDEX idx_progress_shares_token ON public.progress_shares(share_token);
CREATE INDEX idx_progress_shares_user_id ON public.progress_shares(user_id);

-- Trigger for updated_at on progress_shares
ALTER TABLE public.progress_shares ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER update_progress_shares_updated_at
BEFORE UPDATE ON public.progress_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();