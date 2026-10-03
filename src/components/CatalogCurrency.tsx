import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPreferredCurrency, setPreferredCurrency, type Currency } from '@/lib/catalog';

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
    {(['USD', 'JMD'] as const).map(c => <Button key={c} size="sm" variant={currency === c ? 'default' : 'ghost'} className="rounded-full h-8 px-3 text-xs" onClick={() => setCurrency(c)} aria-pressed={currency === c}>{c === 'USD' ? '🇺🇸' : '🇯🇲'} {c}</Button>)}
  </div>;
}
