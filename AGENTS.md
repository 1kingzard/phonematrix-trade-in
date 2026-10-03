- Phone stock/sales live in device_stock, device_sales, sale_installments, shipment_events, customers, loyalty_rules (admin-only RLS); customers see their data only via the get_customer_portal(token) RPC at /c/:token — keeps private costs off public pages.

- Public catalog variants come from devices; product URLs identify brand/model and select storage/grade via query parameters, while cart stores USD base prices and derives JMD totals using the shared shipping formula to prevent conversion drift.
