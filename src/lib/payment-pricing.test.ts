import { expect, it } from 'vitest';
import { quoteDevicePayment, WALLET_TOPUP_CENTS } from '../../supabase/functions/_shared/payment-pricing';
it('offers exactly a $5 wallet top-up', () => { expect(WALLET_TOPUP_CENTS).toBe(500); });
it('charges Jamaica prices plus 30 percent shipping', () => { expect(quoteDevicePayment(100, 'JM', 157)).toEqual({ subtotal: 15700, shipping: 4710, total: 20410, currency: 'jmd' }); });
it('charges US device prices without shipping', () => { expect(quoteDevicePayment(100, 'US', 157)).toEqual({ subtotal: 100, shipping: 0, total: 100, currency: 'usd' }); });