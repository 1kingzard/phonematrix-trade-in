import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SHIPMENT_STATUSES, usd, fmtDate, fmtDateTime, installmentOwed, isLate, warrantyEnd, saleMoney } from '@/lib/stock';

const db = supabase as any;

interface Props { saleId: string | null; onOpenChange: (b: boolean) => void; onChanged?: () => void }

const SaleDetails = ({ saleId, onOpenChange, onChanged }: Props) => {
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [inst, setInst] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [ev, setEv] = useState({ status: SHIPMENT_STATUSES[0] as string, note: '', occurred_at: '' });
  const [pay, setPay] = useState<Record<string, string>>({});
  const [fee, setFee] = useState<Record<string, string>>({});

  const load = async () => {
    if (!saleId) return;
    const [s, i, e] = await Promise.all([
      db.from('device_sales').select('*, device_stock(*), customers(name, phone, email)').eq('id', saleId).single(),
      db.from('sale_installments').select('*').eq('sale_id', saleId).order('due_date'),
      db.from('shipment_events').select('*').eq('sale_id', saleId).order('occurred_at'),
    ]);
    setSale(s.data); setInst(i.data || []); setEvents(e.data || []);
  };
  useEffect(() => { load(); }, [saleId]);

  const saveTracking = async () => {
    const { error } = await db.from('device_sales').update({ courier: sale.courier, tracking_number: sale.tracking_number }).eq('id', saleId);
    toast({ title: error ? 'Save failed' : 'Tracking saved', variant: error ? 'destructive' : undefined });
  };

  const addEvent = async () => {
    const { error } = await db.from('shipment_events').insert({
      sale_id: saleId, status: ev.status, note: ev.note || null,
      occurred_at: ev.occurred_at ? new Date(ev.occurred_at).toISOString() : new Date().toISOString(),
    });
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    setEv({ ...ev, note: '', occurred_at: '' }); load();
  };
  const delEvent = async (id: string) => { await db.from('shipment_events').delete().eq('id', id); load(); };

  const recordPayment = async (i: any) => {
    const amt = toUsd(pay[i.id]); if (!amt) return;
    await db.from('sale_installments').update({ paid_amount: Number(i.paid_amount) + amt, paid_at: new Date().toISOString() }).eq('id', i.id);
    setPay({ ...pay, [i.id]: '' }); load(); onChanged?.();
  };
  const addFee = async (i: any) => {
    const amt = toUsd(fee[i.id]); if (!amt) return;
    await db.from('sale_installments').update({ late_fee: Number(i.late_fee) + amt }).eq('id', i.id);
    setFee({ ...fee, [i.id]: '' }); load(); onChanged?.();
  };

  const jm = sale?.sold_in === 'JM';
  const rate = Number(sale?.rate_used) || 157;
  const toUsd = (v: string) => { const n = Number(v) || 0; return jm ? Math.round((n / rate) * 100) / 100 : n; };
  const remaining = inst.reduce((a, i) => a + installmentOwed(i), 0);
  const d = sale?.device_stock;

  return (
    <Dialog open={!!saleId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Sale details</DialogTitle></DialogHeader>
        {sale && (
          <div className="space-y-6 text-sm">
            <div className="grid sm:grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Device:</span> {d?.brand} {d?.model} {d?.storage} {d?.colour}</div>
              <div><span className="text-muted-foreground">Buyer:</span> {sale.customers?.name || '—'} {sale.customers?.phone}</div>
              <div><span className="text-muted-foreground">Sold for:</span> {saleMoney(sale.sold_for, sale)} ({sale.payment_method})</div>
              <div><span className="text-muted-foreground">Sold:</span> {fmtDateTime(sale.sold_at)}</div>
              <div><span className="text-muted-foreground">Warranty until:</span> {fmtDate(warrantyEnd(sale.sold_at, sale.warranty_days).toISOString())}</div>
              {sale.loyalty_discount > 0 && <div><span className="text-muted-foreground">Loyalty discount:</span> −{saleMoney(sale.loyalty_discount, sale)}</div>}
              {sale.sold_as_trade && <div><span className="text-muted-foreground">Trade credit:</span> {saleMoney(sale.trade_credit, sale)}</div>}
            </div>

            {sale.is_payment_plan && (
              <section className="space-y-2">
                <h3 className="font-semibold">Payment plan — agreed {saleMoney(sale.plan_total, sale)}, deposit {saleMoney(sale.deposit, sale)}, remaining <span className={remaining > 0 ? 'text-destructive' : ''}>{saleMoney(remaining, sale)}</span></h3>
                <div className="border rounded-md divide-y">
                  {inst.map(i => (
                    <div key={i.id} className="p-2 flex flex-wrap items-center gap-2">
                      <div className="w-28">{fmtDate(i.due_date)}</div>
                      <div className="w-40">{saleMoney(i.paid_amount, sale)} / {saleMoney(Number(i.amount) + Number(i.late_fee), sale)}{i.late_fee > 0 && <span className="text-xs text-muted-foreground"> (fee {saleMoney(i.late_fee, sale)})</span>}</div>
                      {installmentOwed(i) === 0 ? <Badge variant="secondary">Paid</Badge> : isLate(i) ? <Badge variant="destructive">Late</Badge> : <Badge variant="outline">Due</Badge>}
                      {installmentOwed(i) > 0 && (
                        <div className="flex gap-1 ml-auto">
                          <Input className="w-24 h-8" type="number" placeholder={jm ? "Pay (JMD)" : "Pay"} value={pay[i.id] || ''} onChange={e => setPay({ ...pay, [i.id]: e.target.value })} />
                          <Button size="sm" onClick={() => recordPayment(i)}>Record</Button>
                          <Input className="w-24 h-8" type="number" placeholder={jm ? "Late fee (JMD)" : "Late fee"} value={fee[i.id] || ''} onChange={e => setFee({ ...fee, [i.id]: e.target.value })} />
                          <Button size="sm" variant="outline" onClick={() => addFee(i)}>Add fee</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-semibold">Shipping</h3>
              <div className="flex flex-wrap gap-2 items-end">
                <div><Label>Courier</Label><Input value={sale.courier || ''} onChange={e => setSale({ ...sale, courier: e.target.value })} /></div>
                <div><Label>Tracking number</Label><Input value={sale.tracking_number || ''} onChange={e => setSale({ ...sale, tracking_number: e.target.value })} /></div>
                <Button variant="outline" onClick={saveTracking}>Save</Button>
              </div>
              <ol className="border-l-2 border-border ml-2 space-y-2 py-1">
                {events.map(e => (
                  <li key={e.id} className="pl-3 flex justify-between gap-2">
                    <div><div className="font-medium">{e.status}</div><div className="text-xs text-muted-foreground">{fmtDateTime(e.occurred_at)}{e.note ? ` — ${e.note}` : ''}</div></div>
                    <Button size="sm" variant="ghost" onClick={() => delEvent(e.id)}>Remove</Button>
                  </li>
                ))}
                {events.length === 0 && <li className="pl-3 text-muted-foreground">No updates yet</li>}
              </ol>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="min-w-[220px]"><Label>Status</Label>
                  <Select value={ev.status} onValueChange={v => setEv({ ...ev, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIPMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>When (blank = now)</Label><Input type="datetime-local" value={ev.occurred_at} onChange={e => setEv({ ...ev, occurred_at: e.target.value })} /></div>
                <div className="flex-1 min-w-[160px]"><Label>Note</Label><Input value={ev.note} onChange={e => setEv({ ...ev, note: e.target.value })} /></div>
                <Button onClick={addEvent}>Add update</Button>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetails;
