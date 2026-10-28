export function quoteDevicePayment(priceUsd: number, country: 'US' | 'JM', rate: number) {
  const subtotal = Math.round(priceUsd * (country === 'JM' ? rate : 1) * 100) / 100;
  const shipping = country === 'JM' ? Math.round(subtotal * 0.3 * 100) / 100 : 0;
  return { subtotal, shipping, total: Math.round((subtotal + shipping) * 100) / 100, currency: country === 'JM' ? 'jmd' : 'usd' };
}
export const WALLET_TOPUP_CENTS = 500;