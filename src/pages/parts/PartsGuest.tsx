import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePartsRole } from '@/hooks/usePartsRole';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fmtJMD } from '@/lib/partsCalc';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { LogOut, Wrench } from 'lucide-react';

const PartsGuest = () => {
  const { role, loading, user } = usePartsRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, logout } = useAuth();
  const { rate } = useExchangeRateSetting();

  const [inv, setInv] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cols, setCols] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [misc, setMisc] = useState<any[]>([]);
  const [pays, setPays] = useState<any[]>([]);

  // sale form
  const [saleItem, setSaleItem] = useState(''); const [saleQty, setSaleQty] = useState(''); const [saleNote, setSaleNote] = useState('');
  // collection form
  const [colSale, setColSale] = useState(''); const [colAmt, setColAmt] = useState('');
  // deposit form
  const [depAmt, setDepAmt] = useState(''); const [depRef, setDepRef] = useState('');
  // misc pay form
  const [miscId, setMiscId] = useState(''); const [miscAmt, setMiscAmt] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login?redirect=/parts/guest', { replace: true });
    else if (role !== 'admin' && role !== 'parts_guest') navigate('/', { replace: true });
  }, [role, loading, user, navigate]);

  const load = async () => {
    const [i, s, c, d, m, p] = await Promise.all([
      supabase.from('parts_inventory_public').select('*').eq('archived', false),
      supabase.from('parts_sales').select('*').order('created_at', { ascending: false }),
      supabase.from('parts_collections').select('*'),
      supabase.from('parts_deposits').select('*').order('deposited_at', { ascending: false }),
      supabase.from('parts_misc_orders_public').select('*').order('created_at', { ascending: false }),
      supabase.from('parts_misc_payments').select('*'),
    ]);
    setInv(i.data || []); setSales(s.data || []); setCols(c.data || []);
    setDeps(d.data || []); setMisc(m.data || []); setPays(p.data || []);
  };

  useEffect(() => {
    if (role !== 'admin' && role !== 'parts_guest') return;
    load();
    const ch = supabase.channel('guest-parts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_inventory' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_sales' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_collections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_deposits' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_misc_orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_misc_payments' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  if (loading || (role !== 'admin' && role !== 'parts_guest')) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const invMap: Record<string, any> = {}; inv.forEach(i => invMap[i.id] = i);
  const collectedBySale = cols.reduce<Record<string, number>>((a, c) => { a[c.sale_id] = (a[c.sale_id] || 0) + Number(c.amount_jmd); return a; }, {});
  const outstanding = sales.reduce((a, s) => a + Math.max(0, Number(s.total_jmd) - (collectedBySale[s.id] || 0)), 0);
  const collectedTotal = cols.reduce((a, c) => a + Number(c.amount_jmd), 0);
  const verifiedDep = deps.filter(d => d.status === 'verified').reduce((a, d) => a + Number(d.amount_jmd), 0);
  const remainingToDeposit = Math.max(0, collectedTotal - verifiedDep);
  const paidByMisc = pays.reduce<Record<string, number>>((a, p) => { a[p.misc_order_id] = (a[p.misc_order_id] || 0) + Number(p.amount_jmd); return a; }, {});

  const recordSale = async () => {
    const item = invMap[saleItem]; const qty = Number(saleQty);
    if (!item || !qty || qty <= 0) return;
    if (qty > item.qty_available) { toast({ title: 'Not enough stock', variant: 'destructive' }); return; }
    const total = qty * Number(item.selling_price_jmd);
    const { error } = await supabase.from('parts_sales').insert({
      inventory_id: item.id, units_sold: qty, unit_price_jmd: item.selling_price_jmd,
      total_jmd: total, rate_at_sale: rate, customer_note: saleNote || null, sold_by: authUser?.id,
    });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sale recorded' }); setSaleItem(''); setSaleQty(''); setSaleNote('');
  };

  const recordCol = async () => {
    const amt = Number(colAmt);
    if (!colSale || !amt) return;
    const { error } = await supabase.from('parts_collections').insert({ sale_id: colSale, amount_jmd: amt, recorded_by: authUser?.id });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setColAmt(''); setColSale('');
  };

  const recordDep = async () => {
    const amt = Number(depAmt);
    if (!amt) return;
    const { error } = await supabase.from('parts_deposits').insert({ amount_jmd: amt, reference: depRef || null, recorded_by: authUser?.id });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setDepAmt(''); setDepRef('');
  };

  const payMisc = async () => {
    const amt = Number(miscAmt);
    if (!miscId || !amt) return;
    const { error } = await supabase.from('parts_misc_payments').insert({ misc_order_id: miscId, amount_jmd: amt, recorded_by: authUser?.id });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setMiscAmt(''); setMiscId('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Parts — Guest Portal</h1>
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="sale">Record Sale</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="misc">Misc Items</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Available</TableHead><TableHead className="text-right">Price (JMD)</TableHead></TableRow></TableHeader>
              <TableBody>
                {inv.map(i => (<TableRow key={i.id}><TableCell>{i.item_name}</TableCell><TableCell>{i.category || '—'}</TableCell><TableCell className="text-right">{i.qty_available}</TableCell><TableCell className="text-right">{fmtJMD(Number(i.selling_price_jmd))}</TableCell></TableRow>))}
                {inv.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No items available</TableCell></TableRow>}
              </TableBody>
            </Table></CardContent></Card>
          </TabsContent>

          <TabsContent value="sale">
            <Card><CardHeader><CardTitle className="text-base">Record a Sale</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Item</Label>
                  <Select value={saleItem} onValueChange={setSaleItem}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{inv.map(i => <SelectItem key={i.id} value={i.id}>{i.item_name} — {fmtJMD(Number(i.selling_price_jmd))} ({i.qty_available} left)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Units</Label><Input type="number" value={saleQty} onChange={e => setSaleQty(e.target.value)} /></div>
                  <div><Label>Total</Label><Input readOnly value={saleItem && saleQty ? fmtJMD(Number(saleQty) * Number(invMap[saleItem]?.selling_price_jmd || 0)) : ''} /></div>
                </div>
                <div><Label>Customer note (optional)</Label><Input value={saleNote} onChange={e => setSaleNote(e.target.value)} /></div>
                <Button onClick={recordSale}>Record Sale</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(collectedTotal)}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-destructive">{fmtJMD(outstanding)}</div></CardContent></Card>
            </div>
            <Card className="mb-4"><CardHeader><CardTitle className="text-base">Add Collection</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2"><Label>Sale</Label>
                  <Select value={colSale} onValueChange={setColSale}>
                    <SelectTrigger><SelectValue placeholder="Select sale" /></SelectTrigger>
                    <SelectContent>{sales.filter(s => (collectedBySale[s.id] || 0) < Number(s.total_jmd)).map(s => {
                      const bal = Number(s.total_jmd) - (collectedBySale[s.id] || 0);
                      return <SelectItem key={s.id} value={s.id}>{invMap[s.inventory_id]?.item_name || 'Item'} — bal {fmtJMD(bal)}</SelectItem>;
                    })}</SelectContent>
                  </Select>
                </div>
                <div><Label>Amount (JMD)</Label><Input type="number" value={colAmt} onChange={e => setColAmt(e.target.value)} /></div>
                <div className="md:col-span-3"><Button onClick={recordCol}>Record</Button></div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Sale</TableHead><TableHead className="text-right">Collected</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
              <TableBody>{sales.map(s => { const got = collectedBySale[s.id] || 0; return (
                <TableRow key={s.id}><TableCell>{invMap[s.inventory_id]?.item_name || '—'}</TableCell><TableCell className="text-right">{fmtJMD(Number(s.total_jmd))}</TableCell><TableCell className="text-right">{fmtJMD(got)}</TableCell><TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(s.total_jmd) - got))}</TableCell></TableRow>
              ); })}</TableBody>
            </Table></CardContent></Card>
          </TabsContent>

          <TabsContent value="deposits">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Deposited (verified)</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(verifiedDep)}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Still to deposit</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(remainingToDeposit)}</div></CardContent></Card>
            </div>
            <Card className="mb-4"><CardHeader><CardTitle className="text-base">Log a Deposit</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div><Label>Amount (JMD)</Label><Input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} /></div>
                <div className="md:col-span-2"><Label>Reference (optional)</Label><Input value={depRef} onChange={e => setDepRef(e.target.value)} /></div>
                <div className="md:col-span-3"><Button onClick={recordDep}>Submit</Button></div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{deps.map(d => (<TableRow key={d.id}><TableCell>{new Date(d.deposited_at).toLocaleDateString()}</TableCell><TableCell>{d.reference || '—'}</TableCell><TableCell className="text-right">{fmtJMD(Number(d.amount_jmd))}</TableCell><TableCell><Badge variant={d.status === 'verified' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>{d.status}</Badge></TableCell></TableRow>))}</TableBody>
            </Table></CardContent></Card>
          </TabsContent>

          <TabsContent value="misc">
            <Card className="mb-4"><CardHeader><CardTitle className="text-base">Make a Payment</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2"><Label>Item</Label>
                  <Select value={miscId} onValueChange={setMiscId}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{misc.filter(m => (paidByMisc[m.id] || 0) < Number(m.cost_jmd)).map(m => {
                      const bal = Number(m.cost_jmd) - (paidByMisc[m.id] || 0);
                      return <SelectItem key={m.id} value={m.id}>{m.description} — bal {fmtJMD(bal)}</SelectItem>;
                    })}</SelectContent>
                  </Select>
                </div>
                <div><Label>Amount (JMD)</Label><Input type="number" value={miscAmt} onChange={e => setMiscAmt(e.target.value)} /></div>
                <div className="md:col-span-3"><Button onClick={payMisc}>Pay</Button></div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-0 overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
              <TableBody>{misc.map(m => { const paid = paidByMisc[m.id] || 0; return (
                <TableRow key={m.id}><TableCell>{m.date_added}</TableCell><TableCell>{m.description}</TableCell><TableCell className="text-right">{fmtJMD(Number(m.cost_jmd))}</TableCell><TableCell className="text-right">{fmtJMD(paid)}</TableCell><TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(m.cost_jmd) - paid))}</TableCell></TableRow>
              ); })}</TableBody>
            </Table></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartsGuest;