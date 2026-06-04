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

interface Misc { id: string; description: string; cost_input: number; cost_currency: 'USD'|'JMD'; cost_jmd: number; rate_used: number; date_added: string; }
type EditField = 'description' | 'cost' | null;
interface Pay { id: string; misc_order_id: string; amount_jmd: number; paid_at: string; }

const MiscOrdersTab = () => {
  const [misc, setMisc] = useState<Misc[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);
  const [desc, setDesc] = useState(''); const [cost, setCost] = useState(''); const [cur, setCur] = useState<'USD'|'JMD'>('USD');
  const { rate } = useExchangeRateSetting();
  const { user } = useAuth();
  const { toast } = useToast();

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
    setDesc(''); setCost('');
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
          </TableRow></TableHeader>
          <TableBody>
            {misc.map(m => {
              const paid = paidBy[m.id] || 0;
              return (
                <TableRow key={m.id}>
                  <TableCell>{m.date_added}</TableCell>
                  <TableCell>{m.description}</TableCell>
                  <TableCell className="text-right">{m.cost_currency === 'USD' ? fmtUSD(Number(m.cost_input)) : fmtJMD(Number(m.cost_input))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(Number(m.cost_jmd))}</TableCell>
                  <TableCell className="text-right">{fmtJMD(paid)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtJMD(Math.max(0, Number(m.cost_jmd) - paid))}</TableCell>
                </TableRow>
              );
            })}
            {misc.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">None</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default MiscOrdersTab;