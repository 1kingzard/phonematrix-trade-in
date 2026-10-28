import { expect, it } from 'vitest';
import { paymentItems, paymentMoney, paymentStatus } from './payment-history';
it('keeps pending distinct from paid', () => {
  expect(paymentStatus('pending').label).toBe('Pending');
  expect(paymentStatus('paid').label).toBe('Paid');
  expect(paymentStatus('failed').label).toBe('Failed');
  expect(paymentStatus('expired').label).toBe('Expired');
});
it('displays recorded JMD amounts without converting again', () => {
  expect(paymentMoney(70000, 'jmd')).toBe('JMD 70,000.00');
  expect(paymentMoney(5, 'usd')).toBe('USD 5.00');
});
it('handles empty wallet snapshots and malformed items', () => {
  expect(paymentItems([])).toEqual([]);
  expect(paymentItems([null, 'bad', { model: 'iPhone 15' }])).toEqual([{ model: 'iPhone 15' }]);
});