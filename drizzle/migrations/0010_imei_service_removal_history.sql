ALTER TABLE public.imei_services ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.imei_services ADD CONSTRAINT imei_deleted_services_disabled CHECK (deleted_at IS NULL OR enabled = false);
COMMENT ON COLUMN public.imei_services.deleted_at IS 'Soft deletion keeps historical orders and supplier references intact; removed services must stay disabled.';