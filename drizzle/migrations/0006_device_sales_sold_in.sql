ALTER TABLE public.device_sales ADD COLUMN IF NOT EXISTS sold_in text NOT NULL DEFAULT 'US';
ALTER TABLE public.device_sales ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.device_sales ADD COLUMN IF NOT EXISTS rate_used numeric;