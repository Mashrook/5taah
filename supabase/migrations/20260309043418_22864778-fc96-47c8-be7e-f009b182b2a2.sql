
-- Update guest_bookings RLS to allow car and tour booking types
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON public.guest_bookings;
CREATE POLICY "Anyone can create guest bookings"
ON public.guest_bookings
FOR INSERT
WITH CHECK (
  booking_type = ANY (ARRAY['flight'::text, 'hotel'::text, 'car'::text, 'tour'::text])
  AND total_price >= 0
  AND currency IS NOT NULL
  AND length(currency) > 0
);

-- Update payment_sessions RLS to allow car and tour flows
DROP POLICY IF EXISTS "Anyone can create payment sessions" ON public.payment_sessions;
CREATE POLICY "Anyone can create payment sessions"
ON public.payment_sessions
FOR INSERT
WITH CHECK (
  flow = ANY (ARRAY['flight'::text, 'hotel'::text, 'car'::text, 'tour'::text])
  AND amount >= 0
  AND currency IS NOT NULL
  AND length(currency) > 0
  AND payment_provider = 'moyasar'
  AND (user_id IS NULL OR auth.uid() = user_id)
);
