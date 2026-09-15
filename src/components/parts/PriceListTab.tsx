import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fmtJMD } from '@/lib/partsCalc';
import { logPartsAudit } from '@/lib/partsAudit';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { Plus, Trash2, Tag, TrendingUp, Coins, Pencil } from 'lucide-react';

interface Row {
  id: string;
  source: 'inventory' | 'custom';
  item_name: string;
  category: string | null;
  cost_jmd: number;
  shipping_jmd: number;
  sell_jmd: number;
  note: string | null;
  qty_available: number | null;
}

const emptyForm = { item_name: '', category: '', cost_jmd: '', shipping_jmd: '', sell_jmd: '', note: '' };

const PriceListTab = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rate } = useExchangeRateSetting();
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [inlineId, setInlineId] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState('');

  const load = async () => {
    const { data } = await supabase.from('parts_price_catalog' as any).select('*');
    setRows(((data as any[]) || []).map(r => ({
      ...r,
      cost_jmd: Number(r.cost_jmd) || 0,
      shipping_jmd: Number(r.shipping_jmd) || 0,
      sell_jmd: Number(r.sell_jmd) || 0,
    })) as Row[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('parts-price-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_price_list_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_inventory' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(r => !q || r.item_name.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q));
    const profit = (r: Row) => r.sell_jmd - r.cost_jmd - r.shipping_jmd;
    const cmp: Record<string, (a: Row, b: Row) => number> = {
      'name-asc': (a, b) => a.item_name.localeCompare(b.item_name),
      'name-desc': (a, b) => b.item_name.localeCompare(a.item_name),
      'sell-desc': (a, b) => b.sell_jmd - a.sell_jmd,
      'sell-asc': (a, b) => a.sell_jmd - b.sell_jmd,
      'profit-desc': (a, b) => profit(b) - profit(a),
      'profit-asc': (a, b) => profit(a) - profit(b),
    };
    return [...list].sort(cmp[sort] || cmp['name-asc']);
  }, [rows, query, sort]);

  const totals = visible.reduce((a, r) => ({
    cost: a.cost + r.cost_jmd + r.shipping_jmd,
    sell: a.sell + r.sell_jmd,
    profit: a.profit + (r.sell_jmd - r.cost_jmd - r.shipping_jmd),
  }), { cost: 0, sell: 0, profit: 0 });

  const saveItem = async () => {
    if (!form.item_name.trim()) { toast({ title: 'Item name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      item_name: form.item_name.trim(),
      category: form.category.trim() || null,
      cost_jmd: Number(form.cost_jmd) || 0,
      shipping_jmd: Number(form.shipping_jmd) || 0,
      sell_jmd: Number(form.sell_jmd) || 0,
      note: form.note.trim() || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from('parts_price_list_items' as any).update(payload as any).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('parts_price_list_items' as any).insert({ ...payload, created_by: user?.id } as any));
    }
    setSaving(false);
    if (error) { toast({ title: editing ? 'Could not update item' : 'Could not add item', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({
      action: editing ? 'edit_price_list_item' : 'add_price_list_item',
      entity: 'parts_price_list_items',
      entityId: editing?.id,
      payload,
    });
    toast({ title: editing ? 'Item updated' : 'Item added to price list' });
    setForm(emptyForm); setEditing(null); setOpen(false); load();
  };

  const startEdit = (row: Row) => {
    setEditing(row);
    setForm({
      item_name: row.item_name,
      category: row.category || '',
      cost_jmd: String(row.cost_jmd || ''),
      shipping_jmd: String(row.shipping_jmd || ''),
      sell_jmd: String(row.sell_jmd || ''),
      note: row.note || '',
    });
    setOpen(true);
  };

  const removeItem = async (row: Row) => {
    const { error } = await supabase.from('parts_price_list_items' as any).delete().eq('id', row.id);
    if (error) { toast({ title: 'Could not remove item', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({ action: 'delete_price_list_item', entity: 'parts_price_list_items', entityId: row.id, payload: { item: row.item_name } });
    load();
  };

  const startInlineEdit = (row: Row) => {
    setInlineId(`${row.source}-${row.id}`);
    setInlineValue(String(row.sell_jmd || ''));
  };

  const commitInlineEdit = async (row: Row) => {
    const val = Number(inlineValue);
    setInlineId(null);
    if (Number.isNaN(val) || val < 0) {
      toast({ title: 'Invalid price', variant: 'destructive' });
      return;
    }
    if (val === row.sell_jmd) return;

    if (row.source === 'inventory') {
      const { error } = await supabase.from('parts_inventory').update({ selling_price_jmd: val } as any).eq('id', row.id);
      if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
      await logPartsAudit({
        action: 'update_price',
        entity: 'parts_inventory',
        entityId: row.id,
        payload: { item: row.item_name, from_jmd: row.sell_jmd, to_jmd: val, source: 'price_list' },
      });
    } else {
      const { error } = await supabase.from('parts_price_list_items' as any).update({ sell_jmd: val }).eq('id', row.id);
      if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
      await logPartsAudit({
        action: 'edit_price_list_item',
        entity: 'parts_price_list_items',
        entityId: row.id,
        payload: { item: row.item_name, from_jmd: row.sell_jmd, to_jmd: val, source: 'price_list' },
      });
    }
    toast({ title: 'Price updated' });
    load();
  };

  const stat = (label: string, value: string, Icon: any, cls = '') => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold tabular-nums ${cls}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {stat('Total Cost', fmtJMD(totals.cost), Coins)}
        {stat('Total Sell', fmtJMD(totals.sell), Tag)}
        {stat('Total Profit', fmtJMD(totals.profit), TrendingUp, totals.profit >= 0 ? 'text-emerald-600' : 'text-destructive')}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search price list…" value={query} onChange={e => setQuery(e.target.value)} className="w-56 h-9" />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="sell-desc">Sell (high → low)</SelectItem>
            <SelectItem value="sell-asc">Sell (low → high)</SelectItem>
            <SelectItem value="profit-desc">Profit (high → low)</SelectItem>
            <SelectItem value="profit-asc">Profit (low → high)</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit price list item' : 'Add price list item'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Item</Label><Input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} /></div>
                <div><Label>Category (optional)</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Cost (JMD)</Label><Input type="number" value={form.cost_jmd} onChange={e => setForm({ ...form, cost_jmd: e.target.value })} /></div>
                  <div><Label>Shipping (JMD)</Label><Input type="number" value={form.shipping_jmd} onChange={e => setForm({ ...form, shipping_jmd: e.target.value })} /></div>
                  <div><Label>Sell (JMD)</Label><Input type="number" value={form.sell_jmd} onChange={e => setForm({ ...form, sell_jmd: e.target.value })} /></div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Profit: <span className="font-medium text-foreground">{fmtJMD((Number(form.sell_jmd) || 0) - (Number(form.cost_jmd) || 0) - (Number(form.shipping_jmd) || 0))}</span>
                </div>
                <div><Label>Note (optional)</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={saveItem} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="text-xs uppercase tracking-wide">Item</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Source</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Cost</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Shipping</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Sell</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Profit</TableHead>
                {isAdmin && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r, idx) => {
                const profit = r.sell_jmd - r.cost_jmd - r.shipping_jmd;
                return (
                  <TableRow key={`${r.source}-${r.id}`} className={idx % 2 ? 'bg-muted/20' : ''}>
                    <TableCell>
                      <div className="font-medium">{r.item_name}</div>
                      {(r.category || r.note) && <div className="text-xs text-muted-foreground">{r.category || r.note}</div>}
                    </TableCell>
                    <TableCell><Badge variant={r.source === 'inventory' ? 'secondary' : 'outline'}>{r.source === 'inventory' ? 'Stock' : 'Added'}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtJMD(r.cost_jmd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtJMD(r.shipping_jmd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtJMD(r.sell_jmd)}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmtJMD(profit)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {r.source === 'custom' && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(r)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(r)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-muted-foreground">No items in the price list yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceListTab;
