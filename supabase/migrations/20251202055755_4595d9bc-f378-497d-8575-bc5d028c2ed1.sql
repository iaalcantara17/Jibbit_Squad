-- Fix advisor booking: Update coaching_sessions check constraint to match UI values
ALTER TABLE coaching_sessions
DROP CONSTRAINT IF EXISTS coaching_sessions_session_type_check;

ALTER TABLE coaching_sessions
ADD CONSTRAINT coaching_sessions_session_type_check
CHECK (session_type IN (
  'career_coaching',
  'resume_review', 
  'interview_prep',
  'salary_negotiation',
  'job_search_strategy',
  'career_strategy',
  'general'
));

-- Fix technical prep: Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create challenges"
ON technical_challenges
FOR INSERT
TO authenticated
WITH CHECK (true);