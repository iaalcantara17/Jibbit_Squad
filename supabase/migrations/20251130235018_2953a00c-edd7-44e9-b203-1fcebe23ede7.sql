-- Informational Interviews tracking
CREATE TABLE informational_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  outreach_sent_at TIMESTAMPTZ,
  scheduled_date TIMESTAMPTZ,
  prep_checklist JSONB DEFAULT '{"topics": [], "questions_prepared": false, "research_completed": false, "goals_defined": false}'::jsonb,
  outcome_notes TEXT,
  follow_up_tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'outreach_pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_informational_interviews_user ON informational_interviews(user_id);
CREATE INDEX idx_informational_interviews_contact ON informational_interviews(contact_id);
CREATE INDEX idx_informational_interviews_status ON informational_interviews(user_id, status);

ALTER TABLE informational_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own informational interviews"
  ON informational_interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own informational interviews"
  ON informational_interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own informational interviews"
  ON informational_interviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own informational interviews"
  ON informational_interviews FOR DELETE
  USING (auth.uid() = user_id);

-- Networking Campaigns
CREATE TABLE networking_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_companies TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  goal TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_networking_campaigns_user ON networking_campaigns(user_id);

ALTER TABLE networking_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns"
  ON networking_campaigns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Campaign Outreaches (with A/B testing)
CREATE TABLE campaign_outreaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES networking_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  variant TEXT CHECK (variant IN ('A', 'B')),
  sent_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  response_date TIMESTAMPTZ,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_outreaches_campaign ON campaign_outreaches(campaign_id);
CREATE INDEX idx_campaign_outreaches_contact ON campaign_outreaches(contact_id);

ALTER TABLE campaign_outreaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaign outreaches"
  ON campaign_outreaches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Professional References
CREATE TABLE professional_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_description TEXT,
  can_speak_to TEXT[] DEFAULT '{}',
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('email', 'phone', 'either')),
  notes TEXT,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_professional_references_user ON professional_references(user_id);
CREATE INDEX idx_professional_references_contact ON professional_references(contact_id);

ALTER TABLE professional_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own references"
  ON professional_references FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reference Requests (track usage per application)
CREATE TABLE reference_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_id UUID NOT NULL REFERENCES professional_references(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  provided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reference_requests_reference ON reference_requests(reference_id);
CREATE INDEX idx_reference_requests_job ON reference_requests(job_id);

ALTER TABLE reference_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reference requests"
  ON reference_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at timestamps
CREATE TRIGGER update_informational_interviews_updated_at
  BEFORE UPDATE ON informational_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_networking_campaigns_updated_at
  BEFORE UPDATE ON networking_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_references_updated_at
  BEFORE UPDATE ON professional_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();