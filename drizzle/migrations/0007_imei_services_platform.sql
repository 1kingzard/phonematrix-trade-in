CREATE TABLE public.imei_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.imei_service_categories TO anon;
GRANT SELECT ON public.imei_service_categories TO authenticated;
GRANT ALL ON public.imei_service_categories TO service_role;
ALTER TABLE public.imei_service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views categories" ON public.imei_service_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.imei_service_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.imei_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_service_id integer NOT NULL UNIQUE,
  supplier_name text NOT NULL,
  display_name text NOT NULL,
  category_id uuid REFERENCES public.imei_service_categories(id) ON DELETE SET NULL,
  description text,
  wholesale_cost numeric(10,4) NOT NULL DEFAULT 0,
  retail_price numeric(10,2) NOT NULL DEFAULT 0,
  markup_type text NOT NULL DEFAULT 'manual',
  markup_amount numeric(10,4) NOT NULL DEFAULT 0,
  min_profit numeric(10,2) NOT NULL DEFAULT 0,
  is_instant boolean NOT NULL DEFAULT true,
  processing_time text NOT NULL DEFAULT 'Instant',
  identifier_type text NOT NULL DEFAULT 'imei',
  enabled boolean NOT NULL DEFAULT false,
  requires_ownership_confirm boolean NOT NULL DEFAULT true,
  requires_manual_approval boolean NOT NULL DEFAULT false,
  is_unlock boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.imei_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imei_services TO authenticated;
GRANT ALL ON public.imei_services TO service_role;
ALTER TABLE public.imei_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views enabled services" ON public.imei_services FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Admins view all services" ON public.imei_services FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage services" ON public.imei_services FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.service_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_cost numeric(10,4) NOT NULL DEFAULT 0,
  max_cost numeric(10,4),
  markup_type text NOT NULL DEFAULT 'fixed',
  markup_amount numeric(10,4) NOT NULL DEFAULT 0,
  min_retail numeric(10,2) NOT NULL DEFAULT 0,
  min_profit numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_pricing_rules TO authenticated;
GRANT ALL ON public.service_pricing_rules TO service_role;
ALTER TABLE public.service_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pricing rules" ON public.service_pricing_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  reserved numeric(12,2) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.customer_wallets TO authenticated;
GRANT ALL ON public.customer_wallets TO service_role;
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.customer_wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all wallets" ON public.customer_wallets FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.customer_wallets(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  reference text NOT NULL UNIQUE,
  order_id uuid,
  reason text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (wallet_id IN (SELECT id FROM public.customer_wallets WHERE user_id = auth.uid()));
CREATE POLICY "Admins view all transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE SEQUENCE public.imei_order_seq START 10001;
CREATE TABLE public.imei_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE DEFAULT ('PM-IMEI-' || nextval('public.imei_order_seq')::text),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.imei_services(id),
  identifier text NOT NULL,
  identifier_masked text NOT NULL,
  retail_price numeric(10,2) NOT NULL,
  wholesale_cost numeric(10,4) NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  result jsonb,
  supplier_order_id text,
  error_message text,
  idempotency_key text NOT NULL UNIQUE,
  trade_in_request_id uuid REFERENCES public.trade_in_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.imei_orders TO authenticated;
GRANT ALL ON public.imei_orders TO service_role;
ALTER TABLE public.imei_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.imei_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all orders" ON public.imei_orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.imei_order_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.imei_orders(id) ON DELETE CASCADE,
  raw_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.imei_order_results TO authenticated;
GRANT ALL ON public.imei_order_results TO service_role;
ALTER TABLE public.imei_order_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view raw results" ON public.imei_order_results FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.supplier_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  service_id integer,
  status text,
  error_code text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.supplier_api_logs TO authenticated;
