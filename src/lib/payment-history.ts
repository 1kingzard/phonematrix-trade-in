import type { Json, Tables } from '@/integrations/supabase/types';
export type PaymentOrder = Tables<'payment_orders'>;
export function paymentStatus(status: string) {
  switch (status) {
    case 'paid': return { label: 'Paid', description: 'Payment confirmed.', variant: 'default' as const };
    case 'failed': return { label: 'Failed', description: 'Payment was not completed.', variant: 'destructive' as const };
    case 'expired': return { label: 'Expired', description: 'This checkout has expired.', variant: 'secondary' as const };
    default: return { label: 'Pending', description: 'Payment has not been confirmed yet.', variant: 'outline' as const };
  }
}
export function paymentMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), currencyDisplay: 'code' }).format(value);
}
export function paymentItems(value: Json): Record<string, Json | undefined>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, Json | undefined> => !!item && typeof item === 'object' && !Array.isArray(item)) : [];
}
export function paymentDelivery(value: Json) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}