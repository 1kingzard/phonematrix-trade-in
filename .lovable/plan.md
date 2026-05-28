## Private Auto Parts Inventory & Sales System

A hidden module at `/parts` (not linked in nav, accessible only via direct URL) for managing auto parts inventory, sales, collections, and deposits with USD→JMD currency handling.

### Access Control

- Reuse existing Supabase auth (login at `/login`)
- Add new role `parts_guest` to the existing `app_role` enum (alongside `admin`, `user`)
- New routes:
  - `/parts` → redirects based on role
  - `/parts/admin` → requires `admin` role
  - `/parts/guest` → requires `parts_guest` or `admin` role
- Unauthorized users redirected to `/login` then back, or shown 404 to keep the module hidden
- No links added to Header, Footer, or sitemap

### Database (new tables, all RLS-protected)

```text
parts_settings        — singleton row: current_exchange_rate, updated_by, updated_at
exchange_rate_history — rate, effective_at, set_by
parts_inventory       — item_name, category, date_ordered, qty_ordered, qty_available,
                        cost_per_unit_usd, product_cost_usd, shipping_usd,
                        discount_usd, discount_is_percent, selling_price_jmd,
                        locked_rate (nullable), archived, created_by
parts_sales           — inventory_id, units_sold, unit_price_jmd, total_jmd,
                        rate_at_sale, sold_by, customer_note, created_at
parts_collections     — sale_id, amount_jmd, collected_at, recorded_by
parts_deposits        — amount_jmd, deposited_at, reference, status
                        (pending|verified|rejected), verified_by, verified_at, recorded_by
parts_misc_orders     — description, cost_input, cost_currency (USD|JMD),
                        cost_jmd (converted), rate_used, date_added, created_by
parts_misc_payments   — misc_order_id, amount_jmd, paid_at, recorded_by
parts_audit_log       — actor, action, entity, entity_id, payload jsonb, rate_used, created_at
```

RLS:
- Admin (via `is_admin`) → full CRUD on all parts tables
- `parts_guest` (via new `has_role` check) → 
  - SELECT inventory (limited columns enforced in UI; row policy allows read of non-archived)
  - INSERT sales, collections, deposits, misc_payments
  - SELECT own + all sales/collections/deposits/misc for shared visibility with admin
  - No access to cost columns enforced via a `parts_inventory_public` view granted to guests; base table SELECT restricted to admin only

### Admin Dashboard (`/parts/admin`)

Tabs:
1. **Inventory** — table + add/edit dialog. Auto-calc total cost USD, total cost JMD (using current rate or locked rate), profit/unit JMD, total inventory value, projected profit.
2. **Sales** — real-time list of guest sales, COGS in JMD, revenue, profit per sale.
3. **Collections** — per-sale outstanding balances, running total outstanding.
4. **Deposits** — pending/verified deposits, Verify/Reject actions.
5. **Misc Orders** — add items (USD or JMD input), payment history, balance.
6. **Settings** — exchange rate field + history log.
7. **Reports** — P/L summary, cash flow, outstanding, inventory status, margin analysis (JMD with USD context).

### Guest Dashboard (`/parts/guest`)

Tabs:
1. **Inventory** — name, qty available, selling price JMD only (queries the restricted view).
2. **Record Sale** — pick item, units, auto-total JMD, decrements inventory.
3. **Collections** — enter collected amount per sale, see remaining balance + running outstanding.
4. **Deposits** — log deposits to admin (JMD), see verification status, totals deposited vs outstanding.
5. **Misc Items** — see admin-added misc items in JMD, make full/partial payments, history.

All amounts JMD-only on guest side. No USD, no costs, no margins, no exchange rate visible.

### Currency Handling

- Inputs: cost fields in USD; sales/collections/deposits/misc-payments in JMD.
- Exchange rate stored in `parts_settings`; updates append to history.
- Each sale snapshots `rate_at_sale`; each misc order snapshots `rate_used`. Admin can toggle "lock rate" per inventory item.
- Display helpers: `formatUSD`, `formatJMD` (reuse `src/hooks/useExchangeRate.ts` formatters).

### Files to create

```text
src/pages/parts/PartsIndex.tsx          — role-based redirect
src/pages/parts/PartsAdmin.tsx          — admin shell with tabs
src/pages/parts/PartsGuest.tsx          — guest shell with tabs
src/components/parts/InventoryTab.tsx
src/components/parts/InventoryFormDialog.tsx
src/components/parts/SalesTab.tsx
src/components/parts/CollectionsTab.tsx
src/components/parts/DepositsTab.tsx
src/components/parts/MiscOrdersTab.tsx
src/components/parts/SettingsTab.tsx
src/components/parts/ReportsTab.tsx
src/components/parts/guest/GuestInventoryTab.tsx
src/components/parts/guest/GuestSalesTab.tsx
src/components/parts/guest/GuestCollectionsTab.tsx
src/components/parts/guest/GuestDepositsTab.tsx
src/components/parts/guest/GuestMiscTab.tsx
src/hooks/useExchangeRateSetting.ts     — reads parts_settings + realtime
src/hooks/usePartsRole.ts               — checks admin / parts_guest
src/lib/partsCalc.ts                    — all calculation helpers
```

Routes added in `src/App.tsx`. No nav links added anywhere.

### Realtime

Enable Supabase realtime on `parts_inventory`, `parts_sales`, `parts_collections`, `parts_deposits`, `parts_misc_orders`, `parts_misc_payments`, `parts_settings` so admin and guest views stay in sync.

### Admin user assignment

After migration, the admin can promote a user to `parts_guest` via a small UI in the Settings tab (input email → calls a SECURITY DEFINER function `assign_parts_guest(email)`).

### Scope notes

- This is a large build. I'll deliver it in one pass: migration first (for your approval), then all UI/logic.
- Existing app, auth, and design system remain untouched outside `src/App.tsx` route additions.
- Mobile-responsive via existing Tailwind tokens.

Shall I proceed? On approval I'll submit the migration, then build the screens.