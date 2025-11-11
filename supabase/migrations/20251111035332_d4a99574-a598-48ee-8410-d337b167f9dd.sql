-- Create resume shares table for collaboration (UC-054)
CREATE TABLE public.resume_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL,
  user_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view',
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.resume_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume shares"
  ON public.resume_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create resume shares"
  ON public.resume_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume shares"
  ON public.resume_shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume shares"
  ON public.resume_shares FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_resume_shares_updated_at
  BEFORE UPDATE ON public.resume_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create email tracking table for status monitoring (UC-070)
CREATE TABLE public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID,
  email_subject TEXT,
  email_body TEXT,
  sender_email TEXT,
  detected_status TEXT,
  confidence_score NUMERIC DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email tracking"
  ON public.email_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email tracking"
  ON public.email_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create cover letter analytics table (UC-062)
CREATE TABLE public.cover_letter_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_letter_id UUID NOT NULL,
  user_id UUID NOT NULL,
  job_id UUID,
  variant_name TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened BOOLEAN DEFAULT false,
  responded BOOLEAN DEFAULT false,
  response_time_hours INTEGER,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cover_letter_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cover letter analytics"
  ON public.cover_letter_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letter analytics"
  ON public.cover_letter_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letter analytics"
  ON public.cover_letter_analytics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letter analytics"
  ON public.cover_letter_analytics FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_cover_letter_analytics_updated_at
  BEFORE UPDATE ON public.cover_letter_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();