ALTER TABLE public.scraper_settings
  ADD COLUMN IF NOT EXISTS swappa_url text NOT NULL DEFAULT 'https://swappa.com/buy/apple-iphone',
  ADD COLUMN IF NOT EXISTS backmarket_url text NOT NULL DEFAULT 'https://www.backmarket.com/en-us/l/iphone/e8724fea-197e-4815-85ce-21b8068020cc',
  ADD COLUMN IF NOT EXISTS auto_refresh boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz;

CREATE TABLE IF NOT EXISTS public.scraper_cron_token (
  id int PRIMARY KEY DEFAULT 1,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);
GRANT ALL ON public.scraper_cron_token TO service_role;
ALTER TABLE public.scraper_cron_token ENABLE ROW LEVEL SECURITY;
INSERT INTO public.scraper_cron_token (id) VALUES (1) ON CONFLICT DO NOTHING;