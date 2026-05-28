import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { fmtJMD, fmtUSD, InventoryRow, costPerUnitJmd, inventoryValueJmd, profitPerUnitJmd, projectedProfitJmd, totalCostJmd, totalCostUsd } from '@/lib/partsCalc';
import InventoryFormDialog from './InventoryFormDialog';

const InventoryTab = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const { rate } = useExchangeRateSetting();
  const { toast } = useToast();

  const load = async () => {
    const { data, error } = await supabase.from('parts_inventory').select('*').order('created_at', { ascending: false });
    if (error) { toast({ title: 'Load failed', description: error.message, variant: 'destructive' }); return; }
    setItems((data || []) as any);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('inv').on('postgres_changes', { event: '*', schema: 'public', table: 'parts_inventory' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleArchive = async (item: InventoryRow) => {
    await supabase.from('parts_inventory').update({ archived: !item.archived }).eq('id', item.id);
  };

  const totals = items.filter(i => !i.archived).reduce((acc, i) => {
    acc.costUsd += totalCostUsd(i);
    acc.valueJmd += inventoryValueJmd(i, rate);
    acc.projProfit += projectedProfitJmd(i, rate);
    return acc;
  }, { costUsd: 0, valueJmd: 0, projProfit: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Purchase Cost</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{fmtUSD(totals.costUsd)}</div><div className="text-xs text-muted-foreground">{fmtJMD(totals.costUsd * rate)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Inventory Value (JMD)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{fmtJMD(totals.valueJmd)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Projected Profit (JMD)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{fmtJMD(totals.projProfit)}</div></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Rate: 1 USD = {rate} JMD</div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total Cost (USD)</TableHead>
              <TableHead className="text-right">Total Cost (JMD)</TableHead>
              <TableHead className="text-right">Sell / unit (JMD)</TableHead>
              <TableHead className="text-right">Profit / unit (JMD)</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.id} className={i.archived ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{i.item_name}{i.locked_rate ? <Badge variant="outline" className="ml-2">locked @{i.locked_rate}</Badge> : null}</TableCell>
                  <TableCell>{i.category || '—'}</TableCell>
                  <TableCell className="text-right">{i.qty_available} / {i.qty_ordered}</TableCell>
                  <TableCell className="text-right">{fmtUSD(totalCostUsd(i))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(totalCostJmd(i, rate))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(i.selling_price_jmd)}</TableCell>
                  <TableCell className="text-right">{fmtJMD(profitPerUnitJmd(i, rate))}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleArchive(i)}>{i.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No inventory yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InventoryFormDialog open={open} onOpenChange={setOpen} item={editing} onSaved={load} rate={rate} />
    </div>
  );
};

export default InventoryTab;