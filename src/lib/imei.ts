// IMEI services: pure helpers for validation, masking and the pricing engine.
// All money math uses integer cents to avoid floating-point currency errors.

export type MarkupType = 'fixed' | 'percent' | 'multiplier' | 'manual';

export interface PricingRule {
  id: string;
  name: string;
  min_cost: number;
  max_cost: number | null;
  markup_type: MarkupType;
  markup_amount: number;
  min_retail: number;
  min_profit: number;
  active: boolean;
  sort_order: number;
}

/** Luhn checksum validation for 15-digit IMEIs. */
export function isValidImei(imei: string): boolean {
  const digits = imei.replace(/[\s-]/g, '');
  if (!/^\d{15}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(digits[i]);
    // Double every second digit (positions 2,4,... from the left, 1-indexed)
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Serial numbers: 5-32 alphanumeric chars. */
export function isValidSerial(serial: string): boolean {
  return /^[A-Za-z0-9]{5,32}$/.test(serial.trim());
}

export function validateIdentifier(value: string, type: 'imei' | 'serial' | string): string | null {
  const v = value.trim();
  if (type === 'serial') {
    return isValidSerial(v) ? null : 'Enter a valid serial number (5-32 letters or digits).';
  }
  return isValidImei(v) ? null : 'Enter a valid 15-digit IMEI (dial *#06# on the phone to find it).';
}

/** Mask all but the last 4 characters: 3530**********1234 style. */
export function maskIdentifier(id: string): string {
  if (id.length <= 4) return id;
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

/** Convert dollars to integer cents safely. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Compute a retail price from a wholesale cost and markup settings.
 * Returns the price in dollars, rounded to 2dp, honouring min retail/profit floors.
 */
export function computeRetailPrice(opts: {
  wholesaleCost: number;
  markupType: MarkupType;
  markupAmount: number;
  minRetail?: number;
  minProfit?: number;
}): number {
  const costCents = toCents(opts.wholesaleCost);
  let priceCents: number;
  switch (opts.markupType) {
    case 'fixed':
      priceCents = costCents + toCents(opts.markupAmount);
      break;
    case 'percent':
      priceCents = Math.round(costCents * (1 + opts.markupAmount / 100));
      break;
    case 'multiplier':
      priceCents = Math.round(costCents * opts.markupAmount);
      break;
    case 'manual':
    default:
      priceCents = toCents(opts.markupAmount); // markupAmount holds the chosen retail price
      break;
  }
  const minRetailCents = toCents(opts.minRetail ?? 0);
  const minProfitCents = toCents(opts.minProfit ?? 0);
  priceCents = Math.max(priceCents, minRetailCents, costCents + minProfitCents);
  return toDollars(priceCents);
}

/** Pick the first active pricing rule whose cost band contains the wholesale cost. */
export function matchPricingRule(rules: PricingRule[], wholesaleCost: number): PricingRule | null {
  const sorted = [...rules].filter((r) => r.active).sort((a, b) => a.sort_order - b.sort_order);
  return (
    sorted.find(
      (r) => wholesaleCost >= r.min_cost && (r.max_cost == null || wholesaleCost <= r.max_cost),
    ) ?? null
  );
}

/** Suggested retail for a cost using the rule set; null when no rule matches. */
export function suggestRetailPrice(rules: PricingRule[], wholesaleCost: number): number | null {
  const rule = matchPricingRule(rules, wholesaleCost);
  if (!rule) return null;
  return computeRetailPrice({
    wholesaleCost,
    markupType: rule.markup_type,
    markupAmount: rule.markup_amount,
    minRetail: rule.min_retail,
    minProfit: rule.min_profit,
  });
}

/** Gross spread and margin for admin display. */
export function profitMetrics(retail: number, wholesale: number): { spread: number; margin: number } {
  const spread = toDollars(toCents(retail) - toCents(wholesale));
  const margin = retail > 0 ? Math.round((spread / retail) * 1000) / 10 : 0;
  return { spread, margin };
}

export const ORDER_STATUSES = [
  'submitted',
  'pending',
  'processing',
  'completed',
  'failed',
  'rejected',
  'cancelled',
  'under_review',
  'reconciliation',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Map a result value to a status-indicator tone for the report page. */
export function statusTone(value: string): 'good' | 'bad' | 'warn' | 'neutral' {
  const v = value.toLowerCase();
  if (/(clean|unlocked|eligible|active|disabled|no record)/.test(v)) return 'good';
  if (/(blacklist|locked|ineligible|lost|stolen|enabled)/.test(v)) return 'bad';
  if (/(unknown|pending|partial|expired)/.test(v)) return 'warn';
  return 'neutral';
}
