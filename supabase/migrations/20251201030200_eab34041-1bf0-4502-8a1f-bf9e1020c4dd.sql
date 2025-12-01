-- ============================================
-- UC-112: Peer Networking and Support Groups
-- ============================================

-- Support groups table
CREATE TABLE IF NOT EXISTS public.support_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('industry', 'role', 'location', 'general')),
  industry TEXT,
  role TEXT,
  location TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  member_count INTEGER NOT NULL DEFAULT 0
);

-- Support group memberships
CREATE TABLE IF NOT EXISTS public.support_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  privacy_level TEXT NOT NULL DEFAULT 'anonymous' CHECK (privacy_level IN ('anonymous', 'name_only', 'full_profile')),
  UNIQUE(group_id, user_id)
);

-- Group posts/insights (anonymous sharing)
CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('insight', 'question', 'success_story', 'resource')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reaction_count INTEGER NOT NULL DEFAULT 0
);

-- Group challenges (accountability programs)
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.support_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('applications', 'networking', 'skills', 'interview_prep')),
  target_value INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Challenge participation
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

-- Group webinars/coaching sessions
CREATE TABLE IF NOT EXISTS public.group_webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.support_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  host_name TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT,
  recording_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Peer referrals/opportunities
CREATE TABLE IF NOT EXISTS public.peer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.support_groups(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('job_opening', 'referral_offer', 'networking_contact')),
  description TEXT,
  application_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- UC-114: Corporate Career Services Integration
-- ============================================

-- Institutional settings (white-label, compliance)
CREATE TABLE IF NOT EXISTS public.institutional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  custom_domain TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Institutional cohorts (bulk onboarding)
CREATE TABLE IF NOT EXISTS public.institutional_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutional_settings(id) ON DELETE CASCADE,
  cohort_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cohort members (bulk onboarding results)
CREATE TABLE IF NOT EXISTS public.cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.institutional_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  UNIQUE(cohort_id, user_id)
);

-- Audit logs (compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data retention policies (compliance)
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutional_settings(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- UC-115: External Advisor and Coach Integration
-- ============================================

-- Advisor profiles
CREATE TABLE IF NOT EXISTS public.advisor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  specialization TEXT[],
  bio TEXT,
  hourly_rate NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coaching sessions
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES public.advisor_profiles(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('resume_review', 'interview_prep', 'career_strategy', 'general')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session payments/billing
CREATE TABLE IF NOT EXISTS public.session_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL,
  advisor_id UUID NOT NULL REFERENCES public.advisor_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT,
  provider_transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================

-- Support groups RLS
ALTER TABLE public.support_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public support groups"
ON public.support_groups FOR SELECT
USING (is_private = false OR created_by = auth.uid());

CREATE POLICY "Users can create support groups"
ON public.support_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their groups"
ON public.support_groups FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their groups"
ON public.support_groups FOR DELETE
USING (auth.uid() = created_by);

-- Support group members RLS
ALTER TABLE public.support_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group memberships"
ON public.support_group_members FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.support_groups WHERE id = group_id AND created_by = auth.uid())
);

CREATE POLICY "Users can join groups"
ON public.support_group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.support_group_members FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their privacy settings"
ON public.support_group_members FOR UPDATE
USING (auth.uid() = user_id);

-- Group posts RLS
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group posts"
ON public.group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = group_posts.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can create posts"
ON public.group_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = group_posts.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authors can update their posts"
ON public.group_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Authors can delete their posts"
ON public.group_posts FOR DELETE
USING (auth.uid() = user_id);

-- Group challenges RLS
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view challenges"
ON public.group_challenges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = group_challenges.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can create challenges"
ON public.group_challenges FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = group_challenges.group_id AND user_id = auth.uid()
  )
);

-- Challenge participants RLS
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their participation"
ON public.challenge_participants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
ON public.challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- Group webinars RLS
ALTER TABLE public.group_webinars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view webinars"
ON public.group_webinars FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = group_webinars.group_id AND user_id = auth.uid()
  )
);

-- Peer referrals RLS
ALTER TABLE public.peer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view peer referrals"
ON public.peer_referrals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = peer_referrals.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can share referrals"
ON public.peer_referrals FOR INSERT
WITH CHECK (
  auth.uid() = shared_by_user_id AND
  EXISTS (
    SELECT 1 FROM public.support_group_members
    WHERE group_id = peer_referrals.group_id AND user_id = auth.uid()
  )
);

-- Institutional settings RLS
ALTER TABLE public.institutional_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can manage settings"
ON public.institutional_settings FOR ALL
USING (auth.uid() = created_by);

-- Institutional cohorts RLS
ALTER TABLE public.institutional_cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can manage cohorts"
ON public.institutional_cohorts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.institutional_settings
    WHERE id = institutional_cohorts.institution_id AND created_by = auth.uid()
  )
);

-- Cohort members RLS
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their cohort membership"
ON public.cohort_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Institution admins can manage cohort members"
ON public.cohort_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.institutional_cohorts ic
    JOIN public.institutional_settings ist ON ic.institution_id = ist.id
    WHERE ic.id = cohort_members.cohort_id AND ist.created_by = auth.uid()
  )
);

-- Audit logs RLS (read-only for admins)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Data retention policies RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can manage retention policies"
ON public.data_retention_policies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.institutional_settings
    WHERE id = data_retention_policies.institution_id AND created_by = auth.uid()
  )
);

-- Advisor profiles RLS
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active advisors"
ON public.advisor_profiles FOR SELECT
USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their advisor profile"
ON public.advisor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their profile"
ON public.advisor_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Coaching sessions RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients and advisors can view sessions"
ON public.coaching_sessions FOR SELECT
USING (
  auth.uid() = client_user_id OR
  EXISTS (
    SELECT 1 FROM public.advisor_profiles
    WHERE id = coaching_sessions.advisor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create sessions"
ON public.coaching_sessions FOR INSERT
WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Clients and advisors can update sessions"
ON public.coaching_sessions FOR UPDATE
USING (
  auth.uid() = client_user_id OR
  EXISTS (
    SELECT 1 FROM public.advisor_profiles
    WHERE id = coaching_sessions.advisor_id AND user_id = auth.uid()
  )
);

-- Session payments RLS
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients and advisors can view payments"
ON public.session_payments FOR SELECT
USING (
  auth.uid() = client_user_id OR
  EXISTS (
    SELECT 1 FROM public.advisor_profiles
    WHERE id = session_payments.advisor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create payments"
ON public.session_payments FOR INSERT
WITH CHECK (auth.uid() = client_user_id);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_support_group_members_user_id ON public.support_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_support_group_members_group_id ON public.support_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_challenges_group_id ON public.group_challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_webinars_group_id ON public.group_webinars(group_id);
CREATE INDEX IF NOT EXISTS idx_peer_referrals_group_id ON public.peer_referrals(group_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON public.cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client_user_id ON public.coaching_sessions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_advisor_id ON public.coaching_sessions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_session_id ON public.session_payments(session_id);