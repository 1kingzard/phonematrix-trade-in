import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtJMD, costPerUnitJmd, InventoryRow } from '@/lib/partsCalc';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';

interface Sale {
  id: string; inventory_id: string; units_sold: number;
  unit_price_jmd: number; total_jmd: number; rate_at_sale: number;
  customer_note: string | null; created_at: string;
}

const SalesTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState<Record<string, InventoryRow>>({});
  const { rate } = useExchangeRateSetting();

  const load = async () => {
    const [s, i] = await Promise.all([
      supabase.from('parts_sales').select('*').order('created_at', { ascending: false }),
      supabase.from('parts_inventory').select('*'),
    ]);
    setSales((s.data || []) as any);
    const m: Record<string, InventoryRow> = {};
    (i.data || []).forEach((it: any) => m[it.id] = it);
    setItems(m);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('sales').on('postgres_changes', { event: '*', schema: 'public', table: 'parts_sales' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Date</TableHead><TableHead>Item</TableHead>
          <TableHead className="text-right">Units</TableHead>
          <TableHead className="text-right">Revenue (JMD)</TableHead>
          <TableHead className="text-right">COGS (JMD)</TableHead>
          <TableHead className="text-right">Profit (JMD)</TableHead>
          <TableHead>Note</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {sales.map(s => {
            const item = items[s.inventory_id];
            const cogs = item ? costPerUnitJmd(item, rate) * s.units_sold : 0;
            return (
              <TableRow key={s.id}>
                <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{item?.item_name || '—'}</TableCell>
                <TableCell className="text-right">{s.units_sold}</TableCell>
                <TableCell className="text-right">{fmtJMD(s.total_jmd)}</TableCell>
                <TableCell className="text-right">{fmtJMD(cogs)}</TableCell>
                <TableCell className="text-right font-medium">{fmtJMD(s.total_jmd - cogs)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.customer_note || '—'}</TableCell>
              </TableRow>
            );
          })}
          {sales.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales yet</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
};

export default SalesTab;