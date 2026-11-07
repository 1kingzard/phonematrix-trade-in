DROP POLICY IF EXISTS "Anyone reads settings" ON public.imei_settings;
REVOKE ALL ON public.imei_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imei_settings TO authenticated;
GRANT ALL ON public.imei_settings TO service_role;
ALTER TABLE public.imei_settings ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.get_imei_availability()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'resale_enabled', EXISTS (SELECT 1 FROM public.imei_settings WHERE key = 'resale_enabled' AND value = 'true'::jsonb),
    'topups_enabled', EXISTS (SELECT 1 FROM public.imei_settings WHERE key = 'topups_enabled' AND value = 'true'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.get_imei_availability() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_imei_availability() TO anon, authenticated, service_role;