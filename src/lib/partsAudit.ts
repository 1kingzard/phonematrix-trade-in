import { supabase } from '@/integrations/supabase/client';

export interface AuditInput {
  action: string;
  entity: string;
  entityId?: string | null;
  payload?: Record<string, any>;
  rateUsed?: number | null;
}

/**
 * Records a timestamped audit entry for any change made in the Parts section,
 * capturing who performed the action (id + email) alongside the details.
 */
export const logPartsAudit = async ({ action, entity, entityId, payload, rateUsed }: AuditInput) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('parts_audit_log').insert({
      actor: user?.id ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      rate_used: rateUsed ?? null,
      payload: {
        ...(payload || {}),
        actor_email: user?.email ?? null,
      },
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
};

export const auditActorLabel = (payload: any, actor: string | null) =>
  payload?.actor_email || (actor ? `${actor.slice(0, 8)}…` : 'System');

export const ENTITY_LABELS: Record<string, string> = {
  parts_inventory: 'Inventory',
  parts_sales: 'Sales',
  parts_collections: 'Collections',
  parts_deposits: 'Deposits',
  parts_misc_orders: 'Misc Orders',
  parts_misc_payments: 'Misc Payments',
  parts_settings: 'Settings',
  parts_access: 'Access',
};
