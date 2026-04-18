import React, { useState, useMemo } from 'react';
import { useDeviceData, DeviceData, formatCurrency, getUniqueValues } from '@/services/deviceDataService';
import { useSiteMedia } from '@/services/mediaService';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import PurchaseRequestModal from '@/components/PurchaseRequestModal';
import { Search, Smartphone, X } from 'lucide-react';

const ALL = '__all__';

const colorSwatch = (name: string): string => {
  const lower = name.toLowerCase();
  const map: Record<string, string> = {
    black: '#1a1a1a', 'space black': '#0a0a0a', graphite: '#3a3a3a', midnight: '#1c2330',
    silver: '#e3e3e3', white: '#f5f5f5', star: '#f5efe6', starlight: '#f5efe6', blanco: '#f5f5f5',
    gold: '#d4af37', 'rose gold': '#e0bfb8',
    blue: '#1e6fb8', 'alpine blue': '#5d7d9c', 'sierra blue': '#94b4c1',
    'deep blue': '#1a3a5c', natural: '#c9c2b6',
    'cosmic orange': '#d97342', orange: '#e87b2c',
    red: '#c8202e', green: '#3a7d44', 'alpine green': '#576f5e',
    purple: '#9a7bb0', 'dark purple': '#4a3957', 'deep purple': '#5e4870',
    yellow: '#f3d35e', pink: '#f8c8d0',
  };
  for (const [k, v] of Object.entries(map)) if (lower.includes(k)) return v;
  return '#9ca3af';
};

const PriceList: React.FC = () => {
  const { devices, loading } = useDeviceData();
  const { media } = useSiteMedia();
  const logoUrl = media['logo']?.file_url;

  const [search, setSearch] = useState('');
  const [os, setOs] = useState(ALL);
  const [brand, setBrand] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [condition, setCondition] = useState(ALL);
  const [storage, setStorage] = useState(ALL);
  const [color, setColor] = useState(ALL);
  const [selected, setSelected] = useState<{ device: DeviceData; color: string } | null>(null);

  const osOptions = useMemo(() => getUniqueValues(devices, 'OS'), [devices]);
  const brandOptions = useMemo(
    () => getUniqueValues(devices.filter(d => os === ALL || d.OS === os), 'Brand'),
    [devices, os]
  );
  const modelOptions = useMemo(
    () => getUniqueValues(devices.filter(d => (os === ALL || d.OS === os) && (brand === ALL || d.Brand === brand)), 'Model'),
    [devices, os, brand]
  );
  const conditionOptions = useMemo(() => getUniqueValues(devices, 'Condition'), [devices]);
  const storageOptions = useMemo(() => getUniqueValues(devices, 'Storage'), [devices]);
  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    devices.forEach(d => d.Colors.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [devices]);

  const filtered = useMemo(() => devices.filter(d => {
    if (os !== ALL && d.OS !== os) return false;
    if (brand !== ALL && d.Brand !== brand) return false;
    if (model !== ALL && d.Model !== model) return false;
    if (condition !== ALL && d.Condition !== condition) return false;
    if (storage !== ALL && d.Storage !== storage) return false;
    if (color !== ALL && !d.Colors.includes(color)) return false;
    if (search && !`${d.Brand} ${d.Model} ${d.Storage}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [devices, os, brand, model, condition, storage, color, search]);

  const clearFilters = () => {
    setSearch(''); setOs(ALL); setBrand(ALL); setModel(ALL); setCondition(ALL); setStorage(ALL); setColor(ALL);
  };
  const hasFilters = search || os !== ALL || brand !== ALL || model !== ALL || condition !== ALL || storage !== ALL || color !== ALL;

  const conditionColor = (c: string) => {
    switch (c.toLowerCase()) {
      case 'like new': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'good': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'fair': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'poor': return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="mb-8 md:mb-12 text-center">
          {logoUrl && <img src={logoUrl} alt="Phone Matrix" className="h-12 mx-auto mb-4" />}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Device <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">Catalog</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our full inventory. Filter by what matters to you, then request a purchase in seconds.
          </p>
        </div>

        <Card className="p-4 md:p-6 mb-6 bg-card/60 backdrop-blur border-border/60">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search brand, model, storage…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={os} onValueChange={setOs}>
                <SelectTrigger><SelectValue placeholder="OS" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All OS</SelectItem>{osOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={brand} onValueChange={v => { setBrand(v); setModel(ALL); }}>
                <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Brands</SelectItem>{brandOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Models</SelectItem>{modelOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Conditions</SelectItem>{conditionOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={storage} onValueChange={setStorage}>
                <SelectTrigger><SelectValue placeholder="Storage" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Storage</SelectItem>{storageOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Colors</SelectItem>{colorOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'device' : 'devices'} found</span>
              {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8"><X className="h-3.5 w-3.5 mr-1" /> Clear</Button>}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No devices match your filters</p>
            <p className="text-muted-foreground mt-1">Try adjusting your search or clearing filters.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((d, i) => (
              <Card key={`${d.Brand}-${d.Model}-${d.Storage}-${d.Condition}-${i}`} className="group overflow-hidden border-border/60 hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center relative overflow-hidden">
                  <Smartphone className="h-20 w-20 text-muted-foreground/30 group-hover:scale-110 transition-transform" strokeWidth={1} />
                  <Badge variant="outline" className={`absolute top-3 right-3 ${conditionColor(d.Condition)} border`}>{d.Condition}</Badge>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{d.Brand}</p>
                    <h3 className="font-semibold text-base leading-tight">{d.Model}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">{d.Storage}</span>
                  </div>
                  {d.Colors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {d.Colors.slice(0, 5).map(c => (
                        <span key={c} title={c} className="w-5 h-5 rounded-full border border-border/60 ring-1 ring-background" style={{ backgroundColor: colorSwatch(c) }} />
                      ))}
                      {d.Colors.length > 5 && <span className="text-xs text-muted-foreground self-center">+{d.Colors.length - 5}</span>}
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(d.Price)}</p>
                    </div>
                    <Button size="sm" onClick={() => setSelected({ device: d, color: d.Colors[0] || '' })} className="shrink-0">Request</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PurchaseRequestModal open={!!selected} onClose={() => setSelected(null)} device={selected.device} initialColor={selected.color} />
      )}
    </div>
  );
};

export default PriceList;
