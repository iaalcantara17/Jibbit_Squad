-- ============================================
-- Sprint 3: Interview Data Foundation
-- ============================================

-- 1. ALTER existing interviews table to add Sprint 3 columns
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS scheduled_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS video_link text,
  ADD COLUMN IF NOT EXISTS interviewer_names text[],
  ADD COLUMN IF NOT EXISTS outcome text DEFAULT 'pending' CHECK (outcome IN ('pending', 'pass', 'fail', 'offer', 'unknown'));

-- Add comment explaining the outcome field
COMMENT ON COLUMN public.interviews.outcome IS 'Interview outcome: pending (awaiting result), pass (moved to next round), fail (rejected), offer (received offer), unknown';

-- 2. CREATE interview_checklists table
CREATE TABLE IF NOT EXISTS public.interview_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text NOT NULL,
  category text,
  is_required boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on interview_checklists
ALTER TABLE public.interview_checklists ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_checklists (owner-only for now)
CREATE POLICY "Users can view own interview checklists"
  ON public.interview_checklists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview checklists"
  ON public.interview_checklists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview checklists"
  ON public.interview_checklists
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview checklists"
  ON public.interview_checklists
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. CREATE interview_followups table
CREATE TABLE IF NOT EXISTS public.interview_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('thank_you', 'status_check', 'feedback_request', 'network_followup')),
  template_subject text,
  template_body text,
  sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on interview_followups
ALTER TABLE public.interview_followups ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_followups (owner-only for now)
CREATE POLICY "Users can view own interview followups"
  ON public.interview_followups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview followups"
  ON public.interview_followups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview followups"
  ON public.interview_followups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview followups"
  ON public.interview_followups
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Add indexes for common filters
-- Interviews table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_start ON public.interviews(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_outcome ON public.interviews(outcome);

-- Interview checklists indexes
CREATE INDEX IF NOT EXISTS idx_interview_checklists_interview_id ON public.interview_checklists(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_checklists_user_id ON public.interview_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_checklists_completed_at ON public.interview_checklists(completed_at);

-- Interview followups indexes
CREATE INDEX IF NOT EXISTS idx_interview_followups_interview_id ON public.interview_followups(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_followups_user_id ON public.interview_followups(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_followups_sent_at ON public.interview_followups(sent_at);
CREATE INDEX IF NOT EXISTS idx_interview_followups_status ON public.interview_followups(status);

-- 5. Add update trigger for updated_at columns
CREATE TRIGGER update_interview_checklists_updated_at
  BEFORE UPDATE ON public.interview_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interview_followups_updated_at
  BEFORE UPDATE ON public.interview_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- TODO: When collaboration/mentor features are implemented, add additional RLS policies
-- to allow mentors to read interview data if a team/mentor relationship exists