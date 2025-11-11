-- UC-042: Application Materials Usage Tracking
CREATE TABLE IF NOT EXISTS public.materials_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_id uuid NULL REFERENCES public.resumes(id) ON DELETE SET NULL,
  cover_letter_id uuid NULL REFERENCES public.cover_letters(id) ON DELETE SET NULL,
  resume_version_name text,
  cover_letter_version_name text,
  used_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.materials_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materials usage" 
  ON public.materials_usage FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials usage" 
  ON public.materials_usage FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mu_user_job ON public.materials_usage(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_mu_used_at ON public.materials_usage(user_id, used_at DESC);

-- UC-044: Application Status History
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status history" 
  ON public.application_status_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status history" 
  ON public.application_status_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ash_user_job ON public.application_status_history(user_id, job_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_ash_user_changed ON public.application_status_history(user_id, changed_at DESC);

-- UC-069: Add automation_rule_runs table (automation_rules already exists)
CREATE TABLE IF NOT EXISTS public.automation_rule_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  job_id uuid NULL REFERENCES public.jobs(id) ON DELETE SET NULL,
  run_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL CHECK (outcome IN ('success', 'skipped', 'error')),
  message text,
  dedupe_key text,
  UNIQUE (user_id, rule_id, dedupe_key)
);

ALTER TABLE public.automation_rule_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation runs" 
  ON public.automation_rule_runs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation runs" 
  ON public.automation_rule_runs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_arr_user_rule ON public.automation_rule_runs(user_id, rule_id, run_at DESC);
CREATE INDEX IF NOT EXISTS idx_arr_dedupe ON public.automation_rule_runs(user_id, rule_id, dedupe_key);

-- Update automation_rules table to match UC-069 spec (add columns if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_rules' AND column_name = 'name') THEN
    ALTER TABLE public.automation_rules ADD COLUMN name text NOT NULL DEFAULT 'Unnamed Rule';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_rules' AND column_name = 'is_enabled') THEN
    ALTER TABLE public.automation_rules ADD COLUMN is_enabled boolean NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_rules' AND column_name = 'trigger') THEN
    ALTER TABLE public.automation_rules ADD COLUMN trigger jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automation_rules' AND column_name = 'action') THEN
    ALTER TABLE public.automation_rules ADD COLUMN action jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END$$;