import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, QrCode, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TradeInQrCard from '@/components/TradeInQrCard';
import { customerUrl, usd, installmentOwed, isLate, LoyaltyRule } from '@/lib/stock';

const db = supabase as any;

const Customers = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [qr, setQr] = useState<any | null>(null);
  const [rule, setRule] = useState<any | null>(null);
  const [trades, setTrades] = useState<any[]>([]);

  const load = async () => {
    const [c, s, i, r, t] = await Promise.all([
      db.from('customers').select('*').order('created_at', { ascending: false }),
      db.from('device_sales').select('id, customer_id, sold_for'),
      db.from('sale_installments').select('sale_id, due_date, amount, paid_amount, late_fee'),
      db.from('loyalty_rules').select('*').order('threshold'),
      db.from('trade_in_requests').select('id, request_code, customer_name, customer_phone, customer_id').order('created_at', { ascending: false }).limit(200),
    ]);
    const sales = s.data || []; const inst = i.data || [];
    setRows((c.data || []).map((cu: any) => {
      const my = sales.filter((x: any) => x.customer_id === cu.id);
      const myInst = inst.filter((x: any) => my.some((m: any) => m.id === x.sale_id));
      return { ...cu, purchases: my.length, spent: my.reduce((a: number, x: any) => a + Number(x.sold_for), 0),
        owed: myInst.reduce((a: number, x: any) => a + installmentOwed(x), 0), late: myInst.some(isLate),
        referrals: (c.data || []).filter((x: any) => x.referred_by === cu.id).length,
        tradeCount: (t.data || []).filter((x: any) => x.customer_id === cu.id).length };
    }));
    setRules(r.data || []); setTrades(t.data || []);
  };
  useEffect(() => { load(); }, []);

  const saveCustomer = async () => {
    const { id, purchases, spent, owed, late, referrals, tradeCount, created_at, updated_at, public_token, linkTrades, ...rest } = editing;
    const payload = { name: rest.name, phone: rest.phone || null, email: rest.email || null, notes: rest.notes || null, referred_by: rest.referred_by && rest.referred_by !== 'none' ? rest.referred_by : null };
    const res = id ? await db.from('customers').update(payload).eq('id', id).select().single() : await db.from('customers').insert(payload).select().single();
    if (res.error) return toast({ title: 'Save failed', description: res.error.message, variant: 'destructive' });
    if (linkTrades?.length) await db.from('trade_in_requests').update({ customer_id: res.data.id }).in('id', linkTrades);
    setEditing(null); load();
  };

  const saveRule = async () => {
    const { id, created_at, ...rest } = rule;
    const payload = { ...rest, threshold: Number(rest.threshold) || 1, discount_percent: Number(rest.discount_percent) || 0, discount_amount: Number(rest.discount_amount) || 0 };
    const res = id ? await db.from('loyalty_rules').update(payload).eq('id', id) : await db.from('loyalty_rules').insert(payload);
    if (res.error) return toast({ title: 'Save failed', description: res.error.message, variant: 'destructive' });
    setRule(null); load();
  };

  const digits = (s: string) => (s || '').replace(/\D/g, '');
  const suggested = editing ? trades.filter(t => !t.customer_id && editing.phone && digits(t.customer_phone).endsWith(digits(editing.phone).slice(-7))) : [];
  const filtered = rows.filter(r => `${r.name} ${r.phone} ${r.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <div><CardTitle>Customers</CardTitle><CardDescription>Each customer has a private page with purchases, shipping, payments and trade-ins.</CardDescription></div>
          <div className="flex gap-2"><Input className="w-48" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <Button onClick={() => setEditing({ name: '', phone: '', email: '', referred_by: 'none' })}><Plus className="h-4 w-4 mr-1" />Add</Button></div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b"><tr><th className="py-2">Name</th><th>Contact</th><th className="text-right">Purchases</th><th className="text-right">Spent</th><th className="text-right">Referrals</th><th className="text-right">Owed</th><th></th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{r.name}{r.tradeCount > 0 && <span className="text-xs text-muted-foreground"> · {r.tradeCount} trade-in</span>}</td>
                  <td className="text-xs">{r.phone}<br />{r.email}</td>
                  <td className="text-right">{r.purchases}</td>
                  <td className="text-right tabular-nums">{usd(r.spent)}</td>
                  <td className="text-right">{r.referrals}</td>
                  <td className="text-right tabular-nums">{r.owed > 0 ? <>{usd(r.owed)} {r.late && <Badge variant="destructive" className="ml-1">Late</Badge>}</> : '—'}</td>
                  <td className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setQr(r)}><QrCode className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...r, referred_by: r.referred_by || 'none' })}><Pencil className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No customers yet. They're added when you record a sale.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div><CardTitle>Loyalty discounts</CardTitle><CardDescription>Set rewards for number of phones bought or people referred. The best one a customer qualifies for is offered when you record a sale.</CardDescription></div>
          <Button onClick={() => setRule({ name: '', rule_type: 'purchases', threshold: 2, discount_percent: 5, discount_amount: 0, active: true })}><Plus className="h-4 w-4 mr-1" />Add rule</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center justify-between border rounded p-2 text-sm">
              <div><b>{r.name}</b> — {r.threshold}+ {r.rule_type === 'referrals' ? 'referrals' : 'past purchases'} → {Number(r.discount_percent) > 0 && `${r.discount_percent}%`}{Number(r.discount_percent) > 0 && Number(r.discount_amount) > 0 && ' + '}{Number(r.discount_amount) > 0 && usd(r.discount_amount)} off {!r.active && <Badge variant="outline">Off</Badge>}</div>
              <div><Button size="sm" variant="ghost" onClick={() => setRule(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={async () => { if (confirm('Delete rule?')) { await db.from('loyalty_rules').delete().eq('id', r.id); load(); } }}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
          {rules.length === 0 && <p className="text-sm text-muted-foreground">No rules yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit customer' : 'Add customer'}</DialogTitle></DialogHeader>
          {editing && <div className="grid gap-3">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
            <div><Label>Referred by</Label>
              <Select value={editing.referred_by} onValueChange={v => setEditing({ ...editing, referred_by: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Nobody</SelectItem>{rows.filter(r => r.id !== editing.id).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select></div>
            {suggested.length > 0 && <div className="border rounded p-2 text-sm space-y-1"><div className="font-medium">Trade-in requests with this phone number</div>
              {suggested.map(t => <label key={t.id} className="flex items-center gap-2"><input type="checkbox" checked={(editing.linkTrades || []).includes(t.id)}
                onChange={e => setEditing({ ...editing, linkTrades: e.target.checked ? [...(editing.linkTrades || []), t.id] : (editing.linkTrades || []).filter((x: string) => x !== t.id) })} />{t.request_code} · {t.customer_name}</label>)}</div>}
          </div>}
          <DialogFooter><Button onClick={saveCustomer} disabled={!editing?.name}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rule} onOpenChange={o => !o && setRule(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Loyalty rule</DialogTitle></DialogHeader>
          {rule && <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name</Label><Input value={rule.name} onChange={e => setRule({ ...rule, name: e.target.value })} placeholder="Returning buyer" /></div>
            <div><Label>Based on</Label>
              <Select value={rule.rule_type} onValueChange={v => setRule({ ...rule, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="purchases">Phones bought before</SelectItem><SelectItem value="referrals">People referred</SelectItem></SelectContent>
              </Select></div>
            <div><Label>At least</Label><Input type="number" value={rule.threshold} onChange={e => setRule({ ...rule, threshold: e.target.value })} /></div>
            <div><Label>Discount %</Label><Input type="number" value={rule.discount_percent} onChange={e => setRule({ ...rule, discount_percent: e.target.value })} /></div>
            <div><Label>Discount $ (USD)</Label><Input type="number" value={rule.discount_amount} onChange={e => setRule({ ...rule, discount_amount: e.target.value })} /></div>
            <div className="col-span-2 flex items-center gap-2"><Switch checked={rule.active} onCheckedChange={v => setRule({ ...rule, active: v })} /><Label>Active</Label></div>
          </div>}
          <DialogFooter><Button onClick={saveRule} disabled={!rule?.name}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qr} onOpenChange={o => !o && setQr(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{qr?.name}'s page</DialogTitle></DialogHeader>
          {qr && <TradeInQrCard url={customerUrl(qr.public_token)} code={qr.name}
            onWhatsApp={qr.phone ? () => window.open(`https://wa.me/${qr.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${qr.name}, here's your Phone Matrix page with your purchases, shipping and payments: ${customerUrl(qr.public_token)}`)}`, '_blank') : undefined} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
