import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, RefreshCw, DollarSign, Eye, Plus, Trash2 } from 'lucide-react';
import { profitMetrics, suggestRetailPrice, type PricingRule, type MarkupType } from '@/lib/imei';
import { serviceDetailsSchema, serviceRemovalValues } from '@/lib/imei-service-management';

interface Service {
  id: string;
  supplier_service_id: number;
  supplier_name: string;
  display_name: string;
  description: string | null;
  category_id: string | null;
  wholesale_cost: number;
  retail_price: number;
  markup_type: MarkupType;
  markup_amount: number;
  min_profit: number;
  is_instant: boolean;
  processing_time: string;
  identifier_type: string;
  enabled: boolean;
  requires_ownership_confirm: boolean;
  requires_manual_approval: boolean;
  is_unlock: boolean;
  last_synced_at: string | null;
}
interface Category { id: string; name: string; sort_order: number }
interface OrderRow {
  id: string; order_ref: string; user_id: string; identifier_masked: string;
  retail_price: number; wholesale_cost: number; status: string; created_at: string;
  supplier_order_id: string | null; error_message: string | null;
  imei_services?: { display_name: string } | null;
}
interface WalletRow { id: string; user_id: string; balance: number; reserved: number; updated_at: string }

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

export default function ImeiServicesAdmin() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [supplierBalance, setSupplierBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [editing, setEditing] = useState<Service | null>(null);
  const [removing, setRemoving] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creditWallet, setCreditWallet] = useState<WalletRow | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [refundOrder, setRefundOrder] = useState<OrderRow | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [rawResult, setRawResult] = useState<{ order: OrderRow; raw: any } | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');

  const load = async () => {
    const [svc, cat, rl, ord, wal, stg] = await Promise.all([
      supabase.from('imei_services').select('*').is('deleted_at', null).order('supplier_service_id'),
      supabase.from('imei_service_categories').select('*').order('sort_order'),
      supabase.from('service_pricing_rules').select('*').order('sort_order'),
      supabase.from('imei_orders').select('*, imei_services(display_name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('customer_wallets').select('*').order('updated_at', { ascending: false }),
      supabase.from('imei_settings').select('key, value'),
    ]);
    setServices((svc.data ?? []) as Service[]);
    setCategories(cat.data ?? []);
    setRules((rl.data ?? []) as PricingRule[]);
    setOrders((ord.data ?? []) as unknown as OrderRow[]);
    setWallets((wal.data ?? []) as WalletRow[]);
    setSettings(Object.fromEntries((stg.data ?? []).map((s: any) => [s.key, s.value])));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed');
    const pending = orders.filter((o) => ['submitted', 'pending', 'processing'].includes(o.status));
    const failed = orders.filter((o) => ['failed', 'rejected'].includes(o.status));
    const grossSales = completed.reduce((a, o) => a + Number(o.retail_price), 0);
    const supplierCosts = completed.reduce((a, o) => a + Number(o.wholesale_cost), 0);
    const liabilities = wallets.reduce((a, w) => a + Number(w.balance), 0);
    const refunds = orders.filter((o) => o.status === 'refunded').reduce((a, o) => a + Number(o.retail_price), 0);
    return {
      total: orders.length,
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      grossSales, supplierCosts,
      spread: grossSales - supplierCosts,
      liabilities, refunds,
    };
  }, [orders, wallets]);

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase.from('imei_settings').upsert({ key, value });
    if (error) {
      toast({ title: 'Could not save setting', description: error.message, variant: 'destructive' });
      return;
    }
    setSettings((s) => ({ ...s, [key]: value }));
    toast({ title: 'Setting saved' });
  };

  const saveService = async () => {
    if (!editing) return;
    const parsed = serviceDetailsSchema.safeParse(editing);
    if (!parsed.success) {
      toast({ title: 'Check service details', description: parsed.error.issues.map((issue) => `${issue.path.join(' ')}: ${issue.message}`).join('; '), variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { id, ...rest } = editing;
    const values = {
      display_name: parsed.data.display_name,
      description: rest.description,
      category_id: rest.category_id,
      retail_price: rest.retail_price,
      markup_type: rest.markup_type,
      markup_amount: rest.markup_amount,
      min_profit: rest.min_profit,
      is_instant: rest.is_instant,
      processing_time: rest.processing_time,
      identifier_type: rest.identifier_type,
      enabled: rest.enabled,
      requires_ownership_confirm: rest.requires_ownership_confirm,
      requires_manual_approval: rest.requires_manual_approval,
      is_unlock: rest.is_unlock,
      updated_at: new Date().toISOString(),
    };
    const { error } = id
      ? await supabase.from('imei_services').update(values).eq('id', id)
      : await supabase.from('imei_services').insert({
          ...values,
          supplier_service_id: parsed.data.supplier_service_id,
          supplier_name: parsed.data.supplier_name,
          wholesale_cost: parsed.data.wholesale_cost,
        });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save service', description: error.code === '23505' ? 'This supplier service ID already exists, including previously deleted services. Use a different supplier ID.' : error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Service saved' });
    setEditing(null);
    load();
  };

  const addService = () => setEditing({
    id: '', supplier_service_id: 0, supplier_name: '', display_name: '', description: '', category_id: null,
    wholesale_cost: 0, retail_price: 0, markup_type: 'manual', markup_amount: 0, min_profit: 0,
    is_instant: true, processing_time: 'Instant', identifier_type: 'imei', enabled: false,
    requires_ownership_confirm: true, requires_manual_approval: false, is_unlock: false, last_synced_at: null,
  });

  const deleteService = async () => {
    if (!removing) return;
    setDeleting(true);
    const { data, error } = await supabase.from('imei_services')
      .update(serviceRemovalValues()).eq('id', removing.id).select('id').single();
    setDeleting(false);
    if (error || !data) {
      toast({ title: 'Could not delete service', description: error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Service deleted', description: 'Past orders and reports are preserved.' });
    setRemoving(null);
    load();
  };

  const syncCatalog = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('imei-services', { body: { action: 'sync-catalog' } });
      if (error) throw error;
      toast({ title: 'Catalog sync', description: data?.message ?? `Updated ${data?.synced ?? 0} supplier prices.` });
      load();
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e?.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const fetchBalance = async () => {
    const { data, error } = await supabase.functions.invoke('imei-services', { body: { action: 'balance' } });
    if (error || data?.error) {
      toast({ title: 'Could not fetch supplier balance', description: data?.error ?? error?.message, variant: 'destructive' });
      return;
    }
    setSupplierBalance(data.balance);
  };

  const grantCredit = async () => {
    if (!creditWallet) return;
    const amount = parseFloat(creditAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !creditReason.trim()) {
      toast({ title: 'Enter an amount and a reason', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.rpc('wallet_credit', {
      p_user_id: creditWallet.user_id,
      p_amount: amount,
      p_type: 'adjustment',
      p_reference: `admin-credit:${crypto.randomUUID()}`,
      p_reason: creditReason.trim(),
    });
    if (error) {
      toast({ title: 'Credit failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Credit added', description: `$${amount.toFixed(2)} added to the wallet.` });
    setCreditWallet(null);
    setCreditAmount('');
    setCreditReason('');
    load();
  };

  const issueRefund = async () => {
    if (!refundOrder) return;
    if (!refundReason.trim()) {
      toast({ title: 'A reason is required for refunds', variant: 'destructive' });
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('refund_imei_order', {
      p_order_id: refundOrder.id,
      p_reason: refundReason.trim(),
      p_admin_id: userData.user?.id ?? null,
    });
    if (error) {
      toast({ title: 'Refund failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Refund issued', description: `$${refundOrder.retail_price.toFixed(2)} returned to the customer's wallet.` });
    setRefundOrder(null);
    setRefundReason('');
    load();
  };

  const viewRaw = async (order: OrderRow) => {
    const { data } = await supabase.from('imei_order_results').select('raw_response').eq('order_id', order.id).maybeSingle();
    setRawResult({ order, raw: data?.raw_response ?? null });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);
  const suggested = editing ? suggestRetailPrice(rules, Number(editing.wholesale_cost)) : null;
  const metrics = editing ? profitMetrics(Number(editing.retail_price), Number(editing.wholesale_cost)) : null;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="wallets">Wallets</TabsTrigger>
        <TabsTrigger value="supplier">Supplier & Flags</TabsTrigger>
      </TabsList>

      {/* ---------- Overview ---------- */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total orders', stats.total],
            ['Completed', stats.completed],
            ['Pending', stats.pending],
            ['Failed / rejected', stats.failed],
          ].map(([label, value]) => (
            <Card key={label as string}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold tabular-nums">{value}</div></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gross customer sales</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums">${stats.grossSales.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Supplier costs</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums">${stats.supplierCosts.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gross spread</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">${stats.spread.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Before payment fees, refunds, taxes and operating costs.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Customer wallet liabilities</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold tabular-nums">${stats.liabilities.toFixed(2)}</div></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Refunds issued</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">${stats.refunds.toFixed(2)}</div></CardContent>
        </Card>
      </TabsContent>

      {/* ---------- Services ---------- */}
      <TabsContent value="services" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {services.filter((s) => s.enabled).length} of {services.length} services enabled. Wholesale costs sync from the supplier; your retail prices are never overwritten.
          </p>
          <div className="flex flex-wrap gap-2">
          <Button onClick={addService}><Plus className="h-4 w-4 mr-2" />Add service</Button>
          <Button variant="outline" onClick={syncCatalog} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync supplier prices
          </Button>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => {
                const m = profitMetrics(Number(s.retail_price), Number(s.wholesale_cost));
                const cat = categories.find((c) => c.id === s.category_id)?.name ?? '—';
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.supplier_service_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{s.display_name}</div>
                      <div className="text-xs text-muted-foreground">{s.is_instant ? 'Instant' : s.processing_time}</div>
                    </TableCell>
                    <TableCell className="text-sm">{cat}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(s.wholesale_cost).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(s.retail_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.margin}%</TableCell>
                    <TableCell>
                      {s.enabled
                        ? <Badge className="bg-green-500/15 text-green-600 dark:text-green-400" variant="secondary">Enabled</Badge>
                        : <Badge variant="outline">Disabled</Badge>}
                      {s.requires_manual_approval && <Badge variant="outline" className="ml-1">Approval</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button size="icon" variant="ghost" title={`Edit ${s.display_name}`} aria-label={`Edit ${s.display_name}`} onClick={() => setEditing({ ...s })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" title={`Delete ${s.display_name}`} aria-label={`Delete ${s.display_name}`} onClick={() => setRemoving(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* ---------- Orders ---------- */}
      <TabsContent value="orders" className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['submitted', 'pending', 'processing', 'completed', 'failed', 'rejected', 'reconciliation', 'refunded'].map((s) => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.order_ref}</TableCell>
                  <TableCell>{o.imei_services?.display_name ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{o.identifier_masked}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(o.retail_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(o.wholesale_cost).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${(Number(o.retail_price) - Number(o.wholesale_cost)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[o.status] ?? ''} variant="secondary">{o.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button size="icon" variant="ghost" title="View raw supplier result" onClick={() => viewRaw(o)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {o.status === 'completed' && (
                      <Button size="icon" variant="ghost" title="Refund" onClick={() => { setRefundOrder(o); setRefundReason(''); }}>
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!filteredOrders.length && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No orders yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* ---------- Wallets ---------- */}
      <TabsContent value="wallets" className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.user_id.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(w.balance).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(w.reserved).toFixed(2)}</TableCell>
                  <TableCell>{new Date(w.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setCreditWallet(w); setCreditAmount(''); setCreditReason(''); }}>
                      Add credit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!wallets.length && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No wallets yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* ---------- Supplier & Flags ---------- */}
      <TabsContent value="supplier" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Launch controls</CardTitle>
            <CardDescription>
              Public resale and wallet top-ups stay off until SICKW's written resale authorization and payment-provider approval are confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Public resale enabled</p>
                <p className="text-sm text-muted-foreground">Lets customers order checks. Admins can always test orders.</p>
              </div>
              <Switch
                checked={settings.resale_enabled === true}
                onCheckedChange={(v) => saveSetting('resale_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Mock supplier mode</p>
                <p className="text-sm text-muted-foreground">Simulates SICKW responses without spending supplier credit. Turn off only after the live API key is configured.</p>
              </div>
              <Switch
                checked={settings.mock_mode !== false}
                onCheckedChange={(v) => saveSetting('mock_mode', v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Wallet top-ups enabled</p>
                <p className="text-sm text-muted-foreground">Requires an approved payment provider for prepaid credits. Keep off until then.</p>
              </div>
              <Switch
                checked={settings.topups_enabled === true}
                onCheckedChange={(v) => saveSetting('topups_enabled', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier</CardTitle>
            <CardDescription>SICKW.COM integration status. The API key is stored securely and never shown here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">API key</p>
                <p className="text-sm text-muted-foreground">Configured via secure environment secrets.</p>
              </div>
              <Badge variant="outline">{settings.mock_mode !== false ? 'Not required (mock mode)' : 'Required for live mode'}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Supplier balance</p>
                <p className="text-sm text-muted-foreground">
                  {supplierBalance != null ? `$${supplierBalance.toFixed(2)}${settings.mock_mode !== false ? ' (simulated)' : ''}` : 'Not fetched yet'}
                </p>
              </div>
              <Button variant="outline" onClick={fetchBalance}>Check balance</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ---------- Edit service dialog ---------- */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit service' : 'Add service'}</DialogTitle>
            <DialogDescription>
              {editing?.id ? `Supplier ID ${editing.supplier_service_id} · ${editing.supplier_name}` : 'Use the exact service ID from your SICKW catalog. New services start disabled.'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {!editing.id && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-supplier-id">Supplier service ID</Label>
                    <Input id="new-supplier-id" type="number" min="1" step="1" value={editing.supplier_service_id || ''} onChange={(e) => setEditing({ ...editing, supplier_service_id: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-wholesale">Wholesale cost (USD)</Label>
                    <Input id="new-wholesale" type="number" min="0" step="0.0001" value={editing.wholesale_cost} onChange={(e) => setEditing({ ...editing, wholesale_cost: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="new-supplier-name">Supplier service name</Label>
                    <Input id="new-supplier-name" value={editing.supplier_name} onChange={(e) => setEditing({ ...editing, supplier_name: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="service-display-name">Display name</Label>
                <Input id="service-display-name" value={editing.display_name} onChange={(e) => setEditing({ ...editing, display_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editing.category_id ?? ''} onValueChange={(v) => setEditing({ ...editing, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Processing time</Label>
                  <Input value={editing.processing_time} onChange={(e) => setEditing({ ...editing, processing_time: e.target.value })} />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Wholesale cost</span><span className="tabular-nums">${Number(editing.wholesale_cost).toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Retail price</span><span className="tabular-nums font-medium">${Number(editing.retail_price).toFixed(2)}</span></div>
                {metrics && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Expected profit</span><span className="tabular-nums">${metrics.spread.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross margin</span><span className="tabular-nums">{metrics.margin}%</span></div>
                  </>
                )}
                {suggested != null && Number(editing.retail_price) !== suggested && (
                  <Button size="sm" variant="link" className="px-0 h-auto" onClick={() => setEditing({ ...editing, retail_price: suggested })}>
                    Apply pricing-rule suggestion: ${suggested.toFixed(2)}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retail price ($)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={editing.retail_price}
                    onChange={(e) => setEditing({ ...editing, retail_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum profit ($)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={editing.min_profit}
                    onChange={(e) => setEditing({ ...editing, min_profit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Device identifier</Label>
                  <Select value={editing.identifier_type} onValueChange={(v) => setEditing({ ...editing, identifier_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imei">IMEI</SelectItem>
                      <SelectItem value="serial">Serial number</SelectItem>
                      <SelectItem value="either">IMEI or serial number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Unlock service</Label>
                  <Switch checked={editing.is_unlock} onCheckedChange={(v) => setEditing({ ...editing, is_unlock: v, requires_manual_approval: v ? true : editing.requires_manual_approval })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Enabled (customers can order)</Label>
                  <Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Instant result</Label>
                  <Switch checked={editing.is_instant} onCheckedChange={(v) => setEditing({ ...editing, is_instant: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Requires ownership confirmation</Label>
                  <Switch checked={editing.requires_ownership_confirm} onCheckedChange={(v) => setEditing({ ...editing, requires_ownership_confirm: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Requires manual approval</Label>
                  <Switch checked={editing.requires_manual_approval} onCheckedChange={(v) => setEditing({ ...editing, requires_manual_approval: v })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveService} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editing?.id ? 'Save' : 'Add service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removing} onOpenChange={(open) => !open && !deleting && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete service?</DialogTitle>
            <DialogDescription>Remove {removing?.display_name} from the service list and stop new orders. Existing orders and reports will remain available.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={deleteService}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Add credit dialog ---------- */}
      <Dialog open={!!creditWallet} onOpenChange={(open) => !open && setCreditWallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add wallet credit</DialogTitle>
            <DialogDescription>Promotional or manual credit for wallet {creditWallet?.user_id.slice(0, 8)}…. Every adjustment is recorded with your identity and a reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" step="0.01" min="0" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="e.g. Promotional credit" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditWallet(null)}>Cancel</Button>
            <Button onClick={grantCredit}>Add credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Refund dialog ---------- */}
      <Dialog open={!!refundOrder} onOpenChange={(open) => !open && setRefundOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund order {refundOrder?.order_ref}</DialogTitle>
            <DialogDescription>
              Returns ${refundOrder?.retail_price.toFixed(2)} to the customer's wallet as a separate auditable transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (required)</Label>
            <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="e.g. Supplier could not complete the check" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOrder(null)}>Cancel</Button>
            <Button onClick={issueRefund}>Issue refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Raw result dialog ---------- */}
      <Dialog open={!!rawResult} onOpenChange={(open) => !open && setRawResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raw supplier result — {rawResult?.order.order_ref}</DialogTitle>
            <DialogDescription>Admin only. Never shown to customers.</DialogDescription>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
            {rawResult?.raw ? JSON.stringify(rawResult.raw, null, 2) : 'No raw result stored for this order.'}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRawResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
