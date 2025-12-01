-- Create enum for team roles
CREATE TYPE public.team_role AS ENUM ('admin', 'mentor', 'candidate');

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team memberships
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.team_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team invitations
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.team_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID,
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin of a team
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE team_id = _team_id
      AND user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Helper function to check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE team_id = _team_id
      AND user_id = _user_id
  )
$$;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they are members of"
  ON public.teams FOR SELECT
  USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams"
  ON public.teams FOR UPDATE
  USING (public.is_team_admin(auth.uid(), id));

CREATE POLICY "Team admins can delete teams"
  ON public.teams FOR DELETE
  USING (public.is_team_admin(auth.uid(), id));

-- RLS Policies for team_memberships
CREATE POLICY "Users can view memberships of their teams"
  ON public.team_memberships FOR SELECT
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can add members"
  ON public.team_memberships FOR INSERT
  WITH CHECK (
    public.is_team_admin(auth.uid(), team_id)
    OR user_id = auth.uid() -- Allow accepting invitations
  );

CREATE POLICY "Team admins can update member roles"
  ON public.team_memberships FOR UPDATE
  USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can remove members or users can remove themselves"
  ON public.team_memberships FOR DELETE
  USING (
    public.is_team_admin(auth.uid(), team_id)
    OR user_id = auth.uid()
  );

-- RLS Policies for team_invitations
CREATE POLICY "Admins and invited users can view invitations"
  ON public.team_invitations FOR SELECT
  USING (
    public.is_team_admin(auth.uid(), team_id)
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Team admins can create invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Users can accept their invitations"
  ON public.team_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Team admins can delete invitations"
  ON public.team_invitations FOR DELETE
  USING (public.is_team_admin(auth.uid(), team_id));

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);