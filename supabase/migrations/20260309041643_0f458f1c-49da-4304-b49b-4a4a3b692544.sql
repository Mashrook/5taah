-- Fix permissive INSERT policy flagged by linter (study_applications)
DROP POLICY IF EXISTS "Anyone can submit application" ON public.study_applications;
CREATE POLICY "Anyone can submit application"
ON public.study_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) > 3
  AND position('@' in email) > 1
  AND phone IS NOT NULL
  AND length(phone) >= 8
  AND full_name IS NOT NULL
  AND length(full_name) >= 2
);
