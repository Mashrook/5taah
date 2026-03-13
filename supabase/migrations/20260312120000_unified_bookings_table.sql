-- Unified bookings table for all service flows
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text UNIQUE NOT NULL DEFAULT ('BK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  flow text NOT NULL CHECK (flow IN ('flight', 'hotel', 'car', 'tour', 'transfer', 'activity')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  
  -- Guest info (for non-authenticated bookings)
  guest_name text,
  guest_phone text,
  guest_email text,
  
  -- Authenticated user
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id uuid,
  
  -- Payment reference
  payment_session_id uuid,
  payment_id text,
  
  -- Amadeus / provider references
  amadeus_order_id text,
  provider_ref text,
  
  -- All booking details stored as JSON
  details_json jsonb DEFAULT '{}'::jsonb,
  travelers_json jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flow ON public.bookings(flow);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_ref ON public.bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_session_id ON public.bookings(payment_session_id);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can do anything (for Edge Functions)
CREATE POLICY "Service role full access"
  ON public.bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous inserts (for guest bookings via Edge Functions using service_role)
-- The moyasar-verify Edge Function runs with service_role key, so it can insert.

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
  RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_bookings_updated_at();
