-- Payment sessions for guest/authenticated checkout (used by flights payment callback)
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  flow text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'initiated',
  payment_provider text NOT NULL DEFAULT 'moyasar',
  payment_id text NULL,
  user_id uuid NULL,
  tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON public.payment_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_payment_id ON public.payment_sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_flow ON public.payment_sessions(flow);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Anyone can create payment sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can create payment sessions" ON public.payment_sessions FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Users can view own payment sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own payment sessions" ON public.payment_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_sessions'
      AND policyname = 'Admins can view all payment sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all payment sessions" ON public.payment_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''))';
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_payment_sessions_updated_at ON public.payment_sessions;
CREATE TRIGGER update_payment_sessions_updated_at
BEFORE UPDATE ON public.payment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Guest bookings table (for guests without an account)
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  booking_type text NOT NULL,
  currency text NOT NULL DEFAULT 'SAR',
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_provider text NULL,
  payment_id text NULL,
  tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL,
  contact_phone text NULL,
  contact_email text NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_guest_bookings_created_at ON public.guest_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_payment_id ON public.guest_bookings(payment_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_bookings'
      AND policyname = 'Anyone can create guest bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can create guest bookings" ON public.guest_bookings FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_bookings'
      AND policyname = 'Admins can view all guest bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all guest bookings" ON public.guest_bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''))';
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_guest_bookings_updated_at ON public.guest_bookings;
CREATE TRIGGER update_guest_bookings_updated_at
BEFORE UPDATE ON public.guest_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
