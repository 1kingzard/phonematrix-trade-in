-- Add sold tracking to inventory
ALTER TABLE public.inventory 
ADD COLUMN sold_to_user_id UUID REFERENCES auth.users(id),
ADD COLUMN sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN order_id UUID REFERENCES public.purchase_requests(id);

-- Create function to auto-generate SKU
CREATE OR REPLACE FUNCTION public.generate_sku(brand TEXT, model TEXT, condition TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  brand_code TEXT;
  model_code TEXT;
  condition_code TEXT;
  counter INTEGER;
  new_sku TEXT;
BEGIN
  -- Generate brand code (first 3 chars, uppercase)
  brand_code := UPPER(SUBSTRING(REPLACE(brand, ' ', ''), 1, 3));
  
  -- Generate model code (first 3 chars, uppercase)  
  model_code := UPPER(SUBSTRING(REPLACE(model, ' ', ''), 1, 3));
  
  -- Generate condition code
  condition_code := CASE 
    WHEN LOWER(condition) LIKE '%new%' THEN 'NEW'
    WHEN LOWER(condition) LIKE '%excellent%' THEN 'EXC'
    WHEN LOWER(condition) LIKE '%good%' THEN 'GD'
    WHEN LOWER(condition) LIKE '%fair%' THEN 'FR'
    ELSE 'US'
  END;
  
  -- Get next counter for this combination
  SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM '([0-9]+)$') AS INTEGER)), 0) + 1
  INTO counter
  FROM public.inventory 
  WHERE sku LIKE brand_code || model_code || condition_code || '%';
  
  -- Generate final SKU
  new_sku := brand_code || model_code || condition_code || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_sku;
END;
$$;

-- Create trigger to auto-generate SKU on insert
CREATE OR REPLACE FUNCTION public.set_inventory_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := public.generate_sku(NEW.device_brand, NEW.device_model, NEW.device_condition);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_sku
  BEFORE INSERT ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_inventory_sku();

-- Create function to mark inventory as sold and create order
CREATE OR REPLACE FUNCTION public.mark_inventory_sold(
  inventory_id UUID,
  user_id UUID,
  sale_price DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inventory_item RECORD;
  new_order_id UUID;
  final_price DECIMAL;
BEGIN
  -- Get inventory item details
  SELECT * INTO inventory_item 
  FROM public.inventory 
  WHERE id = inventory_id AND sold_to_user_id IS NULL AND quantity_available > 0;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found or already sold';
  END IF;
  
  -- Use provided price or default to inventory price
  final_price := COALESCE(sale_price, inventory_item.price);
  
  -- Create purchase request (order)
  INSERT INTO public.purchase_requests (
    user_id,
    device_info,
    customer_info,
    total_price,
    currency,
    status,
    workflow_status
  ) VALUES (
    user_id,
    jsonb_build_object(
      'brand', inventory_item.device_brand,
      'model', inventory_item.device_model,
      'condition', inventory_item.device_condition,
      'sku', inventory_item.sku
    ),
    jsonb_build_object(
      'source', 'inventory_sale'
    ),
    final_price,
    'USD',
    'confirmed',
    'fulfilled'
  ) RETURNING id INTO new_order_id;
  
  -- Mark inventory as sold
  UPDATE public.inventory 
  SET 
    sold_to_user_id = user_id,
    sold_at = now(),
    order_id = new_order_id,
    quantity_available = quantity_available - 1
  WHERE id = inventory_id;
  
  RETURN new_order_id;
END;
$$;