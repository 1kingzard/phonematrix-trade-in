import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fmtJMD } from '@/lib/partsCalc';

interface Sale { id: string; inventory_id: string; total_jmd: number; created_at: string; }
interface Coll { id: string; sale_id: string; amount_jmd: number; collected_at: string; status: string; confirmed_at: string | null; recorded_by: string | null; }

const CollectionsTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cols, setCols] = useState<Coll[]>([]);
  const [items, setItems] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    const [s, c, i] = await Promise.all([
      supabase.from('parts_sales').select('id,inventory_id,total_jmd,created_at'),
      supabase.from('parts_collections').select('*'),
      supabase.from('parts_inventory').select('id,item_name'),
    ]);
    setSales((s.data || []) as any); setCols((c.data || []) as any);
    const m: Record<string, string> = {};
    (i.data || []).forEach((it: any) => m[it.id] = it.item_name);
    setItems(m);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('coll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_collections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_sales' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const activeCols = cols.filter(c => c.status !== 'rejected');
  const collectedBySale = activeCols.reduce<Record<string, number>>((a, c) => { a[c.sale_id] = (a[c.sale_id] || 0) + Number(c.amount_jmd); return a; }, {});
  const totalOutstanding = sales.reduce((sum, s) => sum + Math.max(0, Number(s.total_jmd) - (collectedBySale[s.id] || 0)), 0);
  const totalCollected = activeCols.reduce((s, c) => s + Number(c.amount_jmd), 0);
  const totalConfirmed = cols.filter(c => c.status === 'confirmed').reduce((s, c) => s + Number(c.amount_jmd), 0);
  const totalPending = cols.filter(c => c.status === 'pending' || !c.status).reduce((s, c) => s + Number(c.amount_jmd), 0);

  const setStatus = async (id: string, status: 'confirmed' | 'rejected' | 'pending') => {
    const patch: any = { status };
    if (status === 'confirmed') { patch.confirmed_by = user?.id; patch.confirmed_at = new Date().toISOString(); }
    else { patch.confirmed_by = null; patch.confirmed_at = null; }
    const { error } = await supabase.from('parts_collections').update(patch).eq('id', id);
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else toast({ title: status === 'confirmed' ? 'Collection confirmed' : status === 'rejected' ? 'Collection rejected' : 'Marked pending' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected (incl. pending)</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(totalCollected)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Confirmed Received</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-green-600">{fmtJMD(totalConfirmed)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Confirmation</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-amber-600">{fmtJMD(totalPending)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-destructive">{fmtJMD(totalOutstanding)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Guest Collections — Confirm Receipt</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {[...cols].sort((a,b) => +new Date(b.collected_at) - +new Date(a.collected_at)).map(c => {
                const sale = sales.find(s => s.id === c.sale_id);
                const status = c.status || 'pending';
                return (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.collected_at).toLocaleDateString()}</TableCell>
                    <TableCell>{sale ? (items[sale.inventory_id] || '—') : '—'}</TableCell>
                    <TableCell className="text-right">{fmtJMD(Number(c.amount_jmd))}</TableCell>
                    <TableCell><Badge variant={status === 'confirmed' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>{status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      {status !== 'confirmed' && <Button size="sm" onClick={() => setStatus(c.id, 'confirmed')}>Confirm</Button>}
                      {status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => setStatus(c.id, 'rejected')}>Reject</Button>}
                      {status !== 'pending' && <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'pending')}>Reset</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {cols.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No collections recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Item</TableHead>
            <TableHead className="text-right">Sale</TableHead>
            <TableHead className="text-right">Collected</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {sales.map(s => {
              const got = collectedBySale[s.id] || 0;
              return (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{items[s.inventory_id] || '—'}</TableCell>
                  <TableCell className="text-right">{fmtJMD(Number(s.total_jmd))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(got)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(s.total_jmd) - got))}</TableCell>
                </TableRow>
              );
            })}
            {sales.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sales yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default CollectionsTab;