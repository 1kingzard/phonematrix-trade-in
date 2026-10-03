export const SHIPMENT_STATUSES = [
  'Order placed',
  'Arrived at US address',
  'In transit to Jamaica',
  'At customs',
  'At Jamaica shipping company / Ready for pickup',
  'Delivered',
] as const;

export const PAYMENT_METHODS = ['Cash', 'Bank transfer', 'Card', 'Trade credit', 'Mixed'] as const;

export const STOCK_STATUSES: Record<string, string> = {
  in_stock: 'In stock',
  reserved: 'Reserved',
  sold: 'Sold',
};

export const customerUrl = (token: string) => `${window.location.origin}/c/${token}`;

export const usd = (v: number) =>
  `$${(Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtDate = (s: string) => new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-US', { dateStyle: 'medium' });

export interface Installment {
  id?: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_at?: string | null;
  late_fee: number;
}

export const installmentOwed = (i: Installment) =>
  Math.max(0, Number(i.amount) + Number(i.late_fee) - Number(i.paid_amount));

export const isLate = (i: Installment) =>
  installmentOwed(i) > 0 && new Date(i.due_date + 'T23:59:59') < new Date();

export const warrantyEnd = (soldAt: string, days: number) => {
  const d = new Date(soldAt);
  d.setDate(d.getDate() + (days || 0));
  return d;
};

/** Builds an evenly split schedule of due dates. */
export const buildSchedule = (total: number, count: number, start: string, every: 'weekly' | 'biweekly' | 'monthly'): Installment[] => {
  if (count < 1 || !start) return [];
  const each = Math.round((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, k) => {
    const d = new Date(start + 'T12:00:00');
    if (every === 'monthly') d.setMonth(d.getMonth() + k);
    else d.setDate(d.getDate() + k * (every === 'weekly' ? 7 : 14));
    const amount = k === count - 1 ? Math.round((total - each * (count - 1)) * 100) / 100 : each;
    return { due_date: d.toISOString().slice(0, 10), amount, paid_amount: 0, late_fee: 0 };
  });
};

export interface LoyaltyRule {
  id: string;
  name: string;
  rule_type: 'purchases' | 'referrals' | string;
  threshold: number;
  discount_percent: number;
  discount_amount: number;
  active: boolean;
}

/** Best discount a customer qualifies for, given their counts. */
export const bestLoyalty = (rules: LoyaltyRule[], purchases: number, referrals: number, price: number) => {
  let best: { rule: LoyaltyRule; amount: number } | null = null;
  for (const r of rules) {
    if (!r.active) continue;
    const count = r.rule_type === 'referrals' ? referrals : purchases;
    if (count < r.threshold) continue;
    const amount = Math.round((price * Number(r.discount_percent) / 100 + Number(r.discount_amount)) * 100) / 100;
    if (!best || amount > best.amount) best = { rule: r, amount };
  }
  return best;
};

/** Formats a stored USD amount in the sale's currency (JMD for Jamaica sales, using the rate saved with the sale). */
export const saleMoney = (v: number, sale?: { sold_in?: string | null; rate_used?: number | null } | null) =>
  sale?.sold_in === 'JM'
    ? `J$${Math.round((Number(v) || 0) * (Number(sale.rate_used) || 157)).toLocaleString('en-US')}`
    : usd(v);
