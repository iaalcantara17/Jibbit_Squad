-- Fix Teams RLS policies by dropping all existing policies first
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team admins can delete teams" ON public.teams;

-- Now create the policies fresh
CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their teams"
ON public.teams
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT team_id FROM public.team_memberships
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team admins can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT team_id FROM public.team_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Team admins can delete teams"
ON public.teams
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT team_id FROM public.team_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);