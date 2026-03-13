-- 1. Create a secure view that hides key_value for admin UI
CREATE OR REPLACE VIEW public.api_keys_safe AS
SELECT id, service, key_name, 
  CASE 
    WHEN length(key_value) > 8 THEN left(key_value, 4) || '****' || right(key_value, 4)
    ELSE '********'
  END AS key_value_masked,
  provider_url, is_active, created_at, updated_at
FROM public.api_keys;

-- 2. Drop the overly permissive ALL policy on api_keys
DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;

-- 3. Create granular policies
CREATE POLICY "Admins can insert api keys"
ON public.api_keys FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update api keys"
ON public.api_keys FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete api keys"
ON public.api_keys FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can select api keys"
ON public.api_keys FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));