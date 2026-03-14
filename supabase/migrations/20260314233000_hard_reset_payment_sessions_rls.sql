-- Hard reset RLS policies on payment_sessions to remove hidden/legacy blockers.
-- Some environments may contain FOR ALL policies created manually, which still
-- apply to INSERT and cause checkout failures.

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_sessions', p.policyname);
  END LOOP;
END $$;

GRANT INSERT ON TABLE public.payment_sessions TO anon, authenticated;
GRANT SELECT ON TABLE public.payment_sessions TO authenticated;

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

CREATE POLICY "Users can view own payment sessions"
ON public.payment_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment sessions"
ON public.payment_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