GRANT ALL ON public.supplier_api_logs TO service_role;
ALTER TABLE public.supplier_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view supplier logs" ON public.supplier_api_logs FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.supplier_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.imei_services(id) ON DELETE CASCADE,
  old_cost numeric(10,4),
  new_cost numeric(10,4),
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.supplier_price_history TO authenticated;
GRANT ALL ON public.supplier_price_history TO service_role;
ALTER TABLE public.supplier_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view price history" ON public.supplier_price_history FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.imei_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.imei_settings TO anon;
GRANT SELECT ON public.imei_settings TO authenticated;
GRANT ALL ON public.imei_settings TO service_role;
ALTER TABLE public.imei_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.imei_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.imei_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.imei_settings (key, value) VALUES
  ('resale_enabled', 'false'),
  ('mock_mode', 'true'),
  ('topups_enabled', 'false'),
  ('topup_denominations', '[5, 10, 20, 50, 100]'),
  ('min_topup', '5'),
  ('max_topup', '500');

INSERT INTO public.imei_service_categories (name, sort_order) VALUES
  ('Device Information', 1),
  ('Carrier & SIM Lock', 2),
  ('Blacklist & Eligibility', 3),
  ('Unlock Services', 4);

INSERT INTO public.service_pricing_rules (name, min_cost, max_cost, markup_type, markup_amount, min_retail, min_profit, sort_order) VALUES
  ('Under $0.10 cost', 0, 0.0999, 'fixed', 0, 1.00, 0.50, 1),
  ('$0.10 to $1.00 cost', 0.10, 1.00, 'multiplier', 2, 1.00, 0.50, 2),
  ('$1.01 to $10.00 cost', 1.01, 10.00, 'multiplier', 2, 0, 1.00, 3),
  ('Above $10.00 cost', 10.01, NULL, 'percent', 50, 0, 5.00, 4);

