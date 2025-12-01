-- Mentor feedback/notes table
CREATE TABLE public.mentor_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'job', 'interview', 'goal'
  entity_id UUID NOT NULL,
  feedback_text TEXT NOT NULL,
  implemented BOOLEAN NOT NULL DEFAULT false,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is mentor/admin in same team as candidate
CREATE OR REPLACE FUNCTION public.can_view_candidate_data(_viewer_id UUID, _candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships tm1
    JOIN public.team_memberships tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = _viewer_id
      AND tm2.user_id = _candidate_id
      AND tm1.role IN ('admin', 'mentor')
  )
$$;

-- RLS Policies for mentor_feedback
CREATE POLICY "Mentors and admins can create feedback for their team"
  ON public.mentor_feedback FOR INSERT
  WITH CHECK (
    public.is_team_member(auth.uid(), team_id)
    AND (
      SELECT role FROM public.team_memberships 
      WHERE team_id = mentor_feedback.team_id AND user_id = auth.uid()
    ) IN ('admin', 'mentor')
  );

CREATE POLICY "Users can view feedback for themselves or their mentees"
  ON public.mentor_feedback FOR SELECT
  USING (
    candidate_id = auth.uid()
    OR mentor_id = auth.uid()
    OR public.can_view_candidate_data(auth.uid(), candidate_id)
  );

CREATE POLICY "Candidates can update implementation status"
  ON public.mentor_feedback FOR UPDATE
  USING (candidate_id = auth.uid());

CREATE POLICY "Mentors can update their own feedback"
  ON public.mentor_feedback FOR UPDATE
  USING (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete their own feedback"
  ON public.mentor_feedback FOR DELETE
  USING (mentor_id = auth.uid());

-- Update jobs RLS to allow mentors/admins to view their team members' jobs
CREATE POLICY "Team mentors and admins can view candidate jobs"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.can_view_candidate_data(auth.uid(), user_id)
  );

-- Update interviews RLS to allow mentors/admins to view their team members' interviews
CREATE POLICY "Team mentors and admins can view candidate interviews"
  ON public.interviews FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.can_view_candidate_data(auth.uid(), user_id)
  );

-- Update goals RLS to allow mentors/admins to view their team members' goals
CREATE POLICY "Team mentors and admins can view candidate goals"
  ON public.goals FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.can_view_candidate_data(auth.uid(), user_id)
  );

-- Trigger for updated_at
CREATE TRIGGER update_mentor_feedback_updated_at
  BEFORE UPDATE ON public.mentor_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_mentor_feedback_team_id ON public.mentor_feedback(team_id);
CREATE INDEX idx_mentor_feedback_mentor_id ON public.mentor_feedback(mentor_id);
CREATE INDEX idx_mentor_feedback_candidate_id ON public.mentor_feedback(candidate_id);
CREATE INDEX idx_mentor_feedback_entity ON public.mentor_feedback(entity_type, entity_id);