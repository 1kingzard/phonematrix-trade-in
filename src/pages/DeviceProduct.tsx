import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import DeviceImage from '@/components/DeviceImage';
import CatalogCurrency, { useCatalogCurrency } from '@/components/CatalogCurrency';
import GradeGallery from '@/components/GradeGallery';
import DeviceInspection from '@/components/DeviceInspection';
import PurchaseRequestModal from '@/components/PurchaseRequestModal';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useDeviceData } from '@/services/deviceDataService';
import { calcBreakdown, formatJMD, formatUSD, useExchangeRate } from '@/hooks/useExchangeRate';
import { gradeOrder, deviceCategory, platformOf } from '@/lib/catalog';

export default function DeviceProduct() {
  const { brand = '', model = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { devices, loading } = useDeviceData();
  const { rate } = useExchangeRate();
  const [currency] = useCatalogCurrency();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [request, setRequest] = useState(false);
  const variants = useMemo(() => devices.filter(d => d.Brand === brand && d.Model === model), [devices, brand, model]);
  const storages = [...new Set(variants.map(d => d.Storage))];
  const storage = storages.includes(params.get('storage') || '') ? params.get('storage') || '' : storages[0] || '';
  const grades = gradeOrder.filter(g => variants.some(d => d.Storage === storage && d.Condition === g));
  const grade = grades.includes(params.get('grade') || '') ? params.get('grade') || '' : grades[0] || '';
  const device = variants.find(d => d.Storage === storage && d.Condition === grade);
  const [color, setColor] = useState('');
  const selectedColor = device?.Colors.includes(color) ? color : device?.Colors[0] || 'Default';
  const changeVariant = (key: string, value: string) => { const next = new URLSearchParams(params); next.set(key, value); if (key === 'storage') next.delete('grade'); setParams(next); };
  const breakdown = calcBreakdown(device?.Price || 0, rate);
  const displayPrice = currency === 'JMD' ? formatJMD(breakdown.totalJmd) : formatUSD(device?.Price || 0);
  const add = () => { if (!device) return; addToCart({ ...device, Color: selectedColor }); toast({ title: 'Added to cart', description: `${device.Brand} ${device.Model} · ${storage} · ${grade}` }); };
  return <div className="min-h-screen bg-background"><Header /><main className="container max-w-7xl mx-auto px-4 pt-24 pb-16">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-8"><Link to="/">Home</Link><ChevronRight className="h-4 w-4" /><Link to="/price-list">Browse Devices</Link>{device && <><ChevronRight className="h-4 w-4" /><Link to={`/price-list?platform=${platformOf(device)}&category=${encodeURIComponent(deviceCategory(device))}`}>{deviceCategory(device)}</Link><ChevronRight className="h-4 w-4" /><span className="text-foreground">{model}</span></>}</nav>
    {loading ? <p className="py-20 text-muted-foreground">Loading device…</p> : !device ? <div className="py-20"><h1 className="text-3xl mb-4">Device not found</h1><Button variant="outline" onClick={() => navigate('/price-list')}><ArrowLeft className="h-4 w-4 mr-2" />Browse devices</Button></div> : <>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div className="space-y-3"><DeviceImage brand={brand} model={model} aspectClass="aspect-square" className="rounded-md !bg-muted/50" /><p className="text-xs text-muted-foreground">Product image represents the model; cosmetic condition and color may vary.</p></div>
        <div className="py-2"><div className="flex justify-between items-start gap-3"><div><p className="text-sm text-muted-foreground uppercase">{brand} · {deviceCategory(device)}</p><h1 className="text-4xl lg:text-5xl mt-2 mb-5">{model}</h1></div><CatalogCurrency /></div>
          <div className="border-y border-border py-5 mb-6"><p className="text-sm text-muted-foreground">{currency === 'JMD' ? 'Estimated total · includes shipping to Jamaica' : 'Device price · USD'}</p><p className="text-4xl font-semibold mt-1">{displayPrice}</p>{currency === 'JMD' && <div className="text-sm text-muted-foreground mt-3 space-y-1"><p>Device: {formatJMD(breakdown.deviceJmd)}</p><p>Estimated shipping: {formatJMD(breakdown.shippingJmd)}</p></div>}</div>
          <div className="space-y-6"><div><h2 className="text-sm font-semibold mb-2">Storage</h2><div className="flex flex-wrap gap-2">{storages.map(s => <Button key={s} size="sm" variant={storage === s ? 'default' : 'outline'} onClick={() => changeVariant('storage', s)}>{s}</Button>)}</div></div>
            <div><h2 className="text-sm font-semibold mb-2">Condition</h2><div className="flex flex-wrap gap-2">{grades.map(g => <Button key={g} size="sm" variant={grade === g ? 'default' : 'outline'} onClick={() => changeVariant('grade', g)}>{g}</Button>)}</div><p className="text-xs text-muted-foreground mt-2">See the condition gallery below for illustrative wear examples.</p></div>
            <div><h2 className="text-sm font-semibold mb-2">Color</h2><div className="flex flex-wrap gap-2">{(device.Colors.length ? device.Colors : ['Default']).map(c => <Button key={c} size="sm" variant={selectedColor === c ? 'default' : 'outline'} onClick={() => setColor(c)}>{c}</Button>)}</div></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-8"><Button size="lg" className="flex-1" onClick={add}><ShoppingCart className="h-4 w-4 mr-2" />Add to cart</Button><Button size="lg" variant="outline" className="flex-1" onClick={() => setRequest(true)}>Request device</Button></div>
          <div className="mt-8 grid gap-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Truck className="h-4 w-4" />Shipping estimate shown in JMD mode</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />See inspection checklist below</p></div>
        </div>
      </div>
      <GradeGallery /><DeviceInspection />
    </>}
  </main>{request && device && <PurchaseRequestModal open={request} onClose={() => setRequest(false)} device={device} initialColor={selectedColor} />}</div>;
}
