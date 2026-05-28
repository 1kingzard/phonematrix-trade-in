import { InventoryRow } from './partsCalc';

const COLUMNS: (keyof InventoryRow)[] = [
  'id', 'item_name', 'category', 'date_ordered', 'qty_ordered', 'qty_available',
  'cost_per_unit_usd', 'product_cost_usd', 'shipping_usd',
  'discount_value', 'discount_is_percent', 'selling_price_jmd', 'locked_rate', 'archived',
];

const escape = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: InventoryRow[]) => {
  const header = COLUMNS.join(',');
  const body = rows.map(r => COLUMNS.map(c => escape((r as any)[c])).join(',')).join('\n');
  return header + '\n' + body;
};

export const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const parseLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cur += ch; }
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') { inQ = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
};

const NUM_COLS = new Set(['qty_ordered', 'qty_available', 'cost_per_unit_usd', 'product_cost_usd', 'shipping_usd', 'discount_value', 'selling_price_jmd', 'locked_rate']);
const BOOL_COLS = new Set(['discount_is_percent', 'archived']);

export const parseCsv = (text: string): Partial<InventoryRow>[] => {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = parseLine(line);
    const obj: any = {};
    headers.forEach((h, i) => {
      let v: any = cells[i] ?? '';
      if (v === '') { v = null; }
      else if (NUM_COLS.has(h)) v = Number(v);
      else if (BOOL_COLS.has(h)) v = v === 'true' || v === '1' || v === 'TRUE';
      obj[h] = v;
    });
    return obj;
  });
};