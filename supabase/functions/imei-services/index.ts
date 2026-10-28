import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SICKW_BASE = 'https://sickw.com/api.php';
const REQUEST_TIMEOUT_MS = 25000;

// Supplier error codes -> customer-safe messages (never expose supplier internals)
const SUPPLIER_ERRORS: Record<string, string> = {
  E01: 'The IMEI number appears to be invalid (checksum failed). Please double-check and try again.',
  E02: 'The IMEI or serial number entered is not valid for this service.',
  R01: 'No record was found for this device.',
  B01: 'This service is temporarily unavailable. Please try again later.',
  S01: 'This service is not available.',
  S02: 'This service is currently inactive.',
  S03: 'This service cannot be processed instantly.',
  A01: 'Service configuration error. Please contact support.',
  A02: 'Service configuration error. Please contact support.',
  A03: 'Service configuration error. Please contact support.',
};
// Errors where the supplier definitively did not charge -> safe to release the reservation
const RELEASABLE_ERRORS = new Set(['E01', 'E02', 'S01', 'S02', 'S03', 'A01', 'A02', 'A03']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function maskIdentifier(id: string): string {
  return id.length > 4 ? '*'.repeat(id.length - 4) + id.slice(-4) : id;
}

async function getSetting(supabase: any, key: string): Promise<any> {
  const { data } = await supabase.from('imei_settings').select('value').eq('key', key).maybeSingle();
  return data?.value;
}

async function logApi(supabase: any, action: string, serviceId: number | null, status: string, errorCode: string | null, detail?: string) {
  await supabase.from('supplier_api_logs').insert({
    action,
    service_id: serviceId,
    status,
    error_code: errorCode,
    detail: detail ?? null,
  });
}

// ---------- Mock supplier (development/testing; no chargeable calls) ----------
function mockCheck(service: any, identifier: string) {
  const seed = identifier.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  const carriers = ['Verizon', 'AT&T', 'T-Mobile', 'Cricket', 'Xfinity Mobile', 'Unlocked'];
  const carrier = carriers[seed % carriers.length];
  const blacklisted = seed % 11 === 0;
  const locked = carrier !== 'Unlocked' && seed % 3 !== 0;
  const result: Record<string, string> = {
    'Model': 'Apple iPhone (verified)',
    'IMEI': maskIdentifier(identifier),
  };
  const name = (service.supplier_name || '').toLowerCase();
  if (name.includes('carrier') || name.includes('status')) {
    result['Carrier'] = carrier;
    result['SIM Lock'] = locked ? 'Locked' : 'Unlocked';
  }
  if (name.includes('blacklist') || name.includes('status') || name.includes('fmi')) {
    result['Blacklist Status'] = blacklisted ? 'Blacklisted' : 'Clean';
  }
  if (name.includes('fmi')) {
    result['Find My iPhone'] = seed % 4 === 0 ? 'Enabled' : 'Disabled';
  }
  if (name.includes('unlock') || service.is_unlock) {
    result['Eligibility'] = blacklisted ? 'Ineligible' : 'Eligible';
  }
  result['Warranty Status'] = seed % 2 === 0 ? 'Active' : 'Expired';
  return {
    ok: true,
    supplierOrderId: `MOCK-${Date.now()}-${seed % 1000}`,
    result,
    raw: { mock: true, service: service.supplier_service_id, result },
  };
}

function mockServices() {
  return { ok: true, services: [] as any[] };
}

// ---------- Live supplier ----------
async function sickwGet(params: Record<string, string>, apiKey: string) {
  const qs = new URLSearchParams({ ...params, key: apiKey });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${SICKW_BASE}?${qs.toString()}`, { signal: controller.signal });
    const text = await res.text();
    return { ok: res.ok, text };
  } finally {
    clearTimeout(timer);
  }
}

function parseSupplierError(text: string): string | null {
  const match = text.match(/\b(E01|E02|R01|B01|S01|S02|S03|A01|A02|A03)\b/);
  return match ? match[1] : null;
}

// Parse a supplier response into customer-safe key/value sections.
// Only includes fields actually present in the response; never manufactures values.
function parseSupplierResult(text: string, maskedIdentifier: string): Record<string, string> {
  const result: Record<string, string> = { 'IMEI': maskedIdentifier };
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const flat = (obj: any, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
          if (v == null) continue;
          const label = (prefix + k).replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          if (typeof v === 'object' && !Array.isArray(v)) flat(v, `${label} `);
          else if (typeof v !== 'object') result[label] = String(v);
        }
      };
      flat(parsed);
      return result;
    }
  } catch {
    // not JSON — fall through to text parsing
  }
  // Plain text: "Key: Value" lines
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^:]{2,40}):\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].trim().slice(0, 200);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const mockMode = (await getSetting(supabase, 'mock_mode')) !== false;
    const apiKey = Deno.env.get('SICKW_API_KEY') ?? '';

    const requireAdmin = async () => {
      const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: userId });
      if (!isAdmin) throw Object.assign(new Error('Forbidden'), { status: 403 });
    };

    // ----- Supplier balance (admin) -----
    if (action === 'balance') {
      await requireAdmin();
      if (mockMode) {
        await logApi(supabase, 'balance', null, 'mock', null);
        return json({ ok: true, balance: 250.0, mock: true });
      }
      if (!apiKey) return json({ error: 'Live mode is not configured yet.' }, 400);
      const res = await sickwGet({ action: 'balance' }, apiKey);
      const balance = parseFloat(res.text.replace(/[^0-9.]/g, ''));
      await logApi(supabase, 'balance', null, res.ok ? 'ok' : 'error', null);
      return json({ ok: true, balance: Number.isFinite(balance) ? balance : null });
    }

    // ----- Catalog sync (admin): refresh wholesale costs, keep custom retail prices -----
    if (action === 'sync-catalog') {
      await requireAdmin();
      if (mockMode) {
        await logApi(supabase, 'services', null, 'mock', null);
        return json({ ok: true, synced: 0, mock: true, message: 'Mock mode: catalog sync simulated.' });
      }
      if (!apiKey) return json({ error: 'Live mode is not configured yet.' }, 400);
      const res = await sickwGet({ action: 'services', format: 'json' }, apiKey);
      let synced = 0;
      try {
        const parsed = JSON.parse(res.text);
        const list = Array.isArray(parsed) ? parsed : parsed?.services ?? [];
        for (const item of list) {
          const sid = Number(item.id ?? item.service);
          const cost = Number(item.price ?? item.cost);
          if (!sid || !Number.isFinite(cost)) continue;
          const { data: existing } = await supabase
            .from('imei_services').select('id, wholesale_cost').eq('supplier_service_id', sid).maybeSingle();
          if (existing && Number(existing.wholesale_cost) !== cost) {
            await supabase.from('supplier_price_history').insert({
              service_id: existing.id, old_cost: existing.wholesale_cost, new_cost: cost,
            });
            // Update wholesale cost only — never touch custom retail prices
            await supabase.from('imei_services')
              .update({ wholesale_cost: cost, last_synced_at: new Date().toISOString() })
              .eq('id', existing.id);
            synced++;
          }
        }
      } catch {
        await logApi(supabase, 'services', null, 'error', 'PARSE', 'Could not parse services response');
        return json({ error: 'Could not parse supplier catalog response.' }, 502);
      }
      await logApi(supabase, 'services', null, 'ok', null, `synced ${synced}`);
      return json({ ok: true, synced });
    }

    // ----- Submit / refresh an order -----
    if (action === 'submit' || action === 'refresh') {
      const orderId = body.order_id as string;
      if (!orderId) return json({ error: 'order_id required' }, 400);

      const { data: order } = await supabase
        .from('imei_orders')
        .select('*, imei_services(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (!order) return json({ error: 'Order not found' }, 404);

      const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: userId });
      if (order.user_id !== userId && !isAdmin) return json({ error: 'Forbidden' }, 403);

      const service = order.imei_services;

      if (action === 'refresh') {
        // Delayed orders: poll supplier history. Mock: complete after 60s.
        if (order.status !== 'pending' && order.status !== 'processing') {
          return json({ ok: true, status: order.status });
        }
        if (mockMode) {
          const ageMs = Date.now() - new Date(order.created_at).getTime();
          if (ageMs < 60000) return json({ ok: true, status: 'pending' });
          const mock = mockCheck(service, order.identifier);
          await supabase.from('imei_orders').update({
            status: 'completed', result: mock.result,
            completed_at: new Date().toISOString(),
          }).eq('id', orderId);
          await supabase.from('imei_order_results').upsert({ order_id: orderId, raw_response: mock.raw });
          await supabase.rpc('settle_imei_order', { p_order_id: orderId });
          return json({ ok: true, status: 'completed', result: mock.result });
        }
        if (!apiKey) return json({ error: 'Live mode is not configured yet.' }, 400);
        const res = await sickwGet({ format: 'json', imei: order.supplier_order_id ?? order.identifier, action: 'history' }, apiKey);
        const errCode = parseSupplierError(res.text);
        if (errCode === 'R01') return json({ ok: true, status: 'pending' });
        const parsed = parseSupplierResult(res.text, order.identifier_masked);
        await supabase.from('imei_orders').update({
          status: 'completed', result: parsed, completed_at: new Date().toISOString(),
        }).eq('id', orderId);
        await supabase.from('imei_order_results').upsert({ order_id: orderId, raw_response: { text: res.text } });
        await supabase.rpc('settle_imei_order', { p_order_id: orderId });
        await logApi(supabase, 'history', service?.supplier_service_id ?? null, 'ok', null);
        return json({ ok: true, status: 'completed', result: parsed });
      }

      // action === 'submit'
      if (order.status !== 'submitted') {
        return json({ ok: true, status: order.status, result: order.result });
      }

      if (mockMode) {
        const mock = mockCheck(service, order.identifier);
        if (service.is_instant) {
          await supabase.from('imei_orders').update({
            status: 'completed', result: mock.result,
            supplier_order_id: mock.supplierOrderId,
            completed_at: new Date().toISOString(),
          }).eq('id', orderId);
          await supabase.from('imei_order_results').upsert({ order_id: orderId, raw_response: mock.raw });
          await supabase.rpc('settle_imei_order', { p_order_id: orderId });
          await logApi(supabase, 'check', service.supplier_service_id, 'mock', null);
          return json({ ok: true, status: 'completed', result: mock.result });
        }
        await supabase.from('imei_orders').update({
          status: 'pending', supplier_order_id: mock.supplierOrderId,
        }).eq('id', orderId);
        await logApi(supabase, 'check', service.supplier_service_id, 'mock', null, 'delayed');
        return json({ ok: true, status: 'pending' });
      }

      // Live submission
      if (!apiKey) return json({ error: 'Live mode is not configured yet.' }, 400);
      let res;
      try {
        res = await sickwGet({
          format: 'beta',
          imei: order.identifier,
          service: String(service.supplier_service_id),
        }, apiKey);
      } catch (e) {
        // Timeout/abort after submission: the supplier may have accepted and charged.
        // Never auto-resend — flag for reconciliation and keep the reservation.
        await supabase.from('imei_orders').update({ status: 'reconciliation' }).eq('id', orderId);
        await logApi(supabase, 'check', service.supplier_service_id, 'timeout', null, 'uncertain billing');
        return json({ ok: false, status: 'reconciliation', error: 'The supplier did not respond in time. Your order is being reviewed — no extra charge was made.' }, 504);
      }

      const errCode = parseSupplierError(res.text);
      if (errCode) {
        const customerMessage = SUPPLIER_ERRORS[errCode] ?? 'The check could not be completed.';
        if (RELEASABLE_ERRORS.has(errCode)) {
          await supabase.from('imei_orders').update({ status: 'rejected', error_message: customerMessage }).eq('id', orderId);
          await supabase.rpc('release_imei_order', { p_order_id: orderId, p_reason: `Supplier rejected: ${errCode}` });
        } else {
          // B01 / R01 etc. may still be billable under supplier terms — keep reserved, flag review
          await supabase.from('imei_orders').update({ status: errCode === 'R01' ? 'completed' : 'failed', error_message: customerMessage }).eq('id', orderId);
          if (errCode === 'R01') {
            await supabase.from('imei_orders').update({ result: { 'Status': 'No record found for this device.' } }).eq('id', orderId);
            await supabase.rpc('settle_imei_order', { p_order_id: orderId });
          }
        }
        await logApi(supabase, 'check', service.supplier_service_id, 'error', errCode);
        return json({ ok: false, status: errCode === 'R01' ? 'completed' : 'rejected', error: customerMessage });
      }

      const parsed = parseSupplierResult(res.text, order.identifier_masked);
      if (service.is_instant) {
        await supabase.from('imei_orders').update({
          status: 'completed', result: parsed, completed_at: new Date().toISOString(),
        }).eq('id', orderId);
        await supabase.from('imei_order_results').upsert({ order_id: orderId, raw_response: { text: res.text } });
        await supabase.rpc('settle_imei_order', { p_order_id: orderId });
        await logApi(supabase, 'check', service.supplier_service_id, 'ok', null);
        return json({ ok: true, status: 'completed', result: parsed });
      }
      await supabase.from('imei_orders').update({ status: 'pending' }).eq('id', orderId);
      await supabase.from('imei_order_results').upsert({ order_id: orderId, raw_response: { text: res.text } });
      await logApi(supabase, 'check', service.supplier_service_id, 'ok', null, 'delayed');
      return json({ ok: true, status: 'pending' });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unexpected error' }, e?.status ?? 500);
  }
});
