import { loadStripe } from '@stripe/stripe-js';
const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
export const paymentsReady = Boolean(token?.startsWith('pk_test_') || token?.startsWith('pk_live_'));
export function paymentEnvironment(): 'sandbox' | 'live' {
  if (token?.startsWith('pk_test_')) return 'sandbox';
  if (token?.startsWith('pk_live_')) return 'live';
  throw new Error('Live payments are not configured yet.');
}
export const stripePromise = paymentsReady ? loadStripe(token) : null;