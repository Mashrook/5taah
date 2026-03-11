
-- Update guest_bookings INSERT policy to allow 'hotel' type too
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON public.guest_bookings;
CREATE POLICY "Anyone can create guest bookings"
ON public.guest_bookings
FOR INSERT
WITH CHECK (
  booking_type IN ('flight', 'hotel') 
  AND total_price >= 0 
  AND currency IS NOT NULL 
  AND length(currency) > 0
);

-- Update payment_sessions INSERT policy to allow 'hotel' flow too
DROP POLICY IF EXISTS "Anyone can create payment sessions" ON public.payment_sessions;
CREATE POLICY "Anyone can create payment sessions"
ON public.payment_sessions
FOR INSERT
WITH CHECK (
  flow IN ('flight', 'hotel')
  AND amount >= 0 
  AND currency IS NOT NULL 
  AND length(currency) > 0 
  AND payment_provider = 'moyasar'
  AND (user_id IS NULL OR auth.uid() = user_id)
);
