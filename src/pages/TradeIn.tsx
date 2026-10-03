import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDeviceData, useExchangeRate, DeviceData, formatCurrency } from '@/services/deviceDataService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Smartphone, Battery, Sparkles, Wrench, ShoppingBag, FileCheck, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Pencil, Plus, X } from 'lucide-react';
import DeviceImage from '@/components/DeviceImage';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TradeInQrCard from '@/components/TradeInQrCard';
import { gradeInfo, sortGrades, requestUrl } from '@/lib/tradeInRequests';

const WHATSAPP_NUMBER = '18765472061';
const SERVICE_FEE_PCT = 0.30;
const SHIPPING_PCT = 0.30;

type Cond = 'Like New' | 'Very Good' | 'Good' | 'Fair';
const ORDER: Cond[] = ['Like New', 'Very Good', 'Good', 'Fair'];
const downgrade = (c: Cond, target: Cond): Cond => ORDER.indexOf(target) > ORDER.indexOf(c) ? target : c;
const batteryToCondition = (pct: number): Cond => pct >= 90 ? 'Like New' : pct >= 83 ? 'Very Good' : pct >= 77 ? 'Good' : 'Fair';

interface TradeIn {
  imei: string; brand: string; model: string; storage: string; color: string;
  batteryPct: number; scratch: 'A' | 'B' | 'C' | '';
  brokenScreen: boolean; brokenBackGlass: boolean; brokenCamera: boolean;
  faceIdWorks: boolean; speakersWork: boolean; unlocked: 'unlocked' | 'locked' | '';
}
interface NewDev { brand: string; model: string; storage: string; condition: string; color: string; }

const STEPS = [
  { num: 1, title: 'Your Device', icon: Smartphone },
  { num: 2, title: 'Battery', icon: Battery },
  { num: 3, title: 'Scratches', icon: Sparkles },
  { num: 4, title: 'Faults', icon: Wrench },
  { num: 5, title: 'New Device', icon: ShoppingBag },
  { num: 6, title: 'Estimate', icon: FileCheck },
];

const TradeIn: React.FC = () => {
  const { devices, loading } = useDeviceData();
  const { exchangeRate } = useExchangeRate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ code: string; token: string; key: string } | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const goNext = () => { setDirection('forward'); setStep(s => Math.min(STEPS.length, s + 1)); };
  const goBack = () => { setDirection('back'); setStep(s => Math.max(1, s - 1)); };

  const [t, setT] = useState<TradeIn>({
    imei: '', brand: '', model: '', storage: '', color: '',
    batteryPct: 100, scratch: '', brokenScreen: false, brokenBackGlass: false,
    brokenCamera: false, faceIdWorks: true, speakersWork: true, unlocked: '',
  });
  const [n, setN] = useState<NewDev>({ brand: '', model: '', storage: '', condition: '', color: '' });
  const [compareList, setCompareList] = useState<NewDev[]>([]);
  const [showAddCompare, setShowAddCompare] = useState(false);
  const [c, setC] = useState<NewDev>({ brand: '', model: '', storage: '', condition: '', color: '' });
  const [budget, setBudget] = useState('');
  const [budgetCur, setBudgetCur] = useState<'USD' | 'JMD'>('USD');

  const cModels = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === c.brand).map(d => d.Model))).sort(), [devices, c.brand]);
  const cStorages = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === c.brand && d.Model === c.model).map(d => d.Storage))).sort(), [devices, c.brand, c.model]);
  const cConditions = useMemo(() => sortGrades(Array.from(new Set(devices.filter(d => d.Brand === c.brand && d.Model === c.model && d.Storage === c.storage).map(d => d.Condition)))), [devices, c.brand, c.model, c.storage]);
  const cColors = useMemo(() => devices.find(d => d.Brand === c.brand && d.Model === c.model && d.Storage === c.storage)?.Colors || [], [devices, c.brand, c.model, c.storage]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const tradeBrands = useMemo(() => Array.from(new Set(devices.map(d => d.Brand))).sort(), [devices]);
  const tradeModels = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === t.brand).map(d => d.Model))).sort(), [devices, t.brand]);
  const tradeStorages = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === t.brand && d.Model === t.model).map(d => d.Storage))).sort(), [devices, t.brand, t.model]);
  const tradeColors = useMemo(() => devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage)?.Colors || [], [devices, t.brand, t.model, t.storage]);

  const newBrands = tradeBrands;
  const newModels = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === n.brand).map(d => d.Model))).sort(), [devices, n.brand]);
  const newStorages = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === n.brand && d.Model === n.model).map(d => d.Storage))).sort(), [devices, n.brand, n.model]);
  const newConditions = useMemo(() => sortGrades(Array.from(new Set(devices.filter(d => d.Brand === n.brand && d.Model === n.model && d.Storage === n.storage).map(d => d.Condition)))), [devices, n.brand, n.model, n.storage]);
  const newColors = useMemo(() => devices.find(d => d.Brand === n.brand && d.Model === n.model && d.Storage === n.storage)?.Colors || [], [devices, n.brand, n.model, n.storage]);

  const estimate = useMemo(() => {
    let cond: Cond = batteryToCondition(t.batteryPct);
    if (t.scratch === 'B' && cond === 'Like New') cond = 'Very Good';
    if (t.scratch === 'C') cond = downgrade(cond, 'Good');
    const anyFault = t.brokenScreen || t.brokenBackGlass || t.brokenCamera || !t.faceIdWorks || !t.speakersWork;
    if (anyFault) cond = 'Fair';

    const tradeRow: DeviceData | undefined =
      devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage && d.Condition === cond) ||
      devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage);

    // Repair costs are per-model; pull max across all rows of same brand+model
    const modelRows = devices.filter(d => d.Brand === t.brand && d.Model === t.model);
    const modelMax = (key: keyof DeviceData) =>
      modelRows.reduce((m, r) => Math.max(m, Number((r as any)[key]) || 0), 0);
    const batteryCost = modelMax('BatteryReplacement');
    const screenCost = modelMax('ScreenReplacement');
    const rearGlassCost = modelMax('RearGlassReplacement');

    let repairs = 0;
    const repairBreakdown: { label: string; amount: number }[] = [];
    if (t.batteryPct <= 82 && batteryCost) {
      repairs += batteryCost;
      repairBreakdown.push({ label: 'Battery replacement', amount: batteryCost });
    }
    if (t.brokenScreen && screenCost) {
      repairs += screenCost;
      repairBreakdown.push({ label: 'Screen replacement', amount: screenCost });
    }
    if (t.brokenBackGlass && rearGlassCost) {
      repairs += rearGlassCost;
      repairBreakdown.push({ label: 'Rear glass replacement', amount: rearGlassCost });
    }

    const tradePrice = tradeRow?.Price || 0;
    const tradeValue = Math.max(0, tradePrice * (1 - SERVICE_FEE_PCT) - repairs);
    const newRow = devices.find(d => d.Brand === n.brand && d.Model === n.model && d.Storage === n.storage && d.Condition === n.condition);
    const newPrice = newRow?.Price || 0;
    const estimateUSD = Math.max(0, newPrice - tradeValue);

    return {
      condition: cond, tradePrice, tradeValue, newPrice,
      estimateUSD, estimateJMD: estimateUSD * exchangeRate,
      shippingJMD: newPrice * SHIPPING_PCT * exchangeRate,
      repairs, repairBreakdown,
      batteryCost,
      screenCost,
      backGlassCost: rearGlassCost,
      usaTotalUSD: estimateUSD,
      jamaicaTotalJMD: (estimateUSD * exchangeRate) + (newPrice * SHIPPING_PCT * exchangeRate),
    };
  }, [t, n, devices, exchangeRate]);

  // Compute estimate for any given new device against the same trade-in value
  const compareEstimates = useMemo(() => {
    return compareList.map(cd => {
      const row = devices.find(d => d.Brand === cd.brand && d.Model === cd.model && d.Storage === cd.storage && d.Condition === cd.condition);
      const newPrice = row?.Price || 0;
      const usa = Math.max(0, newPrice - estimate.tradeValue);
      const jmd = usa * exchangeRate + newPrice * SHIPPING_PCT * exchangeRate;
      return { device: cd, newPrice, usaTotalUSD: usa, jamaicaTotalJMD: jmd };
    });
  }, [compareList, devices, exchangeRate, estimate.tradeValue]);

  // Budget finder: budget + trade-in value = total spending power
  const budgetMatches = useMemo(() => {
    const num = parseFloat(budget) || 0;
    if (num <= 0) return [];
    const budgetUSD = budgetCur === 'USD' ? num : num / exchangeRate;
    const total = budgetUSD + estimate.tradeValue;
    return devices
      .filter(d => d.Price > 0 && d.Price <= total)
      .sort((a, b) => b.Price - a.Price)
      .slice(0, 8)
      .map(d => {
        const usa = Math.max(0, d.Price - estimate.tradeValue);
        const jmd = usa * exchangeRate + d.Price * SHIPPING_PCT * exchangeRate;
        return { d, usaTotalUSD: usa, jamaicaTotalJMD: jmd };
      });
  }, [budget, budgetCur, devices, exchangeRate, estimate.tradeValue]);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!(t.brand && t.model && t.storage && t.color);
      case 2: return t.batteryPct >= 0 && t.batteryPct <= 100;
      case 3: return !!t.scratch;
      case 4: return !!t.unlocked;
      case 5: return !!(n.brand && n.model && n.storage && n.condition && n.color);
      default: return true;
    }
  };

  const faultList = () => [
    t.brokenScreen && 'Broken screen', t.brokenBackGlass && 'Broken back glass', t.brokenCamera && 'Broken camera',
    !t.faceIdWorks && 'Face ID not working', !t.speakersWork && 'Speakers not working',
  ].filter(Boolean) as string[];

  const quoteKey = JSON.stringify([t, n, name.trim(), phone.trim(), email.trim(), estimate.tradeValue]);

  const saveRequest = async (): Promise<{ code: string; token: string } | null> => {
    if (saved && saved.key === quoteKey) return saved;
    const { data, error } = await supabase.rpc('create_trade_in_request', { payload: {
      customer_name: name.trim().slice(0, 100), customer_phone: phone.trim().slice(0, 30), customer_email: email.trim() || null,
      trade_device: { brand: t.brand, model: t.model, storage: t.storage, color: t.color, imei: t.imei, unlocked: t.unlocked, scratch: t.scratch },
      condition: estimate.condition, battery_pct: t.batteryPct, faults: faultList(),
      desired_device: n, estimated_value_usd: estimate.tradeValue,
      estimate: { tradeValue: estimate.tradeValue, newPrice: estimate.newPrice, usaTotalUSD: estimate.usaTotalUSD,
        jamaicaTotalJMD: estimate.jamaicaTotalJMD, repairs: estimate.repairBreakdown.map(r => r.label), exchangeRate },
    } as any });
    if (error || !data) { toast({ title: 'Could not save request', description: error?.message, variant: 'destructive' }); return null; }
    const d = data as any;
    const res = { code: d.request_code, token: d.public_token, key: quoteKey };
    setSaved(res);
    return res;
  };

  const createRequest = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Almost there', description: 'Please enter your name and phone.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const r = await saveRequest();
    setSaving(false);
    if (r) setShowSaved(true);
  };

  const sendWhatsApp = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Almost there', description: 'Please enter your name and phone.', variant: 'destructive' });
      return;
    }
    const link = saved ? `\n\nRequest ID: ${saved.code}\nView: ${requestUrl(saved.token)}` : '';
    const repairsList = estimate.repairBreakdown.length
      ? estimate.repairBreakdown.map(r => `  • ${r.label}`).join('\n') : '  • None';
    const msg = `Hello Phone Matrix! I'd like to submit a trade-in request.

— TRADE-IN DEVICE —
${t.brand} ${t.model}
Storage: ${t.storage}
Color: ${t.color}
IMEI: ${t.imei || 'Not provided'}
Assessed Condition: ${estimate.condition}
Battery Health: ${t.batteryPct}%
Unlock Status: ${t.unlocked}

— REPAIRS APPLIED —
${repairsList}

— NEW DEVICE —
${n.brand} ${n.model}
Storage: ${n.storage}
Condition: ${n.condition}
Color: ${n.color}

— ESTIMATE —
Price for USA customers: ${formatCurrency(estimate.usaTotalUSD, 'USD')}
Price for Jamaica customers (incl. shipping): ${formatCurrency(estimate.jamaicaTotalJMD, 'JMD')}

— CUSTOMER —
Name: ${name}
Phone: ${phone}${link}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    toast({ title: 'Opening WhatsApp', description: 'Your trade-in request is ready to send.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header /><div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-bold">Trade-In Builder</h1>
            <span className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</span>
          </div>
          <Progress value={(step / STEPS.length) * 100} className="h-2" />
          <div className="hidden md:flex justify-between mt-3">
            {STEPS.map(s => {
              const Icon = s.icon; const active = s.num === step; const done = s.num < step;
              return (
                <div key={s.num} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                    done ? 'bg-primary border-primary text-primary-foreground' :
                    active ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-6 md:p-8 overflow-hidden">
          <div key={step} className={direction === 'forward' ? 'step-slide-forward' : 'step-slide-back'}>
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Current Device</h2>
                <p className="text-sm text-muted-foreground">Let's start with the basics. We'll use your IMEI to identify the device.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI Number</Label>
                <Input id="imei" value={t.imei} onChange={e => setT({ ...t, imei: e.target.value })} placeholder="15-digit IMEI (optional)" maxLength={20} />
                <p className="text-xs text-muted-foreground">Dial *#06# on your phone to find this number.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Brand</Label>
                  <Select value={t.brand} onValueChange={v => setT({ ...t, brand: v, model: '', storage: '', color: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>{tradeBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Model</Label>
                  <Select value={t.model} onValueChange={v => setT({ ...t, model: v, storage: '', color: '' })} disabled={!t.brand}>
                    <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>{tradeModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Storage</Label>
                  <Select value={t.storage} onValueChange={v => setT({ ...t, storage: v, color: '' })} disabled={!t.model}>
                    <SelectTrigger><SelectValue placeholder="Select storage" /></SelectTrigger>
                    <SelectContent>{tradeStorages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Color</Label>
                  <Select value={t.color} onValueChange={v => setT({ ...t, color: v })} disabled={!t.storage || tradeColors.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>{tradeColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Battery Health</h2>
                <p className="text-sm text-muted-foreground">Settings → Battery → Battery Health on iPhone. On Android, check Settings → Battery.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bat">Battery Health (%)</Label>
                <div className="flex items-center gap-3">
                  <Input id="bat" type="number" min={0} max={100} value={t.batteryPct}
                    onChange={e => setT({ ...t, batteryPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                    className="w-32 text-2xl font-bold h-14" />
                  <span className="text-2xl font-bold">%</span>
                </div>
                <Progress value={t.batteryPct} className="h-3 mt-2" />
              </div>
              {t.batteryPct <= 82 && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm">
                  Battery health is below 82%. Battery replacement cost will be deducted from your trade-in value.
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Physical Condition</h2>
                <p className="text-sm text-muted-foreground">How would you describe the outside of your device?</p>
              </div>
              <div className="grid gap-3">
                {[
                  { v: 'A', label: 'Pristine', desc: 'No blemishes or scratches anywhere.' },
                  { v: 'B', label: 'Light wear', desc: 'Shows signs of use — minor marks but nothing serious.' },
                  { v: 'C', label: 'Noticeable scratches', desc: 'Visible scratches on screen or body.' },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setT({ ...t, scratch: opt.v as any })}
                    className={`text-left rounded-lg border-2 p-4 transition-all ${t.scratch === opt.v ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Detailed Issues</h2>
                <p className="text-sm text-muted-foreground">Be honest — accurate answers mean an accurate quote.</p>
              </div>
              {[
                { key: 'brokenScreen', label: 'Broken screen?', val: t.brokenScreen },
                { key: 'brokenBackGlass', label: 'Broken back glass?', val: t.brokenBackGlass },
                { key: 'brokenCamera', label: 'Broken camera lens?', val: t.brokenCamera },
                { key: 'faceIdWorks', label: 'Face ID / biometrics work?', val: t.faceIdWorks },
                { key: 'speakersWork', label: 'Both speakers work?', val: t.speakersWork },
              ].map(q => (
                <div key={q.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">{q.label}</span>
                  <div className="flex gap-2">
                    {[true, false].map(v => (
                      <Button key={String(v)} size="sm" variant={q.val === v ? 'default' : 'outline'}
                        onClick={() => setT({ ...t, [q.key]: v } as any)}>{v ? 'Yes' : 'No'}</Button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label>Unlock status</Label>
                <Select value={t.unlocked} onValueChange={(v: any) => setT({ ...t, unlocked: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlocked">Unlocked</SelectItem>
                    <SelectItem value="locked">Locked to carrier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Pick Your New Device</h2>
                <p className="text-sm text-muted-foreground">What would you like to upgrade to?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Brand</Label>
                  <Select value={n.brand} onValueChange={v => setN({ ...n, brand: v, model: '', storage: '', condition: '', color: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>{newBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Model</Label>
                  <Select value={n.model} onValueChange={v => setN({ ...n, model: v, storage: '', condition: '', color: '' })} disabled={!n.brand}>
                    <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>{newModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Storage</Label>
                  <Select value={n.storage} onValueChange={v => setN({ ...n, storage: v, condition: '', color: '' })} disabled={!n.model}>
                    <SelectTrigger><SelectValue placeholder="Select storage" /></SelectTrigger>
                    <SelectContent>{newStorages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Condition</Label>
                  <Select value={n.condition} onValueChange={v => setN({ ...n, condition: v })} disabled={!n.storage}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>{newConditions.map(c => <SelectItem key={c} value={c}><span className="font-medium">{c}</span>{gradeInfo(c) && <span className="block text-xs text-muted-foreground">{gradeInfo(c)!.short}</span>}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-2 md:col-span-2"><Label>Color</Label>
                  <Select value={n.color} onValueChange={v => setN({ ...n, color: v })} disabled={!n.storage || newColors.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>{newColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Estimate</h2>
                <p className="text-sm text-muted-foreground">Live exchange rate: 1 USD = {exchangeRate.toFixed(2)} JMD</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-muted/30 relative">
                  <Button size="sm" variant="ghost" onClick={() => { setDirection('back'); setStep(1); }}
                    className="absolute top-2 right-2 h-7 px-2 text-xs">
                    <Pencil className="h-3 w-3 mr-1" />Change
                  </Button>
                  <div className="w-24 mb-3 rounded-md overflow-hidden bg-background">
                    <DeviceImage brand={t.brand} model={t.model} aspectClass="aspect-[3/4]" />
                  </div>
                  <p className="text-xs uppercase text-muted-foreground mb-2">Your Trade-In</p>
                  <p className="font-semibold">{t.brand} {t.model}</p>
                  <p className="text-sm text-muted-foreground">{t.storage} • {t.color}</p>
                  <Badge variant="outline" className="mt-2">Assessed: {estimate.condition}</Badge>
                  {gradeInfo(estimate.condition) && <p className="text-xs text-muted-foreground mt-1">{gradeInfo(estimate.condition)!.short}</p>}
                </Card>
                <Card className="p-4 bg-primary/5 border-primary/30 relative">
                  <Button size="sm" variant="ghost" onClick={() => { setDirection('back'); setStep(5); }}
                    className="absolute top-2 right-2 h-7 px-2 text-xs">
                    <Pencil className="h-3 w-3 mr-1" />Change
                  </Button>
                  <div className="w-24 mb-3 rounded-md overflow-hidden bg-background">
                    <DeviceImage brand={n.brand} model={n.model} aspectClass="aspect-[3/4]" />
                  </div>
                  <p className="text-xs uppercase text-muted-foreground mb-2">New Device</p>
                  <p className="font-semibold">{n.brand} {n.model}</p>
                  <p className="text-sm text-muted-foreground">{n.storage} • {n.condition} • {n.color}</p>
                </Card>
              </div>
              <Card className="p-4 bg-muted/30">
                <p className="text-sm font-semibold mb-3">Repair Costs</p>
                <ul className="text-sm space-y-2">
                  {[
                    { label: 'Battery replacement', cost: estimate.batteryCost, applied: t.batteryPct <= 82 },
                    { label: 'Front screen replacement', cost: estimate.screenCost, applied: t.brokenScreen },
                    { label: 'Back glass replacement', cost: estimate.backGlassCost, applied: t.brokenBackGlass },
                  ].map(r => (
                    <li key={r.label} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        {r.label}
                        {r.applied && <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">Applied</Badge>}
                      </span>
                      <span className={r.applied ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                        {r.cost > 0 ? formatCurrency(r.cost, 'USD') : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
                {estimate.repairs > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40 flex justify-between text-sm font-semibold">
                    <span>Total repairs deducted</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatCurrency(estimate.repairs, 'USD')}</span>
                  </div>
                )}
              </Card>
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 border border-primary/30 p-6 space-y-3">
                <div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Price for customers in USA</span>
                    <span className="text-3xl md:text-4xl font-bold">{formatCurrency(estimate.usaTotalUSD, 'USD')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">No shipping required</p>
                </div>
                <div className="pt-3 border-t border-border/40">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Price for customers in Jamaica</span>
                    <span className="text-3xl md:text-4xl font-bold">{formatCurrency(estimate.jamaicaTotalJMD, 'JMD')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Includes shipping to Jamaica</p>
                </div>
              </div>

              {/* Compare additional devices against the same trade-in */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">Compare other devices (up to 4 total)</p>
                    <p className="text-xs text-muted-foreground">Selected: {n.brand} {n.model} {n.storage}. Tap "Choose" on another to swap it in before sending.</p>
                  </div>
                  {!showAddCompare && compareList.length < 3 && (
                    <Button size="sm" variant="outline" onClick={() => setShowAddCompare(true)}>
                      <Plus className="h-4 w-4 mr-1" />Add device
                    </Button>
                  )}
                </div>

                {compareEstimates.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {compareEstimates.map((ce, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="w-12 shrink-0 rounded-md overflow-hidden bg-background">
                          <DeviceImage brand={ce.device.brand} model={ce.device.model} aspectClass="aspect-[3/4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ce.device.brand} {ce.device.model}</p>
                          <p className="text-xs text-muted-foreground truncate">{ce.device.storage} • {ce.device.condition} • {ce.device.color}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{formatCurrency(ce.usaTotalUSD, 'USD')}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(ce.jamaicaTotalJMD, 'JMD')} JM</p>
                        </div>
                        <Button size="sm" onClick={() => {
                          const prev = n;
                          setN(ce.device);
                          setCompareList(list => list.map((x, idx) => idx === i ? prev : x));
                          toast({ title: 'Device selected', description: `${ce.device.brand} ${ce.device.model} will be in your request.` });
                        }}>Choose</Button>
                        <Button size="sm" variant="ghost" onClick={() => setCompareList(list => list.filter((_, idx) => idx !== i))}
                          className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddCompare && (
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Select value={c.brand} onValueChange={v => setC({ brand: v, model: '', storage: '', condition: '', color: '' })}>
                        <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
                        <SelectContent>{tradeBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.model} onValueChange={v => setC({ ...c, model: v, storage: '', condition: '', color: '' })} disabled={!c.brand}>
                        <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent>{cModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.storage} onValueChange={v => setC({ ...c, storage: v, condition: '', color: '' })} disabled={!c.model}>
                        <SelectTrigger><SelectValue placeholder="Storage" /></SelectTrigger>
                        <SelectContent>{cStorages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.condition} onValueChange={v => setC({ ...c, condition: v })} disabled={!c.storage}>
                        <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                        <SelectContent>{cConditions.map(cn => <SelectItem key={cn} value={cn}>{cn}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={c.color} onValueChange={v => setC({ ...c, color: v })} disabled={!c.storage || cColors.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                        <SelectContent>{cColors.map(cl => <SelectItem key={cl} value={cl}>{cl}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setShowAddCompare(false); setC({ brand: '', model: '', storage: '', condition: '', color: '' }); }}>
                        Cancel
                      </Button>
                      <Button size="sm"
                        disabled={!(c.brand && c.model && c.storage && c.condition && c.color)}
                        onClick={() => {
                          setCompareList(list => [...list, c]);
                          setC({ brand: '', model: '', storage: '', condition: '', color: '' });
                          setShowAddCompare(false);
                        }}>
                        Add to comparison
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Budget finder: budget + trade-in value = what they can get */}
              <Card className="p-4">
                <p className="text-sm font-semibold">Have a budget? See what you can get</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Your trade-in is worth {formatCurrency(estimate.tradeValue, 'USD')} — we'll add it to your budget.
                </p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label htmlFor="budget">Your budget</Label>
                    <Input id="budget" type="number" min="0" inputMode="decimal" value={budget}
                      onChange={e => setBudget(e.target.value)}
                      placeholder={budgetCur === 'USD' ? 'e.g. 400' : 'e.g. 60000'} />
                  </div>
                  <div className="flex rounded-full border border-border p-1">
                    {(['USD', 'JMD'] as const).map(cur => (
                      <Button key={cur} size="sm" variant={budgetCur === cur ? 'default' : 'ghost'}
                        className="rounded-full" onClick={() => setBudgetCur(cur)}>{cur}</Button>
                    ))}
                  </div>
                </div>
                {(parseFloat(budget) || 0) > 0 && (
                  budgetMatches.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No devices fit that budget yet — try a higher amount.</p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {budgetMatches.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <div className="w-12 shrink-0 rounded-md overflow-hidden bg-background">
                            <DeviceImage brand={m.d.Brand} model={m.d.Model} aspectClass="aspect-[3/4]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{m.d.Brand} {m.d.Model}</p>
                            <p className="text-xs text-muted-foreground truncate">{m.d.Storage} • {m.d.Condition}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{formatCurrency(m.usaTotalUSD, 'USD')}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(m.jamaicaTotalJMD, 'JMD')} JM</p>
                          </div>
                          <Button size="sm" onClick={() => {
                            const colors = devices.find(x => x.Brand === m.d.Brand && x.Model === m.d.Model && x.Storage === m.d.Storage)?.Colors || [];
                            setN({ brand: m.d.Brand, model: m.d.Model, storage: m.d.Storage, condition: m.d.Condition, color: colors[0] || '' });
                            toast({ title: 'Device selected', description: `${m.d.Brand} ${m.d.Model} will be in your request.` });
                          }}>Choose</Button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </Card>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label htmlFor="name">Your Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (876) 555-0000" /></div>
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
                </div>
                <Button onClick={createRequest} disabled={saving} className="w-full h-12 text-base">
                  <FileCheck className="h-5 w-5 mr-2" />{saving ? 'Saving…' : 'Get My Trade-In Request & QR Code'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={goBack} disabled={step === 1} className="btn-pop">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < STEPS.length ? (
              <Button onClick={goNext} disabled={!canNext()} className="btn-pop">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setDirection('back'); setStep(1); }} className="btn-pop">Start over</Button>
            )}
          </div>
          </div>
        </Card>
      </div>

      <Dialog open={showSaved} onOpenChange={setShowSaved}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Trade-In Request Created</DialogTitle></DialogHeader>
          {saved && (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm space-y-1">
                <p className="text-xs text-muted-foreground">Request ID</p>
                <p className="text-2xl font-bold tabular-nums">{saved.code}</p>
                <p>{t.brand} {t.model} • {t.storage} • {t.color}</p>
                <p>Network: {t.unlocked === 'unlocked' ? 'Unlocked' : 'Carrier locked'} • Battery {t.batteryPct}%</p>
                <p>Grade: <b>{estimate.condition}</b> — <span className="text-muted-foreground">{gradeInfo(estimate.condition)?.short}</span></p>
                <p>Faults: {faultList().join(', ') || 'None'}</p>
                <p className="pt-1">Estimated trade value: <b className="text-lg">{formatCurrency(estimate.tradeValue, 'USD')}</b></p>
                <p className="text-xs text-muted-foreground">Created {new Date().toLocaleDateString()} • Valid for 14 days</p>
              </div>
              <TradeInQrCard url={requestUrl(saved.token)} code={saved.code} onWhatsApp={sendWhatsApp} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradeIn;
