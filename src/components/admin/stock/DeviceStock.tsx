import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ShoppingBag, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GRADE_ORDER } from '@/lib/tradeInRequests';
import { PAYMENT_METHODS, STOCK_STATUSES, usd, buildSchedule, bestLoyalty, LoyaltyRule, Installment } from '@/lib/stock';
import SaleDetails from './SaleDetails';

const db = supabase as any;

const emptyItem = {
  brand: 'Apple', model: '', storage: '', colour: '', condition: 'Very Good', photos: [] as string[],
  imei: '', serial: '', purchase_cost: 0, purchased_from: '', purchase_date: '', website_price: 0,
  warranty_days: 30, status: 'in_stock', notes: '',
};

const DeviceStock = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [newRepair, setNewRepair] = useState({ description: '', cost: '', repaired_at: '' });
  const [uploading, setUploading] = useState(false);
  const [selling, setSelling] = useState<any | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    const [s, sl] = await Promise.all([
      db.from('device_stock').select('*, device_repairs(cost)').order('created_at', { ascending: false }),
      db.from('device_sales').select('id, stock_id, sold_for, customers(name)'),
    ]);
    setItems(s.data || []); setSales(sl.data || []);
  };
  useEffect(() => { load(); }, []);

  const saleFor = (id: string) => sales.find(s => s.stock_id === id);
  const repairCost = (it: any) => (it.device_repairs || []).reduce((a: number, r: any) => a + Number(r.cost), 0);

  const filtered = items.filter(i => `${i.brand} ${i.model} ${i.imei} ${i.serial} ${i.colour}`.toLowerCase().includes(search.toLowerCase()));
  const stats = useMemo(() => ({
    inStock: items.filter(i => i.status === 'in_stock').length,
    value: items.filter(i => i.status !== 'sold').reduce((a, i) => a + Number(i.purchase_cost) + repairCost(i), 0),
    profit: items.filter(i => i.status === 'sold').reduce((a, i) => a + Number(saleFor(i.id)?.sold_for || 0) - Number(i.purchase_cost) - repairCost(i), 0),
  }), [items, sales]);

  const openEdit = async (it: any | null) => {
    setEditing(it ? { ...it, purchase_date: it.purchase_date || '' } : { ...emptyItem });
    if (it) { const { data } = await db.from('device_repairs').select('*').eq('stock_id', it.id).order('repaired_at'); setRepairs(data || []); }
    else setRepairs([]);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const path = `inventory/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, '_')}`;
      const { error } = await supabase.storage.from('media').upload(path, f);
      if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); continue; }
      urls.push(supabase.storage.from('media').getPublicUrl(path).data.publicUrl);
    }
    setEditing((e: any) => ({ ...e, photos: [...(e.photos || []), ...urls] }));
    setUploading(false);
  };

  const save = async () => {
    const { id, device_repairs, created_at, updated_at, ...rest } = editing;
    const payload = { ...rest, purchase_cost: Number(rest.purchase_cost) || 0, website_price: Number(rest.website_price) || 0, warranty_days: Number(rest.warranty_days) || 0, purchase_date: rest.purchase_date || null };
    const res = id ? await db.from('device_stock').update(payload).eq('id', id).select().single() : await db.from('device_stock').insert(payload).select().single();
    if (res.error) return toast({ title: 'Save failed', description: res.error.message, variant: 'destructive' });
    const pending = repairs.filter(r => !r.id).map(r => ({ ...r, stock_id: res.data.id }));
    if (pending.length) await db.from('device_repairs').insert(pending);
    toast({ title: 'Saved' }); setEditing(null); load();
  };

  const addRepair = () => {
    if (!newRepair.description) return;
    setRepairs([...repairs, { description: newRepair.description, cost: Number(newRepair.cost) || 0, repaired_at: newRepair.repaired_at || new Date().toISOString().slice(0, 10) }]);
    setNewRepair({ description: '', cost: '', repaired_at: '' });
  };
  const removeRepair = async (idx: number) => {
    const r = repairs[idx]; if (r.id) await db.from('device_repairs').delete().eq('id', r.id);
    setRepairs(repairs.filter((_, k) => k !== idx));
  };

  const remove = async (it: any) => {
    if (!confirm(`Delete ${it.model}? This also deletes its sale record.`)) return;
    await db.from('device_stock').delete().eq('id', it.id); load();
  };

  const set = (k: string, v: any) => setEditing((e: any) => ({ ...e, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">In stock</div><div className="text-2xl font-bold">{stats.inStock}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Stock cost (incl. repairs)</div><div className="text-2xl font-bold">{usd(stats.value)}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Profit on sold</div><div className="text-2xl font-bold">{usd(stats.profit)}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Phones</CardTitle>
          <div className="flex gap-2"><Input placeholder="Search model, IMEI, serial…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
            <Button onClick={() => openEdit(null)}><Plus className="h-4 w-4 mr-1" />Add phone</Button></div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b"><tr>
              <th className="py-2"></th><th>Device</th><th>Condition</th><th>IMEI / Serial</th><th className="text-right">Cost</th><th className="text-right">Website</th><th>Status</th><th className="text-right">Sold for</th><th></th></tr></thead>
            <tbody>
              {filtered.map(it => {
                const sale = saleFor(it.id); const cost = Number(it.purchase_cost) + repairCost(it);
                return (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="py-2">{it.photos?.[0] ? <img src={it.photos[0]} className="h-10 w-10 rounded object-cover" alt="" /> : <div className="h-10 w-10 rounded bg-muted" />}</td>
                    <td><div className="font-medium">{it.brand} {it.model}</div><div className="text-xs text-muted-foreground">{[it.storage, it.colour].filter(Boolean).join(' · ')}</div></td>
                    <td>{it.condition}</td>
                    <td className="text-xs">{it.imei || '—'}<br />{it.serial || ''}</td>
                    <td className="text-right tabular-nums">{usd(cost)}</td>
                    <td className="text-right tabular-nums">{usd(it.website_price)}</td>
                    <td><Badge variant={it.status === 'sold' ? 'secondary' : 'outline'}>{STOCK_STATUSES[it.status] || it.status}</Badge></td>
                    <td className="text-right tabular-nums">{sale ? <>{usd(sale.sold_for)}<div className="text-xs text-muted-foreground">{sale.customers?.name}</div></> : '—'}</td>
                    <td className="text-right whitespace-nowrap">
                      {sale ? <Button size="sm" variant="ghost" onClick={() => setDetailId(sale.id)}><Eye className="h-4 w-4" /></Button>
                        : <Button size="sm" variant="ghost" onClick={() => setSelling(it)} title="Mark as sold"><ShoppingBag className="h-4 w-4" /></Button>}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(it)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No phones yet — click Add phone.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit phone' : 'Add phone'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Brand</Label><Input value={editing.brand} onChange={e => set('brand', e.target.value)} /></div>
              <div><Label>Model</Label><Input value={editing.model} onChange={e => set('model', e.target.value)} placeholder="iPhone 15 Pro" /></div>
              <div><Label>Storage</Label><Input value={editing.storage || ''} onChange={e => set('storage', e.target.value)} placeholder="256GB" /></div>
              <div><Label>Colour</Label><Input value={editing.colour || ''} onChange={e => set('colour', e.target.value)} /></div>
              <div><Label>Condition</Label>
                <Select value={editing.condition || ''} onValueChange={v => set('condition', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRADE_ORDER.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Status</Label>
                <Select value={editing.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STOCK_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>IMEI</Label><Input value={editing.imei || ''} onChange={e => set('imei', e.target.value)} /></div>
              <div><Label>Serial</Label><Input value={editing.serial || ''} onChange={e => set('serial', e.target.value)} /></div>
              <div><Label>Purchased for (USD)</Label><Input type="number" value={editing.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} /></div>
              <div><Label>Purchased from</Label><Input value={editing.purchased_from || ''} onChange={e => set('purchased_from', e.target.value)} /></div>
              <div><Label>Purchase date</Label><Input type="date" value={editing.purchase_date || ''} onChange={e => set('purchase_date', e.target.value)} /></div>
              <div><Label>Website selling price (USD)</Label><Input type="number" value={editing.website_price} onChange={e => set('website_price', e.target.value)} /></div>
              <div><Label>Warranty (days)</Label><Input type="number" value={editing.warranty_days} onChange={e => set('warranty_days', e.target.value)} /></div>
              <div className="col-span-2"><Label>Photos</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(editing.photos || []).map((p: string, k: number) => (
                    <div key={p} className="relative"><img src={p} className="h-16 w-16 rounded object-cover" alt="" />
                      <button type="button" className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5" onClick={() => set('photos', editing.photos.filter((_: string, j: number) => j !== k))}><X className="h-3 w-3" /></button></div>
                  ))}
                  <label className="h-16 w-16 rounded border border-dashed flex items-center justify-center cursor-pointer text-xs text-muted-foreground">
                    {uploading ? '…' : <Plus className="h-4 w-4" />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
                  </label>
                </div></div>
              <div className="col-span-2 border-t pt-3"><Label>Repairs</Label>
                {repairs.map((r, k) => (
                  <div key={k} className="flex justify-between text-sm py-1"><span>{r.repaired_at} — {r.description}</span><span className="flex items-center gap-2">{usd(r.cost)}<Button size="sm" variant="ghost" onClick={() => removeRepair(k)}><X className="h-3 w-3" /></Button></span></div>
                ))}
                <div className="flex gap-2 mt-1">
                  <Input placeholder="What was repaired" value={newRepair.description} onChange={e => setNewRepair({ ...newRepair, description: e.target.value })} />
                  <Input className="w-24" type="number" placeholder="Cost" value={newRepair.cost} onChange={e => setNewRepair({ ...newRepair, cost: e.target.value })} />
                  <Input className="w-36" type="date" value={newRepair.repaired_at} onChange={e => setNewRepair({ ...newRepair, repaired_at: e.target.value })} />
                  <Button variant="outline" onClick={addRepair}>Add</Button>
                </div></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={editing.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
              <div className="col-span-2 bg-muted/50 rounded p-3 text-sm">
                Total cost: <b>{usd(Number(editing.purchase_cost) + repairs.reduce((a, r) => a + Number(r.cost), 0))}</b> · Expected profit at website price: <b>{usd(Number(editing.website_price) - Number(editing.purchase_cost) - repairs.reduce((a, r) => a + Number(r.cost), 0))}</b>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={!editing?.model}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <SellDialog item={selling} onClose={() => setSelling(null)} onSold={(id) => { setSelling(null); load(); setDetailId(id); }} />
      <SaleDetails saleId={detailId} onOpenChange={o => !o && setDetailId(null)} onChanged={load} />
    </div>
  );
};

const SellDialog = ({ item, onClose, onSold }: { item: any | null; onClose: () => void; onSold: (saleId: string) => void }) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [counts, setCounts] = useState({ purchases: 0, referrals: 0 });
  const [f, setF] = useState<any>({});
  const [schedule, setSchedule] = useState<Installment[]>([]);
  const [plan, setPlan] = useState({ count: 3, start: '', every: 'monthly' as 'weekly' | 'biweekly' | 'monthly' });

  useEffect(() => {
    if (!item) return;
    setF({ customer_id: 'new', name: '', phone: '', email: '', referred_by: 'none', actual_price: item.website_price, payment_method: 'Cash',
      sold_as_trade: false, trade_in_request_id: 'none', trade_credit: 0, is_payment_plan: false, deposit: 0, warranty_days: item.warranty_days, notes: '', apply_loyalty: true });
    setSchedule([]);
    Promise.all([
      db.from('customers').select('id, name, phone, email').order('name'),
      db.from('loyalty_rules').select('*').eq('active', true),
      db.from('trade_in_requests').select('id, request_code, customer_name, estimated_value_usd, final_value_usd').order('created_at', { ascending: false }).limit(100),
    ]).then(([c, r, t]) => { setCustomers(c.data || []); setRules(r.data || []); setTrades(t.data || []); });
  }, [item]);

  useEffect(() => {
    if (!f.customer_id || f.customer_id === 'new') { setCounts({ purchases: 0, referrals: 0 }); return; }
    Promise.all([
      db.from('device_sales').select('id', { count: 'exact', head: true }).eq('customer_id', f.customer_id),
      db.from('customers').select('id', { count: 'exact', head: true }).eq('referred_by', f.customer_id),
    ]).then(([p, r]) => setCounts({ purchases: p.count || 0, referrals: r.count || 0 }));
  }, [f.customer_id]);

  if (!item) return null;
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const loyalty = bestLoyalty(rules, counts.purchases, counts.referrals, Number(f.actual_price) || 0);
  const discount = f.apply_loyalty && loyalty ? loyalty.amount : 0;
  const soldFor = Math.max(0, (Number(f.actual_price) || 0) - discount);
  const toFinance = Math.max(0, soldFor - (f.sold_as_trade ? Number(f.trade_credit) || 0 : 0) - (Number(f.deposit) || 0));

  const pickTrade = (id: string) => {
    set('trade_in_request_id', id);
    const t = trades.find(x => x.id === id);
    if (t) set('trade_credit', Number(t.final_value_usd ?? t.estimated_value_usd));
  };

  const submit = async () => {
    let customerId = f.customer_id;
    if (customerId === 'new') {
      if (!f.name.trim()) return toast({ title: 'Enter the buyer name', variant: 'destructive' });
      const { data, error } = await db.from('customers').insert({ name: f.name.trim(), phone: f.phone || null, email: f.email || null, referred_by: f.referred_by === 'none' ? null : f.referred_by }).select().single();
      if (error) return toast({ title: 'Could not create customer', description: error.message, variant: 'destructive' });
      customerId = data.id;
    }
    const tradeId = f.sold_as_trade && f.trade_in_request_id !== 'none' ? f.trade_in_request_id : null;
    const { data: sale, error } = await db.from('device_sales').insert({
      stock_id: item.id, customer_id: customerId, listed_price: Number(item.website_price) || 0, actual_price: Number(f.actual_price) || 0,
      sold_for: soldFor, loyalty_rule_id: discount ? loyalty!.rule.id : null, loyalty_discount: discount,
      sold_as_trade: f.sold_as_trade, trade_in_request_id: tradeId, trade_credit: f.sold_as_trade ? Number(f.trade_credit) || 0 : 0,
      payment_method: f.payment_method, is_payment_plan: f.is_payment_plan, plan_total: f.is_payment_plan ? soldFor : 0,
      deposit: f.is_payment_plan ? Number(f.deposit) || 0 : 0, warranty_days: Number(f.warranty_days) || 0, notes: f.notes || null,
    }).select().single();
    if (error) return toast({ title: 'Sale failed', description: error.message, variant: 'destructive' });
    if (f.is_payment_plan && schedule.length) await db.from('sale_installments').insert(schedule.map(s => ({ ...s, sale_id: sale.id })));
    if (tradeId) await db.from('trade_in_requests').update({ customer_id: customerId }).eq('id', tradeId);
    await db.from('device_stock').update({ status: 'sold' }).eq('id', item.id);
    toast({ title: 'Sale recorded' });
    onSold(sale.id);
  };

  return (
    <Dialog open={!!item} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Sell {item.brand} {item.model} {item.storage}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2"><Label>Buyer</Label>
            <Select value={f.customer_id} onValueChange={v => set('customer_id', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="new">+ New customer</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ''}</SelectItem>)}</SelectContent>
            </Select></div>
          {f.customer_id === 'new' && <>
            <div><Label>Name</Label><Input value={f.name} onChange={e => set('name', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={f.email} onChange={e => set('email', e.target.value)} /></div>
            <div><Label>Referred by</Label>
              <Select value={f.referred_by} onValueChange={v => set('referred_by', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Nobody</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
          </>}
          <div><Label>Website price</Label><Input disabled value={usd(item.website_price)} /></div>
          <div><Label>Actual selling price (USD)</Label><Input type="number" value={f.actual_price} onChange={e => set('actual_price', e.target.value)} /></div>
          <div className="col-span-2 rounded border p-2">
            {loyalty ? (
              <div className="flex items-center gap-2"><Switch checked={f.apply_loyalty} onCheckedChange={v => set('apply_loyalty', v)} />
                <span>Loyalty: <b>{loyalty.rule.name}</b> — −{usd(loyalty.amount)}</span></div>
            ) : <span className="text-muted-foreground">No loyalty discount ({counts.purchases} past purchases, {counts.referrals} referrals)</span>}
          </div>
          <div><Label>How they paid</Label>
            <Select value={f.payment_method} onValueChange={v => set('payment_method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Warranty (days)</Label><Input type="number" value={f.warranty_days} onChange={e => set('warranty_days', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2"><Switch checked={f.sold_as_trade} onCheckedChange={v => set('sold_as_trade', v)} /><Label>Sold as a trade</Label></div>
          {f.sold_as_trade && <>
            <div><Label>Trade-in request</Label>
              <Select value={f.trade_in_request_id} onValueChange={pickTrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{trades.map(t => <SelectItem key={t.id} value={t.id}>{t.request_code} · {t.customer_name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Trade credit (USD)</Label><Input type="number" value={f.trade_credit} onChange={e => set('trade_credit', e.target.value)} /></div>
          </>}
          <div className="col-span-2 flex items-center gap-2"><Switch checked={f.is_payment_plan} onCheckedChange={v => set('is_payment_plan', v)} /><Label>Monthly / payment plan</Label></div>
          {f.is_payment_plan && <div className="col-span-2 grid grid-cols-4 gap-2 items-end border rounded p-2">
            <div><Label>Deposit</Label><Input type="number" value={f.deposit} onChange={e => set('deposit', e.target.value)} /></div>
            <div><Label>Payments</Label><Input type="number" value={plan.count} onChange={e => setPlan({ ...plan, count: Number(e.target.value) })} /></div>
            <div><Label>First due</Label><Input type="date" value={plan.start} onChange={e => setPlan({ ...plan, start: e.target.value })} /></div>
            <div><Label>Every</Label>
              <Select value={plan.every} onValueChange={(v: any) => setPlan({ ...plan, every: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="weekly">Week</SelectItem><SelectItem value="biweekly">2 weeks</SelectItem><SelectItem value="monthly">Month</SelectItem></SelectContent>
              </Select></div>
            <div className="col-span-4 flex items-center justify-between"><span>To be paid over time: <b>{usd(toFinance)}</b></span>
              <Button size="sm" variant="outline" onClick={() => setSchedule(buildSchedule(toFinance, plan.count, plan.start, plan.every))} disabled={!plan.start}>Build schedule</Button></div>
            {schedule.map((s, k) => (
              <div key={k} className="col-span-4 flex gap-2">
                <Input type="date" value={s.due_date} onChange={e => setSchedule(schedule.map((x, j) => j === k ? { ...x, due_date: e.target.value } : x))} />
                <Input type="number" value={s.amount} onChange={e => setSchedule(schedule.map((x, j) => j === k ? { ...x, amount: Number(e.target.value) } : x))} />
              </div>
            ))}
          </div>}
          <div className="col-span-2"><Label>Notes</Label><Textarea value={f.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="col-span-2 bg-muted/50 rounded p-3">Sold for: <b>{usd(soldFor)}</b> · Profit: <b>{usd(soldFor - Number(item.purchase_cost))}</b> (before repairs)</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Record sale</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceStock;
