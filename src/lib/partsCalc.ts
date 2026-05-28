export const fmtUSD = (v: number) =>
  `$${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtJMD = (v: number) =>
  `J$${Math.round(v || 0).toLocaleString('en-US')}`;

export interface InventoryRow {
  id: string;
  item_name: string;
  category: string | null;
  date_ordered: string | null;
  qty_ordered: number;
  qty_available: number;
  cost_per_unit_usd: number;
  product_cost_usd: number;
  shipping_usd: number;
  discount_value: number;
  discount_is_percent: boolean;
  selling_price_jmd: number;
  locked_rate: number | null;
  archived: boolean;
}

export const discountAmountUsd = (item: Pick<InventoryRow, 'discount_value' | 'discount_is_percent' | 'product_cost_usd' | 'shipping_usd'>) => {
  if (item.discount_is_percent) {
    return ((item.product_cost_usd + item.shipping_usd) * (item.discount_value || 0)) / 100;
  }
  return item.discount_value || 0;
};

export const totalCostUsd = (item: Pick<InventoryRow, 'product_cost_usd' | 'shipping_usd' | 'discount_value' | 'discount_is_percent'>) =>
  Math.max(0, item.product_cost_usd + item.shipping_usd - discountAmountUsd(item));

export const rateFor = (item: Pick<InventoryRow, 'locked_rate'>, current: number) =>
  item.locked_rate ?? current;

export const totalCostJmd = (item: InventoryRow, current: number) =>
  totalCostUsd(item) * rateFor(item, current);

export const costPerUnitJmd = (item: InventoryRow, current: number) => {
  const qty = item.qty_ordered || 1;
  return totalCostJmd(item, current) / qty;
};

export const profitPerUnitJmd = (item: InventoryRow, current: number) =>
  item.selling_price_jmd - costPerUnitJmd(item, current);

export const inventoryValueJmd = (item: InventoryRow, current: number) =>
  costPerUnitJmd(item, current) * item.qty_available;

export const projectedProfitJmd = (item: InventoryRow, current: number) =>
  profitPerUnitJmd(item, current) * item.qty_available;