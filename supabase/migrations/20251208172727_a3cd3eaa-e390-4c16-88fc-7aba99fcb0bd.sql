-- Fix RLS on salary_benchmarks table
ALTER TABLE public.salary_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view salary benchmarks" ON public.salary_benchmarks;
CREATE POLICY "Anyone can view salary benchmarks"
ON public.salary_benchmarks
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert salary benchmarks" ON public.salary_benchmarks;
CREATE POLICY "Authenticated users can insert salary benchmarks"
ON public.salary_benchmarks
FOR INSERT WITH CHECK (auth.role() = 'authenticated');