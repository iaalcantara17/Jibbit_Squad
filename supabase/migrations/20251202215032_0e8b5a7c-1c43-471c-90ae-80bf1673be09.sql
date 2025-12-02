-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

-- Recreate with explicit check that should work
CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);