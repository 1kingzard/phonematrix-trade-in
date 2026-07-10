CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os text NOT NULL DEFAULT '',
  brand text NOT NULL,
  model text NOT NULL,
  condition text NOT NULL,
  storage text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  screen_replacement numeric NOT NULL DEFAULT 0,
  battery_replacement numeric NOT NULL DEFAULT 0,
  rear_glass_replacement numeric NOT NULL DEFAULT 0,
  colors text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand, model, condition, storage)
);

GRANT SELECT ON public.devices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices readable by anyone" ON public.devices FOR SELECT USING (true);
CREATE POLICY "devices admin insert" ON public.devices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "devices admin update" ON public.devices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "devices admin delete" ON public.devices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;