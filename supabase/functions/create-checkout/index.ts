import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { createStripeClient } from '../_shared/stripe.ts';
import { quoteDevicePayment, WALLET_TOPUP_CENTS } from '../_shared/payment-pricing.ts';

const schema = z.object({
  environment: z.enum(['sandbox', 'live']), kind: z.enum(['wallet', 'devices']),
  sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).optional(),
  delivery: z.object({ name: z.string().trim().min(1).max(200), phone: z.string().trim().min(5).max(40), address: z.string().trim().min(5).max(1000), country: z.enum(['US','JM']) }).optional(),
  items: z.array(z.object({ brand: z.string().max(100), model: z.string().max(200), storage: z.string().max(100), condition: z.string().max(100), colour: z.string().max(100) })).max(20).optional(),
});
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
async function resolveOrCreateCustomer(stripe: ReturnType<typeof createStripeClient>, options: { email?: string; userId?: string }): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      return customer.id;
    }
  }
  const created = await stripe.customers.create({ ...(options.email && { email: options.email }), ...(options.userId && { metadata: { userId: options.userId } }) });
  return created.id;
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const body = schema.parse(await req.json());
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await db.auth.getUser(req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '');
    if (!user) return reply({ error: 'Please sign in before paying.' }, 401);
    const stripe = createStripeClient(body.environment);
    if (body.sessionId) {
      const { data: order } = await db.from('payment_orders').select('*').eq('stripe_session_id', body.sessionId).eq('user_id', user.id).eq('environment', body.environment).single();
      if (!order) return reply({ error: 'Payment not found.' }, 404);
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session.payment_status === 'paid') {
        const { error } = await db.rpc('fulfill_payment_order', { p_order_id: order.id, p_session_id: session.id, p_total: (session.amount_total ?? 0) / 100, p_currency: session.currency });
        if (error) throw error;
      }
      return reply({ status: session.payment_status === 'paid' ? 'paid' : order.status, kind: order.kind, environment: order.environment });
    }
    if (body.kind === 'wallet' && body.environment === 'live') return reply({ error: 'Live wallet top-ups await provider approval and tax review.' }, 403);
    const origin = req.headers.get('Origin') ?? '';
    if (!/^https?:\/\//.test(origin)) return reply({ error: 'Invalid checkout origin' }, 400);
    const customer = await resolveOrCreateCustomer(stripe, { userId: user.id, email: user.email });
    let subtotal = 5, shipping = 0, total = 5, currency = 'usd', rate = 1;
    const snapshots: any[] = [];
    const lineItems: any[] = [];
    if (body.kind === 'wallet') {
      const prices = await stripe.prices.list({ lookup_keys: ['phonematrix_wallet_5_usd'], active: true });
      const price = prices.data[0];
      if (!price || price.unit_amount !== WALLET_TOPUP_CENTS || price.currency !== 'usd') throw new Error('Wallet top-up price is not configured correctly.');
      lineItems.push({ price: price.id, quantity: 1 });
    } else {
      if (!body.delivery || !body.items?.length) return reply({ error: 'Add devices and delivery details first.' }, 400);
      if (body.delivery.country === 'JM') {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const rates = await res.json();
        rate = rates?.rates?.JMD;
        if (!res.ok || !Number.isFinite(rate) || rate <= 0) throw new Error('Could not confirm the Jamaica exchange rate. Please retry.');
      }
      subtotal = 0; shipping = 0;
      const products = await stripe.products.list({ active: true, limit: 100 });
      for (const item of body.items) {
        const { data: device } = await db.from('devices').select('*').eq('active', true).eq('brand', item.brand).eq('model', item.model).eq('storage', item.storage).eq('condition', item.condition).maybeSingle();
        if (!device || Number(device.price) <= 0) throw new Error(`${item.brand} ${item.model} is no longer available for pre-order.`);
        if (item.colour && device.colors?.length && !device.colors.includes(item.colour)) throw new Error('Selected colour is unavailable.');
        const phone = /iphone|phone|galaxy|pixel/i.test(device.model) && !/watch|buds|airpod|tablet|tab |ipad/i.test(device.model);
        const product = products.data.find((p) => p.metadata.lovable_external_id === (phone ? 'phonematrix_phone_preorder' : 'phonematrix_electronics_preorder'));
        if (!product) throw new Error('Payment catalog is not configured.');
        const quote = quoteDevicePayment(Number(device.price), body.delivery.country, rate);
        subtotal += quote.subtotal; shipping += quote.shipping; currency = quote.currency;
        snapshots.push({ ...item, device_id: device.id, usd_price: Number(device.price), ...quote });
        lineItems.push({ price_data: { currency, product: product.id, unit_amount: Math.round(quote.total * 100), tax_behavior: 'exclusive' }, quantity: 1 });
      }
      total = Math.round((subtotal + shipping) * 100) / 100;
    }
    const { data: order, error } = await db.from('payment_orders').insert({ user_id: user.id, environment: body.environment, kind: body.kind, currency, subtotal, shipping, total, rate_used: rate, items: snapshots, delivery_country: body.delivery?.country, delivery_details: body.delivery }).select('id').single();
    if (error || !order) throw error ?? new Error('Could not save payment.');
    const session = await stripe.checkout.sessions.create({
      customer, customer_update: { address: 'auto' }, mode: 'payment', ui_mode: 'embedded_page',
      line_items: lineItems, automatic_tax: { enabled: body.environment === 'live' },
      payment_intent_data: { description: body.kind === 'wallet' ? 'PhoneMatrix $5 Wallet Credit' : snapshots.map((i) => `${i.brand} ${i.model} pre-order`).join(', ') },
      metadata: { userId: user.id, orderId: order.id, kind: body.kind, environment: body.environment },
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    const { error: saveError } = await db.from('payment_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saveError) throw saveError;
    return reply({ clientSecret: session.client_secret, subtotal, shipping, total, currency, rate });
  } catch (e) { return reply({ error: e instanceof Error ? e.message : 'Payment setup failed.' }, 400); }
});