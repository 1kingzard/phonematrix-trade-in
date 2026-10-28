export interface ReportField { label: string; value: string }
export interface ReportSection { title: string; fields: ReportField[] }

const envelopeFields = new Set(['balance', 'price', 'cost', 'service', 'id', 'status', 'success']);

function plainText(value: string) {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|tr|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').trim();
}

/** Normalize old and new supplier reports without displaying billing envelope fields. */
export function formatImeiReport(result: unknown): ReportSection[] {
  const fields = new Map<string, ReportField>();
  const add = (key: string, value: unknown) => {
    const label = key.replace(/^result[\s_.-]+/i, '').replace(/[_-]/g, ' ').trim();
    if (!label || envelopeFields.has(label.toLowerCase()) || value == null) return;
    const text = plainText(String(value));
    if (!text) return;
    const normalized = label.toLowerCase();
    const existing = fields.get(normalized);
    if (!existing || existing.value.includes('*')) fields.set(normalized, { label, value: text });
  };
  const walk = (value: unknown, prefix = '') => {
    if (value && typeof value === 'object') {
      for (const [key, entry] of Object.entries(value)) {
        const path = key.toLowerCase() === 'result' ? prefix : `${prefix}${key}`;
        if (entry && typeof entry === 'object') walk(entry, `${path} `);
        else if (key.toLowerCase() === 'result' && typeof entry === 'string') walk(entry);
        else add(path, entry);
      }
    } else if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object') { walk(parsed); return; } } catch { /* Plain text report */ }
      const text = plainText(value);
      let matched = false;
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([^:]{1,80}):\s*(.+)$/);
        if (match) { add(match[1], match[2]); matched = true; }
      }
      if (!matched) add('Report details', text);
    }
  };
  walk(result);
  const sections: ReportSection[] = [
    { title: 'Device information', fields: [] },
    { title: 'Carrier & security', fields: [] },
    { title: 'Warranty & purchase', fields: [] },
    { title: 'Device history', fields: [] },
    { title: 'Additional details', fields: [] },
  ];
  for (const field of fields.values()) {
    const key = field.label.toLowerCase();
    const index = /carrier|lock|blacklist|icloud|find my|eligib|lost|stolen|sim/.test(key) ? 1
      : /warranty|purchase|coverage|activation/.test(key) ? 2
      : /refurb|replace|loaner|demo/.test(key) ? 3
      : /model|imei|meid|serial|storage|color|colour|brand/.test(key) ? 0 : 4;
    sections[index]?.fields.push(field);
  }
  return sections.filter((section) => section.fields.length > 0);
}