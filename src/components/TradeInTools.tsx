import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, Wallet, Plus, X } from 'lucide-react';
import { DeviceData } from '@/services/deviceDataService';
import { formatJMD, formatUSD } from '@/hooks/useExchangeRate';

const SERVICE_FEE_PCT = 0.30;
const SHIPPING_PCT = 0.30;

interface Props { devices: DeviceData[]; exchangeRate: number; currentTradeValue: number; }
interface Pick { brand: string; model: string; storage: string; condition: string; }
const empty: Pick = { brand: '', model: '', storage: '', condition: '' };

const uniq = (a: string[]) => Array.from(new Set(a.filter(Boolean))).sort();

const TradeInTools: React.FC<Props> = ({ devices, exchangeRate, currentTradeValue }) => {
  // ---------- Compare trade-ins ----------
  const [p, setP] = useState<Pick>(empty);
  const [list, setList] = useState<Pick[]>([]);
  const brands = useMemo(() => uniq(devices.map(d => d.Brand)), [devices]);
  const models = useMemo(() => uniq(devices.filter(d => d.Brand === p.brand).map(d => d.Model)), [devices, p.brand]);
  const storages = useMemo(() => uniq(devices.filter(d => d.Brand === p.brand && d.Model === p.model).map(d => d.Storage)), [devices, p.brand, p.model]);
  const conds = useMemo(() => uniq(devices.filter(d => d.Brand === p.brand && d.Model === p.model && d.Storage === p.storage).map(d => d.Condition)), [devices, p.brand, p.model, p.storage]);

  const rows = useMemo(() => list.map(x => {
    const d = devices.find(r => r.Brand === x.brand && r.Model === x.model && r.Storage === x.storage && r.Condition === x.condition);
    const usd = Math.max(0, (d?.Price || 0) * (1 - SERVICE_FEE_PCT));
    return { ...x, usd, jmd: usd * exchangeRate };
  }), [list, devices, exchangeRate]);
  const best = rows.length > 1 ? Math.max(...rows.map(r => r.usd)) : -1;

  const add = () => { if (p.condition) { setList(l => [...l, p]); setP(empty); } };

  // ---------- Budget finder ----------
  const [budget, setBudget] = useState('');
  const [cur, setCur] = useState<'USD' | 'JMD'>('USD');
  const [useTrade, setUseTrade] = useState(false);
  const budgetNum = parseFloat(budget) || 0;
  const tradeCredit = useTrade ? currentTradeValue : 0;

  const matches = useMemo(() => {
    if (budgetNum <= 0) return [];
    return devices
      .map(d => {
        const usd = Math.max(0, d.Price - tradeCredit);
        const jmd = Math.max(0, d.Price * (1 + SHIPPING_PCT) - tradeCredit) * exchangeRate;
        return { d, usd, jmd };
      })
      .filter(m => (cur === 'USD' ? m.usd : m.jmd) <= budgetNum && m.d.Price > 0)
      .sort((a, b) => b.d.Price - a.d.Price)
      .slice(0, 30);
  }, [devices, budgetNum, cur, tradeCredit, exchangeRate]);

  const sel = (val: string, onChange: (v: string) => void, opts: string[], ph: string, disabled = false) => (
    <Select value={val} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent>{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6 mt-8">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1"><Scale className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Compare trade-in devices</h2></div>
        <p className="text-sm text-muted-foreground mb-4">Add several phones to see which one is worth the most as a trade-in.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sel(p.brand, v => setP({ ...empty, brand: v }), brands, 'Brand')}
          {sel(p.model, v => setP({ ...p, model: v, storage: '', condition: '' }), models, 'Model', !p.brand)}
          {sel(p.storage, v => setP({ ...p, storage: v, condition: '' }), storages, 'Storage', !p.model)}
          {sel(p.condition, v => setP({ ...p, condition: v }), conds, 'Condition', !p.storage)}
        </div>
        <Button onClick={add} disabled={!p.condition} className="mt-3" size="sm"><Plus className="h-4 w-4 mr-1" />Add to comparison</Button>

        {rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">Device</th><th className="py-2 text-right">Value (USD)</th><th className="py-2 text-right">Value (JMD)</th><th />
              </tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2">
                    <div className="font-medium">{r.brand} {r.model} {r.usd === best && <Badge className="ml-1">Best value</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{r.storage} • {r.condition}</div>
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatUSD(r.usd)}</td>
                  <td className="py-2 text-right tabular-nums">{formatJMD(r.jmd)}</td>
                  <td className="py-2 text-right"><Button variant="ghost" size="sm" onClick={() => setList(l => l.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1"><Wallet className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">What can I get for my budget?</h2></div>
        <p className="text-sm text-muted-foreground mb-4">Enter how much you want to spend. Jamaica prices include shipping.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px] space-y-1">
            <Label htmlFor="budget">Budget</Label>
            <Input id="budget" type="number" min="0" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} placeholder={cur === 'USD' ? 'e.g. 500' : 'e.g. 80000'} />
          </div>
          <div className="flex rounded-full border border-border p-1">
            {(['USD', 'JMD'] as const).map(c => (
              <Button key={c} size="sm" variant={cur === c ? 'default' : 'ghost'} className="rounded-full" onClick={() => setCur(c)}>{c}</Button>
            ))}
          </div>
        </div>
        {currentTradeValue > 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Switch checked={useTrade} onCheckedChange={setUseTrade} id="usetrade" />
            <Label htmlFor="usetrade">Include my trade-in credit ({formatUSD(currentTradeValue)} / {formatJMD(currentTradeValue * exchangeRate)})</Label>
          </div>
        )}

        {budgetNum > 0 && (
          matches.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No devices fit that budget yet — try a higher amount.</p>
          ) : (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {matches.map((m, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="font-medium">{m.d.Brand} {m.d.Model}</div>
                  <div className="text-xs text-muted-foreground mb-2">{m.d.Storage} • {m.d.Condition}</div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">USA</span><span className="tabular-nums font-semibold">{formatUSD(m.usd)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Jamaica</span><span className="tabular-nums font-semibold">{formatJMD(m.jmd)}</span></div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>
    </div>
  );
};

export default TradeInTools;
