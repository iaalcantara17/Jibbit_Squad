-- Add INSERT policy for group_posts so members can create posts
CREATE POLICY "Members can create posts in their groups"
ON public.group_posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM support_group_members 
    WHERE support_group_members.group_id = group_posts.group_id 
    AND support_group_members.user_id = auth.uid()
  )
);

-- Add SELECT policy for group_posts so members can view posts
CREATE POLICY "Members can view posts in their groups"
ON public.group_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_group_members 
    WHERE support_group_members.group_id = group_posts.group_id 
    AND support_group_members.user_id = auth.uid()
  )
);