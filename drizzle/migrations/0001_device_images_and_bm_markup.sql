CREATE TABLE public.device_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  image_url text NOT NULL,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand, model)
);
GRANT SELECT ON public.device_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.device_images TO authenticated;
GRANT ALL ON public.device_images TO service_role;
ALTER TABLE public.device_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view device images" ON public.device_images FOR SELECT USING (true);
CREATE POLICY "Admins manage device images" ON public.device_images FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER device_images_updated_at BEFORE UPDATE ON public.device_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.scraper_settings ADD COLUMN backmarket_markup_percent numeric NOT NULL DEFAULT 20;