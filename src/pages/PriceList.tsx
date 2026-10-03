import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Search, ShieldCheck, Smartphone, Truck, X } from 'lucide-react';
import Header from '@/components/Header';
import DeviceImage from '@/components/DeviceImage';
import CatalogCurrency, { useCatalogCurrency } from '@/components/CatalogCurrency';
import GradeGallery from '@/components/GradeGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeviceData, type DeviceData } from '@/services/deviceDataService';
import { calcTotalJMD, formatJMD, formatUSD, useExchangeRate } from '@/hooks/useExchangeRate';
import { deviceCategory, gradeOrder, platformOf, productPath } from '@/lib/catalog';

const ALL = 'all';
const PriceList = () => {
  const { devices, loading, error } = useDeviceData();
  const { rate } = useExchangeRate();
  const [currency] = useCatalogCurrency();
  const [params, setParams] = useSearchParams();
  const platform = params.get('platform') || '';
  const category = params.get('category') || '';
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState(ALL);
  const [storage, setStorage] = useState(ALL);
  const [sort, setSort] = useState('featured');
  const choose = (p = '', c = '') => { setParams(p ? { platform: p, ...(c ? { category: c } : {}) } : {}); setGrade(ALL); setStorage(ALL); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const categories = useMemo(() => [...new Set(devices.filter(d => platformOf(d) === platform).map(deviceCategory))].sort(), [devices, platform]);
  const group = useMemo(() => devices.filter(d => (!platform || platformOf(d) === platform) && (!category || deviceCategory(d) === category)), [devices, platform, category]);
  const models = useMemo(() => {
    const matches = group.filter(d => (grade === ALL || d.Condition === grade) && (storage === ALL || d.Storage === storage) && `${d.Brand} ${d.Model} ${d.Storage}`.toLowerCase().includes(search.toLowerCase()));
    const map = new Map<string, DeviceData>();
    matches.forEach(d => { const key = `${d.Brand}|${d.Model}`; const current = map.get(key); if (!current || current.Price > d.Price) map.set(key, d); });
    const results = [...map.values()];
    if (sort === 'price-low') results.sort((a, b) => a.Price - b.Price);
    else if (sort === 'price-high') results.sort((a, b) => b.Price - a.Price);
    else results.sort((a, b) => `${a.Brand} ${a.Model}`.localeCompare(`${b.Brand} ${b.Model}`));
    return results;
  }, [group, grade, storage, search, sort]);
  const price = (value: number) => currency === 'JMD' ? formatJMD(calcTotalJMD(value, rate)) : formatUSD(value);
  return <div className="min-h-screen bg-background text-foreground"><Header />
    <main className="container max-w-7xl mx-auto px-4 pt-24 pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground">Home</Link><ChevronRight className="h-4 w-4" />
        {platform ? <><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => choose()}>Browse Devices</Button><ChevronRight className="h-4 w-4" /><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => choose(platform)}>{platform} Devices</Button>{category && <><ChevronRight className="h-4 w-4" /><span className="text-foreground">{category}</span></>}</> : <span className="text-foreground">Browse Devices</span>}
      </nav>
      <div className="flex justify-between items-start gap-4 mb-9"><div><p className="text-xs uppercase text-muted-foreground mb-2">PhoneMatrix / Catalog</p><h1 className="text-4xl md:text-6xl font-semibold">{category || (platform ? `${platform} Devices` : 'Browse Devices')}</h1></div><CatalogCurrency /></div>
      {!platform && <>
        <h2 className="text-2xl mb-4">Shop by platform</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-12">{['Apple', 'Android'].map(p => {
          const sample = devices.find(d => platformOf(d) === p && /iphone|galaxy|pixel/i.test(d.Model)) || devices.find(d => platformOf(d) === p);
          return <Button variant="outline" key={p} onClick={() => choose(p)} className="h-48 p-0 overflow-hidden rounded-md border-border bg-muted/30 hover:bg-muted/70 justify-between text-left group">
            <span className="p-6 md:p-8 flex flex-col items-start gap-3"><span className="text-xs uppercase text-muted-foreground">Explore the collection</span><span className="text-2xl md:text-3xl font-semibold text-foreground">{p} Devices</span><span className="text-sm text-muted-foreground inline-flex items-center gap-2">Shop now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span></span>
            {sample && <DeviceImage brand={sample.Brand} model={sample.Model} className="w-40 md:w-56 h-full shrink-0 !bg-transparent" aspectClass="aspect-auto" />}
          </Button>;
        })}</div>
        <h2 className="text-2xl mb-4">Explore devices</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">{[...new Set(devices.map(deviceCategory))].slice(0, 8).map(c => {
          const sample = devices.find(d => deviceCategory(d) === c);
          return <Button key={c} variant="outline" className="h-24 justify-start gap-3 px-4 text-left bg-card hover:bg-muted/50 border-border rounded-md" onClick={() => choose(sample ? platformOf(sample) : '', c)}>
            <span className="w-14 h-14 bg-muted rounded-md overflow-hidden shrink-0">{sample && <DeviceImage brand={sample.Brand} model={sample.Model} className="h-full" aspectClass="aspect-square" />}</span><span className="whitespace-normal text-sm">{c}</span><ChevronRight className="h-4 w-4 ml-auto shrink-0" />
          </Button>;
        })}</div>
        <GradeGallery />
      </>}
      {platform && !category && <><h2 className="text-2xl mb-4">Choose a device type</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">{categories.map(c => {
        const sample = group.find(d => deviceCategory(d) === c);
        return <Button key={c} variant="outline" onClick={() => choose(platform, c)} className="h-32 p-3 bg-card border-border hover:bg-muted/50 rounded-md flex-col items-start justify-between text-left"><span className="w-14 h-14 overflow-hidden rounded-md bg-muted">{sample && <DeviceImage brand={sample.Brand} model={sample.Model} aspectClass="aspect-square" />}</span><span className="text-sm whitespace-normal">{c} <ArrowRight className="inline h-4 w-4 ml-1" /></span></Button>;
      })}</div></>}
      {platform && <>
        <div className="bg-muted/50 rounded-md p-4 flex flex-wrap gap-x-8 gap-y-2 text-sm mb-9"><span className="inline-flex gap-2 items-center"><ShieldCheck className="h-4 w-4" /> Condition options</span><span className="inline-flex gap-2 items-center"><Truck className="h-4 w-4" /> Jamaica delivery estimate in JMD</span><span className="inline-flex gap-2 items-center"><Smartphone className="h-4 w-4" /> Shop by grade & storage</span></div>
        <div className="flex flex-wrap gap-2 mb-5">{categories.map(c => <Button key={c} variant={category === c ? 'default' : 'secondary'} size="sm" onClick={() => choose(platform, c)} className="rounded-full">{c}</Button>)}{category && <Button variant="ghost" size="sm" onClick={() => choose(platform)}>All {platform}</Button>}</div>
        <div className="flex flex-wrap items-center gap-3 mb-5"><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search devices" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={grade} onValueChange={setGrade}><SelectTrigger className="w-36"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All grades</SelectItem>{gradeOrder.filter(g => group.some(d => d.Condition === g)).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
          <Select value={storage} onValueChange={setStorage}><SelectTrigger className="w-36"><SelectValue placeholder="Storage" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All storage</SelectItem>{[...new Set(group.map(d => d.Storage))].filter(Boolean).sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-44 sm:ml-auto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="featured">Sort: Name</SelectItem><SelectItem value="price-low">Price: low to high</SelectItem><SelectItem value="price-high">Price: high to low</SelectItem></SelectContent></Select>
          {(search || grade !== ALL || storage !== ALL) && <Button variant="ghost" size="icon" title="Clear filters" onClick={() => { setSearch(''); setGrade(ALL); setStorage(ALL); }}><X className="h-4 w-4" /></Button>}
        </div>
        <p className="text-sm text-muted-foreground mb-5">{models.length} models</p>
        {loading ? <p className="py-12 text-muted-foreground">Loading devices…</p> : error ? <p className="py-12 text-destructive">Could not load devices.</p> : models.length === 0 ? <p className="py-12 text-muted-foreground">No devices match these filters.</p> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-12">{models.map(d => <Link key={`${d.Brand}-${d.Model}`} to={productPath(d)} className="group border border-border rounded-md overflow-hidden bg-card hover:border-primary/50 transition-colors flex flex-col">
          <DeviceImage brand={d.Brand} model={d.Model} aspectClass="aspect-square" className="!bg-muted/40" />
          <div className="p-3 md:p-5 flex flex-col flex-1"><p className="text-xs text-muted-foreground mb-1">{d.Brand} / {deviceCategory(d)}</p><h3 className="text-lg md:text-xl leading-tight mb-2">{d.Model}</h3><p className="text-xs text-muted-foreground mb-5">{d.Storage} · From {d.Condition}</p><div className="mt-auto border-t border-border pt-3"><p className="text-xs text-muted-foreground">Starting at {currency === 'JMD' ? '· incl. shipping' : ''}</p><p className="text-lg md:text-2xl font-semibold">{price(d.Price)}</p><span className="text-xs text-primary inline-flex items-center gap-1 mt-2">View options <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" /></span></div></div>
        </Link>)}</div>}
        <GradeGallery />
      </>}
    </main></div>;
};
export default PriceList;
