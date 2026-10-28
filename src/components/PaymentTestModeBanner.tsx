import { paymentsReady } from '@/lib/payments';
export default function PaymentTestModeBanner() {
  if (!paymentsReady) return <div className="bg-destructive/10 text-destructive border-b border-border px-4 py-3 text-center text-sm">Live checkout is not available yet.</div>;
  if (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN?.startsWith('pk_test_')) return <div className="bg-muted text-muted-foreground border-b border-border px-4 py-3 text-center text-sm">Test payments only — no real money is charged. Tax calculation is not included in this test.</div>;
  return null;
}