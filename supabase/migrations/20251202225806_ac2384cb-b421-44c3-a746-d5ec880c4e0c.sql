-- Drop existing INSERT policy for teams
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

-- Create new INSERT policy with explicit auth.uid() check
CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
);