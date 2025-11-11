-- UC-070: Email integration OAuth storage
CREATE TABLE IF NOT EXISTS public.email_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ei_sel ON public.email_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ei_mut ON public.email_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ei_upd ON public.email_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ei_del ON public.email_integrations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ei_user ON public.email_integrations(user_id);

-- UC-070: Update email_tracking with new columns
ALTER TABLE public.email_tracking 
  ADD COLUMN IF NOT EXISTS provider_msg_id text,
  ADD COLUMN IF NOT EXISTS from_addr text,
  ADD COLUMN IF NOT EXISTS received_at timestamptz;

ALTER TABLE public.email_tracking DROP CONSTRAINT IF EXISTS email_tracking_user_id_provider_msg_id_key;
ALTER TABLE public.email_tracking ADD CONSTRAINT email_tracking_user_id_provider_msg_id_key UNIQUE (user_id, provider_msg_id);

CREATE INDEX IF NOT EXISTS idx_et_user_received ON public.email_tracking(user_id, received_at DESC);

-- UC-071: Calendar integration storage  
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY ci_sel ON public.calendar_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ci_mut ON public.calendar_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ci_upd ON public.calendar_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ci_del ON public.calendar_integrations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ci_user ON public.calendar_integrations(user_id);

-- UC-071: Update interviews table
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS scheduled_start timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes int,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';

-- UC-054: Resume share links
CREATE TABLE IF NOT EXISTS public.resume_shares_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  can_comment boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_shares_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY rsv2_sel ON public.resume_shares_v2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rsv2_mut ON public.resume_shares_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rsv2_upd ON public.resume_shares_v2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rsv2_del ON public.resume_shares_v2 FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_rsv2_user ON public.resume_shares_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_rsv2_token ON public.resume_shares_v2(share_token) WHERE is_active = true;

-- UC-054: Resume comments
CREATE TABLE IF NOT EXISTS public.resume_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.resume_shares_v2(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resume_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY rc_sel ON public.resume_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.resume_shares_v2 s WHERE s.id = share_id AND s.user_id = auth.uid())
);
CREATE POLICY rc_ins ON public.resume_comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.resume_shares_v2 s WHERE s.id = share_id AND s.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS idx_rc_share ON public.resume_comments(share_id, created_at);