CREATE TABLE public.payment_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, environment text NOT NULL CHECK(environment IN ('sandbox','live')),
 kind text NOT NULL CHECK(kind IN ('devices','wallet')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','expired')),
 currency text NOT NULL CHECK(currency IN ('usd','jmd')), subtotal numeric(14,2) NOT NULL, shipping numeric(14,2) NOT NULL DEFAULT 0, total numeric(14,2) NOT NULL, rate_used numeric,
 items jsonb NOT NULL DEFAULT '[]', delivery_country text, delivery_details jsonb, stripe_session_id text UNIQUE, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view payments" ON public.payment_orders FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin(auth.uid()));
CREATE INDEX payment_orders_owner ON public.payment_orders(user_id,environment,created_at DESC);
CREATE OR REPLACE FUNCTION public.fulfill_payment_order(p_order_id uuid, p_session_id text, p_total numeric, p_currency text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.payment_orders%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Not authorized'; END IF;
 SELECT * INTO o FROM public.payment_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.stripe_session_id IS DISTINCT FROM p_session_id THEN RAISE EXCEPTION 'Payment reference mismatch'; END IF;
 IF o.status='paid' THEN RETURN; END IF;
 IF o.currency<>p_currency OR p_total<o.total THEN RAISE EXCEPTION 'Payment amount mismatch'; END IF;
 IF o.kind='wallet' AND o.environment='live' THEN RAISE EXCEPTION 'Live wallet payments require provider and tax approval'; END IF;
 UPDATE public.payment_orders SET status='paid',paid_at=now() WHERE id=o.id;
 IF o.kind='devices' AND o.environment='live' THEN
  INSERT INTO public.purchase_requests(user_id,device_info,customer_info,total_price,currency,status)
  VALUES(o.user_id,jsonb_build_object('items',o.items,'payment_order_id',o.id,'preorder',true,'shipping',o.shipping,'rate_used',o.rate_used),o.delivery_details,p_total,upper(o.currency),'pending');
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.fulfill_payment_order(uuid,text,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_order(uuid,text,numeric,text) TO service_role;
COMMENT ON TABLE public.payment_orders IS 'Verified payment records isolated by environment; sandbox wallet purchases never credit the live supplier wallet.';