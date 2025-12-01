-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  relationship_type TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  interests TEXT,
  relationship_strength INTEGER DEFAULT 3 CHECK (relationship_strength >= 1 AND relationship_strength <= 5),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Create contact_interactions table
CREATE TABLE public.contact_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interaction_type TEXT NOT NULL,
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_interactions
CREATE POLICY "Users can view own contact interactions"
  ON public.contact_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact interactions"
  ON public.contact_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact interactions"
  ON public.contact_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact interactions"
  ON public.contact_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create contact_reminders table
CREATE TABLE public.contact_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_reminders
CREATE POLICY "Users can view own contact reminders"
  ON public.contact_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact reminders"
  ON public.contact_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact reminders"
  ON public.contact_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact reminders"
  ON public.contact_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create contact_job_links table
CREATE TABLE public.contact_job_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, job_id)
);

-- Enable RLS
ALTER TABLE public.contact_job_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_job_links
CREATE POLICY "Users can view own contact job links"
  ON public.contact_job_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact job links"
  ON public.contact_job_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact job links"
  ON public.contact_job_links FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_user_id ON public.contact_interactions(user_id);
CREATE INDEX idx_contact_reminders_contact_id ON public.contact_reminders(contact_id);
CREATE INDEX idx_contact_reminders_user_id ON public.contact_reminders(user_id);
CREATE INDEX idx_contact_job_links_contact_id ON public.contact_job_links(contact_id);
CREATE INDEX idx_contact_job_links_job_id ON public.contact_job_links(job_id);

-- Trigger to update updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();