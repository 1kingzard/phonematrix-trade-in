import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCcw, Check, X } from 'lucide-react';

interface Settings {
  id: string;
  markup_percent: number;
  default_source_url: string;
}

interface ScrapedRow {
  id: string;
  source: string;
  source_url: string;
  brand: string | null;
  model: string;
  storage: string | null;
  condition: string | null;
  market_price_usd: number;
  suggested_price_usd: number;
  matched_device_id: string | null;
  status: string;
  scraped_at: string;
}

interface DeviceOpt { id: string; brand: string; model: string; storage: string; condition: string; }

const PriceScraper: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [markup, setMarkup] = useState<string>('60');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [rows, setRows] = useState<ScrapedRow[]>([]);
  const [devices, setDevices] = useState<DeviceOpt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [priceEdit, setPriceEdit] = useState<Record<string, string>>({});
  const [matchEdit, setMatchEdit] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [{ data: s }, { data: r }, { data: d }] = await Promise.all([
      supabase.from('scraper_settings').select('*').limit(1).maybeSingle(),
      supabase.from('scraped_prices').select('*').order('scraped_at', { ascending: false }).limit(500),
      supabase.from('devices').select('id,brand,model,storage,condition').order('brand').order('model'),
    ]);
    if (s) { setSettings(s as any); setMarkup(String((s as any).markup_percent)); setScrapeUrl((s as any).default_source_url || ''); }
    if (r) setRows(r as any);
    if (d) setDevices(d as any);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => {
    const pct = parseFloat(markup);
    if (!isFinite(pct) || pct <= 0 || pct > 100) return toast({ title: 'Invalid markup', variant: 'destructive' });
    if (!settings) return;
    const { error } = await supabase.from('scraper_settings').update({ markup_percent: pct, default_source_url: scrapeUrl }).eq('id', settings.id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Settings saved' });
    load();
  };

  const runScrape = async () => {
    if (!scrapeUrl) return toast({ title: 'Enter a URL', variant: 'destructive' });
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', { body: { url: scrapeUrl } });
      if (error) throw error;
      toast({ title: 'Scrape complete', description: `${data?.count ?? 0} listings added to review.` });
      load();
    } catch (e: any) {
      toast({ title: 'Scrape failed', description: e?.message || 'Check function logs', variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

  const findMatch = (r: ScrapedRow): string => {
    if (r.matched_device_id) return r.matched_device_id;
    const brand = (r.brand || '').toLowerCase();
    const model = (r.model || '').toLowerCase();
    const storage = (r.storage || '').toLowerCase();
    const cond = (r.condition || '').toLowerCase();
    const candidate = devices.find(d =>
      d.model.toLowerCase() === model &&
      (!storage || d.storage.toLowerCase() === storage) &&
      (!cond || d.condition.toLowerCase() === cond) &&
      (!brand || d.brand.toLowerCase().includes(brand) || brand.includes(d.brand.toLowerCase()))
    ) || devices.find(d => d.model.toLowerCase() === model);
    return candidate?.id || '';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.brand, r.model, r.storage, r.condition].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const approve = async (r: ScrapedRow) => {
    const matchId = matchEdit[r.id] || findMatch(r);
    if (!matchId) return toast({ title: 'No matched device', description: 'Pick a target device first.', variant: 'destructive' });
    const newPrice = Number(priceEdit[r.id] ?? r.suggested_price_usd);
    if (!isFinite(newPrice) || newPrice <= 0) return toast({ title: 'Invalid price', variant: 'destructive' });
    const { error: upErr } = await supabase.from('devices').update({ price: newPrice }).eq('id', matchId);
    if (upErr) return toast({ title: 'Error', description: upErr.message, variant: 'destructive' });
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('scraped_prices').update({
      status: 'approved', matched_device_id: matchId, suggested_price_usd: newPrice,
      reviewed_at: new Date().toISOString(), reviewed_by: user?.id,
    }).eq('id', r.id);
    toast({ title: 'Applied', description: 'Device price updated.' });
    load();
  };

  const reject = async (r: ScrapedRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('scraped_prices').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user?.id }).eq('id', r.id);
    load();
  };

  const clearReviewed = async () => {
    if (!confirm('Delete all reviewed (approved/rejected) rows?')) return;
    await supabase.from('scraped_prices').delete().in('status', ['approved', 'rejected']);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Scraper Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Trade-in markup %</Label>
            <Input type="number" value={markup} onChange={e => setMarkup(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Suggested = market price × markup%</p>
          </div>
          <div className="md:col-span-2">
            <Label>Source URL</Label>
            <Input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://swappa.com/... or https://www.backmarket.com/..." />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button variant="outline" onClick={saveSettings}>Save Settings</Button>
            <Button onClick={runScrape} disabled={scraping}>
              <RefreshCcw className={`h-4 w-4 mr-1 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'Scraping...' : 'Scrape Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Review Queue ({filtered.length})</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
                <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>{s}</Button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 w-56" />
            </div>
            <Button size="sm" variant="ghost" onClick={clearReviewed}>Clear reviewed</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[70vh] border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Market $</TableHead>
                  <TableHead>Trade-in $</TableHead>
                  <TableHead>Match device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const auto = findMatch(r);
                  const matchVal = matchEdit[r.id] ?? auto;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.brand} {r.model}</div>
                        <a href={r.source_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">{r.source}</a>
                      </TableCell>
                      <TableCell>{r.storage || '—'}</TableCell>
                      <TableCell>{r.condition || '—'}</TableCell>
                      <TableCell>${r.market_price_usd}</TableCell>
                      <TableCell>
                        {r.status === 'pending' ? (
                          <Input type="number" className="w-24" value={priceEdit[r.id] ?? r.suggested_price_usd}
                            onChange={e => setPriceEdit({ ...priceEdit, [r.id]: e.target.value })} />
                        ) : `$${r.suggested_price_usd}`}
                      </TableCell>
                      <TableCell>
                        {r.status === 'pending' ? (
                          <select className="text-sm bg-background border rounded px-2 py-1 max-w-[220px]"
                            value={matchVal}
                            onChange={e => setMatchEdit({ ...matchEdit, [r.id]: e.target.value })}>
                            <option value="">— pick device —</option>
                            {devices.map(d => (
                              <option key={d.id} value={d.id}>{d.brand} {d.model} {d.storage} ({d.condition})</option>
                            ))}
                          </select>
                        ) : (
                          devices.find(d => d.id === r.matched_device_id)?.model || '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => approve(r)} title="Approve & apply"><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => reject(r)} title="Reject"><X className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No listings. Click "Scrape Now" above.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceScraper;