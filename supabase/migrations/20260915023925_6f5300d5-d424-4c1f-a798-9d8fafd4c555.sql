CREATE TABLE public.parts_price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text,
  cost_jmd numeric NOT NULL DEFAULT 0,
  shipping_jmd numeric NOT NULL DEFAULT 0,
  sell_jmd numeric NOT NULL DEFAULT 0,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_price_list_items TO authenticated;
GRANT ALL ON public.parts_price_list_items TO service_role;

ALTER TABLE public.parts_price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parts users can view price list items"
ON public.parts_price_list_items FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'parts_guest'));

CREATE POLICY "Parts users can add price list items"
ON public.parts_price_list_items FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'parts_guest'));

CREATE POLICY "Admins can update price list items"
ON public.parts_price_list_items FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete price list items"
ON public.parts_price_list_items FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER parts_price_list_items_updated_at
BEFORE UPDATE ON public.parts_price_list_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW public.parts_price_catalog
WITH (security_invoker = false) AS
SELECT
  i.id,
  'inventory'::text AS source,
  i.item_name,
  i.category,
  ROUND(
    (GREATEST(0::numeric, i.product_cost_usd - CASE WHEN i.discount_is_percent
        THEN ((i.product_cost_usd + i.shipping_usd) * COALESCE(i.discount_value,0)) / 100
        ELSE COALESCE(i.discount_value,0) END)
     * COALESCE(i.locked_rate, (SELECT s.exchange_rate FROM public.parts_settings s LIMIT 1), 0))
    / GREATEST(i.qty_ordered, 1), 2) AS cost_jmd,
  ROUND((i.shipping_usd * COALESCE(i.locked_rate, (SELECT s.exchange_rate FROM public.parts_settings s LIMIT 1), 0))
    / GREATEST(i.qty_ordered, 1), 2) AS shipping_jmd,
  i.selling_price_jmd AS sell_jmd,
  NULL::text AS note,
  i.qty_available,
  i.created_at
FROM public.parts_inventory i
WHERE i.archived = false
  AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'parts_guest'))
UNION ALL
SELECT
  p.id,
  'custom'::text AS source,
  p.item_name,
  p.category,
  p.cost_jmd,
  p.shipping_jmd,
  p.sell_jmd,
  p.note,
  NULL::integer AS qty_available,
  p.created_at
FROM public.parts_price_list_items p
WHERE public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'parts_guest');

GRANT SELECT ON public.parts_price_catalog TO authenticated;