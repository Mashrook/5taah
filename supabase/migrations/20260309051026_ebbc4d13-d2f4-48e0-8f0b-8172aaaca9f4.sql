-- Fix security definer view - use SECURITY INVOKER instead
CREATE OR REPLACE VIEW public.api_keys_safe 
WITH (security_invoker = true) AS
SELECT id, service, key_name, 
  CASE 
    WHEN length(key_value) > 8 THEN left(key_value, 4) || '****' || right(key_value, 4)
    ELSE '********'
  END AS key_value_masked,
  provider_url, is_active, created_at, updated_at
FROM public.api_keys;