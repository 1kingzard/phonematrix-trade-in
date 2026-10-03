ALTER TABLE public.device_stock ADD COLUMN battery_health integer;
COMMENT ON COLUMN public.device_stock.battery_health IS 'Battery health percentage (0-100), as shown in device settings';