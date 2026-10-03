# Device Inventory, Sales, Payment Plans and Customer Portal

## What you get

**1. Admin – Inventory (upgraded "Inventory" tab)**
Add/edit a phone with:
- Device, storage, colour, condition (Like New / Very Good / Good / Fair), photos (multiple)
- IMEI, serial number
- Purchase cost, where it was bought, purchase date
- Repairs done (list: what, cost, date) – added to total cost automatically
- Website selling price, actual selling price
- Warranty length (e.g. 30/90 days) – end date worked out from the sale date
- Status: In stock / Reserved / Sold
- Profit shown automatically (sold price − purchase cost − repairs)

**2. Admin – Recording a sale** ("Mark as sold" on a phone)
- Buyer name, phone, email (links to a customer record, created if new)
- Sold for, sold as a trade? (pick an existing trade-in request so its credit shows)
- How they paid: Cash / Bank transfer / Card / Trade credit / Mixed
- Payment plan toggle: agreed total, deposit, number of payments, due dates (auto-filled weekly/monthly, editable)
- Record each payment as it comes in; remaining balance updates
- Late detection: past-due payments flagged in red; add a late fee to any payment

**3. Admin – Shipping tracking** (per sale)
- Tracking number and courier
- Status updates, each time-stamped: Ordered → Arrived at US address → In transit → At customs → At Jamaica shipping company / Ready for pickup → Delivered
- Optional note on each update

**4. Admin – Customers tab**
- List of customers with their purchases, trade-in requests, balance owed, late flags
- "Copy link" / "Show QR" / "WhatsApp link" for each customer's private page

**5. Customer page** (private link + QR, like the trade-in ones)
- Their purchases: device, purchase price, date, warranty and days left
- Shipping timeline with dates/times for each update
- Payment plan: agreed amount, paid so far, remaining, schedule with due dates, paid/late status, late fees
- Their trade-in requests and quotes
- Phone number partly hidden; nothing private to the business (costs, IMEI purchase source, profit) is ever shown

## Technical section
- New tables: `customers` (name, phone, email, public_token, user_id nullable), `device_stock` (all device fields, photos text[], status), `device_repairs`, `device_sales` (stock_id, customer_id, prices, payment method, trade_in_request_id, warranty_days), `payment_plans` + `payment_plan_installments` (due_date, amount, paid_amount, paid_at, late_fee), `sale_payments`, `shipment_events` (status, note, created_at). All admin-only RLS with GRANTs.
- Photos in the existing public `media` bucket under `inventory/`.
- `trade_in_requests` gets nullable `customer_id`, matched by phone when a customer is created.
- Security-definer RPC `get_customer_portal(token)` returns only customer-safe fields; route `/c/:token`.
- Existing `inventory` table left in place (marked deprecated); new tab replaces it in the admin panel.
- Late = installment past due and not fully paid, computed on read.
