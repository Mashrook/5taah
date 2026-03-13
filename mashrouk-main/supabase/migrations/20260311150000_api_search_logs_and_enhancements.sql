-- ========== API Search Logs — track Amadeus & Travelpayouts searches =========
CREATE TABLE IF NOT EXISTS public.api_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,          -- 'amadeus' | 'travelpayouts'
  search_type TEXT NOT NULL,       -- 'flight' | 'hotel' | 'car' | 'tour' | 'transfer'
  search_params JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read search logs"
  ON public.api_search_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Anyone can insert search logs"
  ON public.api_search_logs FOR INSERT
  WITH CHECK (true);

-- ========== Add provider tracking columns to bookings =========
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS api_provider TEXT,
  ADD COLUMN IF NOT EXISTS api_offer_id TEXT,
  ADD COLUMN IF NOT EXISTS api_confirmation_id TEXT,
  ADD COLUMN IF NOT EXISTS travelers_json JSONB DEFAULT '[]';

-- ========== Add multi-traveler columns to payment_sessions =========
ALTER TABLE public.payment_sessions
  ADD COLUMN IF NOT EXISTS travelers_count INTEGER DEFAULT 1;

-- ========== Create index on api_search_logs for analytics =========
CREATE INDEX IF NOT EXISTS idx_api_search_logs_provider ON public.api_search_logs(provider, search_type);
CREATE INDEX IF NOT EXISTS idx_api_search_logs_created ON public.api_search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_api_provider ON public.bookings(api_provider);
