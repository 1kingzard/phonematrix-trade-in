import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SettingsTab = () => {
  const { rate } = useExchangeRateSetting();
  const [val, setVal] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { setVal(String(rate)); }, [rate]);

  const loadHist = async () => {
    const { data } = await supabase.from('parts_exchange_rate_history').select('*').order('effective_at', { ascending: false }).limit(20);
    setHistory(data || []);
  };
  useEffect(() => { loadHist(); }, []);

  const save = async () => {
    const n = Number(val);
    if (!n || n <= 0) return;
    const { data: cur } = await supabase.from('parts_settings').select('id').limit(1).maybeSingle();
    if (cur) {
      const { error } = await supabase.from('parts_settings').update({ exchange_rate: n, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('id', cur.id);
      if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    }
    await supabase.from('parts_exchange_rate_history').insert({ rate: n, set_by: user?.id });
    toast({ title: 'Exchange rate updated' });
    loadHist();
  };

  const promote = async () => {
    if (!email) return;
    const { data, error } = await supabase.rpc('assign_parts_guest', { user_email: email });
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: data ? 'Guest assigned' : 'No user with that email' });
    setEmail('');
  };

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-base">USD → JMD Exchange Rate</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs"><Label>Rate</Label><Input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} /></div>
            <Button onClick={save}>Update Rate</Button>
          </div>
          <p className="text-sm text-muted-foreground">Current: 1 USD = {rate} JMD</p>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Assign Parts Guest</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 max-w-md"><Label>User email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" /></div>
          <Button onClick={promote}>Grant Access</Button>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Rate History</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Rate</TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map(h => (<TableRow key={h.id}><TableCell>{new Date(h.effective_at).toLocaleString()}</TableCell><TableCell className="text-right">{h.rate}</TableCell></TableRow>))}
              {history.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No changes yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;