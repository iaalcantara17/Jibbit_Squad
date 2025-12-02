-- Fix progress shares RLS for public access
-- Allow anyone to read active progress shares by token
CREATE POLICY "Progress shares viewable by token" ON public.progress_shares
FOR SELECT
USING (is_active = true);

-- Allow anyone to log access to shares
CREATE POLICY "Anyone can log progress share access" ON public.progress_share_access_log
FOR INSERT
WITH CHECK (true);

-- Ensure progress shares can be updated for last_accessed_at
CREATE POLICY "System can update progress share access time" ON public.progress_shares
FOR UPDATE
USING (true)
WITH CHECK (true);