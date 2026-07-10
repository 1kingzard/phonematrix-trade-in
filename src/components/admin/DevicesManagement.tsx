import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Search } from 'lucide-react';

interface DeviceRow {
  id: string;
  os: string;
  brand: string;
  model: string;
  condition: string;
  storage: string;
  price: number;
  screen_replacement: number;
  battery_replacement: number;
  rear_glass_replacement: number;
  colors: string[];
  active: boolean;
}

type PriceField = 'price' | 'screen_replacement' | 'battery_replacement' | 'rear_glass_replacement';

const emptyForm = {
  os: 'iOS', brand: '', model: '', condition: 'Like New', storage: '',
  price: 0, screen_replacement: 0, battery_replacement: 0, rear_glass_replacement: 0,
  colors: '',
};

const DevicesManagement: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editCell, setEditCell] = useState<{ id: string; field: PriceField } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('devices').select('*').order('brand').order('model').order('condition');
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setRows((data as any) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.brand, r.model, r.storage, r.condition, r.os].some(v => (v || '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const startEdit = (id: string, field: PriceField, current: number) => {
    setEditCell({ id, field });
    setEditVal(String(current));
  };

  const commitEdit = async () => {
    if (!editCell) return;
    const n = parseFloat(editVal);
    if (!isFinite(n) || n < 0) { setEditCell(null); return; }
    const { error } = await supabase.from('devices').update({ [editCell.field]: n } as any).eq('id', editCell.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setRows(prev => prev.map(r => r.id === editCell.id ? { ...r, [editCell.field]: n } : r));
      toast({ title: 'Saved' });
    }
    setEditCell(null);
  };

  const toggleActive = async (r: DeviceRow) => {
    const { error } = await supabase.from('devices').update({ active: !r.active }).eq('id', r.id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, active: !r.active } : x));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this device?')) return;
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const addDevice = async () => {
    const colors = form.colors.split(',').map(s => s.trim()).filter(Boolean);
    const payload = { ...form, colors, price: Number(form.price), screen_replacement: Number(form.screen_replacement), battery_replacement: Number(form.battery_replacement), rear_glass_replacement: Number(form.rear_glass_replacement) };
    const { data, error } = await supabase.from('devices').insert(payload).select().single();
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setRows(prev => [...prev, data as any]);
    setAddOpen(false);
    setForm({ ...emptyForm });
    toast({ title: 'Device added' });
  };

  const renderPriceCell = (r: DeviceRow, field: PriceField) => {
    const val = r[field] as number;
    if (editCell?.id === r.id && editCell.field === field) {
      return (
        <input
          autoFocus
          type="number"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditCell(null); }}
          className="w-24 px-2 py-1 border rounded bg-background text-foreground"
        />
      );
    }
    return (
      <span onDoubleClick={() => startEdit(r.id, field, val)} className="cursor-pointer" title="Double-click to edit">
        ${val}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Devices ({filtered.length})</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brand, model, storage..." className="pl-8 w-72" />
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Device</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>OS</Label><Input value={form.os} onChange={e => setForm({ ...form, os: e.target.value })} /></div>
                <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
                <div><Label>Condition</Label><Input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} /></div>
                <div><Label>Storage</Label><Input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} /></div>
                <div><Label>Price (USD)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
                <div><Label>Screen</Label><Input type="number" value={form.screen_replacement} onChange={e => setForm({ ...form, screen_replacement: Number(e.target.value) })} /></div>
                <div><Label>Battery</Label><Input type="number" value={form.battery_replacement} onChange={e => setForm({ ...form, battery_replacement: Number(e.target.value) })} /></div>
                <div><Label>Rear Glass</Label><Input type="number" value={form.rear_glass_replacement} onChange={e => setForm({ ...form, rear_glass_replacement: Number(e.target.value) })} /></div>
                <div className="col-span-2"><Label>Colors (comma separated)</Label><Input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={addDevice}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">Double-click any price to edit. Changes reflect on the public site immediately.</p>
        <div className="overflow-auto max-h-[70vh] border rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Screen</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Rear Glass</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-6">Loading...</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.brand}</TableCell>
                  <TableCell>{r.model}</TableCell>
                  <TableCell>{r.storage}</TableCell>
                  <TableCell>{r.condition}</TableCell>
                  <TableCell>{renderPriceCell(r, 'price')}</TableCell>
                  <TableCell>{renderPriceCell(r, 'screen_replacement')}</TableCell>
                  <TableCell>{renderPriceCell(r, 'battery_replacement')}</TableCell>
                  <TableCell>{renderPriceCell(r, 'rear_glass_replacement')}</TableCell>
                  <TableCell><Switch checked={r.active} onCheckedChange={() => toggleActive(r)} /></TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevicesManagement;