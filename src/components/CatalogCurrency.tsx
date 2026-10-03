import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPreferredCurrency, setPreferredCurrency, type Currency } from '@/lib/catalog';

const USFlag = () => <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true" className="rounded-sm"><rect width="24" height="16" fill="#fff" />{[1,3,5,7,9,11,13].map(y => <rect key={y} y={y} width="24" height="1.23" fill="#b22234" />)}<rect width="10" height="8.6" fill="#3c3b6e" /></svg>;
const JamaicaFlag = () => <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true" className="rounded-sm"><rect width="24" height="16" fill="#fed100" /><polygon points="2,0 12,6.8 22,0" fill="#009b3a" /><polygon points="2,16 12,9.2 22,16" fill="#009b3a" /><polygon points="0,2 10.5,8 0,14" fill="#000" /><polygon points="24,2 13.5,8 24,14" fill="#000" /></svg>;

export function useCatalogCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(getPreferredCurrency);
  useEffect(() => {
    const update = () => setCurrencyState(getPreferredCurrency());
    window.addEventListener('pm-currency-changed', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('pm-currency-changed', update); window.removeEventListener('storage', update); };
  }, []);
  return [currency, setPreferredCurrency] as const;
}
export default function CatalogCurrency() {
  const [currency, setCurrency] = useCatalogCurrency();
  return <div className="inline-flex border border-border rounded-full p-1 bg-muted/50" aria-label="Currency">
    {(['USD', 'JMD'] as const).map(c => <Button key={c} size="sm" variant={currency === c ? 'default' : 'ghost'} className="rounded-full h-8 px-3 text-xs gap-1.5" onClick={() => setCurrency(c)} aria-pressed={currency === c}>{c === 'USD' ? <USFlag /> : <JamaicaFlag />}{c}</Button>)}
  </div>;
}
