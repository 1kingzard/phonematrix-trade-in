import { describe, expect, it } from 'vitest';
import { formatImeiReport } from './imei-report';

describe('IMEI report normalization', () => {
  it('excludes supplier billing information from customer reports', () => {
    const sections = formatImeiReport({ Balance: 19.11, Price: 0.05, Id: 12, Service: 103, Status: 'success', 'Result Model Description': 'iPhone 17 Pro Max', 'Result ICloud Lock': 'ON' });
    expect(sections.flatMap((s) => s.fields)).toEqual([
      { label: 'Model Description', value: 'iPhone 17 Pro Max' },
      { label: 'ICloud Lock', value: 'ON' },
    ]);
  });
  it('reads nested and HTML reports as plain data', () => {
    expect(formatImeiReport({ result: '<b>Model:</b> iPhone<br>Warranty Status: Active<script>unsafe()</script>' })).toEqual([
      { title: 'Device information', fields: [{ label: 'Model', value: 'iPhone' }] },
      { title: 'Warranty & purchase', fields: [{ label: 'Warranty Status', value: 'Active' }] },
    ]);
  });
});