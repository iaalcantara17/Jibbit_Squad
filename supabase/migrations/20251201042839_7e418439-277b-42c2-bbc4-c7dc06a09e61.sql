-- UC-087: Add constraint to status and optimal_send_time (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referral_requests_status_check'
  ) THEN
    ALTER TABLE referral_requests 
    ADD CONSTRAINT referral_requests_status_check CHECK (status IN ('draft', 'pending', 'sent', 'responded', 'declined', 'completed'));
  END IF;
END $$;

ALTER TABLE referral_requests
ADD COLUMN IF NOT EXISTS optimal_send_time TIMESTAMP WITH TIME ZONE;

-- UC-092: Add contact connections for 2nd/3rd degree discovery
CREATE TABLE IF NOT EXISTS public.contact_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id_a UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_id_b UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, contact_id_a, contact_id_b)
);

-- RLS for contact_connections
ALTER TABLE contact_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_connections' AND policyname = 'Users can manage own contact connections'
  ) THEN
    CREATE POLICY "Users can manage own contact connections"
    ON contact_connections FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UC-092: Add alumni fields to contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS degree TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS influence_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_industry_leader BOOLEAN DEFAULT false;

-- Add constraints separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_influence_score_check'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_influence_score_check CHECK (influence_score >= 0 AND influence_score <= 100);
  END IF;
END $$;

-- UC-092: Add event participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES networking_events(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  participant_role TEXT NOT NULL CHECK (participant_role IN ('speaker', 'attendee', 'organizer', 'panelist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, contact_id)
);

-- RLS for event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_participants' AND policyname = 'Users can manage own event participants'
  ) THEN
    CREATE POLICY "Users can manage own event participants"
    ON event_participants FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UC-113: Add family supporters table
CREATE TABLE IF NOT EXISTS public.family_supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supporter_name TEXT NOT NULL,
  supporter_email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view_progress' CHECK (access_level IN ('view_progress', 'view_all', 'can_message')),
  can_send_messages BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for family_supporters
ALTER TABLE family_supporters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'family_supporters' AND policyname = 'Users can manage own supporters'
  ) THEN
    CREATE POLICY "Users can manage own supporters"
    ON family_supporters FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UC-113: Add supporter messages table
CREATE TABLE IF NOT EXISTS public.supporter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID NOT NULL REFERENCES family_supporters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for supporter_messages
ALTER TABLE supporter_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supporter_messages' AND policyname = 'Users can view messages to them'
  ) THEN
    CREATE POLICY "Users can view messages to them"
    ON supporter_messages FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supporter_messages' AND policyname = 'Supporters can insert messages'
  ) THEN
    CREATE POLICY "Supporters can insert messages"
    ON supporter_messages FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM family_supporters 
        WHERE id = supporter_messages.supporter_id 
        AND can_send_messages = true 
        AND is_muted = false
      )
    );
  END IF;
END $$;

-- UC-113: Add user updates table
CREATE TABLE IF NOT EXISTS public.user_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  update_text TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('milestone', 'progress', 'achievement', 'general')),
  visibility TEXT NOT NULL DEFAULT 'all_supporters' CHECK (visibility IN ('all_supporters', 'selected_supporters', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for user_updates
ALTER TABLE user_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_updates' AND policyname = 'Users can manage own updates'
  ) THEN
    CREATE POLICY "Users can manage own updates"
    ON user_updates FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON referral_requests(status);
CREATE INDEX IF NOT EXISTS idx_referral_requests_follow_up ON referral_requests(next_followup_at);
CREATE INDEX IF NOT EXISTS idx_referral_requests_optimal_send ON referral_requests(optimal_send_time);
CREATE INDEX IF NOT EXISTS idx_contact_connections_user ON contact_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_alumni ON contacts(school, graduation_year) WHERE school IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_influencer ON contacts(is_influencer, is_industry_leader) WHERE is_influencer = true OR is_industry_leader = true;
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_family_supporters_token ON family_supporters(invite_token);
CREATE INDEX IF NOT EXISTS idx_supporter_messages_user ON supporter_messages(user_id, is_read);