import { describe, it, expect } from 'vitest';
import {
  isValidImei,
  isValidSerial,
  validateIdentifier,
  maskIdentifier,
  computeRetailPrice,
  matchPricingRule,
  suggestRetailPrice,
  profitMetrics,
  statusTone,
  type PricingRule,
} from './imei';

describe('isValidImei (Luhn checksum)', () => {
  it('accepts a valid 15-digit IMEI', () => {
    expect(isValidImei('490154203237518')).toBe(true); // well-known valid example
  });
  it('rejects a bad checksum', () => {
    expect(isValidImei('490154203237519')).toBe(false);
  });
  it('rejects wrong lengths and non-digits', () => {
    expect(isValidImei('12345')).toBe(false);
    expect(isValidImei('4901542032375189')).toBe(false);
    expect(isValidImei('49015420323751a')).toBe(false);
  });
});

describe('isValidSerial', () => {
  it('accepts alphanumeric serials of 5-32 chars', () => {
    expect(isValidSerial('F2LX3ABCD123')).toBe(true);
  });
  it('rejects short or symbol-containing serials', () => {
    expect(isValidSerial('ABC')).toBe(false);
    expect(isValidSerial('ABC-DEF-123')).toBe(false);
  });
});

describe('validateIdentifier', () => {
  it('returns null for valid input and an error message for invalid', () => {
    expect(validateIdentifier('490154203237518', 'imei')).toBeNull();
    expect(validateIdentifier('123', 'imei')).toMatch(/IMEI/);
    expect(validateIdentifier('F2LX3ABCD123', 'serial')).toBeNull();
    expect(validateIdentifier('!!', 'serial')).toMatch(/serial/i);
  });
});

describe('maskIdentifier', () => {
  it('keeps only the last 4 characters visible', () => {
    expect(maskIdentifier('490154203237518')).toBe('***********7518');
  });
  it('leaves short values untouched', () => {
    expect(maskIdentifier('1234')).toBe('1234');
  });
});

describe('computeRetailPrice', () => {
  it('fixed markup: $0.05 cost + $0.95 = $1.00', () => {
    expect(computeRetailPrice({ wholesaleCost: 0.05, markupType: 'fixed', markupAmount: 0.95 })).toBe(1.0);
  });
  it('percent markup: $5.00 cost + 100% = $10.00', () => {
    expect(computeRetailPrice({ wholesaleCost: 5, markupType: 'percent', markupAmount: 100 })).toBe(10.0);
  });
  it('multiplier: $3.00 cost x 2.5 = $7.50', () => {
    expect(computeRetailPrice({ wholesaleCost: 3, markupType: 'multiplier', markupAmount: 2.5 })).toBe(7.5);
  });
  it('manual price passes through', () => {
    expect(computeRetailPrice({ wholesaleCost: 0.09, markupType: 'manual', markupAmount: 1.5 })).toBe(1.5);
  });
  it('enforces the minimum retail floor', () => {
    expect(
      computeRetailPrice({ wholesaleCost: 0.04, markupType: 'fixed', markupAmount: 0.1, minRetail: 1.0 }),
    ).toBe(1.0);
  });
  it('enforces the minimum profit floor', () => {
    expect(
      computeRetailPrice({ wholesaleCost: 0.5, markupType: 'fixed', markupAmount: 0.1, minProfit: 0.5 }),
    ).toBe(1.0);
  });
  it('never produces floating-point dust', () => {
    const price = computeRetailPrice({ wholesaleCost: 0.07, markupType: 'percent', markupAmount: 33 });
    expect(price).toBe(0.09);
  });
});

const rules: PricingRule[] = [
  { id: '1', name: 'Under $0.10', min_cost: 0, max_cost: 0.0999, markup_type: 'fixed', markup_amount: 0, min_retail: 1.0, min_profit: 0.5, active: true, sort_order: 1 },
  { id: '2', name: '$0.10-$1.00', min_cost: 0.1, max_cost: 1.0, markup_type: 'multiplier', markup_amount: 2, min_retail: 1.0, min_profit: 0.5, active: true, sort_order: 2 },
  { id: '3', name: 'Above $10', min_cost: 10.01, max_cost: null, markup_type: 'percent', markup_amount: 50, min_retail: 0, min_profit: 5, active: true, sort_order: 4 },
];

describe('pricing rules', () => {
  it('matches the correct cost band', () => {
    expect(matchPricingRule(rules, 0.05)?.name).toBe('Under $0.10');
    expect(matchPricingRule(rules, 0.5)?.name).toBe('$0.10-$1.00');
    expect(matchPricingRule(rules, 50)?.name).toBe('Above $10');
  });
  it('returns null when no band matches', () => {
    expect(matchPricingRule(rules, 5)).toBeNull();
  });
  it('suggests $1.00 minimum for sub-$0.10 costs', () => {
    expect(suggestRetailPrice(rules, 0.05)).toBe(1.0);
  });
  it('doubles costs in the $0.10-$1.00 band', () => {
    expect(suggestRetailPrice(rules, 0.3)).toBe(0.6);
  });
  it('adds 50% above $10', () => {
    expect(suggestRetailPrice(rules, 24)).toBe(36);
  });
  it('skips inactive rules', () => {
    const inactive = rules.map((r) => ({ ...r, active: false }));
    expect(suggestRetailPrice(inactive, 0.05)).toBeNull();
  });
});

describe('profitMetrics', () => {
  it('computes spread and margin', () => {
    const { spread, margin } = profitMetrics(1.0, 0.05);
    expect(spread).toBe(0.95);
    expect(margin).toBe(95);
  });
});

describe('statusTone', () => {
  it('maps result values to indicator tones', () => {
    expect(statusTone('Clean')).toBe('good');
    expect(statusTone('Unlocked')).toBe('good');
    expect(statusTone('Blacklisted')).toBe('bad');
    expect(statusTone('Locked')).toBe('bad');
    expect(statusTone('Unknown')).toBe('warn');
    expect(statusTone('Verizon')).toBe('neutral');
  });
});
