-- Clean existing status values to canonical format
UPDATE jobs 
SET status = CASE 
  WHEN LOWER(TRIM(status)) = 'interested' THEN 'interested'
  WHEN LOWER(TRIM(status)) = 'applied' THEN 'applied'
  WHEN LOWER(TRIM(status)) IN ('phone screen', 'phone_screen') THEN 'phone_screen'
  WHEN LOWER(TRIM(status)) = 'interview' THEN 'interview'
  WHEN LOWER(TRIM(status)) = 'offer' THEN 'offer'
  WHEN LOWER(TRIM(status)) = 'rejected' THEN 'rejected'
  ELSE 'interested'
END
WHERE status IS NULL OR status NOT IN ('interested', 'applied', 'phone_screen', 'interview', 'offer', 'rejected');

-- Ensure NOT NULL constraint with default
ALTER TABLE jobs 
ALTER COLUMN status SET DEFAULT 'interested',
ALTER COLUMN status SET NOT NULL;