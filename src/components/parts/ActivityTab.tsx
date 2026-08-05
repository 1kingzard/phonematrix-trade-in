import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search } from 'lucide-react';
import { auditActorLabel, ENTITY_LABELS } from '@/lib/partsAudit';

interface LogRow {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  payload: any;
  rate_used: number | null;
  created_at: string;
}

const detailText = (payload: any) => {
  if (!payload || typeof payload !== 'object') return '—';
  const skip = new Set(['actor_email']);
  const parts = Object.entries(payload)
    .filter(([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  return parts.length ? parts.join(' · ') : '—';
};

const actionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('reject') || a.includes('archive')) return 'destructive';
  if (a.includes('create') || a.includes('add') || a.includes('confirm')) return 'default';
  return 'secondary';
};

const ActivityTab = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('parts_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    setLogs((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'parts_audit_log' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const entities = useMemo(() => Array.from(new Set(logs.map(l => l.entity))), [logs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return logs.filter(l => {
      if (entity !== 'all' && l.entity !== entity) return false;
      if (!term) return true;
      return [l.action, l.entity, auditActorLabel(l.payload, l.actor), detailText(l.payload)]
        .join(' ').toLowerCase().includes(term);
    });
  }, [logs, q, entity]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle className="text-base">Activity Log ({filtered.length})</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user, action, details…" className="pl-8 w-64" />
          </div>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {entities.map(e => <SelectItem key={e} value={e}>{ENTITY_LABELS[e] || e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="whitespace-nowrap">When</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(l => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-sm">{new Date(l.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-sm">{auditActorLabel(l.payload, l.actor)}</TableCell>
                <TableCell className="text-sm">{ENTITY_LABELS[l.entity] || l.entity}</TableCell>
                <TableCell><Badge variant={actionVariant(l.action)}>{l.action.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md break-words">{detailText(l.payload)}</TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activity recorded</TableCell></TableRow>
            )}
            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ActivityTab;
