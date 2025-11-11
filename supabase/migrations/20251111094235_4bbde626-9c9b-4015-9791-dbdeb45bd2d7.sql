-- Create indexes for job search and filtering
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_filters ON public.jobs(user_id, industry, location, application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON public.jobs USING GIN (job_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON public.jobs USING GIN (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON public.jobs USING GIN (job_description gin_trgm_ops);