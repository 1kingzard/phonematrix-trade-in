
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.parts_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_rate numeric NOT NULL DEFAULT 157,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  singleton boolean NOT NULL DEFAULT true UNIQUE
);
GRANT SELECT, INSERT, UPDATE ON public.parts_settings TO authenticated;
GRANT ALL ON public.parts_settings TO service_role;
ALTER TABLE public.parts_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parts settings read" ON public.parts_settings FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "parts settings admin write" ON public.parts_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.parts_settings (singleton) VALUES (true);

CREATE TABLE public.parts_exchange_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric NOT NULL,
  set_by uuid,
  effective_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.parts_exchange_rate_history TO authenticated;
GRANT ALL ON public.parts_exchange_rate_history TO service_role;
ALTER TABLE public.parts_exchange_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate history admin" ON public.parts_exchange_rate_history FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.parts_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text,
  date_ordered date,
  qty_ordered integer NOT NULL DEFAULT 0,
  qty_available integer NOT NULL DEFAULT 0,
  cost_per_unit_usd numeric NOT NULL DEFAULT 0,
  product_cost_usd numeric NOT NULL DEFAULT 0,
  shipping_usd numeric NOT NULL DEFAULT 0,
  discount_value numeric NOT NULL DEFAULT 0,
  discount_is_percent boolean NOT NULL DEFAULT false,
  selling_price_jmd numeric NOT NULL DEFAULT 0,
  locked_rate numeric,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_inventory TO authenticated;
GRANT ALL ON public.parts_inventory TO service_role;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory admin all" ON public.parts_inventory FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "inventory guest read" ON public.parts_inventory FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'parts_guest'));
CREATE TRIGGER parts_inventory_updated_at BEFORE UPDATE ON public.parts_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.parts_inventory_public AS
SELECT id, item_name, category, qty_available, selling_price_jmd, archived
FROM public.parts_inventory;
GRANT SELECT ON public.parts_inventory_public TO authenticated;

CREATE TABLE public.parts_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.parts_inventory(id) ON DELETE RESTRICT,
  units_sold integer NOT NULL CHECK (units_sold > 0),
  unit_price_jmd numeric NOT NULL,
  total_jmd numeric NOT NULL,
  rate_at_sale numeric NOT NULL,
  customer_note text,
  sold_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_sales TO authenticated;
GRANT ALL ON public.parts_sales TO service_role;
ALTER TABLE public.parts_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales read" ON public.parts_sales FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "sales insert" ON public.parts_sales FOR INSERT TO authenticated
  WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest')) AND sold_by = auth.uid());
CREATE POLICY "sales admin update" ON public.parts_sales FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "sales admin delete" ON public.parts_sales FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.parts_sales_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.parts_inventory SET qty_available = qty_available - NEW.units_sold
  WHERE id = NEW.inventory_id;
  IF (SELECT qty_available FROM public.parts_inventory WHERE id = NEW.inventory_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER parts_sales_decrement AFTER INSERT ON public.parts_sales
  FOR EACH ROW EXECUTE FUNCTION public.parts_sales_after_insert();

CREATE TABLE public.parts_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.parts_sales(id) ON DELETE CASCADE,
  amount_jmd numeric NOT NULL CHECK (amount_jmd > 0),
  recorded_by uuid,
  collected_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_collections TO authenticated;
GRANT ALL ON public.parts_collections TO service_role;
ALTER TABLE public.parts_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections read" ON public.parts_collections FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "collections insert" ON public.parts_collections FOR INSERT TO authenticated
  WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest')) AND recorded_by = auth.uid());
CREATE POLICY "collections admin update" ON public.parts_collections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "collections admin delete" ON public.parts_collections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TABLE public.parts_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_jmd numeric NOT NULL CHECK (amount_jmd > 0),
  reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  recorded_by uuid,
  verified_by uuid,
  verified_at timestamptz,
  deposited_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_deposits TO authenticated;
GRANT ALL ON public.parts_deposits TO service_role;
ALTER TABLE public.parts_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits read" ON public.parts_deposits FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "deposits insert" ON public.parts_deposits FOR INSERT TO authenticated
  WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest')) AND recorded_by = auth.uid());
CREATE POLICY "deposits admin update" ON public.parts_deposits FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "deposits admin delete" ON public.parts_deposits FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TABLE public.parts_misc_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  cost_input numeric NOT NULL,
  cost_currency text NOT NULL CHECK (cost_currency IN ('USD','JMD')),
  cost_jmd numeric NOT NULL,
  rate_used numeric NOT NULL,
  date_added date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_misc_orders TO authenticated;
GRANT ALL ON public.parts_misc_orders TO service_role;
ALTER TABLE public.parts_misc_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "misc read" ON public.parts_misc_orders FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "misc admin all" ON public.parts_misc_orders FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE VIEW public.parts_misc_orders_public AS
SELECT id, description, cost_jmd, date_added, created_at
FROM public.parts_misc_orders;
GRANT SELECT ON public.parts_misc_orders_public TO authenticated;

CREATE TABLE public.parts_misc_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  misc_order_id uuid NOT NULL REFERENCES public.parts_misc_orders(id) ON DELETE CASCADE,
  amount_jmd numeric NOT NULL CHECK (amount_jmd > 0),
  recorded_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_misc_payments TO authenticated;
GRANT ALL ON public.parts_misc_payments TO service_role;
ALTER TABLE public.parts_misc_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "misc pay read" ON public.parts_misc_payments FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest'));
CREATE POLICY "misc pay insert" ON public.parts_misc_payments FOR INSERT TO authenticated
  WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest')) AND recorded_by = auth.uid());
CREATE POLICY "misc pay admin update" ON public.parts_misc_payments FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "misc pay admin delete" ON public.parts_misc_payments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TABLE public.parts_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  payload jsonb,
  rate_used numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.parts_audit_log TO authenticated;
GRANT ALL ON public.parts_audit_log TO service_role;
ALTER TABLE public.parts_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read admin" ON public.parts_audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "audit insert" ON public.parts_audit_log FOR INSERT TO authenticated
  WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'parts_guest')) AND actor = auth.uid());

CREATE OR REPLACE FUNCTION public.assign_parts_guest(user_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_user_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'parts_guest')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_misc_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_misc_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_settings;
