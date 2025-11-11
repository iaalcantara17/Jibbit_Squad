-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info (Sprint 1)
  professional_headline TEXT,
  phone_number TEXT,
  location TEXT,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  
  -- Employment History stored as JSONB array
  employment_history JSONB DEFAULT '[]'::jsonb,
  
  -- Skills stored as JSONB array
  skills JSONB DEFAULT '[]'::jsonb,
  
  -- Education stored as JSONB array
  education JSONB DEFAULT '[]'::jsonb,
  
  -- Certifications stored as JSONB array
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Projects stored as JSONB array
  projects JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create jobs table (Sprint 2)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job basic info
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  job_url TEXT,
  application_deadline DATE,
  job_description TEXT,
  industry TEXT,
  job_type TEXT,
  
  -- Status pipeline
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected')),
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Company info (JSONB)
  company_info JSONB DEFAULT '{}'::jsonb,
  
  -- Contacts (JSONB array)
  contacts JSONB DEFAULT '[]'::jsonb,
  
  -- Notes and tracking
  notes TEXT,
  interview_notes TEXT,
  salary_notes TEXT,
  
  -- Application materials tracking
  resume_id UUID,
  cover_letter_id UUID,
  
  -- Status history (JSONB array)
  status_history JSONB DEFAULT '[]'::jsonb,
  
  -- Archiving
  is_archived BOOLEAN DEFAULT FALSE,
  archive_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_archived ON public.jobs(is_archived);

-- Create resumes table (Sprint 2)
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  template TEXT DEFAULT 'chronological' CHECK (template IN ('chronological', 'functional', 'hybrid', 'modern', 'classic')),
  
  -- Sections stored as JSONB array
  sections JSONB DEFAULT '[]'::jsonb,
  
  -- Styling options
  styling JSONB DEFAULT '{"fontSize": 11, "fontFamily": "Arial", "colorScheme": "default", "margins": 1, "lineSpacing": 1.15}'::jsonb,
  
  -- Versions (JSONB array)
  versions JSONB DEFAULT '[]'::jsonb,
  
  -- Linked jobs (JSONB array)
  linked_jobs JSONB DEFAULT '[]'::jsonb,
  
  -- AI metadata
  ai_generated JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  times_used INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  success_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Resumes policies
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_default ON public.resumes(is_default);

-- Create cover_letters table (Sprint 2)
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  template TEXT DEFAULT 'formal' CHECK (template IN ('formal', 'creative', 'technical', 'casual')),
  
  -- Content
  content TEXT,
  
  -- Linked job
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  
  -- Tone and style
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('formal', 'casual', 'enthusiastic', 'analytical')),
  style_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- AI metadata
  ai_generated JSONB DEFAULT '{}'::jsonb,
  
  -- Company research data
  company_research JSONB DEFAULT '{}'::jsonb,
  
  -- Version history
  versions JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  times_used INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  response_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cover_letters
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- Cover letters policies
CREATE POLICY "Users can view own cover letters"
  ON public.cover_letters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letters"
  ON public.cover_letters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters"
  ON public.cover_letters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters"
  ON public.cover_letters FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for cover letters
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id ON public.cover_letters(job_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();