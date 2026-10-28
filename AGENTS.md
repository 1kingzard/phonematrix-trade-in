- Phone stock/sales live in device_stock, device_sales, sale_installments, shipment_events, customers, loyalty_rules (admin-only RLS); customers see their data only via the get_customer_portal(token) RPC at /c/:token — keeps private costs off public pages.

- Public catalog variants come from devices; product URLs identify brand/model and select storage/grade via query parameters, while cart stores USD base prices and derives JMD totals using the shared shipping formula to prevent conversion drift.

- IMEI service deletion sets deleted_at and disables ordering instead of removing the row, so historical orders retain their supplier service and reports; admin lists exclude deleted rows and supplier sync must never re-enable them.

- Admin wallet owner labels are resolved through the authenticated, admin-checked IMEI function using account metadata with an email-prefix fallback; do not expose the auth user directory to clients.

- Customer IMEI catalog queries require enabled and undeleted services; historical order joins remain unfiltered. Normalize report fields through src/lib/imei-report.ts for both display and copy, excluding supplier billing envelope fields.

- Payments use gateway-only Stripe Embedded Checkout, authenticated server-side catalog repricing, environment-isolated payment_orders and signed webhook fulfillment. Sandbox wallet purchases never credit customer_wallets; live top-ups stay blocked pending provider/tax approval. Physical live pre-orders create purchase_requests, not stock sales.

- Account access uses one shared form for pages and dialogs; account settings are available to all authenticated roles at /account, and recovery stays public at /reset-password with a recovery-event guard, so admins and customers share secure account lifecycle behavior.

- Vite deduplicates React and React DOM so dependency updates cannot load separate hook and renderer instances.
