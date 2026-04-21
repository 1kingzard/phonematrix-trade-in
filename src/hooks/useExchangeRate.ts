import { useEffect, useState } from 'react';

const FALLBACK_RATE = 157;
const CACHE_KEY = 'usd_jmd_rate';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface RateState {
  rate: number;
  isFallback: boolean;
  loading: boolean;
}

let inMemory: { rate: number; ts: number } | null = null;

export const useExchangeRate = (): RateState => {
  const [state, setState] = useState<RateState>(() => {
    if (inMemory && Date.now() - inMemory.ts < CACHE_TTL) {
      return { rate: inMemory.rate, isFallback: false, loading: false };
    }
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          inMemory = { rate: parsed.rate, ts: parsed.ts };
          return { rate: parsed.rate, isFallback: false, loading: false };
        }
      }
    } catch {}
    return { rate: FALLBACK_RATE, isFallback: true, loading: true };
  });

  useEffect(() => {
    if (inMemory && Date.now() - inMemory.ts < CACHE_TTL) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        const rate = data?.rates?.JMD;
        if (!rate || typeof rate !== 'number') throw new Error('Invalid rate');
        if (cancelled) return;
        inMemory = { rate, ts: Date.now() };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(inMemory)); } catch {}
        setState({ rate, isFallback: false, loading: false });
      } catch {
        if (!cancelled) setState({ rate: FALLBACK_RATE, isFallback: true, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
};

export const formatJMD = (value: number): string =>
  `J$${Math.round(value).toLocaleString('en-US')}`;

export const formatUSD = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const SHIPPING_RATE = 0.30;

export const calcBreakdown = (priceUsd: number, rate: number) => {
  const shippingUsd = priceUsd * SHIPPING_RATE;
  const deviceJmd = priceUsd * rate;
  const shippingJmd = shippingUsd * rate;
  const totalJmd = deviceJmd + shippingJmd;
  return { priceUsd, shippingUsd, deviceJmd, shippingJmd, totalJmd };
};