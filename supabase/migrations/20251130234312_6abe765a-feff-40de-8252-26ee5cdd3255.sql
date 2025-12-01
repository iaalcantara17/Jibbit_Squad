-- Create networking_events table
CREATE TABLE public.networking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT NOT NULL DEFAULT 'in-person',
  goals TEXT,
  prep_checklist JSONB DEFAULT '[]'::jsonb,
  attended BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('in-person', 'virtual'))
);

-- Enable RLS
ALTER TABLE public.networking_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for networking_events
CREATE POLICY "Users can view own events"
  ON public.networking_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.networking_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.networking_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.networking_events FOR DELETE
  USING (auth.uid() = user_id);

-- Create event_connections table
CREATE TABLE public.event_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.networking_events(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.event_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_connections
CREATE POLICY "Users can view own event connections"
  ON public.event_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event connections"
  ON public.event_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own event connections"
  ON public.event_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create event_outcomes table
CREATE TABLE public.event_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.networking_events(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  referral_request_id UUID REFERENCES public.referral_requests(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_outcome_type CHECK (outcome_type IN ('referral_requested', 'application_influenced', 'interview_sourced', 'other'))
);

-- Enable RLS
ALTER TABLE public.event_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_outcomes
CREATE POLICY "Users can view own event outcomes"
  ON public.event_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event outcomes"
  ON public.event_outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event outcomes"
  ON public.event_outcomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event outcomes"
  ON public.event_outcomes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_networking_events_user_id ON public.networking_events(user_id);
CREATE INDEX idx_networking_events_date ON public.networking_events(event_date);
CREATE INDEX idx_event_connections_event_id ON public.event_connections(event_id);
CREATE INDEX idx_event_connections_contact_id ON public.event_connections(contact_id);
CREATE INDEX idx_event_outcomes_event_id ON public.event_outcomes(event_id);
CREATE INDEX idx_event_outcomes_job_id ON public.event_outcomes(job_id);

-- Triggers to update updated_at
CREATE TRIGGER update_networking_events_updated_at
  BEFORE UPDATE ON public.networking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();