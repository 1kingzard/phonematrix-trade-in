CREATE SEQUENCE IF NOT EXISTS public.trade_in_request_seq START 10001;

CREATE TABLE public.trade_in_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE DEFAULT ('PM-TI-' || nextval('public.trade_in_request_seq')::text),
  public_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  trade_device jsonb NOT NULL DEFAULT '{}'::jsonb,
  condition text,
  battery_pct integer,
  faults jsonb NOT NULL DEFAULT '[]'::jsonb,
  desired_device jsonb,
  estimate jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_value_usd numeric NOT NULL DEFAULT 0,
  final_value_usd numeric,
  status text NOT NULL DEFAULT 'Quote Created',
  admin_notes text,
  invoice_id uuid,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_in_requests TO authenticated;
GRANT ALL ON public.trade_in_requests TO service_role;
ALTER TABLE public.trade_in_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage trade-in requests" ON public.trade_in_requests FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trade_in_requests_updated_at BEFORE UPDATE ON public.trade_in_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX trade_in_requests_created_idx ON public.trade_in_requests (created_at DESC);

CREATE TABLE public.trade_in_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.trade_in_requests(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_value text,
  to_value text,
  note text,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trade_in_request_history TO authenticated;
GRANT ALL ON public.trade_in_request_history TO service_role;
ALTER TABLE public.trade_in_request_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view history" ON public.trade_in_request_history FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins add history" ON public.trade_in_request_history FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.create_trade_in_request(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.trade_in_requests;
  nm text := btrim(coalesce(payload->>'customer_name',''));
  ph text := btrim(coalesce(payload->>'customer_phone',''));
  em text := nullif(btrim(coalesce(payload->>'customer_email','')),'');
BEGIN
  IF length(nm) < 1 OR length(nm) > 100 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF length(ph) < 5 OR length(ph) > 30 THEN RAISE EXCEPTION 'Invalid phone'; END IF;
  IF em IS NOT NULL AND (length(em) > 255 OR em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN RAISE EXCEPTION 'Invalid email'; END IF;
  IF length(payload::text) > 20000 THEN RAISE EXCEPTION 'Payload too large'; END IF;
  INSERT INTO public.trade_in_requests (user_id, customer_name, customer_phone, customer_email, trade_device, condition,
    battery_pct, faults, desired_device, estimate, estimated_value_usd)
  VALUES (auth.uid(), nm, ph, em, coalesce(payload->'trade_device','{}'::jsonb), left(payload->>'condition', 40),
    nullif(payload->>'battery_pct','')::int, coalesce(payload->'faults','[]'::jsonb), payload->'desired_device',
    coalesce(payload->'estimate','{}'::jsonb), greatest(0, coalesce(nullif(payload->>'estimated_value_usd','')::numeric, 0)))
  RETURNING * INTO r;
  INSERT INTO public.trade_in_request_history (request_id, action, to_value, note)
  VALUES (r.id, 'created', r.status, 'Original quote: $' || r.estimated_value_usd::text);
  RETURN jsonb_build_object('request_code', r.request_code, 'public_token', r.public_token, 'created_at', r.created_at, 'expires_at', r.expires_at);
END $$;

CREATE OR REPLACE FUNCTION public.get_trade_in_request(token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'request_code', request_code, 'customer_name', customer_name,
    'customer_phone_masked', CASE WHEN length(customer_phone) > 4 THEN repeat('•', length(customer_phone)-4) || right(customer_phone, 4) ELSE customer_phone END,
    'trade_device', trade_device, 'condition', condition, 'battery_pct', battery_pct, 'faults', faults,
    'desired_device', desired_device, 'estimate', estimate, 'estimated_value_usd', estimated_value_usd,
    'final_value_usd', final_value_usd, 'status', status, 'created_at', created_at, 'expires_at', expires_at)
  FROM public.trade_in_requests WHERE public_token = token AND length(token) >= 32 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.create_trade_in_request(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_trade_in_request(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_trade_in_request(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trade_in_request(text) TO anon, authenticated;