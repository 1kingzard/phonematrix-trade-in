import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logPartsAudit } from '@/lib/partsAudit';
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [saleItem, setSaleItem] = useState('');
  const [saleQty, setSaleQty] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleNote, setSaleNote] = useState('');
  const [saving, setSaving] = useState(false);

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

  const activeItems = Object.values(items).filter((i: any) => !i.archived);
  const selected: any = items[saleItem];

  const onSelectItem = (id: string) => {
    setSaleItem(id);
    const it: any = items[id];
    setSalePrice(it ? String(it.selling_price_jmd) : '');
  };

  const recordSale = async () => {
    const qty = Number(saleQty);
    const price = Number(salePrice);
    if (!selected || !qty || qty <= 0 || !price) { toast({ title: 'Select an item, quantity and price', variant: 'destructive' }); return; }
    if (qty > Number(selected.qty_available)) { toast({ title: 'Not enough stock', variant: 'destructive' }); return; }
    setSaving(true);
    const total = qty * price;
    const { error } = await supabase.from('parts_sales').insert({
      inventory_id: selected.id, units_sold: qty, unit_price_jmd: price,
      total_jmd: total, rate_at_sale: rate, customer_note: saleNote || null, sold_by: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({ action: 'record_sale', entity: 'parts_sales', rateUsed: rate, payload: { item: selected.item_name, units: qty, unit_price_jmd: price, total_jmd: total, note: saleNote || null } });
    toast({ title: 'Sale recorded' });
    setSaleItem(''); setSaleQty(''); setSalePrice(''); setSaleNote('');
    load();
  };

  return (
    <div className="space-y-4">
    <Card>
      <CardHeader><CardTitle className="text-base">Record a Sale</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-5 items-end">
        <div className="sm:col-span-2">
          <Label>Item</Label>
          <Select value={saleItem} onValueChange={onSelectItem}>
            <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
            <SelectContent>
              {activeItems.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>{i.item_name} ({i.qty_available} in stock)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Units</Label>
          <Input type="number" min="1" value={saleQty} onChange={e => setSaleQty(e.target.value)} />
        </div>
        <div>
          <Label>Unit price (JMD)</Label>
          <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
        </div>
        <div>
          <Label>Note</Label>
          <Input value={saleNote} onChange={e => setSaleNote(e.target.value)} placeholder="Customer / note" />
        </div>
        <div className="sm:col-span-5 flex items-center gap-3">
          <Button onClick={recordSale} disabled={saving}>Record Sale</Button>
          {Number(saleQty) > 0 && Number(salePrice) > 0 && (
            <span className="text-sm text-muted-foreground">Total: {fmtJMD(Number(saleQty) * Number(salePrice))}</span>
          )}
        </div>
      </CardContent>
    </Card>
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
    </div>
  );
};

export default SalesTab;