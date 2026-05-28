import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryRow, totalCostUsd, fmtUSD, fmtJMD } from '@/lib/partsCalc';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  item: InventoryRow | null;
  onSaved: () => void;
  rate: number;
}

const emptyForm = {
  item_name: '', category: '', date_ordered: '', qty_ordered: 0, qty_available: 0,
  cost_per_unit_usd: 0, product_cost_usd: 0, shipping_usd: 0,
  discount_value: 0, discount_is_percent: false,
  selling_price_jmd: 0, locked_rate: null as number | null,
};

const InventoryFormDialog = ({ open, onOpenChange, item, onSaved, rate }: Props) => {
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [lockRate, setLockRate] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (item) {
      setForm({ ...item, date_ordered: item.date_ordered || '' });
      setLockRate(item.locked_rate != null);
    } else {
      setForm(emptyForm);
      setLockRate(false);
    }
  }, [item, open]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const previewTotalUsd = totalCostUsd(form);
  const previewRate = lockRate ? (form.locked_rate || rate) : rate;

  const save = async () => {
    setSaving(true);
    const payload: any = {
      item_name: form.item_name,
      category: form.category || null,
      date_ordered: form.date_ordered || null,
      qty_ordered: Number(form.qty_ordered) || 0,
      qty_available: Number(form.qty_available) || 0,
      cost_per_unit_usd: Number(form.cost_per_unit_usd) || 0,
      product_cost_usd: Number(form.product_cost_usd) || 0,
      shipping_usd: Number(form.shipping_usd) || 0,
      discount_value: Number(form.discount_value) || 0,
      discount_is_percent: !!form.discount_is_percent,
      selling_price_jmd: Number(form.selling_price_jmd) || 0,
      locked_rate: lockRate ? (Number(form.locked_rate) || rate) : null,
      created_by: user?.id,
    };
    const res = item
      ? await supabase.from('parts_inventory').update(payload).eq('id', item.id)
      : await supabase.from('parts_inventory').insert(payload);
    setSaving(false);
    if (res.error) { toast({ title: 'Save failed', description: res.error.message, variant: 'destructive' }); return; }
    toast({ title: item ? 'Updated' : 'Added' });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Item name</Label><Input value={form.item_name} onChange={e => set('item_name', e.target.value)} /></div>
          <div><Label>Category</Label><Input value={form.category || ''} onChange={e => set('category', e.target.value)} /></div>
          <div><Label>Date ordered</Label><Input type="date" value={form.date_ordered || ''} onChange={e => set('date_ordered', e.target.value)} /></div>
          <div><Label>Qty ordered</Label><Input type="number" value={form.qty_ordered} onChange={e => set('qty_ordered', e.target.value)} /></div>
          <div><Label>Qty available</Label><Input type="number" value={form.qty_available} onChange={e => set('qty_available', e.target.value)} /></div>
          <div><Label>Cost per unit (USD)</Label><Input type="number" step="0.01" value={form.cost_per_unit_usd} onChange={e => set('cost_per_unit_usd', e.target.value)} /></div>
          <div><Label>Product cost (USD)</Label><Input type="number" step="0.01" value={form.product_cost_usd} onChange={e => set('product_cost_usd', e.target.value)} /></div>
          <div><Label>Shipping (USD)</Label><Input type="number" step="0.01" value={form.shipping_usd} onChange={e => set('shipping_usd', e.target.value)} /></div>
          <div><Label>Discount</Label><Input type="number" step="0.01" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} /></div>
          <div className="flex items-end gap-2"><Switch checked={form.discount_is_percent} onCheckedChange={v => set('discount_is_percent', v)} /><Label>{form.discount_is_percent ? '% of (product+shipping)' : 'Fixed USD'}</Label></div>
          <div className="col-span-2 border-t pt-3"><Label>Selling price per unit (JMD)</Label><Input type="number" step="0.01" value={form.selling_price_jmd} onChange={e => set('selling_price_jmd', e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2"><Switch checked={lockRate} onCheckedChange={setLockRate} /><Label>Lock exchange rate for this item</Label>
            {lockRate && <Input className="w-32 ml-2" type="number" step="0.01" value={form.locked_rate ?? rate} onChange={e => set('locked_rate', e.target.value)} />}
          </div>
          <div className="col-span-2 bg-muted/50 rounded p-3 text-sm space-y-1">
            <div>Total cost: <span className="font-semibold">{fmtUSD(previewTotalUsd)}</span> ≈ <span className="font-semibold">{fmtJMD(previewTotalUsd * previewRate)}</span></div>
            <div>Rate used: {previewRate} JMD/USD</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.item_name}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryFormDialog;