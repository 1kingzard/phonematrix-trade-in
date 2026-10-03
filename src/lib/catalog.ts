import type { DeviceData } from '@/services/deviceDataService';

export type Currency = 'USD' | 'JMD';
export const getPreferredCurrency = (): Currency => {
  try { return localStorage.getItem('preferred_currency') === 'JMD' ? 'JMD' : 'USD'; } catch { return 'USD'; }
};
export const setPreferredCurrency = (currency: Currency) => {
  try { localStorage.setItem('preferred_currency', currency); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event('pm-currency-changed'));
};
export const productPath = (d: DeviceData) => `/devices/${encodeURIComponent(d.Brand)}/${encodeURIComponent(d.Model)}?${new URLSearchParams({ storage: d.Storage, grade: d.Condition })}`;
export const deviceCategory = (d: DeviceData) => {
  const model = d.Model.toLowerCase();
  const brand = d.Brand.toLowerCase();
  if (/airpods|earbuds|buds|headphone/.test(model)) return 'Earbuds & audio';
  if (/watch|fitbit/.test(model)) return 'Watches';
  if (/ipad|tablet|tab\b/.test(model)) return 'Tablets';
  if (/macbook|laptop|chromebook/.test(model)) return 'Laptops';
  if (/iphone/.test(model)) return 'iPhones';
  if (/pixel/.test(model)) return 'Google Pixel';
  if (/samsung|galaxy/.test(model) || brand.includes('samsung')) return 'Samsung Galaxy';
  return `${d.Brand} devices`;
};
export const platformOf = (d: DeviceData) => /apple|ios/i.test(`${d.OS} ${d.Brand}`) ? 'Apple' : 'Android';
export const gradeOrder = ['Like New', 'Very Good', 'Good', 'Fair'];
