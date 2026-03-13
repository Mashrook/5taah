
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL DEFAULT '',
  excerpt text,
  content text,
  image_url text,
  category text NOT NULL DEFAULT 'عام',
  author text DEFAULT 'فريق التحرير',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles" ON public.articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage articles" ON public.articles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