INSERT INTO public.imei_services (supplier_service_id, supplier_name, display_name, category_id, description, wholesale_cost, retail_price, markup_type, markup_amount, is_instant, processing_time, enabled, is_unlock, requires_manual_approval) VALUES
  (103, 'iPhone Carrier', 'iPhone Carrier Check', (SELECT id FROM public.imei_service_categories WHERE name = 'Carrier & SIM Lock'), 'Find out which carrier an iPhone is locked to and its SIM-lock status.', 0.05, 1.00, 'manual', 0.95, true, 'Instant', true, false, false),
  (61, 'iPhone Carrier, FMI & Blacklist', 'iPhone Carrier + FMI + Blacklist', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Full iPhone status: carrier, Find My iPhone, and blacklist/lost-stolen status in one check.', 0.09, 1.50, 'manual', 1.41, true, 'Instant', true, false, false),
  (65, 'AT&T USA Status & Unlock', 'AT&T USA Status & Eligibility', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Check AT&T USA device status and unlock eligibility.', 0.30, 1.50, 'manual', 1.20, true, 'Instant', true, false, false),
  (16, 'T-Mobile USA Status Pro', 'T-Mobile USA Status Pro', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Check T-Mobile USA device status, blacklist and financing status.', 0.04, 1.00, 'manual', 0.96, true, 'Instant', true, false, false),
  (21, 'Cricket USA Status Pro', 'Cricket USA Status Pro', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Check Cricket Wireless device status and eligibility.', 0.12, 1.25, 'manual', 1.13, true, 'Instant', true, false, false),
  (232, 'Verizon USA Status Pro', 'Verizon USA Status Pro', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Check Verizon USA device status and blacklist standing.', 0.05, 1.00, 'manual', 0.95, true, 'Instant', true, false, false),
  (230, 'Xfinity USA Status Pro', 'Xfinity USA Status Pro', (SELECT id FROM public.imei_service_categories WHERE name = 'Blacklist & Eligibility'), 'Check Xfinity Mobile device status and eligibility.', 0.06, 1.00, 'manual', 0.94, true, 'Instant', true, false, false),
  (51, 'AT&T USA Clean/Active Line', 'AT&T USA Clean/Active Line', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock service for clean, active AT&T USA lines.', 7.00, 14.00, 'multiplier', 2, false, '1-3 business days', false, true, true),
  (53, 'USA Cricket Clean & 6 Months Old', 'Cricket USA Unlock (Clean, 6+ Months)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for clean Cricket devices at least 6 months old.', 5.50, 11.00, 'multiplier', 2, false, '1-3 business days', false, true, true),
  (57, 'UK O2 Clean', 'UK O2 Unlock (Clean)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for clean UK O2 devices.', 7.20, 14.40, 'multiplier', 2, false, '1-5 business days', false, true, true),
  (95, 'Canada Telus Clean', 'Canada Telus Unlock (Clean)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for clean Canada Telus devices.', 1.50, 3.00, 'multiplier', 2, false, '1-3 business days', false, true, true),
  (96, 'Canada Fido/Rogers Premium', 'Canada Fido/Rogers Unlock (Premium)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Premium carrier unlock for Canada Fido/Rogers devices.', 18.50, 27.75, 'percent', 50, false, '1-5 business days', false, true, true),
  (104, 'Canada Videotron', 'Canada Videotron Unlock', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for Canada Videotron devices.', 0.75, 1.50, 'multiplier', 2, false, '1-3 business days', false, true, true),
  (115, 'HTC International', 'HTC International Unlock Code', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Network unlock code for HTC devices (international).', 1.80, 3.60, 'multiplier', 2, false, '1-3 business days', false, true, true),
  (125, 'Samsung Europe Premium', 'Samsung Europe Unlock (Premium)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Premium network unlock for Samsung Europe devices.', 17.00, 25.50, 'percent', 50, false, '1-5 business days', false, true, true),
  (130, 'Samsung Europe Limited Countries', 'Samsung Europe Unlock (Limited Countries)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Network unlock for Samsung Europe devices in supported countries.', 13.50, 20.25, 'percent', 50, false, '1-5 business days', false, true, true),
  (134, 'Samsung UK & Ireland Premium', 'Samsung UK & Ireland Unlock (Premium)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Premium network unlock for Samsung UK & Ireland devices.', 17.00, 25.50, 'percent', 50, false, '1-5 business days', false, true, true),
  (159, 'Ireland Hutchison Three/O2 Premium', 'Ireland Three/O2 Unlock (Premium)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Premium carrier unlock for Ireland Hutchison Three/O2 devices.', 3.00, 6.00, 'multiplier', 2, false, '1-5 business days', false, true, true),
  (132, 'Claro iPhone 14', 'Claro iPhone 14 Unlock', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for Claro iPhone 14 series.', 57.00, 85.50, 'percent', 50, false, '3-10 business days', false, true, true),
  (142, 'Claro iPhone 15', 'Claro iPhone 15 Unlock', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for Claro iPhone 15 series.', 87.00, 130.50, 'percent', 50, false, '3-10 business days', false, true, true),
  (135, 'Claro up to iPhone 13', 'Claro Unlock (up to iPhone 13)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for Claro devices up to iPhone 13.', 45.00, 67.50, 'percent', 50, false, '3-10 business days', false, true, true),
  (137, 'Austria A1 Premium', 'Austria A1 Unlock (Premium)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Premium carrier unlock for Austria A1 devices.', 160.00, 240.00, 'percent', 50, false, '3-10 business days', false, true, true),
  (138, 'Austria A1 Out of Contract', 'Austria A1 Unlock (Out of Contract)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for out-of-contract Austria A1 devices.', 110.00, 165.00, 'percent', 50, false, '3-10 business days', false, true, true),
  (234, 'AT&T Sold Date 60 Days', 'AT&T Unlock (Sold 60+ Days)', (SELECT id FROM public.imei_service_categories WHERE name = 'Unlock Services'), 'Carrier unlock for AT&T devices sold more than 60 days ago.', 24.00, 36.00, 'percent', 50, false, '1-5 business days', false, true, true);

CREATE OR REPLACE FUNCTION public.wallet_credit(p_user_id uuid, p_amount numeric, p_type text, p_reference text, p_reason text DEFAULT NULL, p_admin_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance numeric(12,2);
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;
  INSERT INTO public.customer_wallets (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = p_user_id FOR UPDATE;
  BEGIN
    INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, reason, admin_id)
    SELECT v_wallet_id, p_type, p_amount, w.balance + p_amount, p_reference, p_reason, p_admin_id
    FROM public.customer_wallets w WHERE w.id = v_wallet_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT balance INTO v_balance FROM public.customer_wallets WHERE id = v_wallet_id;
    RETURN v_balance;
  END;
  UPDATE public.customer_wallets SET balance = balance + p_amount, updated_at = now() WHERE id = v_wallet_id RETURNING balance INTO v_balance;
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_imei_order(p_service_id uuid, p_identifier text, p_idempotency_key text, p_trade_in_request_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_service public.imei_services%ROWTYPE;
  v_wallet_id uuid;
  v_order_id uuid;
  v_masked text;
  v_resale boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT (value::text)::boolean INTO v_resale FROM public.imei_settings WHERE key = 'resale_enabled';
  IF NOT COALESCE(v_resale, false) THEN
    RAISE EXCEPTION 'IMEI services are not currently enabled';
  END IF;
  SELECT * INTO v_service FROM public.imei_services WHERE id = p_service_id;
  IF NOT FOUND OR NOT v_service.enabled THEN
    RAISE EXCEPTION 'This service is not available';
  END IF;
  IF length(trim(p_identifier)) < 5 THEN
    RAISE EXCEPTION 'Invalid IMEI or serial number';
  END IF;
  SELECT id INTO v_order_id FROM public.imei_orders WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_order_id;
  END IF;
  INSERT INTO public.customer_wallets (user_id) VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = v_user FOR UPDATE;
  IF (SELECT balance - reserved FROM public.customer_wallets WHERE id = v_wallet_id) < v_service.retail_price THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  v_masked := CASE WHEN length(p_identifier) > 4 THEN repeat('*', length(p_identifier) - 4) || right(p_identifier, 4) ELSE p_identifier END;
  INSERT INTO public.imei_orders (user_id, service_id, identifier, identifier_masked, retail_price, wholesale_cost, status, idempotency_key, trade_in_request_id)
  VALUES (v_user, p_service_id, trim(p_identifier), v_masked, v_service.retail_price, v_service.wholesale_cost, 'submitted', p_idempotency_key, p_trade_in_request_id)
  RETURNING id INTO v_order_id;
  UPDATE public.customer_wallets SET reserved = reserved + v_service.retail_price, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, order_id)
  SELECT v_wallet_id, 'reservation', -v_service.retail_price, w.balance, 'reserve:' || v_order_id::text, v_order_id
  FROM public.customer_wallets w WHERE w.id = v_wallet_id;
  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_imei_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.imei_orders%ROWTYPE;
  v_wallet_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.imei_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = v_order.user_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE reference = 'charge:' || p_order_id::text) THEN
    RETURN;
  END IF;
  UPDATE public.customer_wallets SET balance = balance - v_order.retail_price, reserved = reserved - v_order.retail_price, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, order_id)
  SELECT v_wallet_id, 'charge', -v_order.retail_price, w.balance, 'charge:' || p_order_id::text, p_order_id
  FROM public.customer_wallets w WHERE w.id = v_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_imei_order(p_order_id uuid, p_reason text DEFAULT 'Order released')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.imei_orders%ROWTYPE;
  v_wallet_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.imei_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = v_order.user_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE reference = 'release:' || p_order_id::text) THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE reference = 'charge:' || p_order_id::text) THEN
    RETURN;
  END IF;
  UPDATE public.customer_wallets SET reserved = reserved - v_order.retail_price, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, order_id, reason)
  SELECT v_wallet_id, 'release', v_order.retail_price, w.balance, 'release:' || p_order_id::text, p_order_id, p_reason
  FROM public.customer_wallets w WHERE w.id = v_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_imei_order(p_order_id uuid, p_reason text, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.imei_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_order FROM public.imei_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  PERFORM public.wallet_credit(v_order.user_id, v_order.retail_price, 'refund', 'refund:' || p_order_id::text, p_reason, p_admin_id);
  UPDATE public.imei_orders SET status = 'refunded' WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_credit(uuid, numeric, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_imei_order(uuid, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_imei_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_imei_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_imei_order(uuid, text, uuid) TO authenticated;