import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Archive, ArchiveRestore, Download, Upload, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { fmtJMD, fmtUSD, InventoryRow, costPerUnitJmd, inventoryValueJmd, profitPerUnitJmd, projectedProfitJmd, totalCostJmd, totalCostUsd } from '@/lib/partsCalc';
import InventoryFormDialog from './InventoryFormDialog';
import RestockDialog from './RestockDialog';
import { toCsv, downloadCsv, parseCsv } from '@/lib/partsCsv';

const InventoryTab = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [restocking, setRestocking] = useState<InventoryRow | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceEditValue, setPriceEditValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
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

  const exportCsv = () => {
    const csv = toCsv(items);
    downloadCsv(`parts-inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const importCsv = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast({ title: 'CSV is empty', variant: 'destructive' }); return; }
      const toUpdate = rows.filter(r => r.id);
      const toInsert = rows.filter(r => !r.id).map(r => { const { id, ...rest } = r as any; return rest; });
      let ok = 0, fail = 0;
      for (const r of toUpdate) {
        const { id, ...rest } = r as any;
        const { error } = await supabase.from('parts_inventory').update(rest).eq('id', id);
        if (error) fail++; else ok++;
      }
      if (toInsert.length) {
        const { error, data } = await supabase.from('parts_inventory').insert(toInsert).select('id');
        if (error) fail += toInsert.length; else ok += data?.length || 0;
      }
      toast({ title: 'Import complete', description: `${ok} saved${fail ? `, ${fail} failed` : ''}` });
      load();
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const startPriceEdit = (item: InventoryRow) => {
    setPriceEditId(item.id);
    setPriceEditValue(String(item.selling_price_jmd ?? ''));
  };

  const commitPriceEdit = async (item: InventoryRow) => {
    const val = Number(priceEditValue);
    if (Number.isNaN(val) || val < 0) {
      toast({ title: 'Invalid price', variant: 'destructive' });
      setPriceEditId(null);
      return;
    }
    const { error } = await supabase.from('parts_inventory').update({ selling_price_jmd: val }).eq('id', item.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Price updated' });
    }
    setPriceEditId(null);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
        </div>
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
                  <TableCell className="text-right" onDoubleClick={() => startPriceEdit(i)}>
                    {priceEditId === i.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        className="w-32 ml-auto h-8 text-right"
                        autoFocus
                        value={priceEditValue}
                        onChange={e => setPriceEditValue(e.target.value)}
                        onBlur={() => commitPriceEdit(i)}
                        onKeyDown={e => { if (e.key === 'Enter') commitPriceEdit(i); if (e.key === 'Escape') setPriceEditId(null); }}
                      />
                    ) : (
                      <span className="cursor-pointer select-none" title="Double-click to edit">{fmtJMD(i.selling_price_jmd)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{fmtJMD(profitPerUnitJmd(i, rate))}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" title="Restock" onClick={() => { setRestocking(i); setRestockOpen(true); }}><PackagePlus className="h-4 w-4" /></Button>
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
      <RestockDialog open={restockOpen} onOpenChange={setRestockOpen} item={restocking} onSaved={load} />
    </div>
  );
};

export default InventoryTab;