-- Create question bank items table
CREATE TABLE public.question_bank_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  industry TEXT,
  category TEXT NOT NULL CHECK (category IN ('behavioral', 'technical', 'situational')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('entry', 'mid', 'senior')),
  question_text TEXT NOT NULL,
  star_framework_hint TEXT,
  linked_skills TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question practice tracking table
CREATE TABLE public.question_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank_items(id) ON DELETE CASCADE,
  last_practiced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create indexes for fast querying
CREATE INDEX idx_question_bank_role ON public.question_bank_items(role_title);
CREATE INDEX idx_question_bank_industry ON public.question_bank_items(industry);
CREATE INDEX idx_question_bank_category ON public.question_bank_items(category);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank_items(difficulty);
CREATE INDEX idx_question_bank_skills ON public.question_bank_items USING GIN(linked_skills);
CREATE INDEX idx_question_practice_user ON public.question_practice(user_id);
CREATE INDEX idx_question_practice_question ON public.question_practice(question_id);
CREATE INDEX idx_question_practice_user_last_practiced ON public.question_practice(user_id, last_practiced_at DESC);

-- Enable RLS
ALTER TABLE public.question_bank_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_practice ENABLE ROW LEVEL SECURITY;

-- RLS policies for question_bank_items (public read)
CREATE POLICY "Anyone can view question bank items"
  ON public.question_bank_items
  FOR SELECT
  USING (true);

-- RLS policies for question_practice (user-specific)
CREATE POLICY "Users can view own practice history"
  ON public.question_practice
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice records"
  ON public.question_practice
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice records"
  ON public.question_practice
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice records"
  ON public.question_practice
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on question_bank_items
CREATE TRIGGER update_question_bank_items_updated_at
  BEFORE UPDATE ON public.question_bank_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample questions to get started
INSERT INTO public.question_bank_items (role_title, industry, category, difficulty, question_text, star_framework_hint, linked_skills) VALUES
  ('Software Engineer', 'Technology', 'behavioral', 'entry', 'Tell me about a time when you had to learn a new technology quickly.', 'Situation: Describe the project context. Task: What did you need to learn? Action: How did you approach learning? Result: What was the outcome?', ARRAY['Learning Agility', 'Self-Motivation']),
  ('Software Engineer', 'Technology', 'technical', 'mid', 'How would you design a URL shortening service like bit.ly?', NULL, ARRAY['System Design', 'Databases', 'Scalability']),
  ('Product Manager', 'Technology', 'behavioral', 'mid', 'Describe a situation where you had to prioritize features with limited resources.', 'Situation: What was the product context? Task: What needed prioritization? Action: How did you make the decision? Result: What impact did it have?', ARRAY['Prioritization', 'Stakeholder Management', 'Decision Making']),
  ('Data Analyst', 'Finance', 'technical', 'entry', 'What SQL query would you write to find the top 10 customers by revenue?', NULL, ARRAY['SQL', 'Data Analysis']),
  ('Marketing Manager', 'Retail', 'situational', 'senior', 'Your main competitor just launched a major campaign. How would you respond?', NULL, ARRAY['Strategic Thinking', 'Competitive Analysis', 'Crisis Management']),
  ('Software Engineer', 'Technology', 'behavioral', 'senior', 'Tell me about a time you had to make a difficult technical decision that affected the entire team.', 'Situation: What was the technical challenge? Task: What decision needed to be made? Action: How did you analyze options and communicate? Result: What was the long-term impact?', ARRAY['Technical Leadership', 'Communication', 'Decision Making']),
  ('UX Designer', 'Technology', 'situational', 'mid', 'How would you handle conflicting design feedback from stakeholders?', NULL, ARRAY['Stakeholder Management', 'Communication', 'Design Thinking']),
  ('Sales Representative', 'SaaS', 'behavioral', 'entry', 'Describe a time when you turned a rejection into a success.', 'Situation: What was the initial rejection? Task: What was your goal? Action: How did you approach it differently? Result: What was the outcome?', ARRAY['Resilience', 'Persuasion', 'Problem Solving']);