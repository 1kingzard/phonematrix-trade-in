import { useState, useEffect } from 'react';

// Updated CSV with new columns: Color 1-6, Screen Replacement, Battery Replacement, Rear Glass replacement
const DEFAULT_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTm_hMufMdiRt6SRdz5LGd_bWTGJuW1eEO6GEx13FA9tRZYmkqHtrz28brn8yTiS94HKUPuwSgPZkxP/pub?output=csv';

const CSV_URL_KEY = 'pm_csv_url';
const CSV_MAPPING_KEY = 'pm_csv_mapping';

export const getCsvUrl = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CSV_URL;
  return localStorage.getItem(CSV_URL_KEY) || DEFAULT_CSV_URL;
};

export const setCsvUrl = (url: string) => {
  localStorage.setItem(CSV_URL_KEY, url);
};

export const getDefaultCsvUrl = () => DEFAULT_CSV_URL;

// Expected canonical field names
export const CANONICAL_FIELDS = [
  'OS', 'Brand', 'Model', 'Condition', 'Price', 'Storage',
  'Color 1', 'Color 2', 'Color 3', 'Color 4', 'Color 5', 'Color 6',
  'Screen Replacement', 'Battery Replacement', 'Rear Glass Replacement',
] as const;

export type CanonicalField = typeof CANONICAL_FIELDS[number];

export type ColumnMapping = Partial<Record<CanonicalField, string>>;

export const getColumnMapping = (): ColumnMapping => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CSV_MAPPING_KEY) || '{}');
  } catch { return {}; }
};

export const setColumnMapping = (m: ColumnMapping) => {
  localStorage.setItem(CSV_MAPPING_KEY, JSON.stringify(m));
};

export interface DeviceData {
  OS: string;
  Brand: string;
  Model: string;
  Condition: string;
  Price: number;
  Storage: string;
  Colors: string[]; // filtered (no "None" / empty)
  ScreenReplacement: number;
  BatteryReplacement: number;
  RearGlassReplacement: number;
}

export const SERVICE_CHARGE = 50;

const parseCSVLine = (line: string): string[] => {
  // Simple CSV split — these sheets don't appear to use quoted fields with commas
  return line.split(',').map(v => v.trim());
};

const findHeaderIndex = (headers: string[], canonical: CanonicalField, mapping: ColumnMapping): number => {
  const mapped = mapping[canonical];
  if (mapped) {
    const i = headers.findIndex(h => h.toLowerCase() === mapped.toLowerCase());
    if (i >= 0) return i;
  }
  // Case-insensitive match on canonical name
  const i = headers.findIndex(h => h.toLowerCase() === canonical.toLowerCase());
  return i;
};

const num = (v: string | undefined): number => {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const parseCSV = (csvText: string, mapping: ColumnMapping): DeviceData[] => {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const headers = parseCSVLine(lines[0]);

  const idx = {
    OS: findHeaderIndex(headers, 'OS', mapping),
    Brand: findHeaderIndex(headers, 'Brand', mapping),
    Model: findHeaderIndex(headers, 'Model', mapping),
    Condition: findHeaderIndex(headers, 'Condition', mapping),
    Price: findHeaderIndex(headers, 'Price', mapping),
    Storage: findHeaderIndex(headers, 'Storage', mapping),
    C1: findHeaderIndex(headers, 'Color 1', mapping),
    C2: findHeaderIndex(headers, 'Color 2', mapping),
    C3: findHeaderIndex(headers, 'Color 3', mapping),
    C4: findHeaderIndex(headers, 'Color 4', mapping),
    C5: findHeaderIndex(headers, 'Color 5', mapping),
    C6: findHeaderIndex(headers, 'Color 6', mapping),
    Screen: findHeaderIndex(headers, 'Screen Replacement', mapping),
    Battery: findHeaderIndex(headers, 'Battery Replacement', mapping),
    Rear: findHeaderIndex(headers, 'Rear Glass Replacement', mapping),
  };

  return lines.slice(1).map(line => {
    const v = parseCSVLine(line);
    const colors = [v[idx.C1], v[idx.C2], v[idx.C3], v[idx.C4], v[idx.C5], v[idx.C6]]
      .filter(c => c && c.toLowerCase() !== 'none' && c !== '');
    return {
      OS: v[idx.OS] || '',
      Brand: v[idx.Brand] || '',
      Model: v[idx.Model] || '',
      Condition: v[idx.Condition] || '',
      Price: num(v[idx.Price]),
      Storage: v[idx.Storage] || '',
      Colors: colors,
      ScreenReplacement: num(v[idx.Screen]),
      BatteryReplacement: num(v[idx.Battery]),
      RearGlassReplacement: num(v[idx.Rear]),
    };
  }).filter(d => d.Model && d.Brand);
};

export const useDeviceData = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const url = getCsvUrl();
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch CSV');
        const text = await res.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length) setHeaders(parseCSVLine(lines[0]));
        const data = parseCSV(text, getColumnMapping());
        if (!cancelled) {
          setDevices(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load device data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const handler = () => load();
    window.addEventListener('pm-csv-config-changed', handler);
    return () => { cancelled = true; window.removeEventListener('pm-csv-config-changed', handler); };
  }, []);

  return { devices, loading, error, headers };
};

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number>(158);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => { if (d?.rates?.JMD) setExchangeRate(d.rates.JMD); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return { exchangeRate, loading };
};

export const getUniqueValues = <K extends keyof DeviceData>(devices: DeviceData[], field: K): string[] => {
  const set = new Set<string>();
  devices.forEach(d => {
    const v = d[field];
    if (typeof v === 'string' && v) set.add(v);
  });
  return Array.from(set).sort();
};

export const calculatePriceDifference = (
  tradeIn: DeviceData | null,
  upgrade: DeviceData | null,
  finalTradeValue: number
): number => {
  if (!tradeIn || !upgrade) return 0;
  return upgrade.Price - finalTradeValue + SERVICE_CHARGE;
};

export const calculateShippingCost = (price: number) => price * 0.3;

export const formatServiceCharge = (currency: 'USD' | 'JMD', exchangeRate: number) => {
  const v = currency === 'USD' ? SERVICE_CHARGE : SERVICE_CHARGE * exchangeRate;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
};

export const formatCurrency = (amount: number, currency: 'USD' | 'JMD' = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
