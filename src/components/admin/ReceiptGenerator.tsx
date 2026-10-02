import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { useSiteMedia } from '@/services/mediaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order { id: string; device_info: any; customer_info: any; total_price: number; currency: string; tracking_number: string | null; }
interface Device { id: string; brand: string; model: string; storage: string; condition: string; price: number; }
interface Line { description: string; qty: number; price: number; }

const BIZ_KEY = 'pm_receipt_business';
const DEFAULT_BIZ = { name: 'PhoneMatrix', address: 'Kingston, Jamaica', contact: '' };

const loadImage = async (url: string): Promise<{ data: string; w: number; h: number } | null> => {
  try {
    const blob = await (await fetch(url)).blob();
    const data: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob); });
    const dims: { w: number; h: number } = await new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.width, h: i.height }); i.onerror = () => res({ w: 1, h: 1 }); i.src = data; });
    return { data, ...dims };
  } catch { return null; }
};

const ReceiptGenerator = ({ orders }: { orders: Order[] }) => {
  const { toast } = useToast();
  const { media } = useSiteMedia();
  const themeLogo = useSiteLogo();
  const logoUrl = media['logo-light']?.file_url || themeLogo;

  const [biz, setBiz] = useState(() => { try { return { ...DEFAULT_BIZ, ...JSON.parse(localStorage.getItem(BIZ_KEY) || '{}') }; } catch { return DEFAULT_BIZ; } });
  useEffect(() => { localStorage.setItem(BIZ_KEY, JSON.stringify(biz)); }, [biz]);

  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [receiptNo, setReceiptNo] = useState(() => `R-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [tracking, setTracking] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.from('devices').select('id,brand,model,storage,condition,price').eq('active', true).order('brand').then(({ data }) => setDevices((data as Device[]) || []));
  }, []);

  const matches = useMemo(() => {
    const q = deviceSearch.trim().toLowerCase();
    if (!q) return [];
    return devices.filter(d => `${d.brand} ${d.model} ${d.storage} ${d.condition}`.toLowerCase().includes(q)).slice(0, 8);
  }, [deviceSearch, devices]);

  const fillFromOrder = (id: string) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const c = o.customer_info || {}; const d = o.device_info || {};
    setName(c.name || ''); setAddress(c.address || ''); setTracking(o.tracking_number || '');
    setCurrency(o.currency || 'USD');
    setLines([{ description: [d.brand, d.model, d.storage, d.condition].filter(Boolean).join(' '), qty: 1, price: Number(o.total_price) || 0 }]);
  };

  const addDevice = (d: Device) => {
    setLines(l => [...l, { description: `${d.model.toLowerCase().startsWith(d.brand.toLowerCase()) ? d.model : `${d.brand} ${d.model}`} ${d.storage} (${d.condition})`, qty: 1, price: Number(d.price) }]);
    setDeviceSearch('');
  };
  const updateLine = (i: number, patch: Partial<Line>) => setLines(l => l.map((x, j) => j === i ? { ...x, ...patch } : x));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const fmt = (v: number) => `${currency === 'JMD' ? 'J$' : '$'}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportPdf = async () => {
    if (!lines.length) { toast({ title: 'Add at least one device or line first', variant: 'destructive' }); return; }
    try { await buildPdf(); } catch (e: any) { console.error(e); toast({ title: 'Export failed', description: e?.message || 'Unknown error', variant: 'destructive' }); }
  };

  const buildPdf = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth(); const M = 48; let y = M;
    const logo = logoUrl ? await Promise.race([loadImage(logoUrl), new Promise<null>(r => setTimeout(() => r(null), 4000))]) : null;
    if (logo) { const h = 50; const w = Math.min(160, (logo.w / logo.h) * h); try { doc.addImage(logo.data, M, y, w, h); } catch {} }
    doc.setFont('helvetica', 'bold').setFontSize(22).text('RECEIPT', W - M, y + 20, { align: 'right' });
    doc.setFont('helvetica', 'normal').setFontSize(10).text(`No. ${receiptNo}`, W - M, y + 36, { align: 'right' }).text(`Date: ${date}`, W - M, y + 50, { align: 'right' });
    y += 75;
    doc.setFont('helvetica', 'bold').setFontSize(11).text(biz.name, M, y);
    doc.setFont('helvetica', 'normal').setFontSize(10);
    const bizLines = doc.splitTextToSize([biz.address, biz.contact].filter(Boolean).join('\n'), 220);
    doc.text(bizLines, M, y + 14);
    doc.setFont('helvetica', 'bold').text('BILL TO', W / 2 + 20, y);
    doc.setFont('helvetica', 'normal');
    const toLines = doc.splitTextToSize([name, address].filter(Boolean).join('\n'), 220);
    doc.text(toLines, W / 2 + 20, y + 14);
    y += 14 + Math.max(bizLines.length, toLines.length) * 12 + 10;
    if (tracking) { doc.setFont('helvetica', 'bold').text('Tracking #: ', M, y); doc.setFont('helvetica', 'normal').text(tracking, M + 62, y); y += 18; }
    y += 6;
    doc.setFillColor(240, 240, 240).rect(M, y, W - 2 * M, 22, 'F');
    doc.setFont('helvetica', 'bold').text('Item', M + 8, y + 15).text('Qty', W - M - 190, y + 15, { align: 'right' }).text('Price', W - M - 100, y + 15, { align: 'right' }).text('Amount', W - M - 8, y + 15, { align: 'right' });
    y += 22; doc.setFont('helvetica', 'normal');
    lines.forEach(l => {
      const desc = doc.splitTextToSize(l.description || '-', W - 2 * M - 230);
      const h = desc.length * 12 + 10;
      if (y + h > 720) { doc.addPage(); y = M; }
      doc.text(desc, M + 8, y + 15).text(String(l.qty), W - M - 190, y + 15, { align: 'right' }).text(fmt(l.price), W - M - 100, y + 15, { align: 'right' }).text(fmt(l.qty * l.price), W - M - 8, y + 15, { align: 'right' });
      y += h; doc.setDrawColor(225).line(M, y, W - M, y);
    });
    y += 22;
    doc.setFont('helvetica', 'bold').setFontSize(13).text('Total', W - M - 140, y).text(fmt(total), W - M - 8, y, { align: 'right' });
    y += 30;
    if (notes) {
      doc.setFontSize(10).text('Notes', M, y);
      doc.setFont('helvetica', 'normal').text(doc.splitTextToSize(notes, W - 2 * M), M, y + 14);
    }
    doc.setFontSize(9).setTextColor(130).text('Thank you for your business!', W / 2, 760, { align: 'center' });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `receipt-${receiptNo}.pdf`; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    // Fallback for mobile / embedded previews that block downloads
    setTimeout(() => { if (/iPhone|iPad|Android/i.test(navigator.userAgent) || window.self !== window.top) window.open(url, '_blank'); }, 300);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast({ title: 'Receipt exported' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Business name</Label><Input value={biz.name} onChange={e => setBiz({ ...biz, name: e.target.value })} /></div>
          <div><Label>Address</Label><Textarea rows={3} value={biz.address} onChange={e => setBiz({ ...biz, address: e.target.value })} /></div>
          <div><Label>Phone / email</Label><Input value={biz.contact} onChange={e => setBiz({ ...biz, contact: e.target.value })} /></div>
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 object-contain" />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Receiver</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Fill from order (optional)</Label>
            <Select onValueChange={fillFromOrder}>
              <SelectTrigger><SelectValue placeholder="Choose an order" /></SelectTrigger>
              <SelectContent>{orders.map(o => <SelectItem key={o.id} value={o.id}>{o.customer_info?.name || 'Unknown'} — {o.device_info?.brand} {o.device_info?.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Address</Label><Textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Tracking #</Label><Input value={tracking} onChange={e => setTracking(e.target.value)} /></div>
            <div><Label>Receipt #</Label><Input value={receiptNo} onChange={e => setReceiptNo(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Devices & pricing</CardTitle>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="JMD">JMD</SelectItem></SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input placeholder="Search devices to add (e.g. iPhone 13 128GB)" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} />
            {matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {matches.map(d => <button key={d.id} type="button" onClick={() => addDevice(d)} className="flex w-full justify-between px-3 py-2 text-sm hover:bg-accent text-left"><span>{d.brand} {d.model} {d.storage} · {d.condition}</span><span className="text-muted-foreground">${Number(d.price).toFixed(2)}</span></button>)}
              </div>
            )}
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-6" value={l.description} onChange={e => updateLine(i, { description: e.target.value })} />
              <Input className="col-span-2" type="number" min={1} value={l.qty} onChange={e => updateLine(i, { qty: Number(e.target.value) || 0 })} />
              <Input className="col-span-3" type="number" step="0.01" value={l.price} onChange={e => updateLine(i, { price: Number(e.target.value) || 0 })} />
              <Button variant="ghost" size="icon" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines(l => [...l, { description: '', qty: 1, price: 0 }])}><Plus className="h-4 w-4 mr-1" />Add custom line</Button>
          <div className="text-right text-lg font-semibold">Total: {fmt(total)}</div>
          <div><Label>Notes</Label><Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Warranty, payment method, etc." /></div>
          <Button onClick={exportPdf}><FileDown className="h-4 w-4 mr-2" />Export PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptGenerator;
