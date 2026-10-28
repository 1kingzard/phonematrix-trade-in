import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Smartphone, RefreshCw, Receipt, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { paymentEnvironment, paymentsReady } from '@/lib/payments';
import { paymentDelivery, paymentItems, paymentMoney, paymentStatus, type PaymentOrder } from '@/lib/payment-history';

function OrderDetails({ order }: { order: PaymentOrder }) {
  const items = paymentItems(order.items);
  const delivery = paymentDelivery(order.delivery_details);
  const text = (value: unknown) => typeof value === 'string' ? value : '';
  const money = (value: number) => paymentMoney(value, order.currency);
  const extra = Math.round((Number(order.total) - Number(order.subtotal) - Number(order.shipping)) * 100) / 100;
  return <div className="border-t border-border pt-5 mt-5 grid md:grid-cols-2 gap-6 text-sm">
    <div className="space-y-4"><h3 className="text-lg">{order.kind === 'wallet' ? 'Wallet purchase' : 'Pre-order items'}</h3>{order.kind === 'wallet' ? <p>$5 USD wallet purchase</p> : items.map((item, i) => <div key={i} className="space-y-1"><p className="font-medium">{text(item.brand)} {text(item.model)}</p><p className="text-muted-foreground">{[text(item.storage), text(item.condition), text(item.colour)].filter(Boolean).join(' · ')}</p>{typeof item.subtotal === 'number' && <p>{money(item.subtotal)}</p>}</div>)}
    {order.kind === 'devices' && <div className="space-y-1 border-t border-border pt-4"><h3 className="text-lg">Delivery</h3><p>{order.delivery_country === 'JM' ? 'Jamaica' : order.delivery_country === 'US' ? 'United States' : 'Not provided'}</p><p>{text(delivery.name)}</p><p className="whitespace-pre-wrap break-words">{text(delivery.address)}</p><p>{text(delivery.phone)}</p></div>}
    </div><div className="space-y-3"><h3 className="text-lg">Payment details</h3><dl className="space-y-3"><div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{money(Number(order.subtotal))}</dd></div><div className="flex justify-between gap-3"><dt>Shipping</dt><dd>{money(Number(order.shipping))}</dd></div>{extra > 0 && <div className="flex justify-between gap-3"><dt>Additional charges</dt><dd>{money(extra)}</dd></div>}<div className="flex justify-between gap-3 font-semibold border-t border-border pt-3"><dt>Total</dt><dd>{money(Number(order.total))}</dd></div>{order.paid_at && <div><dt className="text-muted-foreground">Paid on</dt><dd>{new Date(order.paid_at).toLocaleString()}</dd></div>}<div><dt className="text-muted-foreground">Order ID</dt><dd className="font-mono text-xs break-all">{order.id}</dd></div></dl>
    {order.environment === 'sandbox' ? <p className="text-muted-foreground border-t border-border pt-4">Test purchase only. No real money was charged, no usable wallet credit was added, and no live pre-order was created.</p> : order.kind === 'devices' && <p className="text-muted-foreground">{order.status === 'paid' ? 'Your pre-order has been received. Payment status is separate from delivery progress.' : 'Your pre-order will be received once payment is confirmed.'}</p>}
    </div></div>;
}

export default function PaymentHistory() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const environment = paymentsReady ? paymentEnvironment() : 'live';
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (!isLoading && !user) navigate('/login?redirect=/payments', { replace: true }); }, [user, isLoading, navigate]);
  const query = useQuery({
    queryKey: ['payment-history', user?.id, environment], enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('payment_orders').select('id,user_id,environment,kind,status,currency,subtotal,shipping,total,rate_used,items,delivery_country,delivery_details,stripe_session_id,paid_at,created_at').eq('user_id', user.id).eq('environment', environment).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }, refetchInterval: 15000,
  });
  const orders = (query.data || []).filter(order => (kind === 'all' || order.kind === kind) && (status === 'all' || order.status === status));
  if (!user) return null;
  return <div className="min-h-screen bg-background"><Header /><main className="max-w-5xl mx-auto px-4 pt-28 pb-16"><div className="flex justify-between items-start gap-4 mb-6"><div><Link to="/account" className="text-sm text-muted-foreground">Account</Link><h1 className="text-4xl mt-2">Payment history</h1></div><Button variant="outline" size="icon" aria-label="Refresh payment history" title="Refresh payment history" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? 'animate-spin' : ''} /></Button></div>
    {environment === 'sandbox' && <p className="bg-muted border border-border rounded-md p-4 text-sm mb-6">Test payments · No real money is charged. Test purchases do not add usable wallet credit or create live pre-orders.</p>}
    <div className="flex flex-wrap gap-3 mb-6"><Select value={kind} onValueChange={setKind}><SelectTrigger className="w-48" aria-label="Purchase type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All purchases</SelectItem><SelectItem value="wallet">Wallet purchases</SelectItem><SelectItem value="devices">Phone pre-orders</SelectItem></SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40" aria-label="Payment status"><SelectValue /></SelectTrigger><SelectContent>{['all','paid','pending','failed','expired'].map(value => <SelectItem key={value} value={value}>{value === 'all' ? 'All statuses' : paymentStatus(value).label}</SelectItem>)}</SelectContent></Select></div>
    {query.isLoading ? <Loader2 className="animate-spin" aria-label="Loading payments" /> : query.isError ? <div role="alert" className="py-8"><p>Payment history could not be loaded.</p><Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Try again</Button></div> : orders.length === 0 ? <div className="border-y border-border py-16 text-center"><Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-4" /><h2 className="text-2xl">{query.data?.length ? 'No matching purchases' : 'No payments yet'}</h2><Button asChild variant="outline" className="mt-5"><Link to="/price-list">Browse devices</Link></Button></div> : <div className="space-y-4">{orders.map(order => {
      const state = paymentStatus(order.status); const items = paymentItems(order.items); const expanded = open === order.id;
      return <article key={order.id} className="border border-border bg-card rounded-lg p-5"><div className="flex gap-4"><div className="h-10 w-10 shrink-0 bg-muted rounded-md flex items-center justify-center">{order.kind === 'wallet' ? <Wallet className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</div><div className="flex-1 min-w-0"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl break-words">{order.kind === 'wallet' ? 'Wallet purchase' : items.length === 1 ? `${typeof items[0].brand === 'string' ? items[0].brand : ''} ${typeof items[0].model === 'string' ? items[0].model : 'Phone'} pre-order` : `${items.length} device pre-order`}</h2><p className="font-semibold whitespace-nowrap">{paymentMoney(Number(order.total), order.currency)}</p></div><p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString()} · #{order.id.slice(0,8).toUpperCase()}</p><div className="flex flex-wrap items-center gap-3 mt-3"><Badge variant={state.variant}>{state.label}</Badge>{order.environment === 'sandbox' && <Badge variant="secondary">Test</Badge>}<p className="text-sm text-muted-foreground">{state.description}</p></div><Button variant="ghost" size="sm" className="mt-3" aria-expanded={expanded} aria-controls={`details-${order.id}`} onClick={() => setOpen(expanded ? null : order.id)}>{expanded ? 'Hide details' : 'View details'}{expanded ? <ChevronUp /> : <ChevronDown />}</Button></div></div>{expanded && <div id={`details-${order.id}`}><OrderDetails order={order} /></div>}</article>;
    })}</div>}
  </main></div>;
}