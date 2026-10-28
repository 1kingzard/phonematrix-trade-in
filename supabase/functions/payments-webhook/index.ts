import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook } from '../_shared/stripe.ts';
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const env = new URL(req.url).searchParams.get('env');
  if (env !== 'sandbox' && env !== 'live') return new Response('Invalid environment', { status: 400 });
  try {
    const event = await verifyWebhook(req, env);
    const session = event.data.object;
    if (!event.type.startsWith('checkout.session.') || !session.metadata?.orderId) return new Response('ok');
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: order } = await db.from('payment_orders').select('id').eq('id', session.metadata.orderId).eq('environment', env).eq('stripe_session_id', session.id).single();
    if (!order) throw new Error('Payment reference not found');
    if ((event.type === 'checkout.session.completed' && session.payment_status === 'paid') || event.type === 'checkout.session.async_payment_succeeded') {
      const { error } = await db.rpc('fulfill_payment_order', { p_order_id: order.id, p_session_id: session.id, p_total: (session.amount_total ?? 0) / 100, p_currency: session.currency });
      if (error) throw error;
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const { error } = await db.from('payment_orders').update({ status: event.type.endsWith('expired') ? 'expired' : 'failed' }).eq('id', order.id).eq('status', 'pending');
      if (error) throw error;
    }
    return new Response('ok');
  } catch { return new Response('Payment verification failed', { status: 400 }); }
});