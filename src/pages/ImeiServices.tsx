import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldCheck, Smartphone, Lock, Search, Wallet, Zap, Clock, ChevronRight, Loader2, Info,
} from 'lucide-react';
import { validateIdentifier, maskIdentifier } from '@/lib/imei';
import { paymentsReady, paymentEnvironment } from '@/lib/payments';

interface Category { id: string; name: string; sort_order: number }
interface Service {
  id: string;
  supplier_service_id: number;
  display_name: string;
  description: string | null;
  category_id: string | null;
  retail_price: number;
  is_instant: boolean;
  processing_time: string;
  identifier_type: string;
  enabled: boolean;
  is_unlock: boolean;
  requires_ownership_confirm: boolean;
}
interface OrderRow {
  id: string;
  order_ref: string;
  identifier_masked: string;
  retail_price: number;
  status: string;
  created_at: string;
  imei_services?: { display_name: string } | null;
}
interface WalletRow { id: string; balance: number; reserved: number }

const CATEGORY_ICONS: Record<string, typeof Smartphone> = {
  'Device Information': Smartphone,
  'Carrier & SIM Lock': Search,
  'Blacklist & Eligibility': ShieldCheck,
  'Unlock Services': Lock,
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  submitted: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  processing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
  refunded: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  reconciliation: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

export default function ImeiServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [resaleEnabled, setResaleEnabled] = useState(false);
  const [topupsEnabled, setTopupsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Service | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: svcs }, { data: settings }] = await Promise.all([
        supabase.from('imei_service_categories').select('*').order('sort_order'),
        supabase.from('imei_services').select('*').eq('enabled', true).is('deleted_at', null).order('retail_price'),
        supabase.from('imei_settings').select('key, value'),
      ]);
      setCategories(cats ?? []);
      setServices((svcs ?? []) as Service[]);
      const flags = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
      setResaleEnabled(flags.resale_enabled === true);
      setTopupsEnabled(flags.topups_enabled === true);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) { setWallet(null); setOrders([]); return; }
    supabase.from('customer_wallets').select('id, balance, reserved').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setWallet(data as WalletRow | null));
    supabase.from('imei_orders').select('id, order_ref, identifier_masked, retail_price, status, created_at, imei_services(display_name)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setOrders((data ?? []) as unknown as OrderRow[]));
  }, [user]);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      if (!s.category_id) continue;
      const list = map.get(s.category_id) ?? [];
      list.push(s);
      map.set(s.category_id, list);
    }
    return map;
  }, [services]);

  const available = wallet ? wallet.balance - wallet.reserved : 0;

  const openOrder = (service: Service) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to order a device check.' });
      navigate('/login');
      return;
    }
    setSelected(service);
    setIdentifier('');
    setIdError(null);
    setOwnershipConfirmed(false);
  };

  const submitOrder = async () => {
    if (!selected || !user) return;
    const err = validateIdentifier(identifier, selected.identifier_type);
    if (err) { setIdError(err); return; }
    if (selected.requires_ownership_confirm && !ownershipConfirmed) {
      toast({ title: 'Confirmation required', description: 'Please confirm you own or are authorized to check this device.', variant: 'destructive' });
      return;
    }
    if (available < selected.retail_price) {
      toast({ title: 'Insufficient balance', description: 'Your wallet balance is too low for this check.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data: orderId, error } = await supabase.rpc('submit_imei_order', {
        p_service_id: selected.id,
        p_identifier: identifier.trim(),
        p_idempotency_key: crypto.randomUUID(),
      });
      if (error) throw error;
      const { data, error: fnError } = await supabase.functions.invoke('imei-services', {
        body: { action: 'submit', order_id: orderId },
      });
      if (fnError) throw fnError;
      if (data?.status === 'completed') {
        toast({ title: 'Check complete', description: 'Your report is ready.' });
      } else if (data?.status === 'pending') {
        toast({ title: 'Order submitted', description: 'This service takes longer — we will update your order when it completes.' });
      } else if (data?.error) {
        toast({ title: 'Check not completed', description: data.error, variant: 'destructive' });
      }
      setSelected(null);
      navigate(`/imei-services/orders/${orderId}`);
    } catch (e: any) {
      toast({ title: 'Order failed', description: e?.message ?? 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4 pt-6">
          <Badge variant="secondary" className="mx-auto">Phone Checks & Unlocking</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Check Your Phone's Status</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Check carrier lock, blacklist, device information, and more with ShopPhoneMatrix.
          </p>
        </section>

        {/* Wallet */}
        <section>
          {user ? (
            <Card className="border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet balance</p>
                    <p className="text-2xl font-bold tabular-nums">${available.toFixed(2)}</p>
                    {wallet && wallet.reserved > 0 && (
                      <p className="text-xs text-muted-foreground">${wallet.reserved.toFixed(2)} reserved for pending orders</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {paymentsReady && (paymentEnvironment() === 'sandbox' || topupsEnabled) ? (
                    <Button asChild><Link to="/checkout?kind=wallet">{paymentEnvironment() === 'sandbox' ? 'Test $5 top-up' : 'Add $5'}</Link></Button>
                  ) : (
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Wallet top-ups are coming soon. Credits can be added by our team in the meantime.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between gap-4 py-5">
                <p className="text-muted-foreground">Sign in to view your wallet balance and order checks.</p>
                <Button asChild><Link to="/login">Sign In</Link></Button>
              </CardContent>
            </Card>
          )}
          {!resaleEnabled && (
            <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              Our device-check services are launching soon. You can browse the catalog now.
            </p>
          )}
        </section>

        {/* Catalog */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          categories.map((cat) => {
            const list = servicesByCategory.get(cat.id) ?? [];
            if (!list.length) return null;
            const Icon = CATEGORY_ICONS[cat.name] ?? Smartphone;
            return (
              <section key={cat.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
                  <h2 className="text-2xl font-semibold">{cat.name}</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <Card key={s.id} className="flex flex-col hover:border-primary/40 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-snug">{s.display_name}</CardTitle>
                          {s.is_instant ? (
                            <Badge variant="secondary" className="shrink-0 gap-1"><Zap className="h-3 w-3" />Instant</Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 gap-1"><Clock className="h-3 w-3" />{s.processing_time}</Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">{s.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto flex items-center justify-between pt-0">
                        <span className="text-xl font-bold tabular-nums">${s.retail_price.toFixed(2)}</span>
                        <Button size="sm" onClick={() => openOrder(s)} disabled={!resaleEnabled && !user}>
                          Check Device <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Recent orders */}
        {user && orders.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Recent Orders</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>IMEI / Serial</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/imei-services/orders/${o.id}`)}>
                      <TableCell className="font-medium">{o.order_ref}</TableCell>
                      <TableCell>{o.imei_services?.display_name ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{o.identifier_masked}</TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right tabular-nums">${o.retail_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLES[o.status] ?? ''} variant="secondary">
                          {o.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        )}
      </main>
      <Footer />

      {/* Order dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.display_name}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imei-input">{selected?.identifier_type === 'serial' ? 'Serial number' : 'IMEI number'}</Label>
              <Input
                id="imei-input"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setIdError(null); }}
                placeholder={selected?.identifier_type === 'serial' ? 'e.g. F2LX3ABCD123' : '15-digit IMEI (dial *#06#)'}
                className="font-mono"
                maxLength={32}
              />
              {idError && <p className="text-sm text-destructive">{idError}</p>}
              {identifier.trim().length > 4 && !idError && (
                <p className="text-xs text-muted-foreground">Will be stored masked as {maskIdentifier(identifier.trim())}</p>
              )}
            </div>
            {selected?.requires_ownership_confirm && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="ownership"
                  checked={ownershipConfirmed}
                  onCheckedChange={(v) => setOwnershipConfirmed(v === true)}
                />
                <Label htmlFor="ownership" className="text-sm font-normal leading-snug">
                  I confirm that I own this device or am authorized by the owner to request this check.
                </Label>
              </div>
            )}
            <div className="rounded-lg bg-muted p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-bold tabular-nums">${selected?.retail_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your balance</span>
              <span className={`tabular-nums font-medium ${available < (selected?.retail_price ?? 0) ? 'text-destructive' : ''}`}>
                ${available.toFixed(2)}
              </span>
            </div>
            {selected?.is_unlock && (
              <p className="text-xs text-muted-foreground">
                This is an unlocking service, not a status check. Processing time: {selected.processing_time}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={submitOrder} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Pay ${selected?.retail_price.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
