import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Archive, ArchiveRestore, Download, Upload, PackagePlus, DollarSign, Package, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { fmtJMD, fmtUSD, InventoryRow, costPerUnitJmd, inventoryValueJmd, profitPerUnitJmd, projectedProfitJmd, totalCostJmd, totalCostUsd } from '@/lib/partsCalc';
import InventoryFormDialog from './InventoryFormDialog';
import RestockDialog from './RestockDialog';
import { toCsv, downloadCsv, parseCsv } from '@/lib/partsCsv';
import { logPartsAudit } from '@/lib/partsAudit';

const InventoryTab = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('created-desc');
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [restocking, setRestocking] = useState<InventoryRow | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceEditValue, setPriceEditValue] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<InventoryRow | null>(null);
  const [archiveNote, setArchiveNote] = useState('');
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
    if (!item.archived) { setArchiveTarget(item); setArchiveNote(''); return; }
    await supabase.from('parts_inventory').update({ archived: false, archive_note: null } as any).eq('id', item.id);
    await logPartsAudit({
      action: 'unarchive',
      entity: 'parts_inventory',
      entityId: item.id,
      payload: { item: item.item_name },
    });
    load();
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    const note = archiveNote.trim();
    if (!note) { toast({ title: 'Please add a reason', variant: 'destructive' }); return; }
    const { error } = await supabase.from('parts_inventory').update({ archived: true, archive_note: note } as any).eq('id', archiveTarget.id);
    if (error) { toast({ title: 'Archive failed', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({
      action: 'archive',
      entity: 'parts_inventory',
      entityId: archiveTarget.id,
      payload: { item: archiveTarget.item_name, note },
    });
    toast({ title: 'Item archived' });
    setArchiveTarget(null);
    setArchiveNote('');
    load();
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
      await logPartsAudit({
        action: 'csv_import',
        entity: 'parts_inventory',
        payload: { saved: ok, failed: fail, updated: toUpdate.length, inserted: toInsert.length },
      });
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
      await logPartsAudit({
        action: 'update_price',
        entity: 'parts_inventory',
        entityId: item.id,
        payload: { item: item.item_name, from_jmd: Number(item.selling_price_jmd), to_jmd: val },
      });
    }
    setPriceEditId(null);
  };

  const totals = items.filter(i => !i.archived).reduce((acc, i) => {
    acc.costUsd += totalCostUsd(i);
    acc.valueJmd += inventoryValueJmd(i, rate);
    acc.projProfit += projectedProfitJmd(i, rate);
    return acc;
  }, { costUsd: 0, valueJmd: 0, projProfit: 0 });

  const visibleItems = (() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(i =>
      !q || i.item_name?.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)
    );
    const cmp: Record<string, (a: InventoryRow, b: InventoryRow) => number> = {
      'name-asc': (a, b) => a.item_name.localeCompare(b.item_name),
      'name-desc': (a, b) => b.item_name.localeCompare(a.item_name),
      'category-asc': (a, b) => (a.category || '').localeCompare(b.category || ''),
      'qty-asc': (a, b) => a.qty_available - b.qty_available,
      'qty-desc': (a, b) => b.qty_available - a.qty_available,
      'price-asc': (a, b) => Number(a.selling_price_jmd) - Number(b.selling_price_jmd),
      'price-desc': (a, b) => Number(b.selling_price_jmd) - Number(a.selling_price_jmd),
      'profit-desc': (a, b) => profitPerUnitJmd(b, rate) - profitPerUnitJmd(a, rate),
      'profit-asc': (a, b) => profitPerUnitJmd(a, rate) - profitPerUnitJmd(b, rate),
      'created-desc': (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      'created-asc': (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    };
    return [...list].sort(cmp[sortBy] || cmp['created-desc']);
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Purchase Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{fmtUSD(totals.costUsd)}</div>
            <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{fmtJMD(totals.costUsd * rate)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{fmtJMD(totals.valueJmd)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">at current selling prices</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projected Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{fmtJMD(totals.projProfit)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">if all stock sells</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search items…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-52 h-9"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created-desc">Newest first</SelectItem>
              <SelectItem value="created-asc">Oldest first</SelectItem>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="category-asc">Category (A–Z)</SelectItem>
              <SelectItem value="qty-desc">Qty (high → low)</SelectItem>
              <SelectItem value="qty-asc">Qty (low → high)</SelectItem>
              <SelectItem value="price-desc">Price (high → low)</SelectItem>
              <SelectItem value="price-asc">Price (low → high)</SelectItem>
              <SelectItem value="profit-desc">Profit/unit (high → low)</SelectItem>
              <SelectItem value="profit-asc">Profit/unit (low → high)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Rate: 1 USD = {rate} JMD</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/80 backdrop-blur hover:bg-muted/80 border-b border-border/60">
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Item</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Category</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">In Stock</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">Cost (USD)</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">Cost (JMD)</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">Sell / unit</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">Profit / unit</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map(i => (
                <TableRow key={i.id} className={i.archived ? 'opacity-50' : 'even:bg-muted/30 hover:bg-muted/50'}>
                  <TableCell className="font-medium">
                    {i.item_name}{i.locked_rate ? <Badge variant="outline" className="ml-2">locked @{i.locked_rate}</Badge> : null}
                    {i.archived && (i as any).archive_note ? (
                      <div className="text-xs text-muted-foreground mt-1 max-w-[240px]">Archived: {(i as any).archive_note}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i.category || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={i.qty_available === 0 ? 'destructive' : i.qty_available <= 2 ? 'secondary' : 'outline'}
                      className="tabular-nums"
                      title={`${i.qty_ordered} ordered in total`}
                    >
                      {i.qty_available === 0 ? 'Out of stock' : `${i.qty_available} / ${i.qty_ordered}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtUSD(totalCostUsd(i))}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmtJMD(totalCostJmd(i, rate))}</TableCell>
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
              {visibleItems.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{items.length === 0 ? 'No inventory yet' : 'No items match your search'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InventoryFormDialog open={open} onOpenChange={setOpen} item={editing} onSaved={load} rate={rate} />
      <RestockDialog open={restockOpen} onOpenChange={setRestockOpen} item={restocking} onSaved={load} />

      <Dialog open={!!archiveTarget} onOpenChange={o => { if (!o) { setArchiveTarget(null); setArchiveNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive item</DialogTitle>
            <DialogDescription>Record why "{archiveTarget?.item_name}" is being archived.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="archive-note">Reason</Label>
            <Textarea id="archive-note" value={archiveNote} onChange={e => setArchiveNote(e.target.value)} placeholder="e.g. Discontinued by supplier, damaged stock, duplicate entry" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button onClick={confirmArchive}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTab;