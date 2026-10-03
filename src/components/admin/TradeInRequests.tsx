import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import TradeInQrCard from '@/components/TradeInQrCard';
import { TRADE_IN_STATUSES, requestUrl, statusTone, gradeInfo } from '@/lib/tradeInRequests';

const WHATSAPP_NUMBER = '18765472061';
const usd = (n: number | null | undefined) => n == null ? '—' : `$${Number(n).toLocaleString()}`;

const TradeInRequests: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [edit, setEdit] = useState({ status: '', final: '', notes: '', note: '' });

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('trade_in_requests').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setRows(data || []);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => {
      if (status !== 'all' && r.status !== status) return false;
      if (from && new Date(r.created_at) < new Date(from)) return false;
      if (to && new Date(r.created_at) > new Date(to + 'T23:59:59')) return false;
      if (!s) return true;
      const td = r.trade_device || {};
      return [r.request_code, r.customer_name, r.customer_phone, r.customer_email, td.brand, td.model]
        .some(v => (v || '').toLowerCase().includes(s));
    });
  }, [rows, q, status, from, to]);

  const openReq = async (r: any) => {
    setOpen(r);
    setEdit({ status: r.status, final: r.final_value_usd != null ? String(r.final_value_usd) : '', notes: r.admin_notes || '', note: '' });
    const { data } = await supabase.from('trade_in_request_history').select('*').eq('request_id', r.id).order('created_at', { ascending: false });
    setHistory(data || []);
  };

  const save = async () => {
    if (!open) return;
    const { data: { user } } = await supabase.auth.getUser();
    const final = edit.final.trim() === '' ? null : Number(edit.final);
    if (final != null && (!isFinite(final) || final < 0)) return toast({ title: 'Invalid final value', variant: 'destructive' });
    const hist: any[] = [];
    if (edit.status !== open.status) hist.push({ action: 'status_change', from_value: open.status, to_value: edit.status, note: edit.note || null });
    if (final !== (open.final_value_usd == null ? null : Number(open.final_value_usd)))
      hist.push({ action: 'final_value_adjusted', from_value: String(open.final_value_usd ?? open.estimated_value_usd), to_value: String(final ?? ''), note: edit.note || null });
    if (edit.notes !== (open.admin_notes || '')) hist.push({ action: 'notes_updated', note: edit.note || null });
    if (!hist.length && edit.note) hist.push({ action: 'note', note: edit.note });
    const { error } = await supabase.from('trade_in_requests').update({ status: edit.status, final_value_usd: final, admin_notes: edit.notes || null }).eq('id', open.id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    if (hist.length) await supabase.from('trade_in_request_history').insert(hist.map(h => ({ ...h, request_id: open.id, actor: user?.id })));
    toast({ title: 'Saved' });
    setOpen(null); load();
  };

  const whatsapp = (r: any) => {
    const td = r.trade_device || {};
    const val = r.final_value_usd ?? r.estimated_value_usd;
    const msg = `Hi ${r.customer_name}, this is Phone Matrix about trade-in request ${r.request_code} (${td.brand} ${td.model} ${td.storage}).\nStatus: ${r.status}\nTrade value: ${usd(val)}\nView it here: ${requestUrl(r.public_token)}`;
    const phone = (r.customer_phone || '').replace(/\D/g, '') || WHATSAPP_NUMBER;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Trade-In Requests ({filtered.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="ID, name, phone, email, device…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {TRADE_IN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-40" value={from} onChange={e => setFrom(e.target.value)} />
          <Input type="date" className="w-40" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map(r => {
          const td = r.trade_device || {};
          return (
            <button key={r.id} onClick={() => openReq(r)} className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold tabular-nums">{r.request_code} <span className="font-normal text-muted-foreground">• {r.customer_name}</span></p>
                  <p className="text-sm text-muted-foreground">{td.brand} {td.model} {td.storage} • {r.condition} • {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <p className="font-semibold">{usd(r.final_value_usd ?? r.estimated_value_usd)}</p>
                    {r.final_value_usd != null && <p className="text-xs text-muted-foreground line-through">{usd(r.estimated_value_usd)}</p>}
                  </div>
                  <Badge variant={statusTone(r.status)}>{r.status}</Badge>
                </div>
              </div>
            </button>
          );
        })}
        {!filtered.length && <p className="text-center text-muted-foreground py-8">No trade-in requests yet.</p>}
      </CardContent>

      <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {open && (() => {
            const td = open.trade_device || {}; const dd = open.desired_device; const est = open.estimate || {};
            return (<>
              <DialogHeader><DialogTitle>{open.request_code} — {open.customer_name}</DialogTitle></DialogHeader>
              <div className="grid md:grid-cols-[1fr_240px] gap-6">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <p><span className="text-muted-foreground">Phone:</span> {open.customer_phone}</p>
                    <p><span className="text-muted-foreground">Email:</span> {open.customer_email || '—'}</p>
                    <p><span className="text-muted-foreground">Created:</span> {new Date(open.created_at).toLocaleString()}</p>
                    <p><span className="text-muted-foreground">Expires:</span> {open.expires_at ? new Date(open.expires_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="rounded border p-3 space-y-1">
                    <p className="font-semibold">{td.brand} {td.model} {td.storage} {td.color && `• ${td.color}`}</p>
                    <p>Grade: {open.condition} <span className="text-muted-foreground">— {gradeInfo(open.condition)?.short}</span></p>
                    <p>Battery: {open.battery_pct ?? '—'}% • Network: {td.unlocked || '—'} • IMEI: {td.imei || '—'}</p>
                    <p>Faults: {(open.faults || []).join(', ') || 'None'}</p>
                    {est.repairs?.length > 0 && <p>Repairs deducted: {est.repairs.join(', ')}</p>}
                    <p>Original estimate: <b>{usd(open.estimated_value_usd)}</b></p>
                    {dd && <p>Wants: {dd.brand} {dd.model} {dd.storage} • {dd.condition} • {dd.color} (USA {usd(est.usaTotalUSD)})</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Status</Label>
                      <Select value={edit.status} onValueChange={v => setEdit({ ...edit, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TRADE_IN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Final approved value (USD)</Label>
                      <Input type="number" value={edit.final} placeholder={String(open.estimated_value_usd)} onChange={e => setEdit({ ...edit, final: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1"><Label>Internal notes</Label>
                    <Textarea value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} rows={3} /></div>
                  <div className="space-y-1"><Label>Reason / history note (optional)</Label>
                    <Input value={edit.note} onChange={e => setEdit({ ...edit, note: e.target.value })} placeholder="e.g. screen scratches found at inspection" /></div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={save}>Save changes</Button>
                    <Button variant="outline" disabled title="Coming in the invoice update">Create Invoice</Button>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">History</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {history.map(h => (
                        <div key={h.id} className="text-xs border-l-2 pl-2">
                          <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span> — {h.action.replace(/_/g, ' ')}
                          {h.from_value || h.to_value ? `: ${h.from_value ?? ''} → ${h.to_value ?? ''}` : ''}{h.note ? ` (${h.note})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <TradeInQrCard url={requestUrl(open.public_token)} code={open.request_code} onWhatsApp={() => whatsapp(open)} />
              </div>
            </>);
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TradeInRequests;
