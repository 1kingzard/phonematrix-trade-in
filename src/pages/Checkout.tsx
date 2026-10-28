import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { FunctionsHttpError } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentTestModeBanner from '@/components/PaymentTestModeBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { paymentEnvironment, paymentsReady, stripePromise } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';

export default function Checkout() {
  const [params] = useSearchParams();
  const kind = params.get('kind') === 'wallet' ? 'wallet' : 'devices';
  const { user } = useAuth();
  const { items } = useCart();
  const [delivery, setDelivery] = useState({ name: '', phone: '', address: '', country: params.get('country') === 'JM' ? 'JM' : 'US' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ subtotal: number; shipping: number; total: number; currency: string } | null>(null);
  const start = async () => {
    setBusy(true); setError('');
    try {
      const { data, error: invocationError } = await supabase.functions.invoke('create-checkout', { body: {
        kind, environment: paymentEnvironment(), delivery: kind === 'devices' ? delivery : undefined,
        items: kind === 'devices' ? items.map(({ device }) => ({ brand: device.Brand, model: device.Model, storage: device.Storage, condition: device.Condition, colour: device.Color || '' })) : undefined,
      } });
      if (invocationError) {
        if (invocationError instanceof FunctionsHttpError) {
          const details = await invocationError.context.json();
          throw new Error(details.error ?? 'Could not open payment form.');
        }
        throw invocationError;
      }
      if (!data?.clientSecret) throw new Error(data?.error ?? 'Could not open payment form.');
      setQuote(data); setSecret(data.clientSecret);
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment unavailable.'); }
    finally { setBusy(false); }
  };
  const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: quote?.currency ?? 'USD' }).format(amount);
  return <div className="min-h-screen bg-background"><Header /><main className="max-w-4xl mx-auto pt-20 pb-16 px-4 space-y-6">
    <PaymentTestModeBanner />
    <Button asChild variant="ghost"><Link to={kind === 'wallet' ? '/imei-services' : '/price-list'}><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
    <h1 className="text-3xl font-bold">{kind === 'wallet' ? 'Add $5 wallet credit' : 'Device pre-order checkout'}</h1>
    {!user ? <Button asChild><Link to="/login">Sign in to continue</Link></Button> : !paymentsReady ? <p className="text-muted-foreground">Payments are not available yet.</p> : <>
      {kind === 'wallet' && <p className="text-sm text-muted-foreground">Test wallet purchases are recorded separately and do not increase your phone-check balance. Live top-ups await approval.</p>}
      {kind === 'devices' && !secret && <>
        <div className="divide-y divide-border">{items.map((item) => <div key={item.id} className="py-3"><p className="font-medium">{item.device.Brand} {item.device.Model}</p><p className="text-sm text-muted-foreground">{item.device.Storage} · {item.device.Condition} · {item.device.Color}</p></div>)}</div>
        <p className="text-sm text-muted-foreground">Pre-order: your device may need to be sourced before delivery. Jamaica includes 30% shipping; US orders use the device price only. Tax is calculated at payment.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['name','phone','address'] as const).map((key) => <div key={key} className={key === 'address' ? 'sm:col-span-2 space-y-2' : 'space-y-2'}><Label htmlFor={`delivery-${key}`}>{key === 'name' ? 'Receiver name' : key === 'phone' ? 'Phone number' : 'Full delivery address'}</Label><Input id={`delivery-${key}`} value={delivery[key]} onChange={(e) => setDelivery({ ...delivery, [key]: e.target.value })} /></div>)}
          <div className="space-y-2"><Label>Delivery country</Label><Select value={delivery.country} onValueChange={(country) => setDelivery({ ...delivery, country })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="US">United States · USD</SelectItem><SelectItem value="JM">Jamaica · JMD</SelectItem></SelectContent></Select></div>
        </div>
      </>}
      {error && <p role="alert" className="text-destructive break-words">{error}</p>}
      {!secret && <Button onClick={start} disabled={busy || (kind === 'devices' && !items.length)}>{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}Continue to payment</Button>}
      {quote && <dl className="border-y border-border py-4 space-y-2"><div className="flex justify-between"><dt>{kind === 'wallet' ? 'Wallet credit' : 'Devices'}</dt><dd>{money(quote.subtotal)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{money(quote.shipping)}</dd></div><div className="flex justify-between font-semibold"><dt>Total before tax</dt><dd>{money(quote.total)}</dd></div></dl>}
      {secret && stripePromise && <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: secret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>}
    </>}
  </main><Footer /></div>;
}