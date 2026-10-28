import { z } from 'zod';

export const serviceDetailsSchema = z.object({
  supplier_service_id: z.number().int().positive().max(2147483647),
  supplier_name: z.string().trim().min(1).max(255),
  display_name: z.string().trim().min(1).max(255),
  wholesale_cost: z.number().finite().nonnegative().max(999999.9999),
  retail_price: z.number().finite().nonnegative().max(99999999.99),
  min_profit: z.number().finite().nonnegative().max(99999999.99),
  identifier_type: z.enum(['imei', 'serial', 'either']),
});

export function serviceRemovalValues(now = new Date()) {
  return { enabled: false, deleted_at: now.toISOString() };
}