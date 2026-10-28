import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import PaymentTestModeBanner from '@/components/PaymentTestModeBanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { paymentEnvironment } from '@/lib/payments';
import { useCart } from '@/contexts/CartContext';
import { Loader2, CheckCircle2 } from 'lucide-react';
export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Confirming your payment…');
  const [pending, setPending] = useState(true);
  const [paid, setPaid] = useState(false);
  const { clearCart } = useCart();
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout', { body: { kind: 'devices', environment: paymentEnvironment(), sessionId: params.get('session_id') } });
        if (error || data?.error) throw new Error('Could not confirm this payment. Please check your payment history before trying again.');
        setPaid(data.status === 'paid');
        setMessage(data.status === 'paid' ? data.environment === 'sandbox' ? 'Test payment completed. No real money was charged and no live wallet credit or device order was created.' : 'Payment confirmed. Your pre-order has been received.' : 'Your payment has not been confirmed yet.');
        if (data.status === 'paid' && data.kind === 'devices') clearCart();
      } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not verify payment.'); }
      finally { setPending(false); }
    })();
    // The payment is verified once per return page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="min-h-screen bg-background"><Header /><main className="max-w-2xl mx-auto pt-24 px-4 space-y-6"><PaymentTestModeBanner /><h1 className="text-3xl font-bold">Payment {paid ? 'confirmed' : 'status'}</h1>{pending ? <Loader2 className="animate-spin h-6 w-6" /> : paid && <CheckCircle2 className="h-8 w-8 text-primary" />}<p>{message}</p><div className="flex flex-wrap gap-3"><Button asChild><Link to="/payments">Payment history</Link></Button><Button asChild variant="outline"><Link to="/imei-services">Phone checks</Link></Button><Button asChild variant="outline"><Link to="/price-list">Browse devices</Link></Button></div></main></div>;
}