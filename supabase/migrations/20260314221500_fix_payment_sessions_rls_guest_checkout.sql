-- Ensure payment_sessions supports guest and authenticated checkout flows.
-- This migration hardens/normalizes INSERT policies to avoid production RLS regressions.

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  -- Remove any legacy INSERT policies to avoid contradictory checks.
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_sessions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Checkout can create payment sessions"
ON public.payment_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  flow = ANY (ARRAY['flight'::text, 'hotel'::text, 'car'::text, 'tour'::text, 'transfer'::text])
  AND amount >= 0
  AND currency IS NOT NULL
  AND length(currency) > 0
  AND payment_provider = 'moyasar'
  AND (user_id IS NULL OR auth.uid() = user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Users can view own payment sessions'
  ) THEN
    CREATE POLICY "Users can view own payment sessions"
    ON public.payment_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Admins can view all payment sessions'
  ) THEN
    CREATE POLICY "Admins can view all payment sessions"
    ON public.payment_sessions
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;
