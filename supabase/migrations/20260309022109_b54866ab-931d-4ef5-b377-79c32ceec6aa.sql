
-- Study Programs table
CREATE TABLE public.study_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  country_code text NOT NULL DEFAULT '',
  description text,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  duration text NOT NULL,
  level text NOT NULL DEFAULT 'lang',
  accommodation_type text,
  university_name text,
  tag text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Study Applications table
CREATE TABLE public.study_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  program_id uuid REFERENCES public.study_programs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  nationality text,
  preferred_country text,
  preferred_level text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for study_programs (public read, admin write)
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active programs"
  ON public.study_programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage programs"
  ON public.study_programs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS for study_applications
ALTER TABLE public.study_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
  ON public.study_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own applications"
  ON public.study_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications"
  ON public.study_applications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
