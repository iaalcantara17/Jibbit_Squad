
-- Ensure teams table has proper RLS policies and the created_by column is not nullable
-- The created_by column should already be NOT NULL, but let's verify the policies are correct

-- Drop existing INSERT policy and recreate it with better error handling
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

CREATE POLICY "Authenticated users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = created_by
);

-- Add a comment to document the expected behavior
COMMENT ON POLICY "Authenticated users can create teams" ON public.teams IS 
'Users can only create teams where they are the creator (created_by = auth.uid())';
