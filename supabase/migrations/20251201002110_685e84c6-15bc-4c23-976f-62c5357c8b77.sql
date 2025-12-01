-- Table for internal team-based document sharing
CREATE TABLE public.document_shares_internal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter')),
  document_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, shared_with_user_id, document_type, document_id)
);

-- Table for document comments with text anchoring
CREATE TABLE public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter')),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  quoted_text TEXT,
  selection_start INTEGER,
  selection_end INTEGER,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_shares_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Policies for document_shares_internal
CREATE POLICY "dsi_sel"
ON public.document_shares_internal FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "dsi_ins"
ON public.document_shares_internal FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dsi_del"
ON public.document_shares_internal FOR DELETE
USING (auth.uid() = owner_id);

-- Helper function for document access
CREATE OR REPLACE FUNCTION public.has_document_access(
  _user_id UUID,
  _document_type TEXT,
  _document_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.document_shares_internal
    WHERE shared_with_user_id = _user_id
    AND document_type = _document_type
    AND document_id = _document_id
  ) OR
  (_document_type = 'resume' AND EXISTS (
    SELECT 1 FROM public.resumes WHERE id = _document_id AND user_id = _user_id
  )) OR
  (_document_type = 'cover_letter' AND EXISTS (
    SELECT 1 FROM public.cover_letters WHERE id = _document_id AND user_id = _user_id
  ));
$$;

-- Policies for document_comments
CREATE POLICY "dc_sel"
ON public.document_comments FOR SELECT
USING (public.has_document_access(auth.uid(), document_type, document_id));

CREATE POLICY "dc_ins"
ON public.document_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.document_shares_internal dsi
    WHERE dsi.document_type = document_comments.document_type
    AND dsi.document_id = document_comments.document_id
    AND dsi.shared_with_user_id = auth.uid()
    AND dsi.permission = 'comment'
  ) OR
  (document_type = 'resume' AND EXISTS (
    SELECT 1 FROM public.resumes r WHERE r.id = document_comments.document_id AND r.user_id = auth.uid()
  )) OR
  (document_type = 'cover_letter' AND EXISTS (
    SELECT 1 FROM public.cover_letters cl WHERE cl.id = document_comments.document_id AND cl.user_id = auth.uid()
  ))
);

CREATE POLICY "dc_upd"
ON public.document_comments FOR UPDATE
USING (
  auth.uid() = user_id OR
  (document_type = 'resume' AND EXISTS (
    SELECT 1 FROM public.resumes r WHERE r.id = document_comments.document_id AND r.user_id = auth.uid()
  )) OR
  (document_type = 'cover_letter' AND EXISTS (
    SELECT 1 FROM public.cover_letters cl WHERE cl.id = document_comments.document_id AND cl.user_id = auth.uid()
  ))
);

-- Trigger for updated_at
CREATE TRIGGER update_document_comments_updated_at
BEFORE UPDATE ON public.document_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();