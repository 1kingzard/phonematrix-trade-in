import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtJMD } from '@/lib/partsCalc';

interface Sale { id: string; inventory_id: string; total_jmd: number; created_at: string; }
interface Coll { id: string; sale_id: string; amount_jmd: number; collected_at: string; }

const CollectionsTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cols, setCols] = useState<Coll[]>([]);
  const [items, setItems] = useState<Record<string, string>>({});

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

  const collectedBySale = cols.reduce<Record<string, number>>((a, c) => { a[c.sale_id] = (a[c.sale_id] || 0) + Number(c.amount_jmd); return a; }, {});
  const totalOutstanding = sales.reduce((sum, s) => sum + Math.max(0, Number(s.total_jmd) - (collectedBySale[s.id] || 0)), 0);
  const totalCollected = cols.reduce((s, c) => s + Number(c.amount_jmd), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(totalCollected)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-destructive">{fmtJMD(totalOutstanding)}</div></CardContent></Card>
      </div>
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