-- Phase 3 migrations: resume_templates, resume_experience_variants (cover_letter_analytics already exists)

-- Resume Templates table
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  content_markdown text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY rt_sel ON public.resume_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rt_ins ON public.resume_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rt_upd ON public.resume_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY rt_del ON public.resume_templates FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rt_user ON public.resume_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_user_default ON public.resume_templates(user_id, is_default);

-- Trigger for updated_at
CREATE TRIGGER update_resume_templates_updated_at
  BEFORE UPDATE ON public.resume_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Resume Experience Variants table
CREATE TABLE IF NOT EXISTS public.resume_experience_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_experience_id uuid NOT NULL,
  job_id uuid NULL REFERENCES public.jobs(id) ON DELETE SET NULL,
  content_markdown text NOT NULL,
  relevance_score int NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_experience_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY rev_sel ON public.resume_experience_variants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY rev_ins ON public.resume_experience_variants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY rev_upd ON public.resume_experience_variants FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rev_user_job ON public.resume_experience_variants(user_id, job_id, relevance_score);
CREATE INDEX IF NOT EXISTS idx_rev_user_exp ON public.resume_experience_variants(user_id, resume_experience_id);