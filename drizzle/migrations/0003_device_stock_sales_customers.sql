CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  user_id uuid,
  referred_by uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  public_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24),'hex'),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.device_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text,
  brand text NOT NULL DEFAULT 'Apple',
  model text NOT NULL,
  storage text,
  colour text,
  condition text,
  photos text[] NOT NULL DEFAULT '{}',
  imei text,
  serial text,
  purchase_cost numeric NOT NULL DEFAULT 0,
  purchased_from text,
  purchase_date date,
  website_price numeric NOT NULL DEFAULT 0,
  warranty_days integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'in_stock',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.device_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.device_stock(id) ON DELETE CASCADE,
  description text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  repaired_at date DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.loyalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'purchases',
  threshold integer NOT NULL DEFAULT 1,
  discount_percent numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.device_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.device_stock(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  listed_price numeric NOT NULL DEFAULT 0,
  actual_price numeric NOT NULL DEFAULT 0,
  sold_for numeric NOT NULL DEFAULT 0,
  loyalty_rule_id uuid REFERENCES public.loyalty_rules(id) ON DELETE SET NULL,
  loyalty_discount numeric NOT NULL DEFAULT 0,
  sold_as_trade boolean NOT NULL DEFAULT false,
  trade_in_request_id uuid REFERENCES public.trade_in_requests(id) ON DELETE SET NULL,
  trade_credit numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  is_payment_plan boolean NOT NULL DEFAULT false,
  plan_total numeric NOT NULL DEFAULT 0,
  deposit numeric NOT NULL DEFAULT 0,
  warranty_days integer NOT NULL DEFAULT 30,
  sold_at timestamptz NOT NULL DEFAULT now(),
  courier text,
  tracking_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sale_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.device_sales(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  paid_at timestamptz,
  late_fee numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.device_sales(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_in_requests ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
COMMENT ON TABLE public.inventory IS 'DEPRECATED: replaced by device_stock';

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['customers','device_stock','device_repairs','loyalty_rules','device_sales','sale_installments','shipment_events'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))', t, t);
  END LOOP;
END $$;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER device_stock_updated_at BEFORE UPDATE ON public.device_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_customer_portal(token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'name', c.name,
    'phone_masked', CASE WHEN length(c.phone) > 4 THEN repeat('•', length(c.phone)-4) || right(c.phone,4) ELSE c.phone END,
    'referrals', (SELECT count(*) FROM customers r WHERE r.referred_by = c.id),
    'purchases', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'brand', d.brand, 'model', d.model, 'storage', d.storage, 'colour', d.colour, 'condition', d.condition,
        'photo', d.photos[1], 'sold_for', s.sold_for, 'loyalty_discount', s.loyalty_discount, 'trade_credit', s.trade_credit,
        'payment_method', s.payment_method, 'sold_at', s.sold_at, 'warranty_days', s.warranty_days,
        'courier', s.courier, 'tracking_number', s.tracking_number,
        'is_payment_plan', s.is_payment_plan, 'plan_total', s.plan_total, 'deposit', s.deposit,
        'installments', coalesce((SELECT jsonb_agg(jsonb_build_object('due_date', i.due_date, 'amount', i.amount, 'paid_amount', i.paid_amount, 'paid_at', i.paid_at, 'late_fee', i.late_fee) ORDER BY i.due_date) FROM sale_installments i WHERE i.sale_id = s.id), '[]'::jsonb),
        'shipments', coalesce((SELECT jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note, 'occurred_at', e.occurred_at) ORDER BY e.occurred_at) FROM shipment_events e WHERE e.sale_id = s.id), '[]'::jsonb)
      ) ORDER BY s.sold_at DESC) FROM device_sales s JOIN device_stock d ON d.id = s.stock_id WHERE s.customer_id = c.id), '[]'::jsonb),
    'trade_ins', coalesce((SELECT jsonb_agg(jsonb_build_object('request_code', t.request_code, 'public_token', t.public_token, 'trade_device', t.trade_device, 'desired_device', t.desired_device, 'estimated_value_usd', t.estimated_value_usd, 'final_value_usd', t.final_value_usd, 'status', t.status, 'created_at', t.created_at) ORDER BY t.created_at DESC) FROM trade_in_requests t WHERE t.customer_id = c.id), '[]'::jsonb)
  ) FROM customers c WHERE c.public_token = token AND length(token) >= 32 LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_customer_portal(text) TO anon, authenticated;