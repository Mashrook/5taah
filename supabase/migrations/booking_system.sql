-- 5ATTH Travel - Booking System Migration
-- Run this SQL in your Supabase SQL Editor

-- ========== Offers Table ==========
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  season TEXT,
  discount INTEGER DEFAULT 0,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  currency TEXT DEFAULT 'SAR',
  valid_until DATE,
  destination TEXT,
  includes JSONB DEFAULT '[]',
  before_travel JSONB DEFAULT '[]',
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active offers" ON offers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage offers" ON offers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========== Activities Table ==========
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  city TEXT,
  category TEXT,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'SAR',
  duration TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active activities" ON activities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage activities" ON activities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========== Bookings Table (Unified) ==========
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL DEFAULT ('BK' || upper(substring(gen_random_uuid()::text, 1, 8))),
  flow TEXT NOT NULL CHECK (flow IN ('flight', 'hotel', 'car', 'tour', 'transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'cancelled', 'failed')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SAR',
  payment_provider TEXT DEFAULT 'moyasar',
  payment_id TEXT,
  payment_session_id UUID REFERENCES payment_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_phone TEXT,
  guest_id_number TEXT,
  guest_email TEXT,
  details_json JSONB DEFAULT '{}',
  amadeus_order_id TEXT,
  amadeus_pnr TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_booking_ref_idx ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_flow_idx ON bookings(flow);

-- RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert booking" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- ========== Guest Bookings Table ==========
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  traveler_name TEXT NOT NULL,
  traveler_email TEXT,
  traveler_phone TEXT,
  traveler_id_type TEXT,
  traveler_id_number TEXT,
  traveler_passport_expiry DATE,
  traveler_date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert guest booking" ON guest_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view guest bookings" ON guest_bookings FOR SELECT USING (true);

-- Insert sample offers for testing
INSERT INTO public.offers (title, subtitle, description, image_url, season, discount, price, original_price, currency, valid_until, destination, includes, before_travel, duration, is_active, sort_order) VALUES
('عرض شتاء العُلا', 'تجربة صحراوية فاخرة مع جولات تاريخية وإقامة مميزة', 'استمتع بجمال الصحراء في الشتاء', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800', 'winter', 35, 2730, 4200, 'SAR', '2026-03-31', 'العُلا، السعودية', '["إقامة 3 ليالٍ", "جولة صحراوية مميزة", "تذاكر داخلية"]', '["احجز قبل أسبوعين", "ملابس مريحة"]', '4 أيام / 3 ليالٍ', true, 1),
('باقة جدة البحرية', 'الإقامة على الكورنيش مع جولة مدينة وأنشطة مائية', 'استمتع بإجازة بحرية مميزة', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800', 'صيفي', 25, 2325, 3100, 'SAR', '2026-06-15', 'جدة، السعودية', '["إقامة فاخرة", "جولة بحرية", "رحلة غوص"]', '["واقي شمسي ضروري"]', '3 أيام / 2 ليالٍ', true, 2),
('عطلة الرياض العائلية', 'باقة عائلية قريبة من الفعاليات والترفيه', 'عطلة عائلية لا تُنسى', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'عائلي', 20, 1920, 2400, 'SAR', '2026-05-01', 'الرياض، السعودية', '["إقامة 2 ليالٍ", "تذاكر فعاليات"]', '["تذاكر مسبقة للفعاليات"]', '3 أيام / 2 ليالٍ', true, 3);
