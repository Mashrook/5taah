-- Tighten permissive INSERT policies (avoid WITH CHECK (true))

-- payment_sessions
DROP POLICY IF EXISTS "Anyone can create payment sessions" ON public.payment_sessions;
CREATE POLICY "Anyone can create payment sessions"
ON public.payment_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  flow IN ('flight')
  AND amount >= 0
  AND currency IS NOT NULL
  AND length(currency) > 0
  AND payment_provider IN ('moyasar')
  AND (user_id IS NULL OR auth.uid() = user_id)
);

-- guest_bookings
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON public.guest_bookings;
CREATE POLICY "Anyone can create guest bookings"
ON public.guest_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  booking_type IN ('flight')
  AND total_price >= 0
  AND currency IS NOT NULL
  AND length(currency) > 0
);
