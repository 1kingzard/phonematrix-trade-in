import { describe, expect, it } from 'vitest';
import { serviceDetailsSchema, serviceRemovalValues } from './imei-service-management';

describe('IMEI service management', () => {
  it('removes services without deleting their order reference', () => {
    expect(serviceRemovalValues(new Date('2026-10-28T02:12:00Z'))).toEqual({
      enabled: false, deleted_at: '2026-10-28T02:12:00.000Z',
    });
  });
  it('requires a valid supplier ID when adding a live service', () => {
    const service = { supplier_service_id: 42, supplier_name: 'Carrier check', display_name: 'Carrier check', wholesale_cost: 0.5, retail_price: 1, min_profit: 0, identifier_type: 'imei' };
    expect(serviceDetailsSchema.safeParse(service).success).toBe(true);
    expect(serviceDetailsSchema.safeParse({ ...service, supplier_service_id: 0 }).success).toBe(false);
    expect(serviceDetailsSchema.safeParse({ ...service, wholesale_cost: -1 }).success).toBe(false);
  });
});