CREATE TABLE public.scraped_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source text NOT NULL DEFAULT 'swappa',
  brand text,
  model text NOT NULL,
  storage text,
  condition text,
  market_price_usd numeric NOT NULL,
  suggested_price_usd numeric NOT NULL,
  matched_device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scraped_prices TO authenticated;
GRANT ALL ON public.scraped_prices TO service_role;

ALTER TABLE public.scraped_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scraped_prices admin all" ON public.scraped_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER scraped_prices_updated_at BEFORE UPDATE ON public.scraped_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.scraper_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  markup_percent numeric NOT NULL DEFAULT 60,
  default_source_url text NOT NULL DEFAULT 'https://swappa.com/mobile/buy/apple-iphone',
  source text NOT NULL DEFAULT 'swappa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scraper_settings TO authenticated;
GRANT ALL ON public.scraper_settings TO service_role;

ALTER TABLE public.scraper_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scraper_settings admin all" ON public.scraper_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER scraper_settings_updated_at BEFORE UPDATE ON public.scraper_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.scraper_settings (markup_percent, default_source_url) VALUES (60, 'https://swappa.com/mobile/buy/apple-iphone');