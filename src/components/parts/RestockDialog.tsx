import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryRow, fmtUSD } from '@/lib/partsCalc';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  item: InventoryRow | null;
  onSaved: () => void;
}

const RestockDialog = ({ open, onOpenChange, item, onSaved }: Props) => {
  const [qty, setQty] = useState<string>('');
  const [addProduct, setAddProduct] = useState<string>('');
  const [addShipping, setAddShipping] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) { setQty(''); setAddProduct(''); setAddShipping(''); }
  }, [open]);

  if (!item) return null;

  const addQty = Number(qty) || 0;
  const addProd = Number(addProduct) || 0;
  const addShip = Number(addShipping) || 0;

  const newQtyOrdered = item.qty_ordered + addQty;
  const newQtyAvailable = item.qty_available + addQty;
  const newProductCost = Number(item.product_cost_usd) + addProd;
  const newShipping = Number(item.shipping_usd) + addShip;
  const newCostPerUnit = newQtyOrdered > 0 ? newProductCost / newQtyOrdered : 0;

  const save = async () => {
    if (addQty <= 0) { toast({ title: 'Enter qty to add', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('parts_inventory').update({
      qty_ordered: newQtyOrdered,
      qty_available: newQtyAvailable,
      product_cost_usd: newProductCost,
      shipping_usd: newShipping,
      cost_per_unit_usd: newCostPerUnit,
    }).eq('id', item.id);
    setSaving(false);
    if (error) { toast({ title: 'Restock failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Restocked', description: `${item.item_name}: +${addQty}` });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Restock — {item.item_name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground">
            Current: {item.qty_available}/{item.qty_ordered} units · Product cost {fmtUSD(Number(item.product_cost_usd))} · Shipping {fmtUSD(Number(item.shipping_usd))}
          </div>
          <div><Label>Additional qty</Label><Input type="number" value={qty} onChange={e => setQty(e.target.value)} /></div>
          <div><Label>Additional product cost (USD)</Label><Input type="number" step="0.01" value={addProduct} onChange={e => setAddProduct(e.target.value)} /></div>
          <div><Label>Additional shipping (USD)</Label><Input type="number" step="0.01" value={addShipping} onChange={e => setAddShipping(e.target.value)} /></div>
          <div className="bg-muted/50 rounded p-3 space-y-1">
            <div>New qty: <span className="font-semibold">{newQtyAvailable} / {newQtyOrdered}</span></div>
            <div>New product cost: <span className="font-semibold">{fmtUSD(newProductCost)}</span></div>
            <div>New shipping: <span className="font-semibold">{fmtUSD(newShipping)}</span></div>
            <div>New cost/unit: <span className="font-semibold">{fmtUSD(newCostPerUnit)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add to stock'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RestockDialog;