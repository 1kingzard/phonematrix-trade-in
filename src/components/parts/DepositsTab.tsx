import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { fmtJMD } from '@/lib/partsCalc';
import { useAuth } from '@/contexts/AuthContext';

interface Deposit { id: string; amount_jmd: number; reference: string | null; status: string; deposited_at: string; verified_at: string | null; }

const DepositsTab = () => {
  const [deps, setDeps] = useState<Deposit[]>([]);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from('parts_deposits').select('*').order('deposited_at', { ascending: false });
    setDeps((data || []) as any);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('dep').on('postgres_changes', { event: '*', schema: 'public', table: 'parts_deposits' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setStatus = async (id: string, status: 'verified' | 'rejected') => {
    await supabase.from('parts_deposits').update({ status, verified_by: user?.id, verified_at: new Date().toISOString() }).eq('id', id);
  };

  const totals = deps.reduce((a, d) => {
    if (d.status === 'verified') a.verified += Number(d.amount_jmd);
    if (d.status === 'pending') a.pending += Number(d.amount_jmd);
    return a;
  }, { verified: 0, pending: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Verified Deposits</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(totals.verified)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Verification</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{fmtJMD(totals.pending)}</div></CardContent></Card>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {deps.map(d => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.deposited_at).toLocaleDateString()}</TableCell>
                <TableCell>{d.reference || '—'}</TableCell>
                <TableCell className="text-right">{fmtJMD(Number(d.amount_jmd))}</TableCell>
                <TableCell><Badge variant={d.status === 'verified' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>{d.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {d.status === 'pending' && (<>
                    <Button variant="ghost" size="icon" onClick={() => setStatus(d.id, 'verified')}><Check className="h-4 w-4 text-green-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setStatus(d.id, 'rejected')}><X className="h-4 w-4 text-destructive" /></Button>
                  </>)}
                </TableCell>
              </TableRow>
            ))}
            {deps.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No deposits</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default DepositsTab;