-- Create referral_requests table
CREATE TABLE public.referral_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  last_action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_followup_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  message_sent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'followup', 'accepted', 'declined'))
);

-- Enable RLS
ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_requests
CREATE POLICY "Users can view own referral requests"
  ON public.referral_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral requests"
  ON public.referral_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral requests"
  ON public.referral_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own referral requests"
  ON public.referral_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_referral_requests_user_id ON public.referral_requests(user_id);
CREATE INDEX idx_referral_requests_contact_id ON public.referral_requests(contact_id);
CREATE INDEX idx_referral_requests_job_id ON public.referral_requests(job_id);
CREATE INDEX idx_referral_requests_status ON public.referral_requests(status);

-- Trigger to update updated_at
CREATE TRIGGER update_referral_requests_updated_at
  BEFORE UPDATE ON public.referral_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();