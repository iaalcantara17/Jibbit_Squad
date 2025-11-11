-- Add reminder preferences to profiles for UC-040
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reminder_days integer[] DEFAULT ARRAY[1,3,7],
ADD COLUMN IF NOT EXISTS email_reminders boolean DEFAULT true;