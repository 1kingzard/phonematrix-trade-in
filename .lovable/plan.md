
## Goal

Replace the Google Sheets CSV as the source of device prices with a database-backed catalog that admins can edit directly. Seed it from the current sheet so nothing is lost, and give the admin UI a search box for fast navigation.

## What changes

### 1. New `devices` table (Lovable Cloud)
Columns: os, brand, model, condition, storage, price, screen_replacement, battery_replacement, rear_glass_replacement, colors (text[]), active (bool), plus standard id/created_at/updated_at.
- Public read (anon + authenticated) so the storefront works without login.
- Insert/update/delete restricted to admins via `has_role`.
- Seed rows from the current published Google Sheet on migration.

### 2. Admin "Devices" tab (in AdminDashboard)
New tab alongside Inventory / Orders / etc. Features:
- Search bar filtering across brand / model / storage / condition (live filter).
- Table listing every device with inline-editable price, screen, battery, rear glass (double-click to edit, same pattern as Inventory/Collections).
- Add device button (dialog with all fields).
- Delete / toggle active.
- Optional: "Re-import from Google Sheet" button that pulls the current CSV and upserts rows, for future bulk updates.

### 3. Storefront pulls from DB instead of CSV
`useDeviceData` hook rewritten to query the `devices` table (still returns the same `DeviceData[]` shape so `DeviceGrid`, `DeviceCard`, filters, cart, trade-in, price list all keep working with no changes).
- CSV URL / column-mapping settings become legacy; the CsvManagement admin tab can stay as a one-off importer or be removed later.
- Battery / screen / rear-glass prices used by `DeductionCalculator` now come from the same DB rows.

### 4. Realtime reflection
Enable Postgres realtime on `devices` so admin edits appear on the public site without a refresh (same pattern already used elsewhere).

## Technical notes

- Migration includes `CREATE TABLE`, GRANTs (SELECT to anon+authenticated, ALL to authenticated for admin-gated policies, ALL to service_role), RLS enable, and policies using `has_role(auth.uid(),'admin')`.
- Seed step: I'll fetch the current published CSV once during planning-to-build, parse it, and emit an `INSERT ... ON CONFLICT DO NOTHING` block in the migration so every current device/condition/storage combo is preloaded.
- Uniqueness key for upsert: (brand, model, condition, storage).
- No changes to trade-in math, cart, or checkout beyond swapping the data source.

## Open question

Do you want the old CSV import kept as a one-click "Sync from Google Sheet" button in the admin panel (useful if you still update the sheet), or should the sheet be fully retired and the DB become the only source of truth going forward?
