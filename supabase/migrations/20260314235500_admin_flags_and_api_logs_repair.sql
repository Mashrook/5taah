-- Repair migration for admin API controls and API logs visibility.

CREATE TABLE IF NOT EXISTS public.api_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  search_type text NOT NULL,
  search_params jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  response_time_ms integer,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_search_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_api_search_logs_provider ON public.api_search_logs(provider, search_type);
CREATE INDEX IF NOT EXISTS idx_api_search_logs_created ON public.api_search_logs(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'api_search_logs'
      AND policyname = 'Admin can read search logs'
  ) THEN
    CREATE POLICY "Admin can read search logs"
      ON public.api_search_logs
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'api_search_logs'
      AND policyname = 'Anyone can insert search logs'
  ) THEN
    CREATE POLICY "Anyone can insert search logs"
      ON public.api_search_logs
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenants'
      AND policyname = 'Admins can view all tenants'
  ) THEN
    CREATE POLICY "Admins can view all tenants"
      ON public.tenants
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feature_flags'
      AND policyname = 'Admins can manage all flags'
  ) THEN
    CREATE POLICY "Admins can manage all flags"
      ON public.feature_flags
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;
