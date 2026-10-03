export const GRADES = [
  { name: 'Like New', short: 'No blemishes • 95%+ battery health', long: 'No noticeable blemishes and in excellent cosmetic condition. Battery health generally 95% or higher.' },
  { name: 'Very Good', short: 'Little to no blemishes • 85%+ battery health', long: 'Little to no noticeable blemishes and in very good overall condition. Battery health generally 85% or higher.' },
  { name: 'Good', short: 'Visible wear acceptable • 80%+ battery health', long: 'May have visible scratches or other signs of normal use but fully functional. Battery health generally 80% or higher.' },
  { name: 'Fair', short: 'Heavy wear, poor battery health, or faults', long: 'May have visible scratches, significant cosmetic wear, poor battery health, functional faults, or other issues that reduce its value.' },
] as const;

export const GRADE_ORDER = GRADES.map(g => g.name) as string[];
export const gradeInfo = (name?: string | null) => GRADES.find(g => g.name === name);
export const sortGrades = (list: string[]) =>
  [...list].sort((a, b) => {
    const ia = GRADE_ORDER.indexOf(a), ib = GRADE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

export const TRADE_IN_STATUSES = [
  'Quote Created', 'Awaiting Device Inspection', 'Device Received', 'Inspection Complete',
  'Quote Adjusted', 'Approved', 'Invoice Sent', 'Payment Pending', 'Paid', 'Completed', 'Cancelled', 'Expired',
] as const;

export const requestUrl = (token: string) => `${window.location.origin}/trade-in/request/${token}`;

export const statusTone = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
  ['Cancelled', 'Expired'].includes(s) ? 'destructive'
    : ['Approved', 'Paid', 'Completed'].includes(s) ? 'default'
    : s === 'Quote Created' ? 'outline' : 'secondary';
