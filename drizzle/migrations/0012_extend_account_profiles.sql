ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text, ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_currency_allowed CHECK (preferred_currency IN ('USD', 'JMD'));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;