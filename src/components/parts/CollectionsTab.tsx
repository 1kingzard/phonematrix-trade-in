import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fmtJMD } from '@/lib/partsCalc';

interface Sale { id: string; inventory_id: string; total_jmd: number; created_at: string; }
interface Coll { id: string; sale_id: string; amount_jmd: number; collected_at: string; status: string; confirmed_at: string | null; recorded_by: string | null; }
interface AuditEntry { id: string; actor: string | null; action: string; entity_id: string | null; created_at: string; payload: any; }

const CollectionsTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cols, setCols] = useState<Coll[]>([]);
  const [items, setItems] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [pending, setPending] = useState<{ id: string; status: 'confirmed' | 'rejected' | 'pending' } | null>(null);
  const [note, setNote] = useState('');
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    const [s, c, i, a] = await Promise.all([
      supabase.from('parts_sales').select('id,inventory_id,total_jmd,created_at'),
      supabase.from('parts_collections').select('*'),
      supabase.from('parts_inventory').select('id,item_name'),
      supabase.from('parts_audit_log').select('*').eq('entity', 'parts_collections').order('created_at', { ascending: false }),
    ]);
    setSales((s.data || []) as any); setCols((c.data || []) as any);
    setAudit((a.data || []) as any);
    const m: Record<string, string> = {};
    (i.data || []).forEach((it: any) => m[it.id] = it.item_name);
    setItems(m);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('coll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_collections' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_sales' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_audit_log' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const activeCols = cols.filter(c => c.status !== 'rejected');
  const collectedBySale = activeCols.reduce<Record<string, number>>((a, c) => { a[c.sale_id] = (a[c.sale_id] || 0) + Number(c.amount_jmd); return a; }, {});
  const totalOutstanding = sales.reduce((sum, s) => sum + Math.max(0, Number(s.total_jmd) - (collectedBySale[s.id] || 0)), 0);
  const totalCollected = activeCols.reduce((s, c) => s + Number(c.amount_jmd), 0);
  const totalConfirmed = cols.filter(c => c.status === 'confirmed').reduce((s, c) => s + Number(c.amount_jmd), 0);
  const totalPending = cols.filter(c => c.status === 'pending' || !c.status).reduce((s, c) => s + Number(c.amount_jmd), 0);

  const applyStatus = async (id: string, status: 'confirmed' | 'rejected' | 'pending', noteText: string) => {
    const patch: any = { status };
    if (status === 'confirmed') { patch.confirmed_by = user?.id; patch.confirmed_at = new Date().toISOString(); }
    else { patch.confirmed_by = null; patch.confirmed_at = null; }
    const { error } = await supabase.from('parts_collections').update(patch).eq('id', id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    const action = status === 'confirmed' ? 'confirm' : status === 'rejected' ? 'reject' : 'reset';
    await supabase.from('parts_audit_log').insert({
      actor: user?.id, action, entity: 'parts_collections', entity_id: id,
      payload: { status, note: noteText || null },
    });
    toast({ title: status === 'confirmed' ? 'Collection confirmed' : status === 'rejected' ? 'Collection rejected' : 'Marked pending' });
  };

  const openAction = (id: string, status: 'confirmed' | 'rejected' | 'pending') => {
    setPending({ id, status }); setNote('');
  };

  const confirmAction = async () => {
    if (!pending) return;
    const p = pending; const n = note;
    setPending(null); setNote('');
    await applyStatus(p.id, p.status, n);
  };

  const auditFor = (collId: string) => audit.filter(a => a.entity_id === collId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Collected (incl. pending)</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(totalCollected)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Confirmed Received</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-green-600">{fmtJMD(totalConfirmed)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Confirmation</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-amber-600">{fmtJMD(totalPending)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outstanding</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-destructive">{fmtJMD(totalOutstanding)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Guest Collections — Confirm Receipt</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {[...cols].sort((a,b) => +new Date(b.collected_at) - +new Date(a.collected_at)).map(c => {
                const sale = sales.find(s => s.id === c.sale_id);
                const status = c.status || 'pending';
                return (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.collected_at).toLocaleDateString()}</TableCell>
                    <TableCell>{sale ? (items[sale.inventory_id] || '—') : '—'}</TableCell>
                    <TableCell className="text-right">{fmtJMD(Number(c.amount_jmd))}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'confirmed' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>{status}</Badge>
                      {c.confirmed_at && <div className="text-xs text-muted-foreground mt-1">{new Date(c.confirmed_at).toLocaleString()}</div>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {status !== 'confirmed' && <Button size="sm" onClick={() => openAction(c.id, 'confirmed')}>Confirm</Button>}
                      {status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => openAction(c.id, 'rejected')}>Reject</Button>}
                      {status !== 'pending' && <Button size="sm" variant="outline" onClick={() => openAction(c.id, 'pending')}>Reset</Button>}
                      <Button size="sm" variant="ghost" onClick={() => setHistoryFor(c.id)}>History ({auditFor(c.id).length})</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {cols.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No collections recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Item</TableHead>
            <TableHead className="text-right">Sale</TableHead>
            <TableHead className="text-right">Collected</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {sales.map(s => {
              const got = collectedBySale[s.id] || 0;
              return (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{items[s.inventory_id] || '—'}</TableCell>
                  <TableCell className="text-right">{fmtJMD(Number(s.total_jmd))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(got)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(s.total_jmd) - got))}</TableCell>
                </TableRow>
              );
            })}
            {sales.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sales yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!pending} onOpenChange={(o) => { if (!o) { setPending(null); setNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.status === 'confirmed' ? 'Confirm Collection' : pending?.status === 'rejected' ? 'Reject Collection' : 'Reset to Pending'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="audit-note">Note (optional)</Label>
            <Textarea id="audit-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or reference..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPending(null); setNote(''); }}>Cancel</Button>
            <Button onClick={confirmAction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(o) => { if (!o) setHistoryFor(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Audit History</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {historyFor && auditFor(historyFor).length === 0 && (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            )}
            {historyFor && auditFor(historyFor).map(e => (
              <div key={e.id} className="border rounded p-2 text-sm">
                <div className="flex justify-between">
                  <Badge variant="outline" className="capitalize">{e.action}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                {e.payload?.note && <div className="mt-1 text-muted-foreground">{e.payload.note}</div>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsTab;