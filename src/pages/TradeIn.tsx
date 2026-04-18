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

const WHATSAPP_NUMBER = '18765472061';
const SERVICE_FEE_PCT = 0.30;
const SHIPPING_PCT = 0.30;

type Cond = 'Like New' | 'Good' | 'Fair' | 'Poor';
const ORDER: Cond[] = ['Like New', 'Good', 'Fair', 'Poor'];
const downgrade = (c: Cond, target: Cond): Cond => ORDER.indexOf(target) > ORDER.indexOf(c) ? target : c;
const batteryToCondition = (pct: number): Cond => pct >= 90 ? 'Like New' : pct >= 83 ? 'Good' : pct >= 77 ? 'Fair' : 'Poor';

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

  const goNext = () => { setDirection('forward'); setStep(s => Math.min(STEPS.length, s + 1)); };
  const goBack = () => { setDirection('back'); setStep(s => Math.max(1, s - 1)); };

  const [t, setT] = useState<TradeIn>({
    imei: '', brand: '', model: '', storage: '', color: '',
    batteryPct: 100, scratch: '', brokenScreen: false, brokenBackGlass: false,
    brokenCamera: false, faceIdWorks: true, speakersWork: true, unlocked: '',
  });
  const [n, setN] = useState<NewDev>({ brand: '', model: '', storage: '', condition: '', color: '' });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const tradeBrands = useMemo(() => Array.from(new Set(devices.map(d => d.Brand))).sort(), [devices]);
  const tradeModels = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === t.brand).map(d => d.Model))).sort(), [devices, t.brand]);
  const tradeStorages = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === t.brand && d.Model === t.model).map(d => d.Storage))).sort(), [devices, t.brand, t.model]);
  const tradeColors = useMemo(() => devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage)?.Colors || [], [devices, t.brand, t.model, t.storage]);

  const newBrands = tradeBrands;
  const newModels = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === n.brand).map(d => d.Model))).sort(), [devices, n.brand]);
  const newStorages = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === n.brand && d.Model === n.model).map(d => d.Storage))).sort(), [devices, n.brand, n.model]);
  const newConditions = useMemo(() => Array.from(new Set(devices.filter(d => d.Brand === n.brand && d.Model === n.model && d.Storage === n.storage).map(d => d.Condition))), [devices, n.brand, n.model, n.storage]);
  const newColors = useMemo(() => devices.find(d => d.Brand === n.brand && d.Model === n.model && d.Storage === n.storage)?.Colors || [], [devices, n.brand, n.model, n.storage]);

  const estimate = useMemo(() => {
    let cond: Cond = batteryToCondition(t.batteryPct);
    if (t.scratch === 'B' && cond === 'Like New') cond = 'Good';
    if (t.scratch === 'C') cond = downgrade(cond, 'Fair');
    const anyFault = t.brokenScreen || t.brokenBackGlass || t.brokenCamera || !t.faceIdWorks || !t.speakersWork;
    if (anyFault) cond = 'Poor';

    const tradeRow: DeviceData | undefined =
      devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage && d.Condition === cond) ||
      devices.find(d => d.Brand === t.brand && d.Model === t.model && d.Storage === t.storage);

    let repairs = 0;
    const repairBreakdown: { label: string; amount: number }[] = [];
    if (t.batteryPct <= 82 && tradeRow?.BatteryReplacement) {
      repairs += tradeRow.BatteryReplacement;
      repairBreakdown.push({ label: 'Battery replacement', amount: tradeRow.BatteryReplacement });
    }
    if (t.brokenScreen && tradeRow?.ScreenReplacement) {
      repairs += tradeRow.ScreenReplacement;
      repairBreakdown.push({ label: 'Screen replacement', amount: tradeRow.ScreenReplacement });
    }
    if (t.brokenBackGlass && tradeRow?.RearGlassReplacement) {
      repairs += tradeRow.RearGlassReplacement;
      repairBreakdown.push({ label: 'Rear glass replacement', amount: tradeRow.RearGlassReplacement });
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
    };
  }, [t, n, devices, exchangeRate]);

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

  const sendWhatsApp = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Almost there', description: 'Please enter your name and phone.', variant: 'destructive' });
      return;
    }
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
Estimated Cost: ${formatCurrency(estimate.estimateUSD, 'USD')}
Estimated Cost (JMD): ${formatCurrency(estimate.estimateJMD, 'JMD')}
Shipping to Jamaica (JMD): ${formatCurrency(estimate.shippingJMD, 'JMD')}

— CUSTOMER —
Name: ${name}
Phone: ${phone}`;
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
                    <SelectContent>{newConditions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs uppercase text-muted-foreground mb-2">Your Trade-In</p>
                  <p className="font-semibold">{t.brand} {t.model}</p>
                  <p className="text-sm text-muted-foreground">{t.storage} • {t.color}</p>
                  <Badge variant="outline" className="mt-2">Assessed: {estimate.condition}</Badge>
                </Card>
                <Card className="p-4 bg-primary/5 border-primary/30">
                  <p className="text-xs uppercase text-muted-foreground mb-2">New Device</p>
                  <p className="font-semibold">{n.brand} {n.model}</p>
                  <p className="text-sm text-muted-foreground">{n.storage} • {n.condition} • {n.color}</p>
                </Card>
              </div>
              {estimate.repairBreakdown.length > 0 && (
                <Card className="p-4 bg-amber-500/5 border-amber-500/30">
                  <p className="text-sm font-semibold mb-2">Repairs applied</p>
                  <ul className="text-sm space-y-1">
                    {estimate.repairBreakdown.map(r => <li key={r.label} className="text-muted-foreground">• {r.label}</li>)}
                  </ul>
                </Card>
              )}
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 border border-primary/30 p-6 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">You pay (USD)</span>
                  <span className="text-3xl md:text-4xl font-bold">{formatCurrency(estimate.estimateUSD, 'USD')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-sm text-muted-foreground">You pay (JMD)</span>
                  <span className="text-xl font-semibold">{formatCurrency(estimate.estimateJMD, 'JMD')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Shipping to Jamaica (JMD)</span>
                  <span className="text-base font-medium">{formatCurrency(estimate.shippingJMD, 'JMD')}</span>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label htmlFor="name">Your Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (876) 555-0000" /></div>
                </div>
                <Button onClick={sendWhatsApp} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 text-base">
                  <MessageCircle className="h-5 w-5 mr-2" />Send Trade-In Request via WhatsApp
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
    </div>
  );
};

export default TradeIn;
