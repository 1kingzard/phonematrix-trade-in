import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fmtJMD, fmtUSD } from '@/lib/partsCalc';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logPartsAudit } from '@/lib/partsAudit';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface Misc { id: string; description: string; cost_input: number; cost_currency: 'USD'|'JMD'; cost_jmd: number; rate_used: number; date_added: string; }
type EditField = 'description' | 'cost' | null;
interface Pay { id: string; misc_order_id: string; amount_jmd: number; paid_at: string; }

const MiscOrdersTab = () => {
  const [misc, setMisc] = useState<Misc[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);
  const [desc, setDesc] = useState(''); const [cost, setCost] = useState(''); const [cur, setCur] = useState<'USD'|'JMD'>('USD');
  const { rate } = useExchangeRateSetting();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [editId, setEditId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editCur, setEditCur] = useState<'USD'|'JMD'>('USD');

  const load = async () => {
    const [m, p] = await Promise.all([
      supabase.from('parts_misc_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('parts_misc_payments').select('*'),
    ]);
    setMisc((m.data || []) as any); setPays((p.data || []) as any);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('misc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_misc_orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_misc_payments' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const add = async () => {
    const n = Number(cost);
    if (!desc || !n) return;
    const cost_jmd = cur === 'USD' ? n * rate : n;
    const { error } = await supabase.from('parts_misc_orders').insert({ description: desc, cost_input: n, cost_currency: cur, cost_jmd, rate_used: rate, created_by: user?.id });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({ action: 'create_misc_order', entity: 'parts_misc_orders', rateUsed: rate, payload: { description: desc, cost_input: n, currency: cur, cost_jmd } });
    setDesc(''); setCost('');
  };

  const startEdit = (m: Misc) => {
    setEditId(m.id);
    setEditDesc(m.description);
    setEditCost(String(m.cost_input));
    setEditCur(m.cost_currency as 'USD'|'JMD');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDesc('');
    setEditCost('');
    setEditCur('USD');
  };

  const commitEdit = async (m: Misc) => {
    const n = Number(editCost);
    if (!editDesc || !n || !Number.isFinite(n)) { toast({ title: 'Invalid input', variant: 'destructive' }); return; }
    const newCostJmd = editCur === 'USD' ? n * rate : n;
    const { error } = await supabase.from('parts_misc_orders').update({ description: editDesc, cost_input: n, cost_currency: editCur, cost_jmd: newCostJmd }).eq('id', m.id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({
      action: 'update_misc_order',
      entity: 'parts_misc_orders',
      entityId: m.id,
      rateUsed: rate,
      payload: { from_description: m.description, to_description: editDesc, from_cost_jmd: Number(m.cost_jmd), to_cost_jmd: newCostJmd },
    });
    cancelEdit();
  };

  const remove = async (m: Misc) => {
    if ((paidBy[m.id] || 0) > 0) { toast({ title: 'Cannot delete', description: 'This order has payments recorded.', variant: 'destructive' }); return; }
    if (!window.confirm(`Delete misc order "${m.description}"?`)) return;
    const { error } = await supabase.from('parts_misc_orders').delete().eq('id', m.id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    await logPartsAudit({ action: 'delete_misc_order', entity: 'parts_misc_orders', entityId: m.id, payload: { description: m.description, cost_jmd: Number(m.cost_jmd) } });
    toast({ title: 'Misc order deleted' });
    load();
  };

  const paidBy = pays.reduce<Record<string, number>>((a, p) => { a[p.misc_order_id] = (a[p.misc_order_id] || 0) + Number(p.amount_jmd); return a; }, {});

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-base">Add Misc Order</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <div><Label>Cost</Label><Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} /></div>
          <div><Label>Currency</Label>
            <Select value={cur} onValueChange={v => setCur(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="JMD">JMD</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4 flex justify-end"><Button onClick={add}>Add</Button></div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Description</TableHead>
            <TableHead className="text-right">Cost (entered)</TableHead>
            <TableHead className="text-right">Cost (JMD)</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {misc.map(m => {
              const paid = paidBy[m.id] || 0;
              const isEditing = editId === m.id;
              return (
                <TableRow key={m.id}>
                  <TableCell>{m.date_added}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} autoFocus className="h-8" />
                    ) : (
                      <span onDoubleClick={() => startEdit(m)} className="cursor-pointer" title="Double-click to edit">{m.description}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <Input type="number" step="0.01" value={editCost} onChange={e => setEditCost(e.target.value)} className="h-8 w-28 text-right" />
                        <Select value={editCur} onValueChange={v => setEditCur(v as 'USD'|'JMD')}>
                          <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="JMD">JMD</SelectItem></SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <span onDoubleClick={() => startEdit(m)} className="cursor-pointer" title="Double-click to edit">
                        {m.cost_currency === 'USD' ? fmtUSD(Number(m.cost_input)) : fmtJMD(Number(m.cost_input))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{fmtJMD(Number(m.cost_jmd))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(paid)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(m.cost_jmd) - paid))}</TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => commitEdit(m)}><Check className="h-3 w-3" />Save</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={cancelEdit}><X className="h-3 w-3" />Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => remove(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {misc.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">None</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default MiscOrdersTab;